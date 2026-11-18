import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Info } from 'lucide-react';
import { UnivantaMark } from '../components/UnivantaMark.tsx';
import { useApp } from '../context/AppContext.tsx';

export function LoginPage() {
  const { signInDemo, firebaseStatus } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget =
    (location.state as { from?: string } | null)?.from || '/dashboard';

  const [email, setEmail] = useState('ananya.sharma@crestview.example.edu');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid student email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    signInDemo(email);
    navigate(redirectTarget, { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2.5 text-slate-900">
          <UnivantaMark className="h-8 w-8" />
          <span className="font-display text-xl font-bold tracking-tight">Univanta</span>
        </Link>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h1 className="font-display text-2xl font-bold text-slate-900">Sign in to your workspace</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Access your saved opportunities, eligibility checks, and deadline radar.
          </p>

          {!firebaseStatus.configured && (
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-slate-700 leading-relaxed">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
              <div>
                <p className="font-semibold text-slate-900">Demo Mode Authentication</p>
                <p className="mt-0.5">
                  Live Firebase Auth is not configured in this workspace. Signing in activates a clearly labelled local Demo Mode session with browser persistence.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-slate-700">
                University or personal email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
                placeholder="student@university.edu"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-medium text-slate-700">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
                placeholder="Enter at least 6 characters"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              <span>Sign in (Demo Mode)</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                signInDemo('ananya.sharma@crestview.example.edu', 'Ananya Sharma');
                navigate(redirectTarget, { replace: true });
              }}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Continue as Sample Student (Ananya Sharma)
            </button>
            <button
              type="button"
              onClick={() =>
                setError(
                  'Google Sign-In requires Firebase Authentication configuration (see README.md). Use Demo Mode sign-in above to explore all features.'
                )
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Sign in with Google (Requires Firebase OAuth Setup)
            </button>
          </div>

          <p className="mt-5 text-center text-xs text-slate-600">
            New to Univanta?{' '}
            <Link to="/signup" className="font-semibold text-blue-700 hover:underline">
              Create a demo profile
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function SignupPage() {
  const { signUpDemo, firebaseStatus } = useApp();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [course, setCourse] = useState('B.Tech');
  const [branch, setBranch] = useState('Computer Science');
  const [academicYear, setAcademicYear] = useState(2);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (displayName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    signUpDemo({
      displayName,
      email,
      institution,
      course,
      branch,
      academicYear,
    });
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-lg">
        <Link to="/" className="inline-flex items-center gap-2.5 text-slate-900">
          <UnivantaMark className="h-8 w-8" />
          <span className="font-display text-xl font-bold tracking-tight">Univanta</span>
        </Link>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h1 className="font-display text-2xl font-bold text-slate-900">Create your student profile</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Personalize eligibility checks, opportunity recommendations, and deadline tracking.
          </p>

          {!firebaseStatus.configured && (
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-slate-700 leading-relaxed">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
              <span>
                Firebase is not provisioned; this registration creates a local Demo Mode profile saved in your browser.
              </span>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="signup-name" className="block text-xs font-medium text-slate-700">
                  Full name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-700 focus:outline-none"
                  placeholder="Rohan Kulkarni"
                />
              </div>
              <div>
                <label htmlFor="signup-email" className="block text-xs font-medium text-slate-700">
                  Student email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-700 focus:outline-none"
                  placeholder="rohan@college.edu"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-institution" className="block text-xs font-medium text-slate-700">
                College / University
              </label>
              <input
                id="signup-institution"
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-700 focus:outline-none"
                placeholder="e.g. National Institute of Technology"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="signup-course" className="block text-xs font-medium text-slate-700">
                  Degree / Course
                </label>
                <input
                  id="signup-course"
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-700 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="signup-branch" className="block text-xs font-medium text-slate-700">
                  Branch / Dept
                </label>
                <input
                  id="signup-branch"
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-700 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="signup-year" className="block text-xs font-medium text-slate-700">
                  Academic year
                </label>
                <select
                  id="signup-year"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
                >
                  <option value={1}>Year 1</option>
                  <option value={2}>Year 2</option>
                  <option value={3}>Year 3</option>
                  <option value={4}>Year 4</option>
                  <option value={5}>Postgrad / Year 5</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-xs font-medium text-slate-700">
                Password (min 6 chars)
              </label>
              <input
                id="signup-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-700 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
            >
              <span>Create Demo Account</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-600">
            Already have a profile?{' '}
            <Link to="/login" className="font-semibold text-blue-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
