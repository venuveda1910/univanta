# Univanta Testing & Acceptance Checklist

## Build & Static Verification
- [ ] `npm run lint` (`tsc --noEmit`) passes with zero TypeScript errors.
- [ ] `npm run build` (`vite build`) succeeds cleanly and outputs `dist/`.
- [ ] No `GEMINI_API_KEY` or secrets appear in `src/`, `dist/`, `.env.example`, or git-tracked docs.

## Route & Navigation Checks
- [ ] `/` renders Landing Page with Univanta logo, hero, dashboard preview, categories, and footer modals.
- [ ] `/login` and `/signup` validate inputs and provide clear Demo Mode authentication.
- [ ] Protected routes (`/dashboard`, `/scanner`, `/eligibility`, `/deadlines`, `/my-opportunities`, `/profile`, `/settings`, `/admin`) redirect to `/login` when signed out and return after sign-in.
- [ ] Mobile drawer navigation and desktop sidebar highlight the active route cleanly.

## Functional Verification
- [ ] **Discovery (`/discover`)**: Search, category tabs, mode, academic year, skill filter, deadline range, sorting, and pagination work together.
- [ ] **Opportunity Details (`/opportunity/:id`)**: Displays full fields, `SAMPLE DATA` notice, Save/Unsave, status buttons, personal notes, and inline eligibility check.
- [ ] **AI Poster Scanner (`/scanner`)**: Validates file MIME & 8 MB cap; loads sample poster; runs `/api/ai/scan-poster` or preserves file on error/quota exhaustion; supports field editing and verification checkbox before saving.
- [ ] **Eligibility Matcher (`/eligibility`)**: Evaluates profile vs opportunity and distinguishes matching, missing, and unclear criteria.
- [ ] **Deadline Radar (`/deadlines`)**: Separates 7-day, 30-day, and overdue deadlines; toggles between Timeline and monthly Calendar views; saves personal reminder dates.
- [ ] **My Opportunities (`/my-opportunities`)**: Tabs filter by status; inline status dropdown and notes persist across reload; remove confirmation dialog works.
- [ ] **Profile (`/profile`)**: Skills/interests tag editors, academic year, and preferences persist across reload.
- [ ] **Admin Console (`/admin`)**: Enforces role gate; allows Demo Admin preview to create, edit, verify/unverify, and archive opportunities.
- [ ] **AI Assistant**: Answers catalog questions, handles suggested prompts, and falls back gracefully if Gemini quota/key is unavailable.
