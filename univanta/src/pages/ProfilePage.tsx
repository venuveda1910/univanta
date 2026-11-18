import React, { useState } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import type { OpportunityCategory, OpportunityMode } from '../types/campus.ts';

const ALL_CATEGORIES: OpportunityCategory[] = [
  'Hackathon',
  'Internship',
  'Scholarship',
  'Coding Competition',
  'Workshop',
  'Volunteering',
  'Conference',
  'Research',
];

export function ProfilePage() {
  const { profile, updateProfile } = useApp();

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [email, setEmail] = useState(profile.email);
  const [institution, setInstitution] = useState(profile.institution);
  const [course, setCourse] = useState(profile.course);
  const [branch, setBranch] = useState(profile.branch);
  const [academicYear, setAcademicYear] = useState(profile.academicYear);
  const [graduationYear, setGraduationYear] = useState(profile.graduationYear);
  const [skills, setSkills] = useState<string[]>(profile.skills);
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const [preferredCategories, setPreferredCategories] = useState<OpportunityCategory[]>(
    profile.preferredCategories
  );
  const [preferredMode, setPreferredMode] = useState<OpportunityMode | 'Any'>(
    profile.preferredMode
  );
  const [locationPreference, setLocationPreference] = useState(profile.locationPreference || '');

  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [error, setError] = useState<string | null>(null);

  function addSkill() {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (!skills.includes(trimmed) && skills.length < 25) {
      setSkills([...skills, trimmed]);
    }
    setNewSkill('');
  }

  function addInterest() {
    const trimmed = newInterest.trim();
    if (!trimmed) return;
    if (!interests.includes(trimmed) && interests.length < 20) {
      setInterests([...interests, trimmed]);
    }
    setNewInterest('');
  }

  function toggleCategory(cat: OpportunityCategory) {
    setPreferredCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!displayName.trim()) {
      setError('Display name is required.');
      return;
    }
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    updateProfile({
      displayName: displayName.trim(),
      email: email.trim(),
      institution: institution.trim(),
      course: course.trim(),
      branch: branch.trim(),
      academicYear,
      graduationYear,
      skills,
      interests,
      preferredCategories,
      preferredMode,
      locationPreference: locationPreference.trim(),
    });
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Student Profile
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Only academic and preference fields required for eligibility matching and recommendations are stored.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="rounded-xl border border-slate-200 bg-white p-6 space-y-6">
        {/* Identity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="prof-name" className="block text-xs font-medium text-slate-700">
              Display name
            </label>
            <input
              id="prof-name"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="prof-email" className="block text-xs font-medium text-slate-700">
              Email address
            </label>
            <input
              id="prof-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>
        </div>

        {/* Academic Background */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-slate-100 pt-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="prof-inst" className="block text-xs font-medium text-slate-700">
              Institution
            </label>
            <input
              id="prof-inst"
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="prof-course" className="block text-xs font-medium text-slate-700">
              Degree or course
            </label>
            <input
              id="prof-course"
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="prof-branch" className="block text-xs font-medium text-slate-700">
              Branch or department
            </label>
            <input
              id="prof-branch"
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="prof-year" className="block text-xs font-medium text-slate-700">
              Current academic year
            </label>
            <select
              id="prof-year"
              value={academicYear}
              onChange={(e) => setAcademicYear(Number(e.target.value))}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            >
              <option value={1}>Year 1</option>
              <option value={2}>Year 2</option>
              <option value={3}>Year 3</option>
              <option value={4}>Year 4</option>
              <option value={5}>Postgraduate / Year 5</option>
            </select>
          </div>

          <div>
            <label htmlFor="prof-grad" className="block text-xs font-medium text-slate-700">
              Graduation year
            </label>
            <input
              id="prof-grad"
              type="number"
              min={2026}
              max={2035}
              value={graduationYear}
              onChange={(e) => setGraduationYear(Number(e.target.value))}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 font-mono text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="prof-mode" className="block text-xs font-medium text-slate-700">
              Preferred mode
            </label>
            <select
              id="prof-mode"
              value={preferredMode}
              onChange={(e) => setPreferredMode(e.target.value as OpportunityMode | 'Any')}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            >
              <option value="Any">Any mode</option>
              <option value="Online">Online</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Offline">Offline / In-person</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="prof-loc" className="block text-xs font-medium text-slate-700">
            Optional location preference
          </label>
          <input
            id="prof-loc"
            type="text"
            value={locationPreference}
            onChange={(e) => setLocationPreference(e.target.value)}
            placeholder="e.g. Bengaluru / Remote"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-700 focus:outline-none"
          />
        </div>

        {/* Skills Editor */}
        <div className="border-t border-slate-100 pt-5 space-y-2.5">
          <label htmlFor="prof-add-skill" className="block text-xs font-medium text-slate-700">
            Skills ({skills.length}/25)
          </label>
          <div className="flex gap-2">
            <input
              id="prof-add-skill"
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Add skill (e.g. PyTorch, Docker, Figma)"
              className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
            <button
              type="button"
              onClick={addSkill}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Add</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {skills.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSkills(skills.filter((item) => item !== s))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800 hover:border-red-300 hover:bg-red-50"
                title={`Remove ${s}`}
              >
                <span>{s}</span>
                <X className="h-3 w-3 text-slate-400" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        {/* Interests Editor */}
        <div className="border-t border-slate-100 pt-5 space-y-2.5">
          <label htmlFor="prof-add-interest" className="block text-xs font-medium text-slate-700">
            Interests ({interests.length}/20)
          </label>
          <div className="flex gap-2">
            <input
              id="prof-add-interest"
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addInterest();
                }
              }}
              placeholder="Add interest (e.g. Civic Tech, Robotics, Climate)"
              className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
            <button
              type="button"
              onClick={addInterest}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Add</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {interests.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setInterests(interests.filter((x) => x !== item))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800 hover:border-red-300 hover:bg-red-50"
                title={`Remove ${item}`}
              >
                <span>{item}</span>
                <X className="h-3 w-3 text-slate-400" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Categories */}
        <div className="border-t border-slate-100 pt-5 space-y-2.5">
          <p className="text-xs font-medium text-slate-700">Preferred opportunity categories</p>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => {
              const selected = preferredCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? 'bg-blue-700 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            <span>Save Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
}
