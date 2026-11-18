import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { OpportunityCard } from '../components/OpportunityCard.tsx';
import { useApp } from '../context/AppContext.tsx';
import { computeProfileFitScore } from '../lib/clientScoring.ts';
import { getDaysUntilDeadline } from '../lib/dateUtils.ts';
import type { OpportunityCategory, OpportunityMode } from '../types/campus.ts';

const CATEGORIES: Array<OpportunityCategory | 'All'> = [
  'All',
  'Hackathon',
  'Internship',
  'Scholarship',
  'Coding Competition',
  'Workshop',
  'Research',
  'Conference',
  'Volunteering',
  'Other',
];

const PAGE_SIZE = 9;

export function DiscoverPage() {
  const { opportunities, opportunitiesLoading, profile } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState<string>(searchParams.get('category') || 'All');
  const [mode, setMode] = useState<OpportunityMode | 'All'>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [skillFilter, setSkillFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closing-soon' | 'expired'>('open');
  const [deadlineRange, setDeadlineRange] = useState<'all' | '7d' | '30d'>('all');
  const [sortBy, setSortBy] = useState<'match' | 'deadline' | 'recent' | 'alpha'>(
    searchParams.get('sort') === 'match' ? 'match' : 'deadline'
  );
  const [page, setPage] = useState(1);

  useEffect(() => {
    const paramCat = searchParams.get('category');
    if (paramCat) setCategory(paramCat);
  }, [searchParams]);

  const activeOpportunities = useMemo(
    () => opportunities.filter((o) => o.verificationStatus !== 'Archived'),
    [opportunities]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sk = skillFilter.trim().toLowerCase();

    const list = activeOpportunities.filter((opp) => {
      if (category !== 'All' && opp.category !== category) return false;
      if (mode !== 'All' && opp.mode !== mode) return false;

      if (yearFilter === 'eligible-for-me') {
        if (opp.eligibleYears.length > 0 && !opp.eligibleYears.includes(profile.academicYear)) {
          return false;
        }
      } else if (yearFilter !== 'All') {
        const y = Number(yearFilter);
        if (opp.eligibleYears.length > 0 && !opp.eligibleYears.includes(y)) {
          return false;
        }
      }

      if (sk) {
        const hasSkill = opp.requiredSkills.some((s) => s.toLowerCase().includes(sk));
        if (!hasSkill) return false;
      }

      const days = getDaysUntilDeadline(opp.registrationDeadline);
      if (statusFilter === 'open' && days !== null && days < 0) return false;
      if (statusFilter === 'closing-soon' && (days === null || days < 0 || days > 7)) return false;
      if (statusFilter === 'expired' && (days === null || days >= 0)) return false;

      if (deadlineRange === '7d' && (days === null || days < 0 || days > 7)) return false;
      if (deadlineRange === '30d' && (days === null || days < 0 || days > 30)) return false;

      if (q) {
        const haystack = [
          opp.title,
          opp.organisation,
          opp.description,
          opp.eligibility,
          ...opp.tags,
          ...opp.requiredSkills,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    const withScore = list.map((opp) => ({
      opp,
      score: computeProfileFitScore(profile, opp),
    }));

    withScore.sort((a, b) => {
      if (sortBy === 'match') return b.score - a.score;
      if (sortBy === 'deadline') {
        return a.opp.registrationDeadline.localeCompare(b.opp.registrationDeadline);
      }
      if (sortBy === 'recent') return b.opp.createdAt.localeCompare(a.opp.createdAt);
      return a.opp.title.localeCompare(b.opp.title);
    });

    return withScore;
  }, [
    activeOpportunities,
    query,
    category,
    mode,
    yearFilter,
    skillFilter,
    statusFilter,
    deadlineRange,
    sortBy,
    profile,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetFilters() {
    setQuery('');
    setCategory('All');
    setMode('All');
    setYearFilter('All');
    setSkillFilter('');
    setStatusFilter('open');
    setDeadlineRange('all');
    setSortBy('deadline');
    setPage(1);
    setSearchParams({});
  }

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Opportunity Discovery Engine
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Search hackathons, internships, scholarships, workshops, and research tracks. Sample catalog items are labelled SAMPLE DATA.
          </p>
        </div>
        <p className="font-mono text-xs text-slate-600 tabular-nums shrink-0">
          Showing {filtered.length} of {activeOpportunities.length} listings
        </p>
      </div>

      {/* Filter Toolbar */}
      <section aria-label="Search and filter opportunities" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-5 relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            <label htmlFor="discover-search" className="sr-only">
              Search opportunities
            </label>
            <input
              id="discover-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search title, organiser, keywords, description..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="discover-skill" className="sr-only">
              Filter by required skill
            </label>
            <input
              id="discover-skill"
              type="text"
              value={skillFilter}
              onChange={(e) => {
                setSkillFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by skill (e.g. Python, React)"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div className="lg:col-span-4 flex flex-wrap sm:flex-nowrap items-center gap-2">
            <label htmlFor="discover-sort" className="sr-only">
              Sort results
            </label>
            <select
              id="discover-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-700 focus:outline-none"
            >
              <option value="deadline">Sort: Nearest deadline</option>
              <option value="match">Sort: Best profile match</option>
              <option value="recent">Sort: Most recent</option>
              <option value="alpha">Sort: Alphabetical</option>
            </select>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategory(cat);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                category === cat
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Secondary Structured Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-slate-100 pt-3">
          <div>
            <label htmlFor="filter-mode" className="block text-[11px] font-medium text-slate-500 mb-1">
              Event mode
            </label>
            <select
              id="filter-mode"
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as OpportunityMode | 'All');
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-700 focus:outline-none"
            >
              <option value="All">All modes</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-year" className="block text-[11px] font-medium text-slate-500 mb-1">
              Eligibility & academic year
            </label>
            <select
              id="filter-year"
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-700 focus:outline-none"
            >
              <option value="All">All academic years</option>
              <option value="eligible-for-me">Eligible for my year (Year {profile.academicYear})</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-status" className="block text-[11px] font-medium text-slate-500 mb-1">
              Registration status
            </label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-700 focus:outline-none"
            >
              <option value="open">Open registrations</option>
              <option value="closing-soon">Closing within 7 days</option>
              <option value="all">Include closed / overdue</option>
              <option value="expired">Closed / overdue only</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-range" className="block text-[11px] font-medium text-slate-500 mb-1">
              Deadline window
            </label>
            <select
              id="filter-range"
              value={deadlineRange}
              onChange={(e) => {
                setDeadlineRange(e.target.value as typeof deadlineRange);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-700 focus:outline-none"
            >
              <option value="all">Any deadline</option>
              <option value="7d">Next 7 days</option>
              <option value="30d">Next 30 days</option>
            </select>
          </div>
        </div>
      </section>

      {/* Results Grid */}
      {opportunitiesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 rounded-xl border border-slate-200 bg-white p-5 animate-pulse" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <SlidersHorizontal className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <h3 className="mt-3 text-base font-semibold text-slate-900">No matching opportunities</h3>
          <p className="mt-1 text-sm text-slate-600">
            Try clearing one or more filters or switching registration status to include all dates.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginated.map(({ opp, score }) => (
              <OpportunityCard key={opp.id} opportunity={opp} fitScore={score} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-between border-t border-slate-200 pt-4">
              <p className="text-xs text-slate-500 font-mono tabular-nums">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
