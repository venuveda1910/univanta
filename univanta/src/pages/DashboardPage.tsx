import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ScanLine,
  Compass,
  ShieldCheck,
  CalendarClock,
  ArrowRight,
  Bookmark,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatDeadlineCountdown, formatReadableDate, getDaysUntilDeadline } from '../lib/dateUtils.ts';
import type { OpportunityCategory, RecommendationItem } from '../types/campus.ts';

const CATEGORIES: OpportunityCategory[] = [
  'Hackathon',
  'Internship',
  'Scholarship',
  'Coding Competition',
  'Workshop',
  'Research',
  'Conference',
  'Volunteering',
];

export function DashboardPage() {
  const { profile, opportunities, userOpportunities } = useApp();
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);

  const activeOpportunities = useMemo(
    () => opportunities.filter((o) => o.verificationStatus !== 'Archived'),
    [opportunities]
  );

  const savedCount = userOpportunities.length;
  const inProgressCount = userOpportunities.filter((r) =>
    ['Interested', 'Applied', 'Shortlisted'].includes(r.status)
  ).length;

  const upcomingDeadlinesList = useMemo(() => {
    return activeOpportunities
      .filter((o) => {
        const d = getDaysUntilDeadline(o.registrationDeadline);
        return d !== null && d >= 0 && d <= 30;
      })
      .sort((a, b) => a.registrationDeadline.localeCompare(b.registrationDeadline));
  }, [activeOpportunities]);

  const recentlyAdded = useMemo(() => {
    return [...activeOpportunities]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4);
  }, [activeOpportunities]);

  const savedShortcuts = useMemo(() => {
    return userOpportunities
      .slice(0, 4)
      .map((rec) => ({
        rec,
        opp: activeOpportunities.find((o) => o.id === rec.opportunityId),
      }))
      .filter((x) => Boolean(x.opp));
  }, [userOpportunities, activeOpportunities]);

  const statusBreakdown = useMemo(() => {
    const counts = {
      Saved: 0,
      Interested: 0,
      Applied: 0,
      Shortlisted: 0,
      Completed: 0,
    };
    for (const r of userOpportunities) {
      if (r.status in counts) {
        counts[r.status as keyof typeof counts] += 1;
      }
    }
    return counts;
  }, [userOpportunities]);

  useEffect(() => {
    let mounted = true;
    async function loadRecommendations() {
      setRecsLoading(true);
      try {
        const res = await fetch('/api/ai/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile, opportunities: activeOpportunities }),
        });
        if (!mounted) return;
        if (res.ok) {
          const data = (await res.json()) as { recommendations: RecommendationItem[] };
          setRecommendations(data.recommendations || []);
        }
      } catch {
        // Fallback handled gracefully by empty/deterministic UI
      } finally {
        if (mounted) setRecsLoading(false);
      }
    }
    loadRecommendations();
    return () => {
      mounted = false;
    };
  }, [profile, activeOpportunities]);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* Greeting Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="font-mono text-xs text-slate-500">{todayFormatted}</p>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, {profile.displayName}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {profile.course} in {profile.branch} · Year {profile.academicYear} · {profile.institution}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/scanner"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors whitespace-nowrap"
          >
            <ScanLine className="h-4 w-4" aria-hidden="true" />
            <span>Scan Poster</span>
          </Link>
          <Link
            to="/discover"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            <span>Find Opportunities</span>
          </Link>
        </div>
      </section>

      {/* First-Time User Onboarding Experience */}
      {userOpportunities.length === 0 && (
        <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Get started with your Univanta workspace
              </h3>
              <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                You haven&apos;t saved any opportunities yet. Browse our 18 sample listings, upload an event poster or PDF to extract details automatically, or verify your eligibility against any programme.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                to="/discover"
                className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
              >
                Browse Sample Catalog
              </Link>
              <Link
                to="/profile"
                className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-50 whitespace-nowrap"
              >
                Review My Skills
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 4 Summary Metric Cards (Calculated strictly from real state) */}
      <section aria-label="Workspace metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Opportunities available</p>
          <p className="mt-2 font-mono text-3xl font-bold text-slate-900 tabular-nums">
            {activeOpportunities.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Active listings in catalog</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Saved opportunities</p>
          <p className="mt-2 font-mono text-3xl font-bold text-blue-700 tabular-nums">
            {savedCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">In My Opportunities workspace</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Applications in progress</p>
          <p className="mt-2 font-mono text-3xl font-bold text-slate-900 tabular-nums">
            {inProgressCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Interested, Applied, or Shortlisted</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Upcoming deadlines (30d)</p>
          <p className="mt-2 font-mono text-3xl font-bold text-amber-700 tabular-nums">
            {upcomingDeadlinesList.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Open registrations closing soon</p>
        </div>
      </section>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns: Recommended + Recently Added */}
        <div className="lg:col-span-8 space-y-6">
          {/* Personalized Recommendations */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Recommended for your profile
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Filtered against your Year {profile.academicYear} eligibility, skills, and preferred categories
                </p>
              </div>
              <Link to="/discover?sort=match" className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap">
                See all matches
              </Link>
            </div>

            {recsLoading && recommendations.length === 0 ? (
              <div className="py-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <p className="py-6 text-sm text-slate-500">
                No eligible open recommendations match right now. Try adding more skills or expanding your preferred categories in your profile.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recommendations.slice(0, 4).map((rec) => {
                  const opp = activeOpportunities.find((o) => o.id === rec.opportunityId);
                  if (!opp) return null;
                  return (
                    <div key={opp.id} className="py-4 first:pt-4 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span>
                          <strong className="font-semibold text-blue-700">{opp.category}</strong> · {opp.mode} · Due{' '}
                          <span className="font-mono tabular-nums">{opp.registrationDeadline}</span>
                        </span>
                        <span className="font-mono font-semibold text-slate-700 tabular-nums">
                          {rec.score}% fit
                        </span>
                      </div>
                      <Link
                        to={`/opportunity/${opp.id}`}
                        className="mt-1 block text-sm font-semibold text-slate-900 hover:text-blue-700"
                      >
                        {opp.title}
                      </Link>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">{rec.reason}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recently Added Opportunities */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-semibold text-slate-900">Recently added opportunities</h3>
              <Link to="/discover" className="text-xs font-semibold text-blue-700 hover:underline">
                Explore catalog
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentlyAdded.map((opp) => (
                <div key={opp.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      to={`/opportunity/${opp.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-blue-700 truncate block"
                    >
                      {opp.title}
                    </Link>
                    <p className="text-xs text-slate-500 truncate">
                      {opp.category} · {opp.organisation}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-slate-600 tabular-nums shrink-0">
                    {formatReadableDate(opp.registrationDeadline)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right 4 Columns: Quick Actions, Deadlines, Progress, Categories */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions Panel */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Quick actions</h3>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <Link
                to="/scanner"
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-800 hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ScanLine className="h-4 w-4 text-blue-700" aria-hidden="true" />
                  Scan an event poster
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              </Link>
              <Link
                to="/discover"
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-800 hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-blue-700" aria-hidden="true" />
                  Find opportunities
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              </Link>
              <Link
                to="/eligibility"
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-800 hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-700" aria-hidden="true" />
                  Check eligibility
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              </Link>
              <Link
                to="/deadlines"
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-800 hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-blue-700" aria-hidden="true" />
                  View deadlines
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              </Link>
            </div>
          </section>

          {/* Upcoming Deadlines */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Upcoming deadlines</h3>
              <Link to="/deadlines" className="text-xs font-medium text-blue-700 hover:underline">
                Radar
              </Link>
            </div>
            <div className="mt-3 divide-y divide-slate-100">
              {upcomingDeadlinesList.slice(0, 5).map((opp) => (
                <Link
                  key={opp.id}
                  to={`/opportunity/${opp.id}`}
                  className="block py-2.5 hover:bg-slate-50 rounded px-1 -mx-1"
                >
                  <p className="text-xs font-semibold text-slate-900 truncate">{opp.title}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-amber-700 tabular-nums">
                    {formatReadableDate(opp.registrationDeadline)} · {formatDeadlineCountdown(opp.registrationDeadline)}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* Saved Shortcuts & Application Progress */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Application progress</h3>
              <Link to="/my-opportunities" className="text-xs font-medium text-blue-700 hover:underline">
                Manage
              </Link>
            </div>

            {savedShortcuts.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">
                Save opportunities from Discover to track progress here.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-50 p-2.5">
                    <dt className="text-slate-500">Saved / Interested</dt>
                    <dd className="mt-0.5 font-mono font-semibold text-slate-900 tabular-nums">
                      {statusBreakdown.Saved + statusBreakdown.Interested}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5">
                    <dt className="text-slate-500">Applied / Shortlisted</dt>
                    <dd className="mt-0.5 font-mono font-semibold text-blue-700 tabular-nums">
                      {statusBreakdown.Applied + statusBreakdown.Shortlisted}
                    </dd>
                  </div>
                </dl>
                <div className="divide-y divide-slate-100">
                  {savedShortcuts.map(({ opp, rec }) =>
                    opp ? (
                      <Link
                        key={opp.id}
                        to={`/opportunity/${opp.id}`}
                        className="flex items-center justify-between py-2 text-xs hover:text-blue-700"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Bookmark className="h-3.5 w-3.5 shrink-0 text-blue-700" aria-hidden="true" />
                          <span className="truncate font-medium text-slate-800">{opp.title}</span>
                        </span>
                        <span className="ml-2 shrink-0 text-[11px] text-slate-500">{rec.status}</span>
                      </Link>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Categories Quick Jump */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Browse by category</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  to={`/discover?category=${encodeURIComponent(cat)}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
