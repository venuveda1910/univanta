import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  List,
  CheckCircle2,
  BellPlus,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import {
  formatDeadlineCountdown,
  formatReadableDate,
  getDaysUntilDeadline,
  getDeadlineBucket,
} from '../lib/dateUtils.ts';
import type { OpportunityCategory } from '../types/campus.ts';

export function DeadlinesPage() {
  const {
    opportunities,
    userOpportunities,
    getTrackingRecord,
    saveOpportunity,
    updateOpportunityStatus,
    updateOpportunityReminder,
    removeSavedOpportunity,
  } = useApp();

  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  const [scope, setScope] = useState<'all-catalog' | 'saved-only'>('all-catalog');
  const [bucketFilter, setBucketFilter] = useState<'all' | 'within-7' | 'within-30' | 'overdue'>('all');
  const [categoryFilter, setCategoryFilter] = useState<OpportunityCategory | 'All'>('All');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const activeOpps = useMemo(
    () => opportunities.filter((o) => o.verificationStatus !== 'Archived'),
    [opportunities]
  );

  const scopedOpps = useMemo(() => {
    const savedIds = new Set(userOpportunities.map((u) => u.opportunityId));
    return activeOpps
      .filter((o) => (scope === 'saved-only' ? savedIds.has(o.id) : true))
      .filter((o) => (categoryFilter === 'All' ? true : o.category === categoryFilter))
      .filter((o) => {
        const b = getDeadlineBucket(o.registrationDeadline);
        if (bucketFilter === 'within-7') return b === 'within-7';
        if (bucketFilter === 'within-30') return b === 'within-7' || b === 'within-30';
        if (bucketFilter === 'overdue') return b === 'overdue';
        return true;
      })
      .sort((a, b) => a.registrationDeadline.localeCompare(b.registrationDeadline));
  }, [activeOpps, userOpportunities, scope, categoryFilter, bucketFilter]);

  const counts = useMemo(() => {
    let within7 = 0;
    let within30 = 0;
    let overdue = 0;
    for (const o of activeOpps) {
      const days = getDaysUntilDeadline(o.registrationDeadline);
      if (days === null) continue;
      if (days < 0) overdue += 1;
      else {
        if (days <= 7) within7 += 1;
        if (days <= 30) within30 += 1;
      }
    }
    return { within7, within30, overdue };
  }, [activeOpps]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ dateStr: string | null; dayNum: number | null }> = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ dateStr: null, dayNum: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({ dateStr: `${year}-${mStr}-${dStr}`, dayNum: d });
    }
    return cells;
  }, [calendarMonth]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Deadline Radar
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Monitor 7-day urgent cutoffs, 30-day windows, overdue notices, and personal submission reminders.
          </p>
        </div>
        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 self-start">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'timeline' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Timeline</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'calendar' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Calendar</span>
          </button>
        </div>
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setBucketFilter(bucketFilter === 'within-7' ? 'all' : 'within-7')}
          className={`rounded-xl border p-4 text-left transition-colors ${
            bucketFilter === 'within-7'
              ? 'border-amber-500 bg-amber-50/70'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-xs font-medium text-slate-600">Approaching within 7 days</p>
          <p className="mt-1 font-mono text-2xl font-bold text-amber-700 tabular-nums">{counts.within7}</p>
        </button>

        <button
          type="button"
          onClick={() => setBucketFilter(bucketFilter === 'within-30' ? 'all' : 'within-30')}
          className={`rounded-xl border p-4 text-left transition-colors ${
            bucketFilter === 'within-30'
              ? 'border-blue-600 bg-blue-50/70'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-xs font-medium text-slate-600">Approaching within 30 days</p>
          <p className="mt-1 font-mono text-2xl font-bold text-blue-700 tabular-nums">{counts.within30}</p>
        </button>

        <button
          type="button"
          onClick={() => setBucketFilter(bucketFilter === 'overdue' ? 'all' : 'overdue')}
          className={`rounded-xl border p-4 text-left transition-colors ${
            bucketFilter === 'overdue'
              ? 'border-red-500 bg-red-50/70'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-xs font-medium text-slate-600">Overdue / Closed</p>
          <p className="mt-1 font-mono text-2xl font-bold text-red-700 tabular-nums">{counts.overdue}</p>
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setScope('all-catalog')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              scope === 'all-catalog' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            All Catalog Deadlines
          </button>
          <button
            type="button"
            onClick={() => setScope('saved-only')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              scope === 'saved-only' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            My Saved Deadlines ({userOpportunities.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="radar-category" className="text-xs text-slate-500">
            Category:
          </label>
          <select
            id="radar-category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as OpportunityCategory | 'All')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-700 focus:outline-none"
          >
            <option value="All">All categories</option>
            <option value="Hackathon">Hackathon</option>
            <option value="Internship">Internship</option>
            <option value="Scholarship">Scholarship</option>
            <option value="Coding Competition">Coding Competition</option>
            <option value="Workshop">Workshop</option>
            <option value="Research">Research</option>
            <option value="Conference">Conference</option>
            <option value="Volunteering">Volunteering</option>
          </select>
        </div>
      </div>

      {viewMode === 'timeline' ? (
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {scopedOpps.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No deadlines match the selected filter.
            </div>
          ) : (
            scopedOpps.map((opp) => {
              const bucket = getDeadlineBucket(opp.registrationDeadline);
              const tracked = getTrackingRecord(opp.id);
              const countdown = formatDeadlineCountdown(opp.registrationDeadline);

              return (
                <div
                  key={opp.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`font-mono font-semibold tabular-nums ${
                          bucket === 'overdue'
                            ? 'text-red-700'
                            : bucket === 'within-7'
                              ? 'text-amber-700'
                              : 'text-blue-700'
                        }`}
                      >
                        {formatReadableDate(opp.registrationDeadline)} ({countdown})
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-slate-600 font-medium">{opp.category}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-slate-500">{opp.mode}</span>
                      {tracked && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="font-semibold text-slate-900">Status: {tracked.status}</span>
                        </>
                      )}
                    </div>
                    <Link
                      to={`/opportunity/${opp.id}`}
                      className="block text-base font-semibold text-slate-900 hover:text-blue-700"
                    >
                      {opp.title}
                    </Link>
                    <p className="text-xs text-slate-500">{opp.organisation}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {tracked && (
                      <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
                        <BellPlus className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                        <span className="sr-only">Personal reminder date</span>
                        <input
                          type="date"
                          value={tracked.reminderDate || ''}
                          onChange={(e) => updateOpportunityReminder(opp.id, e.target.value)}
                          className="bg-transparent font-mono text-xs focus:outline-none"
                          aria-label={`Set reminder date for ${opp.title}`}
                        />
                      </label>
                    )}

                    {tracked?.status !== 'Applied' && tracked?.status !== 'Completed' ? (
                      <button
                        type="button"
                        onClick={() => updateOpportunityStatus(opp.id, 'Applied')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Mark Applied</span>
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 px-2">
                        {tracked.status}
                      </span>
                    )}

                    {tracked ? (
                      <button
                        type="button"
                        onClick={() => removeSavedOpportunity(opp.id)}
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${opp.title} from saved deadlines`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => saveOpportunity(opp.id, 'Saved')}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Save
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Calendar View */
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-slate-900">
              {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)
                  )
                }
                className="rounded-lg border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-50"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)
                  )
                }
                className="rounded-lg border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-50"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                className="bg-slate-50 px-2 py-2 text-center text-[11px] font-semibold text-slate-600"
              >
                {d}
              </div>
            ))}
            {calendarDays.map((cell, idx) => {
              const items = cell.dateStr
                ? scopedOpps.filter((o) => o.registrationDeadline.slice(0, 10) === cell.dateStr)
                : [];
              return (
                <div
                  key={idx}
                  className="min-h-24 bg-white p-1.5 sm:p-2 flex flex-col gap-1"
                >
                  {cell.dayNum && (
                    <span className="font-mono text-[11px] font-medium text-slate-500 tabular-nums">
                      {cell.dayNum}
                    </span>
                  )}
                  {items.map((opp) => (
                    <Link
                      key={opp.id}
                      to={`/opportunity/${opp.id}`}
                      className="block truncate rounded bg-blue-50 px-1.5 py-1 text-[11px] font-medium text-blue-800 hover:bg-blue-100"
                      title={opp.title}
                    >
                      {opp.title}
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
