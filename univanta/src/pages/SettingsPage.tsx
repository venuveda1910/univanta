import { useState } from 'react';
import { Download, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog.tsx';
import { useApp } from '../context/AppContext.tsx';

export function SettingsPage() {
  const {
    profile,
    userOpportunities,
    notificationPrefs,
    updateNotificationPrefs,
    firebaseStatus,
    geminiConfigured,
    resetDemoWorkspace,
    pushToast,
  } = useApp();

  const [confirmReset, setConfirmReset] = useState(false);

  function exportPersonalData() {
    const bundle = {
      exportedAt: new Date().toISOString(),
      mode: firebaseStatus.modeLabel,
      profile,
      trackedOpportunities: userOpportunities,
      notificationPreferences: notificationPrefs,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `univanta-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast('Export downloaded', 'Your profile and tracked opportunities were exported.');
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Application Settings
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Manage in-app notification reminders, review integration readiness, or export your data.
        </p>
      </div>

      {/* In-App Notification Preferences */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">In-App Notification Preferences</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Univanta currently delivers in-app reminders and date-based deadline alerts (email/SMS push services are not configured).
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          <label className="flex items-center justify-between py-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-slate-900">7-day deadline approaching alerts</p>
              <p className="text-xs text-slate-500">Notify in-app when a saved opportunity closes within 7 days.</p>
            </div>
            <input
              type="checkbox"
              checked={notificationPrefs.deadline7Days}
              onChange={(e) => updateNotificationPrefs({ deadline7Days: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-700"
            />
          </label>

          <label className="flex items-center justify-between py-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-slate-900">3-day urgent cutoff alerts</p>
              <p className="text-xs text-slate-500">Highlight urgent deadlines within 72 hours for unsubmitted saves.</p>
            </div>
            <input
              type="checkbox"
              checked={notificationPrefs.deadline3Days}
              onChange={(e) => updateNotificationPrefs({ deadline3Days: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-700"
            />
          </label>

          <label className="flex items-center justify-between py-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-slate-900">Application status activity log</p>
              <p className="text-xs text-slate-500">Record a notification when you move an opportunity to Applied or Shortlisted.</p>
            </div>
            <input
              type="checkbox"
              checked={notificationPrefs.statusUpdates}
              onChange={(e) => updateNotificationPrefs({ statusUpdates: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-700"
            />
          </label>

          <label className="flex items-center justify-between py-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-slate-900">New recommended opportunity alerts</p>
              <p className="text-xs text-slate-500">Flag newly published listings matching your preferred categories.</p>
            </div>
            <input
              type="checkbox"
              checked={notificationPrefs.newRecommendations}
              onChange={(e) => updateNotificationPrefs({ newRecommendations: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-700"
            />
          </label>
        </div>
      </section>

      {/* Integration Status */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Platform Integration Status</h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-start gap-2.5">
              {geminiConfigured ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
              )}
              <div>
                <p className="font-semibold text-slate-900">Server-Side Gemini AI API</p>
                <p className="mt-0.5 text-slate-600">
                  {geminiConfigured
                    ? 'Server GEMINI_API_KEY detected. Poster scanning, eligibility interpretation, and assistant reasoning are active.'
                    : 'GEMINI_API_KEY is not configured in the server environment. Configure it in AI Studio Secrets (or .env locally) to activate AI poster extraction.'}
                </p>
              </div>
            </div>
            <span className="font-mono font-semibold text-slate-700 shrink-0">
              {geminiConfigured ? 'Configured' : 'Fallback'}
            </span>
          </div>

          <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-start gap-2.5">
              {firebaseStatus.configured ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
              )}
              <div>
                <p className="font-semibold text-slate-900">Firebase Auth & Cloud Firestore</p>
                <p className="mt-0.5 text-slate-600">{firebaseStatus.setupNotice}</p>
              </div>
            </div>
            <span className="font-mono font-semibold text-slate-700 shrink-0">
              {firebaseStatus.configured ? 'Connected' : 'Demo Mode'}
            </span>
          </div>
        </div>
      </section>

      {/* Data Controls */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Data & Privacy Controls</h3>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportPersonalData}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Export My Workspace JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Demo Workspace</span>
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmReset}
        title="Reset local Demo Workspace?"
        description="This clears your saved opportunities, notes, scan history, and profile edits in this browser, restoring the initial sample state."
        confirmLabel="Reset Workspace"
        destructive
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemoWorkspace();
          setConfirmReset(false);
        }}
      />
    </div>
  );
}
