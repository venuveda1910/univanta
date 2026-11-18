import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  ScanLine,
  ShieldCheck,
  CalendarClock,
  BookmarkCheck,
  User,
  Settings,
  Lock,
  Bell,
  Bot,
  Menu,
  X,
  LogOut,
  CheckCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { UnivantaMark } from './UnivantaMark.tsx';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/scanner', label: 'Poster Scanner', icon: ScanLine },
  { to: '/eligibility', label: 'Eligibility Matcher', icon: ShieldCheck },
  { to: '/deadlines', label: 'Deadline Radar', icon: CalendarClock },
  { to: '/my-opportunities', label: 'My Opportunities', icon: BookmarkCheck },
];

const ACCOUNT_NAV: NavItem[] = [
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/admin', label: 'Admin Console', icon: Lock },
];

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/discover': 'Discover Opportunities',
  '/scanner': 'AI Poster Scanner',
  '/eligibility': 'AI Eligibility Matcher',
  '/deadlines': 'Deadline Radar',
  '/my-opportunities': 'My Opportunities',
  '/profile': 'Student Profile',
  '/settings': 'Application Settings',
  '/admin': 'Administrative Management',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    isAuthenticated,
    isDemoMode,
    profile,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setAssistantOpen,
    signOut,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pageTitle =
    ROUTE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/opportunity/') ? 'Opportunity Details' : 'Workspace');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-700 rounded"
          >
            <UnivantaMark className="h-7 w-7 shrink-0" />
            <span className="font-display text-base font-bold tracking-tight whitespace-nowrap">
              Univanta
            </span>
          </Link>
        </div>

        <nav aria-label="Main workspace navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div className="space-y-1">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-50 text-blue-800'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-1">
            <p className="px-3 pb-1 text-xs font-medium text-slate-400">Account & Governance</p>
            {ACCOUNT_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-50 text-blue-800'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <img
              src={profile.avatarUrl || '/src/assets/images/avatar_student_demo_1794834088957.jpg'}
              alt={profile.displayName}
              referrerPolicy="no-referrer"
              className="h-9 w-9 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{profile.displayName}</p>
              <p className="truncate text-xs text-slate-500">
                {profile.course} · Year {profile.academicYear}
              </p>
            </div>
          </div>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                signOut();
                navigate('/');
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-700"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign out</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="mt-3 flex w-full items-center justify-center rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800"
            >
              Sign in (Demo Mode)
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative flex w-72 max-w-full flex-col bg-white border-r border-slate-200 z-10">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 text-slate-900"
              >
                <UnivantaMark className="h-7 w-7" />
                <span className="font-display text-base font-bold">Univanta</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {[...PRIMARY_NAV, ...ACCOUNT_NAV].map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
                        isActive
                          ? 'bg-blue-50 text-blue-800'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Wrapper */}
      <div className="flex flex-1 flex-col lg:pl-64 min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden focus-visible:outline-2 focus-visible:outline-blue-700"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-400">Univanta</span>
              <span className="hidden sm:inline text-slate-300" aria-hidden="true">/</span>
              <h1 className="truncate font-display text-sm sm:text-base font-semibold text-slate-900">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Notification popover button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-700"
                aria-label={`Notifications (${unreadCount} unread)`}
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-700 px-1 font-mono text-[10px] font-semibold text-white tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-3 shadow-lg z-40">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold text-slate-900">In-App Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
                      >
                        <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>
                  <div className="mt-2 max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-500">
                        No notifications yet. Save an opportunity to receive deadline reminders.
                      </p>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            markNotificationRead(n.id);
                            setNotifOpen(false);
                            if (n.opportunityId) {
                              navigate(`/opportunity/${n.opportunityId}`);
                            }
                          }}
                          className={`block w-full py-2.5 text-left transition-colors hover:bg-slate-50 px-2 rounded ${
                            n.read ? 'opacity-65' : ''
                          }`}
                        >
                          <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                          <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">{n.message}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setAssistantOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors focus-visible:outline-2 focus-visible:outline-blue-700 whitespace-nowrap"
            >
              <Bot className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Ask Assistant</span>
            </button>
          </div>
        </header>

        {/* Honest Demo Mode Notice */}
        {isDemoMode && (
          <div className="border-b border-slate-200 bg-slate-100/80 px-4 sm:px-6 py-2 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
            <span>
              <strong className="font-semibold text-slate-900">Demo Mode active:</strong> Firebase is not provisioned; account and tracking changes are saved locally in this browser.
            </span>
            <Link to="/settings" className="font-medium text-blue-700 hover:underline whitespace-nowrap">
              Integration status & setup
            </Link>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
