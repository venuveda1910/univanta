import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Trash2,
  ScanLine,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Image as ImageIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import type {
  Opportunity,
  OpportunityCategory,
  OpportunityMode,
  PosterScanResult,
} from '../types/campus.ts';

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];

interface EditableScanForm {
  title: string;
  organisation: string;
  category: OpportunityCategory;
  description: string;
  eligibility: string;
  academicYearRestrictions: string;
  skillsRequired: string;
  registrationDeadline: string;
  eventDates: string;
  mode: OpportunityMode;
  location: string;
  registrationFee: string;
  rewardsOrBenefits: string;
  registrationInstructions: string;
  contactDetails: string;
  registrationLink: string;
}

function mapCategory(raw: string): OpportunityCategory {
  const lower = raw.toLowerCase();
  if (lower.includes('hack')) return 'Hackathon';
  if (lower.includes('intern')) return 'Internship';
  if (lower.includes('scholar') || lower.includes('grant')) return 'Scholarship';
  if (lower.includes('coding') || lower.includes('ctf') || lower.includes('algorithm'))
    return 'Coding Competition';
  if (lower.includes('workshop') || lower.includes('clinic')) return 'Workshop';
  if (lower.includes('volunteer')) return 'Volunteering';
  if (lower.includes('confer') || lower.includes('sympos')) return 'Conference';
  if (lower.includes('research') || lower.includes('fellow')) return 'Research';
  return 'Other';
}

function mapMode(raw: string): OpportunityMode {
  const lower = raw.toLowerCase();
  if (lower.includes('hybrid')) return 'Hybrid';
  if (lower.includes('offline') || lower.includes('in-person') || lower.includes('campus'))
    return 'Offline';
  return 'Online';
}

export function ScannerPage() {
  const { addScannedOpportunity, recordScanHistory, scanHistory, profile, geminiConfigured, pushToast } =
    useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    mimeType: string;
    sizeBytes: number;
    previewUrl: string;
    base64Data: string;
  } | null>(null);

  const [fileError, setFileError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [rawResult, setRawResult] = useState<PosterScanResult | null>(null);
  const [editForm, setEditForm] = useState<EditableScanForm | null>(null);
  const [verifiedByUser, setVerifiedByUser] = useState(false);
  const [saving, setSaving] = useState(false);

  function readBlobAsFile(blob: Blob, name: string, mimeType: string) {
    setFileError(null);
    setScanError(null);
    if (!ACCEPTED_TYPES.includes(mimeType.toLowerCase())) {
      setFileError('Unsupported file format. Please upload a PNG, JPG, JPEG, WEBP, or PDF file.');
      return;
    }
    if (blob.size > MAX_BYTES) {
      setFileError('File exceeds 8 MB maximum upload limit. Please compress and try again.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      setSelectedFile({
        name,
        mimeType,
        sizeBytes: blob.size,
        previewUrl: dataUrl,
        base64Data,
      });
      setRawResult(null);
      setEditForm(null);
      setVerifiedByUser(false);
    };
    reader.readAsDataURL(blob);
  }

  function handleFileInput(file?: File) {
    if (!file) return;
    readBlobAsFile(file, file.name, file.type || 'image/png');
  }

  async function loadSamplePoster() {
    try {
      const res = await fetch('/src/assets/images/sample_poster_hackathon_1794834090355.jpg');
      if (!res.ok) throw new Error('Sample poster could not be loaded.');
      const blob = await res.blob();
      readBlobAsFile(blob, 'sample_northstar_hackathon_poster.jpg', 'image/jpeg');
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Unable to load sample poster.');
    }
  }

  async function runAiScan() {
    if (!selectedFile) return;
    setScanning(true);
    setScanError(null);
    setScanProgress(25);

    const progressTimer = setInterval(() => {
      setScanProgress((prev) => (prev < 85 ? prev + 12 : prev));
    }, 450);

    try {
      const res = await fetch('/api/ai/scan-poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data: selectedFile.base64Data,
          mimeType: selectedFile.mimeType,
          fileName: selectedFile.name,
        }),
      });

      const data = (await res.json()) as { result?: PosterScanResult; error?: string };
      if (!res.ok || !data.result) {
        throw new Error(data.error || 'Poster extraction failed.');
      }

      setScanProgress(100);
      const r = data.result;
      setRawResult(r);
      setEditForm({
        title: r.title.value,
        organisation: r.organisation.value,
        category: mapCategory(r.category.value),
        description: r.description.value,
        eligibility: r.eligibility.value,
        academicYearRestrictions: r.academicYearRestrictions.value,
        skillsRequired: (r.skillsRequired || []).join(', '),
        registrationDeadline:
          r.registrationDeadline.value !== 'Not specified' ? r.registrationDeadline.value : '',
        eventDates: r.eventDates.value,
        mode: mapMode(r.mode.value),
        location: r.location.value,
        registrationFee: r.registrationFee.value,
        rewardsOrBenefits: r.rewardsOrBenefits.value,
        registrationInstructions: r.registrationInstructions.value,
        contactDetails: r.contactDetails.value,
        registrationLink: r.registrationLink.value,
      });

      recordScanHistory({
        id: `scan-${Date.now()}`,
        userId: profile.uid,
        fileName: selectedFile.name,
        mimeType: selectedFile.mimeType,
        extractedData: r,
        status: 'Reviewed',
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      // Preserve uploaded file when AI fails or quota is exceeded
      setScanError(
        err instanceof Error
          ? err.message
          : 'Gemini poster extraction failed. Your uploaded file has been preserved.'
      );
    } finally {
      clearInterval(progressTimer);
      setScanning(false);
    }
  }

  async function saveReviewedOpportunity(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm || !rawResult) return;
    if (!verifiedByUser) {
      setScanError('Please confirm that you have verified the extracted details before saving.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: editForm.title.trim(),
        organisation: editForm.organisation.trim(),
        category: editForm.category,
        description: editForm.description.trim(),
        eligibility: editForm.eligibility.trim(),
        academicRequirements: editForm.academicYearRestrictions.trim(),
        requiredSkills: editForm.skillsRequired
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        registrationDeadline: editForm.registrationDeadline.trim() || '2026-12-31',
        eventStartDate: editForm.eventDates !== 'Not specified' ? editForm.eventDates : undefined,
        mode: editForm.mode,
        location: editForm.location.trim(),
        registrationFee: editForm.registrationFee,
        rewards: editForm.rewardsOrBenefits,
        applicationProcedure: editForm.registrationInstructions,
        contactEmail: editForm.contactDetails !== 'Not specified' ? editForm.contactDetails : undefined,
        registrationUrl:
          editForm.registrationLink !== 'Not specified' ? editForm.registrationLink : undefined,
      };

      const res = await fetch('/api/opportunities/from-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error || 'Failed to save scanned opportunity.');
      }

      const data = (await res.json()) as { opportunity: Opportunity };
      addScannedOpportunity(data.opportunity, {
        id: `scan-saved-${Date.now()}`,
        userId: profile.uid,
        fileName: selectedFile?.name || 'poster',
        mimeType: selectedFile?.mimeType || 'image/png',
        extractedData: rawResult,
        status: 'Saved to Catalog',
        createdAt: new Date().toISOString(),
      });

      pushToast('Scanned opportunity saved', 'Added to catalog (Pending Review) and saved to My Opportunities.');
      navigate(`/opportunity/${data.opportunity.id}`);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Unable to save opportunity.');
    } finally {
      setSaving(false);
    }
  }

  function confidenceLabel(conf?: 'extracted' | 'inferred' | 'not_specified') {
    if (conf === 'extracted') return 'Extracted from file';
    if (conf === 'inferred') return 'Inferred from context';
    return 'Not specified in file';
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            AI Poster & Document Scanner
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Upload a campus notice, event poster (PNG/JPG/WEBP), or PDF brochure. Review all extracted fields before saving.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSamplePoster}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 whitespace-nowrap self-start"
        >
          <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Load Sample Hackathon Poster</span>
        </button>
      </div>

      {!geminiConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold">GEMINI_API_KEY is not configured on the server</p>
            <p className="mt-0.5">
              Poster scanning requires an active server-side Gemini API key in AI Studio Secrets. Univanta will never display fabricated extraction output if the API is unavailable.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Columns: Upload & Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFileInput(e.dataTransfer.files?.[0]);
            }}
            className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              dragActive
                ? 'border-blue-600 bg-blue-50/60'
                : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
          >
            <UploadCloud className="mx-auto h-9 w-9 text-blue-700" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-slate-900">
              Drag and drop event poster or PDF
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Supports PNG, JPG, JPEG, WEBP, and PDF up to 8 MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.pdf"
              onChange={(e) => handleFileInput(e.target.files?.[0])}
              className="sr-only"
              id="poster-file-input"
            />
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                {selectedFile ? 'Replace File' : 'Choose File'}
              </button>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setRawResult(null);
                    setEditForm(null);
                    setScanError(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>

          {fileError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {fileError}
            </div>
          )}

          {selectedFile && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-900 truncate">{selectedFile.name}</span>
                <span className="font-mono text-slate-500 tabular-nums shrink-0">
                  {(selectedFile.sizeBytes / 1024).toFixed(0)} KB
                </span>
              </div>

              {selectedFile.mimeType === 'application/pdf' ? (
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <FileText className="h-8 w-8 text-blue-700 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900">PDF Document Ready</p>
                    <p className="text-[11px] text-slate-500 truncate">{selectedFile.name}</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <img
                    src={selectedFile.previewUrl}
                    alt="Uploaded event poster preview"
                    className="max-h-96 w-full object-contain"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={runAiScan}
                disabled={scanning}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors"
              >
                {scanning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Analyzing with Gemini ({scanProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <ScanLine className="h-4 w-4" aria-hidden="true" />
                    <span>Extract Opportunity Details</span>
                  </>
                )}
              </button>

              {scanning && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-blue-700 transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {scanHistory.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-semibold text-slate-900">Recent scans</h3>
              <ul className="mt-2 divide-y divide-slate-100 text-xs">
                {scanHistory.slice(0, 4).map((item) => (
                  <li key={item.id} className="py-2 flex items-center justify-between gap-2">
                    <span className="truncate text-slate-700">{item.fileName}</span>
                    <span className="text-[11px] text-slate-500 shrink-0">{item.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right 7 Columns: Structured Editable Output */}
        <div className="lg:col-span-7">
          {scanError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
              <div>
                <p className="font-semibold">Extraction error</p>
                <p className="mt-0.5">{scanError}</p>
              </div>
            </div>
          )}

          {!editForm || !rawResult ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <ScanLine className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold text-slate-900">
                Structured extraction will appear here
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
                Upload an event poster or click &ldquo;Load Sample Hackathon Poster&rdquo; above, then run extraction to inspect all 16 structured fields.
              </p>
            </div>
          ) : (
            <form
              onSubmit={saveReviewedOpportunity}
              className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Review & Edit Extracted Fields
                  </h3>
                  <p className="text-xs text-slate-500">
                    Confirm accuracy before saving. Fields marked &ldquo;Not specified&rdquo; were absent from the uploaded file.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRawResult(null);
                    setEditForm(null);
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-red-600"
                >
                  Discard Scan
                </button>
              </div>

              {/* AI Safety & URL Warnings */}
              {rawResult.safetyWarnings.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 space-y-1.5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Verification & Safety Notices</span>
                  </p>
                  <ul className="list-disc pl-5 text-xs text-amber-900 space-y-1">
                    {rawResult.safetyWarnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label htmlFor="scan-title" className="font-medium text-slate-700">1. Event title</label>
                    <span className="text-[11px] text-slate-400">{confidenceLabel(rawResult.title.confidence)}</span>
                  </div>
                  <input
                    id="scan-title"
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label htmlFor="scan-org" className="font-medium text-slate-700">2. Organiser</label>
                    <span className="text-[11px] text-slate-400">{confidenceLabel(rawResult.organisation.confidence)}</span>
                  </div>
                  <input
                    id="scan-org"
                    type="text"
                    required
                    value={editForm.organisation}
                    onChange={(e) => setEditForm({ ...editForm, organisation: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label htmlFor="scan-cat" className="font-medium text-slate-700">3. Category</label>
                    <span className="text-[11px] text-slate-400">{confidenceLabel(rawResult.category.confidence)}</span>
                  </div>
                  <select
                    id="scan-cat"
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value as OpportunityCategory })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
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
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label htmlFor="scan-mode" className="font-medium text-slate-700">10. Event mode</label>
                    <span className="text-[11px] text-slate-400">{confidenceLabel(rawResult.mode.confidence)}</span>
                  </div>
                  <select
                    id="scan-mode"
                    value={editForm.mode}
                    onChange={(e) =>
                      setEditForm({ ...editForm, mode: e.target.value as OpportunityMode })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label htmlFor="scan-desc" className="font-medium text-slate-700">4. Description</label>
                  <span className="text-[11px] text-slate-400">{confidenceLabel(rawResult.description.confidence)}</span>
                </div>
                <textarea
                  id="scan-desc"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label htmlFor="scan-elig" className="font-medium text-slate-700">5. Eligibility requirements</label>
                    <span className="text-[11px] text-slate-400">{confidenceLabel(rawResult.eligibility.confidence)}</span>
                  </div>
                  <input
                    id="scan-elig"
                    type="text"
                    value={editForm.eligibility}
                    onChange={(e) => setEditForm({ ...editForm, eligibility: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label htmlFor="scan-years" className="font-medium text-slate-700">6. Academic year restrictions</label>
                    <span className="text-[11px] text-slate-400">{confidenceLabel(rawResult.academicYearRestrictions.confidence)}</span>
                  </div>
                  <input
                    id="scan-years"
                    type="text"
                    value={editForm.academicYearRestrictions}
                    onChange={(e) =>
                      setEditForm({ ...editForm, academicYearRestrictions: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label htmlFor="scan-skills" className="font-medium text-slate-700">7. Skills required</label>
                    <span className="text-[11px] text-slate-400">{confidenceLabel(rawResult.skillsConfidence)}</span>
                  </div>
                  <input
                    id="scan-skills"
                    type="text"
                    value={editForm.skillsRequired}
                    onChange={(e) => setEditForm({ ...editForm, skillsRequired: e.target.value })}
                    placeholder="Comma-separated"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label htmlFor="scan-deadline" className="font-medium text-slate-700">8. Registration deadline (YYYY-MM-DD)</label>
                    <span className="text-[11px] text-slate-400">{confidenceLabel(rawResult.registrationDeadline.confidence)}</span>
                  </div>
                  <input
                    id="scan-deadline"
                    type="text"
                    required
                    value={editForm.registrationDeadline}
                    onChange={(e) =>
                      setEditForm({ ...editForm, registrationDeadline: e.target.value })
                    }
                    placeholder="YYYY-MM-DD"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-blue-700 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label htmlFor="scan-dates" className="font-medium text-slate-700">9. Event dates</label>
                    <span className="text-[11px] text-slate-400">{confidenceLabel(rawResult.eventDates.confidence)}</span>
                  </div>
                  <input
                    id="scan-dates"
                    type="text"
                    value={editForm.eventDates}
                    onChange={(e) => setEditForm({ ...editForm, eventDates: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label htmlFor="scan-loc" className="font-medium text-slate-700">11. Location</label>
                    <span className="text-[11px] text-slate-400">{confidenceLabel(rawResult.location.confidence)}</span>
                  </div>
                  <input
                    id="scan-loc"
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label htmlFor="scan-fee" className="font-medium text-slate-700">12. Registration fee</label>
                    <span className="text-[11px] text-slate-400">{confidenceLabel(rawResult.registrationFee.confidence)}</span>
                  </div>
                  <input
                    id="scan-fee"
                    type="text"
                    value={editForm.registrationFee}
                    onChange={(e) => setEditForm({ ...editForm, registrationFee: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label htmlFor="scan-rewards" className="font-medium text-slate-700">13. Rewards or benefits</label>
                    <span className="text-[11px] text-slate-400">{confidenceLabel(rawResult.rewardsOrBenefits.confidence)}</span>
                  </div>
                  <input
                    id="scan-rewards"
                    type="text"
                    value={editForm.rewardsOrBenefits}
                    onChange={(e) => setEditForm({ ...editForm, rewardsOrBenefits: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label htmlFor="scan-contact" className="font-medium text-slate-700">15. Contact details</label>
                    <span className="text-[11px] text-slate-400">{confidenceLabel(rawResult.contactDetails.confidence)}</span>
                  </div>
                  <input
                    id="scan-contact"
                    type="text"
                    value={editForm.contactDetails}
                    onChange={(e) => setEditForm({ ...editForm, contactDetails: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label htmlFor="scan-link" className="font-medium text-slate-700">16. Registration link</label>
                    <span className="text-[11px] text-slate-400">{confidenceLabel(rawResult.registrationLink.confidence)}</span>
                  </div>
                  <input
                    id="scan-link"
                    type="text"
                    value={editForm.registrationLink}
                    onChange={(e) => setEditForm({ ...editForm, registrationLink: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label htmlFor="scan-instructions" className="font-medium text-slate-700">14. Registration instructions</label>
                  <span className="text-[11px] text-slate-400">{confidenceLabel(rawResult.registrationInstructions.confidence)}</span>
                </div>
                <textarea
                  id="scan-instructions"
                  rows={2}
                  value={editForm.registrationInstructions}
                  onChange={(e) =>
                    setEditForm({ ...editForm, registrationInstructions: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
                />
              </div>

              <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedByUser}
                  onChange={(e) => setVerifiedByUser(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700"
                />
                <span>
                  I have reviewed the extracted dates, eligibility, and registration URL against the original poster. Save this listing with status &ldquo;Pending Review&rdquo;.
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || !verifiedByUser}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      <span>Confirm & Save Opportunity</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
