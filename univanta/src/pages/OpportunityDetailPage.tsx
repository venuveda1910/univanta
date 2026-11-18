import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatDeadlineCountdown, formatReadableDate } from '../lib/dateUtils.ts';
import type { ApplicationStatus, EligibilityEvaluation } from '../types/campus.ts';

const STATUS_OPTIONS: ApplicationStatus[] = [
  'Interested',
  'Applied',
  'Shortlisted',
  'Completed',
];

export function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    opportunities,
    profile,
    getTrackingRecord,
    saveOpportunity,
    removeSavedOpportunity,
    updateOpportunityStatus,
    updateOpportunityNotes,
    pushToast,
  } = useApp();

  const opportunity = opportunities.find((o) => o.id === id);
  const tracked = opportunity ? getTrackingRecord(opportunity.id) : undefined;

  const [notesDraft, setNotesDraft] = useState(tracked?.notes || '');
  const [eligLoading, setEligLoading] = useState(false);
  const [eligResult, setEligResult] = useState<EligibilityEvaluation | null>(null);
  const [eligError, setEligError] = useState<string | null>(null);

  useEffect(() => {
    setNotesDraft(tracked?.notes || '');
    setEligResult(null);
    setEligError(null);
  }, [id, tracked?.notes]);

  if (!opportunity) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Opportunity not found</h2>
        <p className="mt-1 text-sm text-slate-600">
          The requested listing may have been archived or removed.
        </p>
        <Link
          to="/discover"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to Discover</span>
        </Link>
      </div>
    );
  }

  async function runEligibilityCheck() {
    if (!opportunity) return;
    setEligLoading(true);
    setEligError(null);
    try {
      const res = await fetch('/api/ai/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, opportunity }),
      });
      const data = (await res.json()) as { evaluation?: EligibilityEvaluation; error?: string };
      if (!res.ok || !data.evaluation) {
        throw new Error(data.error || 'Could not evaluate eligibility.');
      }
      setEligResult(data.evaluation);
    } catch (err) {
      setEligError(err instanceof Error ? err.message : 'Eligibility check failed.');
    } finally {
      setEligLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/discover"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to Discover</span>
        </Link>
      </div>

      {/* Main Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns: Full Specification */}
        <div className="lg:col-span-8 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-blue-700">{opportunity.category}</span>
              <span aria-hidden="true">·</span>
              <span>{opportunity.mode}</span>
              <span aria-hidden="true">·</span>
              <span>Verification: {opportunity.verificationStatus}</span>
              <span aria-hidden="true">·</span>
              <span>Source: {opportunity.source}</span>
            </div>

            <h2 className="mt-2.5 font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {opportunity.title}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-700">{opportunity.organisation}</p>

            {opportunity.isSampleData && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
                <strong className="font-semibold text-slate-800">SAMPLE DATA:</strong> This listing is a fictional sample created for demonstration. Organisers, rewards, and example URLs are illustrative only.
              </div>
            )}

            <div className="mt-6 space-y-6 text-sm text-slate-700 leading-relaxed">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Overview</h3>
                <p className="mt-1.5">{opportunity.description}</p>
              </div>

              {opportunity.objectives.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Objectives</h3>
                  <ul className="mt-1.5 list-disc pl-5 space-y-1">
                    {opportunity.objectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-slate-100 pt-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Eligibility requirements</h3>
                  <p className="mt-1.5 text-slate-600">{opportunity.eligibility}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Academic requirements</h3>
                  <p className="mt-1.5 text-slate-600">{opportunity.academicRequirements}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">Required skills</h3>
                <p className="mt-1.5 text-slate-600">
                  {opportunity.requiredSkills.length > 0
                    ? opportunity.requiredSkills.join(' · ')
                    : 'Not specified'}
                </p>
              </div>

              {(opportunity.rewards || opportunity.benefits.length > 0) && (
                <div className="border-t border-slate-100 pt-5 space-y-3">
                  {opportunity.rewards && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Rewards & grants</h3>
                      <p className="mt-1 text-slate-600">{opportunity.rewards}</p>
                    </div>
                  )}
                  {opportunity.benefits.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Benefits</h3>
                      <ul className="mt-1 list-disc pl-5 space-y-1 text-slate-600">
                        {opportunity.benefits.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-sm font-semibold text-slate-900">Application procedure</h3>
                <p className="mt-1.5 text-slate-600">{opportunity.applicationProcedure}</p>
              </div>
            </div>
          </section>

          {/* Inline AI Eligibility Match Section */}
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Eligibility Match Check</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compares this opportunity against your profile ({profile.course} {profile.branch}, Year {profile.academicYear})
                </p>
              </div>
              <button
                type="button"
                onClick={runEligibilityCheck}
                disabled={eligLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap"
              >
                {eligLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Check My Eligibility</span>
                  </>
                )}
              </button>
            </div>

            {eligError && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                {eligError}
              </p>
            )}

            {eligResult && (
              <div className="mt-5 border-t border-slate-100 pt-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {eligResult.status === 'Appears eligible' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                    ) : eligResult.status === 'Not eligible' ? (
                      <XCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
                    ) : (
                      <HelpCircle className="h-5 w-5 text-amber-600" aria-hidden="true" />
                    )}
                    <span className="text-base font-bold text-slate-900">{eligResult.status}</span>
                  </div>
                  <span className="font-mono text-sm font-semibold text-blue-700 tabular-nums">
                    {eligResult.matchPercentage}% profile fit ({eligResult.evaluationMode === 'hybrid-ai' ? 'AI + Rules' : 'Rule-based'})
                  </span>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">{eligResult.explanation}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5">
                    <p className="font-semibold text-emerald-900">Matching criteria</p>
                    <ul className="mt-2 space-y-1 text-emerald-800 list-disc pl-4">
                      {eligResult.matchingCriteria.length > 0 ? (
                        eligResult.matchingCriteria.map((c, i) => <li key={i}>{c}</li>)
                      ) : (
                        <li>None confirmed</li>
                      )}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-red-200 bg-red-50/50 p-3.5">
                    <p className="font-semibold text-red-900">Missing criteria</p>
                    <ul className="mt-2 space-y-1 text-red-800 list-disc pl-4">
                      {eligResult.missingCriteria.length > 0 ? (
                        eligResult.missingCriteria.map((c, i) => <li key={i}>{c}</li>)
                      ) : (
                        <li>No blocking mismatches found</li>
                      )}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3.5">
                    <p className="font-semibold text-amber-900">Unclear / verify manually</p>
                    <ul className="mt-2 space-y-1 text-amber-900 list-disc pl-4">
                      {eligResult.unclearRequirements.length > 0 ? (
                        eligResult.unclearRequirements.map((c, i) => <li key={i}>{c}</li>)
                      ) : (
                        <li>None</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right 4 Columns: Important Dates, External Link, Tracking & Notes */}
        <div className="lg:col-span-4 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Important dates & logistics</h3>
            <dl className="space-y-3 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Registration deadline</dt>
                <dd className="font-mono font-semibold text-slate-900 tabular-nums text-right">
                  {formatReadableDate(opportunity.registrationDeadline)}
                  <span className="block text-[11px] font-normal text-slate-500">
                    {formatDeadlineCountdown(opportunity.registrationDeadline)}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Event dates</dt>
                <dd className="font-mono text-slate-800 tabular-nums text-right">
                  {opportunity.eventStartDate
                    ? `${formatReadableDate(opportunity.eventStartDate)}${
                        opportunity.eventEndDate && opportunity.eventEndDate !== opportunity.eventStartDate
                          ? ` – ${formatReadableDate(opportunity.eventEndDate)}`
                          : ''
                      }`
                    : 'Not specified'}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Mode</dt>
                <dd className="font-medium text-slate-800">{opportunity.mode}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Location</dt>
                <dd className="text-right text-slate-800">{opportunity.location}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Registration fee</dt>
                <dd className="text-right text-slate-800">{opportunity.registrationFee || 'Not specified'}</dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-slate-100 pt-2.5">
                <dt className="text-slate-500">Last updated</dt>
                <dd className="font-mono text-slate-600 tabular-nums">
                  {formatReadableDate(opportunity.updatedAt)}
                </dd>
              </div>
            </dl>

            {opportunity.registrationUrl && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                {opportunity.verificationStatus !== 'Verified' && (
                  <p className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>This listing is unverified. Confirm domain authenticity before submitting credentials.</span>
                  </p>
                )}
                {opportunity.isSampleData ? (
                  <p className="text-xs text-slate-500 font-mono break-all">
                    Sample link: {opportunity.registrationUrl}
                  </p>
                ) : (
                  <a
                    href={opportunity.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    <span>Open Registration Link</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </section>

          {/* Tracking & Application Status */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Your tracking workspace</h3>
              <button
                type="button"
                onClick={() =>
                  tracked
                    ? removeSavedOpportunity(opportunity.id)
                    : saveOpportunity(opportunity.id, 'Saved')
                }
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tracked
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                {tracked ? (
                  <>
                    <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Unsave</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Save Opportunity</span>
                  </>
                )}
              </button>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Application status</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => updateOpportunityStatus(opportunity.id, st)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      tracked?.status === st
                        ? 'border-blue-700 bg-blue-700 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Mark as {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <label htmlFor="personal-notes" className="block text-xs font-medium text-slate-700">
                Personal notes
              </label>
              <textarea
                id="personal-notes"
                rows={4}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Track teammates, essay drafts, or documents needed..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                maxLength={2000}
              />
              <button
                type="button"
                onClick={() => {
                  if (!tracked) {
                    saveOpportunity(opportunity.id, 'Saved');
                  }
                  updateOpportunityNotes(opportunity.id, notesDraft);
                  pushToast('Notes saved', 'Personal notes updated for this opportunity.');
                }}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
              >
                Save Personal Notes
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
