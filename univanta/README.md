# Univanta

**Discover more. Achieve more.**

---

## 1. Project Name

**Univanta** — AI-powered student opportunity discovery platform.

## 2. Project Overview

Univanta is an AI-powered student opportunity discovery platform that helps students discover hackathons, internships, scholarships, workshops, competitions, research opportunities and other career-building experiences. Students can search opportunities, extract structured details directly from event posters or PDF flyers using Google Gemini, verify their formal eligibility against stated rules, track applications, and monitor deadlines.

## 3. Problem Statement

Students frequently miss valuable academic and career opportunities because announcements are fragmented across physical noticeboards, social media posts, PDF brochures, messaging groups, and email newsletters. Identifying which opportunities match a student's academic year and skills, tracking deadlines, and organizing applications across semesters creates persistent friction.

## 4. Proposed Solution

Univanta combines a searchable opportunity catalog with:
- A server-side multimodal **AI Poster & Document Scanner** that converts unstructured PNG/JPG/PDF notices into structured, editable opportunity records.
- A **Hybrid Eligibility Matcher** pairing deterministic academic-year/deadline checks with Gemini natural-language interpretation.
- A **Deadline Radar** with 7-day, 30-day, overdue, and calendar views.
- A **Personal Application Workspace** and **Catalog-Grounded AI Assistant**.

## 5. Target Audience

- Undergraduate and postgraduate university students.
- Students seeking hackathons, coding competitions, internships, scholarships, workshops, conferences, volunteering, or mentored research fellowships.
- Campus clubs and student affairs coordinators curating verified event notices.

## 6. Key Features

- **Public Landing Page (`/`)**: Product narrative, live workspace preview, category explorer, and transparent AI methodology.
- **Student Dashboard (`/dashboard`)**: Live computed metrics, personalized recommendations, upcoming deadlines, application progress, and quick actions.
- **Opportunity Discovery Engine (`/discover`)**: Full-text search, category tabs, mode/year/skill/status/deadline filters, sorting, and pagination.
- **Opportunity Details (`/opportunity/:id`)**: Complete breakdown, tracking actions, personal notes, safety warnings, and inline eligibility checks.
- **AI Poster Scanner (`/scanner`)**: Drag-and-drop PNG/JPG/WEBP/PDF upload (up to 8 MB), confidence differentiation (`Extracted` vs `Inferred` vs `Not specified`), URL safety warnings, editable 16-field verification form, and 1-click sample hackathon poster test.
- **AI Eligibility Matcher (`/eligibility`)**: Evaluates student profile against opportunity requirements (`Appears eligible`, `Potentially eligible`, `Not eligible`) with matching, missing, and unclear criteria.
- **Deadline Radar (`/deadlines`)**: Timeline and monthly calendar views, 7-day / 30-day / overdue buckets, personal reminders.
- **My Opportunities (`/my-opportunities`)**: Status workspace (`Saved`, `Interested`, `Applied`, `Shortlisted`, `Completed`, `Archived`), progress bar, and notes.
- **Univanta AI Assistant**: Slide-over Q&A drawer grounded strictly in the application catalog and student profile.
- **Student Profile & Settings (`/profile`, `/settings`)**: Editable academic background, skills/interests tags, notification preferences, JSON export, and integration diagnostics.
- **Administrative Management (`/admin`)**: Role-protected catalog creation, editing, verification toggling, and archiving.

## 7. Unique Selling Points

1. **Poster-to-Opportunity Pipeline**: Turns messy campus flyers into verified structured records while marking missing facts as `"Not specified"` and flagging suspicious links.
2. **Eligibility vs. Relevance Separation**: Prevents recommending opportunities that violate mandatory requirements like academic year or closed deadlines.
3. **Resilient Fallback Architecture**: Operates cleanly in Demo Mode when Firebase is not configured and falls back to deterministic rule-based matching if Gemini quota is exhausted.

## 8. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router DOM, Lucide React
- **Backend**: Node.js (v22+), Express, `@google/genai` SDK (`gemini-4-hydrogen`)
- **Database & Auth Schema**: Firebase Authentication & Cloud Firestore blueprint + hardened `firestore.rules` (with local-storage Demo Mode fallback when unconfigured)

## 9. Architecture Overview

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full system diagram, AI safety pipeline, rate limiting, and Firebase/Demo Mode adapter details.

## 10. Folder Structure

```
├── index.html                   # HTML entry point & typography links
├── metadata.json                # Applet metadata & server-side Gemini capability
├── package.json                 # Scripts & dependencies
├── server.ts                    # Express server, API routes, rate limiter, Vite middleware
├── server/
│   ├── eligibilityRules.ts      # Deterministic rule checks & recommendation ranking
│   └── geminiService.ts         # Server-side @google/genai wrapper & safety checks
├── firebase-blueprint.json      # Firestore collection & entity schema IR
├── firestore.rules              # Hardened Firestore security rules
├── ARCHITECTURE.md              # Detailed technical architecture
├── TESTING.md                   # Verification & acceptance testing checklist
└── src/
    ├── App.tsx                  # Route definitions & protected routes
    ├── index.css                # Tailwind v4 theme & typography tokens
    ├── types/campus.ts          # Shared TypeScript interfaces
    ├── data/sampleOpportunities.ts # 18 clearly labelled SAMPLE DATA opportunities
    ├── context/AppContext.tsx   # Workspace state, notifications & Demo Mode persistence
    ├── lib/                     # Date utilities, client scoring, Firebase status check
    ├── components/              # AppShell, OpportunityCard, AssistantDrawer, ConfirmDialog, Toasts
    └── pages/                   # Landing, Auth, Dashboard, Discover, Detail, Scanner, Eligibility, Deadlines, MyOpportunities, Profile, Settings, Admin
```

## 11. Installation Instructions

```bash
git clone <your-repository-url>
cd univanta
npm install
```

## 12. Environment Variable Setup

Copy `.env.example` to `.env` and fill in your values locally (never commit `.env`):

```bash
cp .env.example .env
```

Required / Optional variables:
- `GEMINI_API_KEY`: Server-side Google Gemini API key (never exposed to browser code).
- `APP_URL`: Public application URL.
- `VITE_FIREBASE_*`: Optional Firebase client config if connecting a live Firebase project.

## 13. Firebase Configuration

Univanta ships with `firebase-blueprint.json` and `firestore.rules` ready for Firebase Authentication + Cloud Firestore (optional):
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication** (Email/Password and/or Google Sign-In).
3. Create a **Cloud Firestore** database.
4. Populate the `VITE_FIREBASE_*` keys in `.env` and deploy `firestore.rules`.
5. To provision an administrator, add a document at `admins/<your-admin-uid>` in Firestore using the Firebase Console or Admin SDK. Never grant admin roles from client code.

When `VITE_FIREBASE_*` variables are absent, Univanta automatically operates in **Demo Mode (Local Browser Persistence)**: sign-in/sign-up runs locally without external authentication, user profiles, saved opportunities, notes, scan history, and notification preferences are stored in browser `localStorage`, and the UI explicitly displays a Demo Mode banner so local-only state is never mistaken for cloud persistence.

## 14. Gemini API Configuration

1. Obtain an API key from Google AI Studio.
2. Set `GEMINI_API_KEY` in your server environment (or AI Studio Secrets panel).
3. All `@google/genai` calls execute strictly inside `server/geminiService.ts` using `gemini-4-hydrogen`.

## 15. Local Development Instructions

```bash
npm run dev
```

The Express + Vite server listens on `http://localhost:3000`.

## 16. Database Setup

- **Demo Mode**: Uses in-memory catalog seeded from `src/data/sampleOpportunities.ts` on the server plus browser `localStorage` for user profiles, saved opportunities, notes, scan history, and notifications.
- **Firestore Production Mode**: Follow `firebase-blueprint.json` for collections: `users`, `opportunities`, `userOpportunities`, `scans`, `notifications`, and `admins`.

## 17. Security Rules Deployment

```bash
firebase deploy --only firestore:rules
```

Review `firestore.rules` carefully before broad public release. Rules enforce owner-only PII access on `users/{userId}`, `request.time` timestamp integrity, strict field allowlists (`affectedKeys().hasOnly()`), and admin-only mutations on `opportunities`.

## 18. Build and Test Instructions

```bash
# TypeScript check
npm run lint

# Production frontend bundle
npm run build

# Run production server
NODE_ENV=production npm start
```

See [`TESTING.md`](./TESTING.md) for the complete functional and security test checklist.

## 19. Deployment Instructions

1. Ensure `GEMINI_API_KEY` is configured as a server secret in your hosting platform (e.g., Cloud Run, Render, Fly.io).
2. Run `npm run build` to compile client assets into `dist/`.
3. Start the Node.js server with `NODE_ENV=production npm start` (executes `node server.ts` on Node 22+, port `3000` or `process.env.PORT`).

## 20. Known Limitations

- In this workspace without provisioned Firebase credentials, accounts and saved tracking records persist locally per browser via Demo Mode rather than syncing across devices.
- Server-side newly scanned opportunities reside in server memory during the runtime lifecycle unless backed by Firestore.
- Notifications are in-app and date-driven; background email/SMS push delivery is not enabled.
- All 18 initial listings are clearly labelled fictional `SAMPLE DATA`.

## 21. Future Enhancements

- Live Firestore listener synchronization (`onSnapshot`) when Firebase credentials are attached.
- Firebase Cloud Functions scheduled deadline digest emails.
- Campus club submission portal with automated domain verification (`*.edu` / institutional SSO).
- Team-finder matching for hackathon participants.

## 22. Screenshots

- `[Placeholder: Landing Page & Workspace Preview — /]`
- `[Placeholder: Student Dashboard & Personalized Recommendations — /dashboard]`
- `[Placeholder: AI Poster Scanner & 16-Field Review Form — /scanner]`
- `[Placeholder: Eligibility Matcher & Deadline Radar Calendar — /eligibility, /deadlines]`
