import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Loader2, CheckCircle2, XCircle, HelpCircle, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import type { EligibilityEvaluation } from '../types/campus.ts';

export function EligibilityPage() {
  const { opportunities, profile, saveOpportunity, getTrackingRecord } = useApp();

  const activeOpps = useMemo(
    () => opportunities.filter((o) => o.verificationStatus !== 'Archived'),
    [opportunities]
  );

  const [selectedId, setSelectedId] = useState<string>(activeOpps[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<EligibilityEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedOpp = activeOpps.find((o) => o.id === selectedId);

  async function evaluate() {
    if (!selectedOpp) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, opportunity: selectedOpp }),
      });
      const data = (await res.json()) as { evaluation?: EligibilityEvaluation; error?: string };
      if (!res.ok || !data.evaluation) {
        throw new Error(data.error || 'Eligibility check failed.');
      }
      setEvaluation(data.evaluation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run eligibility evaluation.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          AI Eligibility Matcher
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Evaluate your saved academic profile against any opportunity&apos;s stated requirements using deterministic rule verification and Gemini natural-language interpretation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Summary & Selector */}
        <div className="lg:col-span-5 space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Active student profile</h3>
              <Link to="/profile" className="text-xs font-medium text-blue-700 hover:underline">
                Edit profile
              </Link>
            </div>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Course & Branch</dt>
                <dd className="font-medium text-slate-900 text-right">
                  {profile.course} · {profile.branch}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Academic standing</dt>
                <dd className="font-mono font-semibold text-slate-900">
                  Year {profile.academicYear} (Class of {profile.graduationYear})
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Mode preference</dt>
                <dd className="text-slate-800">{profile.preferredMode}</dd>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <dt className="text-slate-500">Skills</dt>
                <dd className="mt-1 text-slate-800">
                  {profile.skills.length > 0 ? profile.skills.join(' · ') : 'None listed'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <label htmlFor="elig-opp-select" className="block text-sm font-semibold text-slate-900">
              Select opportunity to evaluate
            </label>
            <select
              id="elig-opp-select"
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setEvaluation(null);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
            >
              {activeOpps.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.title} ({opp.category})
                </option>
              ))}
            </select>

            {selectedOpp && (
              <div className="rounded-lg bg-slate-50 p-3.5 text-xs text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-900">{selectedOpp.organisation}</p>
                <p>
                  <strong className="text-slate-800">Stated eligibility:</strong> {selectedOpp.eligibility}
                </p>
                <p>
                  <strong className="text-slate-800">Deadline:</strong>{' '}
                  <span className="font-mono tabular-nums">{selectedOpp.registrationDeadline}</span>
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={evaluate}
              disabled={loading || !selectedOpp}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Evaluating Requirements...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>Run Eligibility Evaluation</span>
                </>
              )}
            </button>
          </section>
        </div>

        {/* Result View */}
        <div className="lg:col-span-7">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              {error}
            </div>
          )}

          {!evaluation ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold text-slate-900">
                Select an opportunity and run evaluation
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
                You will see formal eligibility status, matching criteria, missing criteria, unverified conditions, and recommended next steps.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  {evaluation.status === 'Appears eligible' ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden="true" />
                  ) : evaluation.status === 'Not eligible' ? (
                    <XCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
                  ) : (
                    <HelpCircle className="h-6 w-6 text-amber-600" aria-hidden="true" />
                  )}
                  <div>
                    <p className="text-lg font-bold text-slate-900">{evaluation.status}</p>
                    <p className="text-xs text-slate-500">
                      Mode: {evaluation.evaluationMode === 'hybrid-ai' ? 'Hybrid Rules + Gemini AI' : 'Deterministic Rules Fallback'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-2xl font-bold text-blue-700 tabular-nums">
                    {evaluation.matchPercentage}%
                  </p>
                  <p className="text-[11px] text-slate-500">Profile match score</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900">Decision explanation</h4>
                <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
                  {evaluation.explanation}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Note: Eligibility status reflects stated requirements only and never guarantees selection or acceptance.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
                  <h5 className="font-semibold text-emerald-900">Matching criteria</h5>
                  <ul className="mt-2 space-y-1.5 list-disc pl-4 text-emerald-800">
                    {evaluation.matchingCriteria.length > 0 ? (
                      evaluation.matchingCriteria.map((m, i) => <li key={i}>{m}</li>)
                    ) : (
                      <li>None confirmed</li>
                    )}
                  </ul>
                </div>

                <div className="rounded-lg border border-red-200 bg-red-50/40 p-4">
                  <h5 className="font-semibold text-red-900">Missing criteria</h5>
                  <ul className="mt-2 space-y-1.5 list-disc pl-4 text-red-800">
                    {evaluation.missingCriteria.length > 0 ? (
                      evaluation.missingCriteria.map((m, i) => <li key={i}>{m}</li>)
                    ) : (
                      <li>No hard mismatches detected</li>
                    )}
                  </ul>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
                  <h5 className="font-semibold text-amber-900">Unclear requirements</h5>
                  <ul className="mt-2 space-y-1.5 list-disc pl-4 text-amber-900">
                    {evaluation.unclearRequirements.length > 0 ? (
                      evaluation.unclearRequirements.map((m, i) => <li key={i}>{m}</li>)
                    ) : (
                      <li>None flagged</li>
                    )}
                  </ul>
                </div>
              </div>

              {evaluation.suggestedActions.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-sm font-semibold text-slate-900">Suggested actions</h4>
                  <ul className="mt-2 space-y-1 text-xs text-slate-700 list-disc pl-5">
                    {evaluation.suggestedActions.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedOpp && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <Link
                    to={`/opportunity/${selectedOpp.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline"
                  >
                    <span>Open full opportunity details</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                  {!getTrackingRecord(selectedOpp.id) && evaluation.status !== 'Not eligible' && (
                    <button
                      type="button"
                      onClick={() => saveOpportunity(selectedOpp.id, 'Interested')}
                      className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Save to My Opportunities
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
