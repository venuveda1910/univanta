import React, { useMemo, useState } from 'react';
import { Lock, Plus, CheckCircle2, Archive, ShieldAlert, Edit3 } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import type {
  Opportunity,
  OpportunityCategory,
  OpportunityMode,
  VerificationStatus,
} from '../types/campus.ts';

export function AdminPage() {
  const {
    profile,
    isDemoMode,
    toggleDemoAdminRole,
    opportunities,
    userOpportunities,
    scanHistory,
    adminCreateOpportunity,
    adminUpdateOpportunity,
  } = useApp();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [title, setTitle] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [category, setCategory] = useState<OpportunityCategory>('Hackathon');
  const [mode, setMode] = useState<OpportunityMode>('Hybrid');
  const [deadline, setDeadline] = useState('2026-12-20');
  const [location, setLocation] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const verified = opportunities.filter((o) => o.verificationStatus === 'Verified').length;
    const pending = opportunities.filter((o) => o.verificationStatus === 'Pending Review').length;
    const archived = opportunities.filter((o) => o.verificationStatus === 'Archived').length;
    return {
      total: opportunities.length,
      verified,
      pending,
      archived,
      trackedCount: userOpportunities.length,
      scansCount: scanHistory.length,
    };
  }, [opportunities, userOpportunities, scanHistory]);

  function startEdit(opp: Opportunity) {
    setEditingOpp(opp);
    setShowCreateForm(true);
    setTitle(opp.title);
    setOrganisation(opp.organisation);
    setCategory(opp.category);
    setMode(opp.mode);
    setDeadline(opp.registrationDeadline);
    setLocation(opp.location);
    setEligibility(opp.eligibility);
    setSkillsText(opp.requiredSkills.join(', '));
    setDescription(opp.description);
    setFormError(null);
  }

  function resetForm() {
    setEditingOpp(null);
    setShowCreateForm(false);
    setTitle('');
    setOrganisation('');
    setCategory('Hackathon');
    setMode('Hybrid');
    setDeadline('2026-12-20');
    setLocation('');
    setEligibility('');
    setSkillsText('');
    setDescription('');
    setFormError(null);
  }

  async function handleSaveOpportunity(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!title.trim() || !organisation.trim() || !deadline.trim()) {
      setFormError('Title, organisation, and registration deadline are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Opportunity> = {
        title: title.trim(),
        organisation: organisation.trim(),
        category,
        mode,
        registrationDeadline: deadline.trim(),
        location: location.trim() || 'Not specified',
        eligibility: eligibility.trim() || 'Not specified',
        requiredSkills: skillsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        description: description.trim() || 'Curated by Univanta administrator.',
      };

      if (editingOpp) {
        await adminUpdateOpportunity(editingOpp.id, payload);
      } else {
        await adminCreateOpportunity({
          ...payload,
          verificationStatus: 'Verified',
          source: 'Admin Curated',
          isSampleData: false,
        });
      }
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save opportunity.');
    } finally {
      setSubmitting(false);
    }
  }

  if (profile.role !== 'demo_admin') {
    return (
      <div className="max-w-2xl mx-auto rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              Administrative Access Required
            </h2>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">
              This route manages shared catalog listings, verification status, and user-submitted poster scans.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2 leading-relaxed">
          <p className="font-semibold text-slate-900">Security architecture note</p>
          <p>
            In production with Firebase configured, administrator privileges are enforced server-side and in <code className="font-mono">firestore.rules</code> via verified <code className="font-mono">admins/{'{uid}'}</code> records or Firebase Admin SDK custom claims — never via client-modifiable profile flags or hardcoded passwords.
          </p>
          {isDemoMode && (
            <p>
              Because this workspace is running in local <strong>Demo Mode</strong> without live Firebase provisioning, you can preview the Admin Console by explicitly switching your Demo Role below.
            </p>
          )}
        </div>

        {isDemoMode && (
          <button
            type="button"
            onClick={toggleDemoAdminRole}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            <span>Enable Demo Admin Preview</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Administrative Management
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Curate opportunities, verify student-submitted scans, and archive expired listings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (showCreateForm) resetForm();
              else setShowCreateForm(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{showCreateForm ? 'Close Form' : 'Create Opportunity'}</span>
          </button>
          <button
            type="button"
            onClick={toggleDemoAdminRole}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Exit Demo Admin
          </button>
        </div>
      </div>

      {/* Platform Statistics */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Total catalog</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Verified</p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">{stats.verified}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Pending review</p>
          <p className="mt-1 font-mono text-2xl font-bold text-amber-700 tabular-nums">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Archived</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-500 tabular-nums">{stats.archived}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Tracked / Scans</p>
          <p className="mt-1 font-mono text-2xl font-bold text-blue-700 tabular-nums">
            {stats.trackedCount} / {stats.scansCount}
          </p>
        </div>
      </section>

      {/* Create / Edit Form */}
      {showCreateForm && (
        <form
          onSubmit={handleSaveOpportunity}
          className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
        >
          <h3 className="text-base font-semibold text-slate-900">
            {editingOpp ? `Edit: ${editingOpp.title}` : 'Publish New Opportunity'}
          </h3>

          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="admin-title" className="block text-xs font-medium text-slate-700">Title</label>
              <input
                id="admin-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="admin-org" className="block text-xs font-medium text-slate-700">Organisation</label>
              <input
                id="admin-org"
                type="text"
                required
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="admin-cat" className="block text-xs font-medium text-slate-700">Category</label>
              <select
                id="admin-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as OpportunityCategory)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="Hackathon">Hackathon</option>
                <option value="Internship">Internship</option>
                <option value="Scholarship">Scholarship</option>
                <option value="Coding Competition">Coding Competition</option>
                <option value="Workshop">Workshop</option>
                <option value="Volunteering">Volunteering</option>
                <option value="Conference">Conference</option>
                <option value="Research">Research</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="admin-mode" className="block text-xs font-medium text-slate-700">Mode</label>
              <select
                id="admin-mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as OpportunityMode)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="Online">Online</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
            <div>
              <label htmlFor="admin-deadline" className="block text-xs font-medium text-slate-700">
                Registration deadline (YYYY-MM-DD)
              </label>
              <input
                id="admin-deadline"
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              />
            </div>
            <div>
              <label htmlFor="admin-location" className="block text-xs font-medium text-slate-700">Location</label>
              <input
                id="admin-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="admin-elig" className="block text-xs font-medium text-slate-700">Eligibility</label>
              <input
                id="admin-elig"
                type="text"
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="admin-skills" className="block text-xs font-medium text-slate-700">
                Required skills (comma-separated)
              </label>
              <input
                id="admin-skills"
                type="text"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-desc" className="block text-xs font-medium text-slate-700">Description</label>
            <textarea
              id="admin-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingOpp ? 'Save Changes' : 'Publish Opportunity'}
            </button>
          </div>
        </form>
      )}

      {/* Moderation & Catalog Table */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-slate-900">Catalog Review & Verification</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Title & Organiser</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Deadline</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {opportunities.map((opp) => (
                <tr key={opp.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{opp.title}</p>
                    <p className="text-slate-500">
                      {opp.organisation} · {opp.source}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{opp.category}</td>
                  <td className="px-4 py-3 font-mono text-slate-700 tabular-nums">
                    {opp.registrationDeadline}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <span
                      className={
                        opp.verificationStatus === 'Verified'
                          ? 'text-emerald-700'
                          : opp.verificationStatus === 'Archived'
                            ? 'text-slate-400'
                            : 'text-amber-700'
                      }
                    >
                      {opp.verificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(opp)}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50"
                      >
                        <Edit3 className="h-3 w-3" aria-hidden="true" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus: VerificationStatus =
                            opp.verificationStatus === 'Verified' ? 'Unverified' : 'Verified';
                          adminUpdateOpportunity(opp.id, { verificationStatus: nextStatus });
                        }}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50"
                      >
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        <span>{opp.verificationStatus === 'Verified' ? 'Unverify' : 'Verify'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus: VerificationStatus =
                            opp.verificationStatus === 'Archived' ? 'Verified' : 'Archived';
                          adminUpdateOpportunity(opp.id, { verificationStatus: nextStatus });
                        }}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50"
                      >
                        <Archive className="h-3 w-3" aria-hidden="true" />
                        <span>{opp.verificationStatus === 'Archived' ? 'Restore' : 'Archive'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
