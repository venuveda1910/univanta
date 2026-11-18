import { Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, ArrowUpRight, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatDeadlineCountdown, formatReadableDate, getDeadlineBucket } from '../lib/dateUtils.ts';
import type { Opportunity } from '../types/campus.ts';

interface OpportunityCardProps {
  opportunity: Opportunity;
  fitScore?: number;
}

export function OpportunityCard({ opportunity, fitScore }: OpportunityCardProps) {
  const { getTrackingRecord, saveOpportunity, removeSavedOpportunity } = useApp();
  const tracked = getTrackingRecord(opportunity.id);
  const isSaved = Boolean(tracked);

  const bucket = getDeadlineBucket(opportunity.registrationDeadline);
  const countdown = formatDeadlineCountdown(opportunity.registrationDeadline);

  const deadlineTone =
    bucket === 'overdue'
      ? 'text-red-700'
      : bucket === 'within-7'
        ? 'text-amber-700'
        : 'text-slate-700';

  return (
    <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300">
      <div>
        {/* Unboxed typographic metadata line (Zero-pill discipline) */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-blue-700">{opportunity.category}</span>
            <span aria-hidden="true">·</span>
            <span>{opportunity.mode}</span>
            {opportunity.isSampleData && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-slate-500">SAMPLE DATA</span>
              </>
            )}
          </div>
          {typeof fitScore === 'number' && (
            <span className="font-mono text-xs font-medium text-slate-700 tabular-nums">
              {fitScore}% match
            </span>
          )}
        </div>

        <h3 className="mt-2 text-base font-semibold text-slate-900 leading-snug">
          <Link
            to={`/opportunity/${opportunity.id}`}
            className="hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-700 rounded"
          >
            {opportunity.title}
          </Link>
        </h3>
        <p className="mt-1 text-xs font-medium text-slate-600">{opportunity.organisation}</p>

        <p className="mt-2.5 line-clamp-2 text-sm text-slate-600 leading-relaxed">
          {opportunity.description}
        </p>

        <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-slate-500">Deadline</dt>
            <dd className={`font-mono font-medium tabular-nums ${deadlineTone}`}>
              {formatReadableDate(opportunity.registrationDeadline)} ({countdown})
            </dd>
          </div>
          {opportunity.eventStartDate && (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-slate-500">Event dates</dt>
              <dd className="font-mono text-slate-700 tabular-nums">
                {formatReadableDate(opportunity.eventStartDate)}
                {opportunity.eventEndDate && opportunity.eventEndDate !== opportunity.eventStartDate
                  ? ` – ${formatReadableDate(opportunity.eventEndDate)}`
                  : ''}
              </dd>
            </div>
          )}
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-slate-500 shrink-0">Eligibility</dt>
            <dd className="truncate text-right text-slate-700 max-w-[230px]">
              {opportunity.eligibility}
            </dd>
          </div>
        </dl>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="truncate">{opportunity.location}</span>
        </div>

        {opportunity.requiredSkills.length > 0 && (
          <p className="mt-2.5 text-xs text-slate-600">
            <span className="text-slate-400">Skills: </span>
            {opportunity.requiredSkills.slice(0, 4).join(' · ')}
            {opportunity.requiredSkills.length > 4 ? ` +${opportunity.requiredSkills.length - 4}` : ''}
          </p>
        )}

        {opportunity.tags.filter((t) => t !== 'SAMPLE DATA').length > 0 && (
          <p className="mt-1 text-[11px] text-slate-400 truncate">
            {opportunity.tags.filter((t) => t !== 'SAMPLE DATA').slice(0, 3).join(' / ')}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
        <button
          type="button"
          onClick={() =>
            isSaved ? removeSavedOpportunity(opportunity.id) : saveOpportunity(opportunity.id)
          }
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-700 whitespace-nowrap ${
            isSaved
              ? 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {isSaved ? (
            <>
              <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{tracked?.status || 'Saved'}</span>
            </>
          ) : (
            <>
              <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Save</span>
            </>
          )}
        </button>

        <Link
          to={`/opportunity/${opportunity.id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors focus-visible:outline-2 focus-visible:outline-blue-700 whitespace-nowrap"
        >
          <span>Details</span>
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
