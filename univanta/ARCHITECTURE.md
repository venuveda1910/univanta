# Univanta Architecture

## 1. High-Level System Overview

Univanta uses a single-origin Express + React/Vite architecture:

- **Client SPA (`src/`)**: React 19 + TypeScript + React Router + Tailwind CSS v4. Never imports `@google/genai` or reads server secrets.
- **Backend Server (`server.ts`, `server/`)**: Express server handling `/api/*` endpoints, Vite dev middleware in development, static `dist/` serving in production, rate limiting, and server-side `@google/genai` calls.

## 2. AI Integration & Safety Controls

All AI features run inside `server/geminiService.ts` using `gemini-4-hydrogen`:

1. **Poster Scanner (`/api/ai/scan-poster`)**:
   - Validates MIME type (`image/png`, `image/jpeg`, `image/jpg`, `image/webp`, `application/pdf`) and decoded byte size (`<= 8 MB`).
   - Sets a strict `systemInstruction` treating uploaded document content as untrusted data to resist prompt injection.
   - Uses structured `responseSchema` (`Type` enum) to return 16 fields with explicit confidence markers (`extracted`, `inferred`, `not_specified`).
   - Runs `inspectUrlSafety()` to flag HTTP-only links, URL shorteners, raw IP hosts, and malformed registration links.
   - Never fabricates fake scan results when Gemini is unavailable or rate-limited.

2. **Hybrid Eligibility Evaluator (`/api/ai/eligibility`)**:
   - Runs `runDeterministicEligibility()` first to check hard boundaries (academic year restrictions, passed deadlines, structured skill overlap).
   - If a hard mandatory violation exists, the final status is locked to `Not eligible` even when passed through Gemini for natural-language nuance.
   - Automatically falls back to `buildDeterministicEligibilityFallback()` if `GEMINI_API_KEY` is missing or quota is exceeded.

3. **Personalized Recommendations (`/api/ai/recommendations`)**:
   - Filters out archived, expired, and hard-ineligible listings deterministically before invoking Gemini to generate concise reasoning statements.

4. **Catalog-Grounded Assistant (`/api/ai/assistant`)**:
   - Injects a compact snapshot of the active catalog, student profile, and tracked opportunities into the prompt context.
   - Includes a deterministic offline Q&A fallback if the API key is absent or quota-exhausted.

5. **Rate Limiting**:
   - All `/api/ai/*` routes apply a sliding-window IP rate limiter (25 requests / 60 seconds).

## 3. Data & Persistence Model

- **Demo Mode (Active when `VITE_FIREBASE_*` is unconfigured)**:
  - Auth state, student profile, `userOpportunities`, scan history, notification preferences, and notifications persist in `localStorage`.
  - Clearly disclosed in the UI header, login/signup screens, and settings diagnostics.
- **Firebase Mode Blueprint (`firebase-blueprint.json` + `firestore.rules`)**:
  - Collections: `users/{userId}`, `opportunities/{opportunityId}`, `userOpportunities/{recordId}`, `scans/{scanId}`, `notifications/{notificationId}`, and `admins/{adminUid}`.
  - Enforces strict owner-only read/write isolation on student PII and server-verified admin checks on shared catalog writes.
