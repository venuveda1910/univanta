import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { SAMPLE_OPPORTUNITIES } from './src/data/sampleOpportunities.ts';
import type { Opportunity, StudentProfile, UserOpportunityRecord } from './src/types/campus.ts';
import {
  analyzePosterWithGemini,
  askAssistantWithGemini,
  evaluateEligibilityWithGemini,
  GeminiServiceError,
  generateRecommendationsWithGemini,
  isGeminiConfigured,
} from './server/geminiService.ts';

const PORT = Number(process.env.PORT) || 3000;
const ALLOWED_SCAN_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/pdf',
]);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB

// In-memory catalog initialized from clearly-labelled fictional sample opportunities
let opportunitiesStore: Opportunity[] = [...SAMPLE_OPPORTUNITIES];

// Simple per-IP sliding window rate limiter for AI endpoints
const aiRateLimitMap = new Map<string, number[]>();
const AI_RATE_LIMIT_WINDOW_MS = 60_000;
const AI_RATE_LIMIT_MAX_REQUESTS = 25;

function aiRateLimiter(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const key = req.ip || 'local';
  const now = Date.now();
  const recent = (aiRateLimitMap.get(key) || []).filter(
    (ts) => now - ts < AI_RATE_LIMIT_WINDOW_MS
  );
  if (recent.length >= AI_RATE_LIMIT_MAX_REQUESTS) {
    res.status(429).json({
      error: 'Too many AI requests in a short window. Please wait a minute before trying again.',
      code: 'RATE_LIMITED',
      retryable: true,
    });
    return;
  }
  recent.push(now);
  aiRateLimitMap.set(key, recent);
  next();
}

function isAuthorizedAdmin(req: express.Request): boolean {
  // In production with Firebase Admin SDK, verify Firebase ID Token + custom claim or admins/{uid} doc here.
  // In Demo Mode (when Firebase is not configured), allow explicit demo_admin role header when Firebase isn't active.
  const firebaseConfigured = Boolean(process.env.VITE_FIREBASE_PROJECT_ID);
  if (firebaseConfigured) {
    const adminToken = req.header('x-admin-api-secret');
    return Boolean(process.env.ADMIN_API_SECRET && adminToken === process.env.ADMIN_API_SECRET);
  }
  return req.header('x-campus-demo-role') === 'demo_admin';
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  // Health & integration status (never exposes secrets)
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      geminiConfigured: isGeminiConfigured(),
      firebaseConfigured: Boolean(process.env.VITE_FIREBASE_API_KEY && process.env.VITE_FIREBASE_PROJECT_ID),
      mode:
        process.env.VITE_FIREBASE_API_KEY && process.env.VITE_FIREBASE_PROJECT_ID
          ? 'firebase'
          : 'demo-local-persistence',
      serverTime: new Date().toISOString(),
    });
  });

  // Opportunities catalog endpoints
  app.get('/api/opportunities', (req, res) => {
    const includeArchived = req.query.includeArchived === 'true' && isAuthorizedAdmin(req);
    const items = includeArchived
      ? opportunitiesStore
      : opportunitiesStore.filter((o) => o.verificationStatus !== 'Archived');
    res.json({ opportunities: items });
  });

  app.post('/api/opportunities/from-scan', (req, res) => {
    const body = req.body as Partial<Opportunity>;
    if (!body.title || !body.organisation || !body.category || !body.registrationDeadline) {
      res.status(400).json({ error: 'Missing required fields from reviewed scan.' });
      return;
    }

    const now = new Date().toISOString();
    const created: Opportunity = {
      id: `opp-scan-${Date.now()}`,
      title: String(body.title).slice(0, 200),
      organisation: String(body.organisation).slice(0, 200),
      category: body.category,
      description: String(body.description || 'Submitted via AI Poster Scanner.').slice(0, 4000),
      objectives: Array.isArray(body.objectives) ? body.objectives.slice(0, 8) : [],
      eligibility: String(body.eligibility || 'Not specified').slice(0, 2000),
      academicRequirements: String(body.academicRequirements || 'Not specified').slice(0, 1000),
      eligibleYears: Array.isArray(body.eligibleYears) ? body.eligibleYears : [],
      requiredSkills: Array.isArray(body.requiredSkills) ? body.requiredSkills.slice(0, 15) : [],
      registrationDeadline: String(body.registrationDeadline).slice(0, 40),
      eventStartDate: body.eventStartDate ? String(body.eventStartDate).slice(0, 40) : undefined,
      eventEndDate: body.eventEndDate ? String(body.eventEndDate).slice(0, 40) : undefined,
      mode: body.mode === 'Online' || body.mode === 'Offline' || body.mode === 'Hybrid' ? body.mode : 'Hybrid',
      location: String(body.location || 'Not specified').slice(0, 200),
      registrationFee: body.registrationFee ? String(body.registrationFee).slice(0, 120) : undefined,
      rewards: body.rewards ? String(body.rewards).slice(0, 500) : undefined,
      benefits: Array.isArray(body.benefits) ? body.benefits.slice(0, 10) : [],
      applicationProcedure: String(body.applicationProcedure || 'Follow official organizer registration instructions.').slice(0, 1500),
      registrationUrl: body.registrationUrl ? String(body.registrationUrl).slice(0, 500) : undefined,
      contactEmail: body.contactEmail ? String(body.contactEmail).slice(0, 200) : undefined,
      tags: Array.isArray(body.tags) ? body.tags.slice(0, 10) : ['Student Scan'],
      source: 'Student Poster Scan',
      isSampleData: false,
      verificationStatus: 'Pending Review',
      createdAt: now,
      updatedAt: now,
    };

    opportunitiesStore = [created, ...opportunitiesStore];
    res.status(201).json({ opportunity: created });
  });

  // Protected Admin CRUD endpoints
  app.post('/api/admin/opportunities', (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      res.status(403).json({
        error: 'Administrator privileges required. In production, verify Firebase Admin claims or admins/{uid}.',
      });
      return;
    }

    const body = req.body as Partial<Opportunity>;
    if (!body.title || !body.organisation || !body.category || !body.registrationDeadline) {
      res.status(400).json({ error: 'Title, organisation, category, and registration deadline are required.' });
      return;
    }

    const now = new Date().toISOString();
    const created: Opportunity = {
      id: `opp-admin-${Date.now()}`,
      title: String(body.title).slice(0, 200),
      organisation: String(body.organisation).slice(0, 200),
      category: body.category,
      description: String(body.description || '').slice(0, 4000),
      objectives: Array.isArray(body.objectives) ? body.objectives : [],
      eligibility: String(body.eligibility || 'Not specified').slice(0, 2000),
      academicRequirements: String(body.academicRequirements || 'Not specified').slice(0, 1000),
      eligibleYears: Array.isArray(body.eligibleYears) ? body.eligibleYears : [],
      requiredSkills: Array.isArray(body.requiredSkills) ? body.requiredSkills : [],
      registrationDeadline: String(body.registrationDeadline).slice(0, 40),
      eventStartDate: body.eventStartDate,
      eventEndDate: body.eventEndDate,
      mode: body.mode || 'Online',
      location: String(body.location || 'Not specified').slice(0, 200),
      registrationFee: body.registrationFee,
      rewards: body.rewards,
      benefits: Array.isArray(body.benefits) ? body.benefits : [],
      applicationProcedure: String(body.applicationProcedure || 'Not specified').slice(0, 1500),
      registrationUrl: body.registrationUrl,
      contactEmail: body.contactEmail,
      tags: Array.isArray(body.tags) ? body.tags : [],
      source: body.source || 'Admin Curated',
      isSampleData: Boolean(body.isSampleData),
      verificationStatus: body.verificationStatus || 'Verified',
      createdAt: now,
      updatedAt: now,
    };

    opportunitiesStore = [created, ...opportunitiesStore];
    res.status(201).json({ opportunity: created });
  });

  app.patch('/api/admin/opportunities/:id', (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      res.status(403).json({ error: 'Administrator privileges required.' });
      return;
    }

    const { id } = req.params;
    const idx = opportunitiesStore.findIndex((o) => o.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Opportunity not found.' });
      return;
    }

    const existing = opportunitiesStore[idx];
    const patch = req.body as Partial<Opportunity>;
    const updated: Opportunity = {
      ...existing,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    opportunitiesStore[idx] = updated;
    res.json({ opportunity: updated });
  });

  // AI Poster Scanner
  app.post('/api/ai/scan-poster', aiRateLimiter, async (req, res) => {
    try {
      const { base64Data, mimeType, fileName } = req.body as {
        base64Data?: string;
        mimeType?: string;
        fileName?: string;
      };

      if (!base64Data || !mimeType || !fileName) {
        res.status(400).json({ error: 'File data, MIME type, and file name are required.' });
        return;
      }

      if (!ALLOWED_SCAN_MIMES.has(mimeType.toLowerCase())) {
        res.status(400).json({
          error: 'Unsupported file type. Upload PNG, JPG, JPEG, WEBP, or PDF files only.',
        });
        return;
      }

      const estimatedBytes = Math.ceil((base64Data.length * 3) / 4);
      if (estimatedBytes > MAX_UPLOAD_BYTES) {
        res.status(413).json({
          error: 'File exceeds the 8 MB upload limit. Please compress or upload a smaller poster.',
        });
        return;
      }

      const result = await analyzePosterWithGemini({
        base64Data,
        mimeType: mimeType.toLowerCase(),
        fileName: String(fileName).slice(0, 180),
      });

      res.json({ result });
    } catch (err) {
      if (err instanceof GeminiServiceError) {
        res.status(err.status).json({
          error: err.message,
          code: err.code,
          retryable: err.retryable,
        });
        return;
      }
      res.status(500).json({
        error: 'Unexpected server error while scanning poster.',
        code: 'INTERNAL_ERROR',
      });
    }
  });

  // AI Eligibility Evaluator
  app.post('/api/ai/eligibility', aiRateLimiter, async (req, res) => {
    try {
      const { profile, opportunity } = req.body as {
        profile?: StudentProfile;
        opportunity?: Opportunity;
      };

      if (!profile || !opportunity) {
        res.status(400).json({ error: 'Student profile and opportunity are required.' });
        return;
      }

      const evaluation = await evaluateEligibilityWithGemini(profile, opportunity);
      res.json({ evaluation });
    } catch (err) {
      if (err instanceof GeminiServiceError) {
        res.status(err.status).json({ error: err.message, code: err.code });
        return;
      }
      res.status(500).json({ error: 'Failed to evaluate eligibility.' });
    }
  });

  // AI Personalized Recommendations
  app.post('/api/ai/recommendations', aiRateLimiter, async (req, res) => {
    try {
      const { profile, opportunities } = req.body as {
        profile?: StudentProfile;
        opportunities?: Opportunity[];
      };

      if (!profile) {
        res.status(400).json({ error: 'Student profile is required.' });
        return;
      }

      const sourceList = Array.isArray(opportunities) && opportunities.length > 0
        ? opportunities
        : opportunitiesStore;

      const recommendations = await generateRecommendationsWithGemini(profile, sourceList);
      res.json({ recommendations });
    } catch (err) {
      if (err instanceof GeminiServiceError) {
        res.status(err.status).json({ error: err.message, code: err.code });
        return;
      }
      res.status(500).json({ error: 'Failed to compute recommendations.' });
    }
  });

  // Univanta AI Assistant
  app.post('/api/ai/assistant', aiRateLimiter, async (req, res) => {
    try {
      const { question, profile, opportunities, savedRecords, history } = req.body as {
        question?: string;
        profile?: StudentProfile;
        opportunities?: Opportunity[];
        savedRecords?: UserOpportunityRecord[];
        history?: Array<{ role: 'user' | 'assistant'; text: string }>;
      };

      if (!question || !question.trim() || !profile) {
        res.status(400).json({ error: 'A question and student profile are required.' });
        return;
      }

      if (question.length > 1200) {
        res.status(400).json({ error: 'Question exceeds 1,200 character limit.' });
        return;
      }

      const reply = await askAssistantWithGemini({
        question: question.trim(),
        profile,
        opportunities: Array.isArray(opportunities) && opportunities.length > 0 ? opportunities : opportunitiesStore,
        savedRecords: Array.isArray(savedRecords) ? savedRecords : [],
        history: Array.isArray(history) ? history : [],
      });

      res.json(reply);
    } catch (err) {
      if (err instanceof GeminiServiceError) {
        res.status(err.status).json({ error: err.message, code: err.code });
        return;
      }
      res.status(500).json({ error: 'Assistant request failed.' });
    }
  });

  // Vite Dev Middleware or Static Production Build
  const isProduction = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(process.cwd(), 'dist');

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Univanta server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
