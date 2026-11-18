import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ScanLine,
  ShieldCheck,
  CalendarClock,
  Bot,
  CheckCircle2,
  X,
} from 'lucide-react';
import { UnivantaMark } from '../components/UnivantaMark.tsx';
import { useApp } from '../context/AppContext.tsx';
import { SAMPLE_OPPORTUNITIES } from '../data/sampleOpportunities.ts';

const CATEGORIES = [
  { name: 'Hackathon', summary: '48-hour sprints, civic tech & product builds' },
  { name: 'Internship', summary: 'Summer engineering, systems & co-op tracks' },
  { name: 'Scholarship', summary: 'Merit, equity & conference travel grants' },
  { name: 'Coding Competition', summary: 'Algorithmic contests & collegiate CTFs' },
  { name: 'Workshop', summary: 'Hands-on security, cloud & builder clinics' },
  { name: 'Research', summary: 'Faculty-mentored labs & fellowships' },
  { name: 'Conference', summary: 'Student symposiums & technical colloquiums' },
  { name: 'Volunteering', summary: 'Campus accessibility & digital literacy drives' },
];

export function LandingPage() {
  const { isAuthenticated, opportunities } = useApp();
  const [infoModal, setInfoModal] = useState<'about' | 'privacy' | 'contact' | null>(null);

  const previewOpps = (opportunities.length > 0 ? opportunities : SAMPLE_OPPORTUNITIES).slice(0, 3);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Top Bar Contract: 3 zones (Wordmark — 4 concise nav links — 1 primary CTA) */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-16">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-700 rounded"
          >
            <UnivantaMark className="h-7 w-7" />
            <span className="font-display text-lg font-bold tracking-tight">Univanta</span>
          </Link>

          <nav aria-label="Landing navigation" className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              How It Works
            </a>
            <a href="#categories" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Categories
            </a>
            <a href="#ai-capabilities" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              AI Tools
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={isAuthenticated ? '/dashboard' : '/discover'}
              className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              {isAuthenticated ? 'Open Dashboard' : 'Explore Opportunities'}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-sm font-semibold text-blue-700">
                AI Student Opportunity Discovery & Tracking
              </p>
              <h1 className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1] [text-wrap:balance]">
                Your next opportunity starts here.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Students miss hackathons, internships, scholarships, and research fellowships every semester because notices are buried across campus noticeboards, PDFs, emails, and chat groups. Univanta brings everything into one intelligent workspace.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  to="/discover"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 whitespace-nowrap"
                >
                  <span>Explore Opportunities</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors focus-visible:outline-2 focus-visible:outline-blue-700 whitespace-nowrap"
                >
                  <span>Discover How It Works</span>
                </a>
                {!isAuthenticated && (
                  <Link
                    to="/login"
                    className="px-2 py-2 text-sm font-medium text-slate-600 hover:text-blue-700 underline-offset-4 hover:underline whitespace-nowrap"
                  >
                    Sign in to workspace
                  </Link>
                )}
              </div>

              {/* Clean architectural campus photo strip */}
              <div className="mt-10 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <img
                  src="/src/assets/images/hero_student_hub_1794834091730.jpg"
                  alt="University innovation hall and student collaborative workspace"
                  referrerPolicy="no-referrer"
                  className="h-44 w-full object-cover"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs text-slate-600 border-t border-slate-100">
                  <span>Built for university builders, researchers & scholarship applicants</span>
                  <span className="font-mono text-slate-500 tabular-nums">18 Sample Listings Ready</span>
                </div>
              </div>
            </div>

            {/* Interactive Product Dashboard Preview */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-5 py-3 text-white">
                  <div className="flex items-center gap-2">
                    <UnivantaMark className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-semibold">Univanta Workspace Preview</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-300">Demo Preview</span>
                </div>

                <div className="p-5 space-y-5">
                  {/* Live Computed Sample Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] text-slate-500">Catalog Active</p>
                      <p className="mt-1 font-mono text-xl font-bold text-slate-900 tabular-nums">
                        {opportunities.filter((o) => o.verificationStatus !== 'Archived').length}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] text-slate-500">Poster Fields</p>
                      <p className="mt-1 font-mono text-xl font-bold text-blue-700 tabular-nums">16</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] text-slate-500">Match Modes</p>
                      <p className="mt-1 font-mono text-xl font-bold text-slate-900 tabular-nums">AI + Rules</p>
                    </div>
                  </div>

                  {/* Preview Feed */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">Sample Opportunity Feed</span>
                      <Link to="/discover" className="text-blue-700 font-medium hover:underline">
                        View all
                      </Link>
                    </div>
                    {previewOpps.map((opp) => (
                      <Link
                        key={opp.id}
                        to={`/opportunity/${opp.id}`}
                        className="block rounded-lg border border-slate-200 p-3.5 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span>
                            <strong className="font-semibold text-blue-700">{opp.category}</strong> · {opp.mode}
                          </span>
                          <span className="font-mono tabular-nums text-slate-700">
                            Due {opp.registrationDeadline}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{opp.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500 truncate">{opp.organisation}</p>
                      </Link>
                    ))}
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">Have an event poster or PDF flyer?</p>
                      <p className="text-slate-600">Extract dates, eligibility, and registration links in seconds.</p>
                    </div>
                    <Link
                      to="/scanner"
                      className="shrink-0 rounded-lg bg-blue-700 px-3 py-1.5 font-medium text-white hover:bg-blue-800 whitespace-nowrap"
                    >
                      Try Scanner
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-700">Core Platform</p>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
            Everything required to go from scattered notice to submitted application.
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <ScanLine className="h-5 w-5 text-blue-700" aria-hidden="true" />
            <h3 className="mt-4 text-base font-semibold text-slate-900">AI Poster & PDF Scanner</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Upload PNG, JPG, or PDF notices. Gemini extracts 16 structured fields while distinguishing verified text from missing details.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <ShieldCheck className="h-5 w-5 text-blue-700" aria-hidden="true" />
            <h3 className="mt-4 text-base font-semibold text-slate-900">Hybrid Eligibility Matcher</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Combines strict academic-year and deadline rules with AI interpretation of narrative eligibility criteria.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <CalendarClock className="h-5 w-5 text-blue-700" aria-hidden="true" />
            <h3 className="mt-4 text-base font-semibold text-slate-900">Deadline Radar</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Separate 7-day urgent cutoffs, 30-day windows, calendar views, and overdue items with personal reminders.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <Bot className="h-5 w-5 text-blue-700" aria-hidden="true" />
            <h3 className="mt-4 text-base font-semibold text-slate-900">Catalog-Grounded Assistant</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Ask questions about closing dates, compare saved opportunities, or check skill gaps without hallucinated facts.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-y border-slate-200 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-blue-700">How It Works</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Four structured steps from discovery to completion.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <p className="font-mono text-sm font-semibold text-blue-700">01.</p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">Build your academic profile</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Set your degree, branch, academic year, technical skills, and preferred event modes once.
              </p>
            </div>
            <div>
              <p className="font-mono text-sm font-semibold text-blue-700">02.</p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">Discover or scan posters</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Filter curated opportunities or drop in a department poster or PDF to structure it automatically.
              </p>
            </div>
            <div>
              <p className="font-mono text-sm font-semibold text-blue-700">03.</p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">Verify formal eligibility</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                See matching criteria, missing skills, and ambiguous requirements before spending hours applying.
              </p>
            </div>
            <div>
              <p className="font-mono text-sm font-semibold text-blue-700">04.</p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">Track status and deadlines</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Move opportunities across Saved, Interested, Applied, Shortlisted, and Completed with private notes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Opportunity Categories */}
      <section id="categories" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-700">Coverage</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Opportunity categories tailored for college life.
            </h2>
          </div>
          <Link to="/discover" className="text-sm font-semibold text-blue-700 hover:underline whitespace-nowrap">
            Browse all categories
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              to={`/discover?category=${encodeURIComponent(cat.name)}`}
              className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-400 transition-colors"
            >
              <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-700">
                {cat.name}
              </h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{cat.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* AI Responsible Design & Student Benefits */}
      <section id="ai-capabilities" className="border-t border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <p className="text-sm font-semibold text-blue-400">Responsible AI Architecture</p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight [text-wrap:balance]">
                Transparent extraction and eligibility analysis — never fabricated promises.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Univanta runs all Gemini API operations securely on the server. Uploaded posters are treated as untrusted input, missing dates are marked "Not specified", suspicious registration links are flagged automatically, and deterministic rule checks enforce hard academic-year boundaries.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
                  <span>Distinguishes directly extracted poster fields from inferred context.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
                  <span>Separates formal eligibility qualification from personal interest relevance.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
                  <span>Graceful fallback mode ensures discovery and tracking remain usable even if AI quota is exhausted.</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-6 space-y-4">
                <h3 className="text-base font-semibold text-white">Ready to organize your semester?</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Explore 18 clearly labelled sample listings, test the Gemini poster scanner with our sample poster or your own PDF, and map your upcoming deadlines.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
                  >
                    <span>Launch Student Workspace</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    to="/scanner"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-700 transition-colors"
                  >
                    <span>Open Poster Scanner</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <UnivantaMark className="h-6 w-6" />
              <span className="font-display text-sm font-bold text-slate-900">Univanta</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Discover more. Achieve more. Seeded catalog entries are clearly marked SAMPLE DATA.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-600">
            <button type="button" onClick={() => setInfoModal('about')} className="hover:text-slate-900">
              About
            </button>
            <a href="#features" className="hover:text-slate-900">
              Features
            </a>
            <button type="button" onClick={() => setInfoModal('privacy')} className="hover:text-slate-900">
              Privacy
            </button>
            <button type="button" onClick={() => setInfoModal('contact')} className="hover:text-slate-900">
              Contact
            </button>
          </div>
        </div>
      </footer>

      {/* Footer Information Modal */}
      {infoModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 capitalize">{infoModal}</h3>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 text-sm text-slate-600 leading-relaxed space-y-2">
              {infoModal === 'about' && (
                <p>
                  Univanta is an AI-powered student opportunity discovery platform that helps students discover hackathons, internships, scholarships, workshops, competitions, research opportunities and other career-building experiences, verify eligibility transparently, and extract event notices from posters and PDFs.
                </p>
              )}
              {infoModal === 'privacy' && (
                <p>
                  Univanta collects only essential academic fields (course, branch, year, skills, interests). In Demo Mode, data remains strictly in your browser&apos;s local storage. Uploaded posters are processed transiently by the server-side Gemini endpoint and are not permanently stored on external file buckets.
                </p>
              )}
              {infoModal === 'contact' && (
                <p>
                  For technical documentation, Firebase setup instructions, and repository architecture, inspect the project README.md or visit the Integration Status panel in Settings.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
