import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Trash2, ArrowUpRight, Save } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog.tsx';
import { useApp } from '../context/AppContext.tsx';
import { formatDeadlineCountdown, formatReadableDate } from '../lib/dateUtils.ts';
import type { ApplicationStatus } from '../types/campus.ts';

const TABS: Array<ApplicationStatus | 'All'> = [
  'All',
  'Saved',
  'Interested',
  'Applied',
  'Shortlisted',
  'Completed',
  'Archived',
];

const STATUS_CHOICES: ApplicationStatus[] = [
  'Saved',
  'Interested',
  'Applied',
  'Shortlisted',
  'Completed',
  'Archived',
];

export function MyOpportunitiesPage() {
  const {
    opportunities,
    userOpportunities,
    updateOpportunityStatus,
    updateOpportunityNotes,
    removeSavedOpportunity,
    pushToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<ApplicationStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<'deadline' | 'updated'>('deadline');
  const [notesEdits, setNotesEdits] = useState<Record<string, string>>({});
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const enriched = useMemo(() => {
    return userOpportunities
      .map((rec) => ({
        rec,
        opp: opportunities.find((o) => o.id === rec.opportunityId),
      }))
      .filter((x) => Boolean(x.opp))
      .filter((x) => (activeTab === 'All' ? x.rec.status !== 'Archived' : x.rec.status === activeTab))
      .sort((a, b) => {
        if (sortBy === 'deadline' && a.opp && b.opp) {
          return a.opp.registrationDeadline.localeCompare(b.opp.registrationDeadline);
        }
        return b.rec.updatedAt.localeCompare(a.rec.updatedAt);
      });
  }, [userOpportunities, opportunities, activeTab, sortBy]);

  const progressMetrics = useMemo(() => {
    const total = userOpportunities.filter((r) => r.status !== 'Archived').length;
    const submittedOrBeyond = userOpportunities.filter((r) =>
      ['Applied', 'Shortlisted', 'Completed'].includes(r.status)
    ).length;
    const pct = total > 0 ? Math.round((submittedOrBeyond / total) * 100) : 0;
    return { total, submittedOrBeyond, pct };
  }, [userOpportunities]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            My Opportunities
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Track application stages, maintain private preparation notes, and manage saved listings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="my-opps-sort" className="text-xs text-slate-500">
            Sort:
          </label>
          <select
            id="my-opps-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'deadline' | 'updated')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-700 focus:outline-none"
          >
            <option value="deadline">Nearest deadline</option>
            <option value="updated">Recently updated</option>
          </select>
        </div>
      </div>

      {/* Application Progress Bar */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-900">
            Application submission progress
          </span>
          <span className="font-mono text-slate-700 tabular-nums">
            {progressMetrics.submittedOrBeyond} / {progressMetrics.total} active tracked ({progressMetrics.pct}%)
          </span>
        </div>
        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-blue-700 transition-all duration-300"
            style={{ width: `${progressMetrics.pct}%` }}
          />
        </div>
      </section>

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {TABS.map((tab) => {
          const count =
            tab === 'All'
              ? userOpportunities.filter((r) => r.status !== 'Archived').length
              : userOpportunities.filter((r) => r.status === tab).length;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-blue-700 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Tracked List */}
      {enriched.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <Bookmark className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <h3 className="mt-3 text-base font-semibold text-slate-900">
            No opportunities in {activeTab}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Explore the catalog or scan an event poster to start tracking applications here.
          </p>
          <Link
            to="/discover"
            className="mt-4 inline-flex rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
          >
            Discover Opportunities
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {enriched.map(({ rec, opp }) => {
            if (!opp) return null;
            const currentNote =
              notesEdits[opp.id] !== undefined ? notesEdits[opp.id] : rec.notes;
            return (
              <article
                key={rec.id}
                className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-blue-700">{opp.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{opp.mode}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-slate-700">
                        Due {formatReadableDate(opp.registrationDeadline)} ({formatDeadlineCountdown(opp.registrationDeadline)})
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-semibold text-slate-900">
                      <Link to={`/opportunity/${opp.id}`} className="hover:text-blue-700">
                        {opp.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-500">{opp.organisation}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <label htmlFor={`status-${opp.id}`} className="sr-only">
                      Application status for {opp.title}
                    </label>
                    <select
                      id={`status-${opp.id}`}
                      value={rec.status}
                      onChange={(e) =>
                        updateOpportunityStatus(opp.id, e.target.value as ApplicationStatus)
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-blue-700 focus:outline-none"
                    >
                      {STATUS_CHOICES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>

                    <Link
                      to={`/opportunity/${opp.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <span>Details</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => setConfirmRemoveId(opp.id)}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${opp.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Personal Notes Editor */}
                <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row gap-2.5">
                  <label htmlFor={`note-${opp.id}`} className="sr-only">
                    Personal notes for {opp.title}
                  </label>
                  <input
                    id={`note-${opp.id}`}
                    type="text"
                    value={currentNote}
                    onChange={(e) =>
                      setNotesEdits((prev) => ({ ...prev, [opp.id]: e.target.value }))
                    }
                    placeholder="Add private notes (e.g., team members, essay links, document checklist)..."
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:bg-white focus:outline-none"
                    maxLength={2000}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      updateOpportunityNotes(opp.id, currentNote);
                      pushToast('Note saved', `Updated notes for ${opp.title}.`);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                  >
                    <Save className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Save Note</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmRemoveId)}
        title="Remove saved opportunity?"
        description="This removes the opportunity and any personal notes from your My Opportunities workspace."
        confirmLabel="Remove"
        destructive
        onCancel={() => setConfirmRemoveId(null)}
        onConfirm={() => {
          if (confirmRemoveId) {
            removeSavedOpportunity(confirmRemoveId);
            setConfirmRemoveId(null);
          }
        }}
      />
    </div>
  );
}
