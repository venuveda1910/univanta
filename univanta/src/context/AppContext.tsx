import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SAMPLE_OPPORTUNITIES } from '../data/sampleOpportunities.ts';
import { getDaysUntilDeadline } from '../lib/dateUtils.ts';
import { getFirebaseIntegrationStatus } from '../lib/firebaseConfig.ts';
import type {
  AppNotification,
  ApplicationStatus,
  NotificationPreferences,
  Opportunity,
  ScanHistoryItem,
  StudentProfile,
  UserOpportunityRecord,
} from '../types/campus.ts';

const STORAGE_KEYS = {
  AUTH: 'cc_demo_auth_v1',
  PROFILE: 'cc_demo_profile_v1',
  USER_OPPS: 'cc_demo_user_opps_v1',
  SCANS: 'cc_demo_scans_v1',
  NOTIFICATIONS: 'cc_demo_notifications_v1',
  PREFS: 'cc_demo_notif_prefs_v1',
  CUSTOM_OPPS: 'cc_demo_custom_opps_v1',
};

export const DEFAULT_DEMO_PROFILE: StudentProfile = {
  uid: 'demo-student-ananya',
  displayName: 'Ananya Sharma',
  email: 'ananya.sharma@crestview.example.edu',
  institution: 'Crestview Institute of Technology (Demo)',
  course: 'B.Tech',
  branch: 'Computer Science & Engineering',
  academicYear: 2,
  graduationYear: 2029,
  skills: ['Python', 'TypeScript', 'React', 'SQL', 'Git', 'UI Design'],
  interests: ['Civic Tech', 'AI/ML', 'Open Source', 'Distributed Systems'],
  preferredCategories: ['Hackathon', 'Internship', 'Research', 'Scholarship'],
  preferredMode: 'Hybrid',
  locationPreference: 'Bengaluru / Remote',
  avatarUrl: '/src/assets/images/avatar_student_demo_1794834088957.jpg',
  role: 'student',
  updatedAt: new Date().toISOString(),
};

const DEFAULT_PREFS: NotificationPreferences = {
  deadline7Days: true,
  deadline3Days: true,
  statusUpdates: true,
  newRecommendations: true,
};

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone: 'success' | 'info' | 'error';
}

interface AppContextValue {
  isAuthenticated: boolean;
  isDemoMode: boolean;
  firebaseStatus: ReturnType<typeof getFirebaseIntegrationStatus>;
  geminiConfigured: boolean;
  profile: StudentProfile;
  opportunities: Opportunity[];
  opportunitiesLoading: boolean;
  userOpportunities: UserOpportunityRecord[];
  scanHistory: ScanHistoryItem[];
  notifications: AppNotification[];
  notificationPrefs: NotificationPreferences;
  assistantOpen: boolean;
  setAssistantOpen: (open: boolean) => void;
  toasts: ToastMessage[];
  pushToast: (title: string, description?: string, tone?: ToastMessage['tone']) => void;
  dismissToast: (id: string) => void;
  signInDemo: (email?: string, name?: string) => void;
  signUpDemo: (payload: {
    displayName: string;
    email: string;
    institution?: string;
    course?: string;
    branch?: string;
    academicYear?: number;
  }) => void;
  signOut: () => void;
  updateProfile: (patch: Partial<StudentProfile>) => void;
  toggleDemoAdminRole: () => void;
  getTrackingRecord: (opportunityId: string) => UserOpportunityRecord | undefined;
  saveOpportunity: (opportunityId: string, initialStatus?: ApplicationStatus) => void;
  removeSavedOpportunity: (opportunityId: string) => void;
  updateOpportunityStatus: (opportunityId: string, status: ApplicationStatus) => void;
  updateOpportunityNotes: (opportunityId: string, notes: string) => void;
  updateOpportunityReminder: (opportunityId: string, reminderDate: string) => void;
  addScannedOpportunity: (opp: Opportunity, scanItem?: ScanHistoryItem) => void;
  recordScanHistory: (scan: ScanHistoryItem) => void;
  adminCreateOpportunity: (opp: Partial<Opportunity>) => Promise<Opportunity>;
  adminUpdateOpportunity: (id: string, patch: Partial<Opportunity>) => Promise<Opportunity>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateNotificationPrefs: (patch: Partial<NotificationPreferences>) => void;
  resetDemoWorkspace: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function safeReadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const firebaseStatus = useMemo(() => getFirebaseIntegrationStatus(), []);
  const isDemoMode = !firebaseStatus.configured;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    safeReadStorage<boolean>(STORAGE_KEYS.AUTH, false)
  );
  const [profile, setProfile] = useState<StudentProfile>(() =>
    safeReadStorage<StudentProfile>(STORAGE_KEYS.PROFILE, DEFAULT_DEMO_PROFILE)
  );
  const [opportunities, setOpportunities] = useState<Opportunity[]>(SAMPLE_OPPORTUNITIES);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState<boolean>(true);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(false);

  const [userOpportunities, setUserOpportunities] = useState<UserOpportunityRecord[]>(() =>
    safeReadStorage<UserOpportunityRecord[]>(STORAGE_KEYS.USER_OPPS, [])
  );
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>(() =>
    safeReadStorage<ScanHistoryItem[]>(STORAGE_KEYS.SCANS, [])
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    safeReadStorage<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, [])
  );
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(() =>
    safeReadStorage<NotificationPreferences>(STORAGE_KEYS.PREFS, DEFAULT_PREFS)
  );
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (title: string, description?: string, tone: ToastMessage['tone'] = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, description, tone }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const addNotification = useCallback(
    (notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
      const item: AppNotification = {
        ...notif,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [item, ...prev].slice(0, 40));
    },
    []
  );

  // Persist demo state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER_OPPS, JSON.stringify(userOpportunities));
  }, [userOpportunities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(scanHistory));
  }, [scanHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(notificationPrefs));
  }, [notificationPrefs]);

  // Fetch initial server status and opportunity catalog
  useEffect(() => {
    let active = true;
    async function loadServerState() {
      setOpportunitiesLoading(true);
      try {
        const [healthRes, oppRes] = await Promise.all([
          fetch('/api/health'),
          fetch('/api/opportunities?includeArchived=true', {
            headers: profile.role === 'demo_admin' ? { 'x-campus-demo-role': 'demo_admin' } : {},
          }),
        ]);

        if (!active) return;

        if (healthRes.ok) {
          const health = (await healthRes.json()) as { geminiConfigured?: boolean };
          setGeminiConfigured(Boolean(health.geminiConfigured));
        }

        if (oppRes.ok) {
          const data = (await oppRes.json()) as { opportunities: Opportunity[] };
          const localCustom = safeReadStorage<Opportunity[]>(STORAGE_KEYS.CUSTOM_OPPS, []);
          const mergedMap = new Map<string, Opportunity>();
          for (const item of data.opportunities) {
            mergedMap.set(item.id, item);
          }
          for (const custom of localCustom) {
            mergedMap.set(custom.id, custom);
          }
          setOpportunities(Array.from(mergedMap.values()));
        }
      } catch {
        // Fallback silently to sample dataset if server unreachable
      } finally {
        if (active) setOpportunitiesLoading(false);
      }
    }
    loadServerState();
    return () => {
      active = false;
    };
  }, [profile.role]);

  // Generate date-based deadline notifications for saved opportunities
  useEffect(() => {
    if (!isAuthenticated || userOpportunities.length === 0) return;

    setNotifications((prev) => {
      const existingKeys = new Set(prev.map((n) => `${n.type}:${n.opportunityId}`));
      const additions: AppNotification[] = [];

      for (const rec of userOpportunities) {
        if (rec.status === 'Completed' || rec.status === 'Archived') continue;
        const opp = opportunities.find((o) => o.id === rec.opportunityId);
        if (!opp) continue;
        const days = getDaysUntilDeadline(opp.registrationDeadline);
        if (days === null || days < 0) continue;

        if (days <= 3 && notificationPrefs.deadline3Days && !existingKeys.has(`deadline:${opp.id}`)) {
          additions.push({
            id: `notif-dl-${opp.id}`,
            title: `Urgent deadline: ${opp.title}`,
            message: `Closes in ${days === 0 ? 'today' : `${days} day(s)`} (${opp.registrationDeadline}). Current status: ${rec.status}.`,
            type: 'deadline',
            opportunityId: opp.id,
            read: false,
            createdAt: new Date().toISOString(),
          });
        } else if (days <= 7 && notificationPrefs.deadline7Days && !existingKeys.has(`deadline:${opp.id}`)) {
          additions.push({
            id: `notif-dl-${opp.id}`,
            title: `Deadline approaching: ${opp.title}`,
            message: `Closes in ${days} days (${opp.registrationDeadline}).`,
            type: 'deadline',
            opportunityId: opp.id,
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      }

      if (additions.length === 0) return prev;
      return [...additions, ...prev].slice(0, 40);
    });
  }, [isAuthenticated, userOpportunities, opportunities, notificationPrefs.deadline3Days, notificationPrefs.deadline7Days]);

  const signInDemo = useCallback(
    (email?: string, name?: string) => {
      if (email && email.trim()) {
        setProfile((prev) => ({
          ...prev,
          email: email.trim(),
          displayName: name?.trim() || prev.displayName,
          updatedAt: new Date().toISOString(),
        }));
      }
      setIsAuthenticated(true);
      pushToast('Signed in to Demo Mode', 'Local browser persistence is active.');
    },
    [pushToast]
  );

  const signUpDemo = useCallback(
    (payload: {
      displayName: string;
      email: string;
      institution?: string;
      course?: string;
      branch?: string;
      academicYear?: number;
    }) => {
      const nextProfile: StudentProfile = {
        ...DEFAULT_DEMO_PROFILE,
        uid: `demo-${Date.now()}`,
        displayName: payload.displayName.trim(),
        email: payload.email.trim(),
        institution: payload.institution?.trim() || DEFAULT_DEMO_PROFILE.institution,
        course: payload.course?.trim() || DEFAULT_DEMO_PROFILE.course,
        branch: payload.branch?.trim() || DEFAULT_DEMO_PROFILE.branch,
        academicYear: payload.academicYear || 2,
        updatedAt: new Date().toISOString(),
      };
      setProfile(nextProfile);
      setIsAuthenticated(true);
      pushToast('Demo profile created', `Welcome to Univanta, ${nextProfile.displayName}.`);
    },
    [pushToast]
  );

  const signOut = useCallback(() => {
    setIsAuthenticated(false);
    pushToast('Signed out', 'Your Demo Mode workspace remains saved in this browser.', 'info');
  }, [pushToast]);

  const updateProfile = useCallback(
    (patch: Partial<StudentProfile>) => {
      setProfile((prev) => ({
        ...prev,
        ...patch,
        updatedAt: new Date().toISOString(),
      }));
      pushToast('Profile updated', 'Eligibility matching and recommendations now reflect your changes.');
    },
    [pushToast]
  );

  const toggleDemoAdminRole = useCallback(() => {
    setProfile((prev) => {
      const nextRole = prev.role === 'demo_admin' ? 'student' : 'demo_admin';
      return { ...prev, role: nextRole, updatedAt: new Date().toISOString() };
    });
  }, []);

  const getTrackingRecord = useCallback(
    (opportunityId: string) => userOpportunities.find((r) => r.opportunityId === opportunityId),
    [userOpportunities]
  );

  const saveOpportunity = useCallback(
    (opportunityId: string, initialStatus: ApplicationStatus = 'Saved') => {
      const opp = opportunities.find((o) => o.id === opportunityId);
      setUserOpportunities((prev) => {
        const existing = prev.find((r) => r.opportunityId === opportunityId);
        if (existing) return prev;
        const now = new Date().toISOString();
        const record: UserOpportunityRecord = {
          id: `track-${opportunityId}-${Date.now()}`,
          userId: profile.uid,
          opportunityId,
          status: initialStatus,
          notes: '',
          savedAt: now,
          updatedAt: now,
        };
        return [record, ...prev];
      });
      if (opp) {
        pushToast('Opportunity saved', `${opp.title} added to My Opportunities.`);
        addNotification({
          title: 'Opportunity saved',
          message: `${opp.title} (${opp.registrationDeadline}) was saved to your workspace.`,
          type: 'saved',
          opportunityId,
        });
      }
    },
    [opportunities, profile.uid, pushToast, addNotification]
  );

  const removeSavedOpportunity = useCallback(
    (opportunityId: string) => {
      setUserOpportunities((prev) => prev.filter((r) => r.opportunityId !== opportunityId));
      pushToast('Removed from workspace', 'Opportunity removed from My Opportunities.', 'info');
    },
    [pushToast]
  );

  const updateOpportunityStatus = useCallback(
    (opportunityId: string, status: ApplicationStatus) => {
      const opp = opportunities.find((o) => o.id === opportunityId);
      const now = new Date().toISOString();
      setUserOpportunities((prev) => {
        const exists = prev.some((r) => r.opportunityId === opportunityId);
        if (!exists) {
          return [
            {
              id: `track-${opportunityId}-${Date.now()}`,
              userId: profile.uid,
              opportunityId,
              status,
              notes: '',
              savedAt: now,
              updatedAt: now,
            },
            ...prev,
          ];
        }
        return prev.map((r) =>
          r.opportunityId === opportunityId ? { ...r, status, updatedAt: now } : r
        );
      });
      if (opp) {
        pushToast('Status updated', `${opp.title} marked as ${status}.`);
        if (notificationPrefs.statusUpdates) {
          addNotification({
            title: `Application status: ${status}`,
            message: `Updated ${opp.title} to "${status}".`,
            type: 'status',
            opportunityId,
          });
        }
      }
    },
    [opportunities, profile.uid, pushToast, addNotification, notificationPrefs.statusUpdates]
  );

  const updateOpportunityNotes = useCallback((opportunityId: string, notes: string) => {
    const now = new Date().toISOString();
    setUserOpportunities((prev) =>
      prev.map((r) => (r.opportunityId === opportunityId ? { ...r, notes, updatedAt: now } : r))
    );
  }, []);

  const updateOpportunityReminder = useCallback(
    (opportunityId: string, reminderDate: string) => {
      const now = new Date().toISOString();
      setUserOpportunities((prev) =>
        prev.map((r) =>
          r.opportunityId === opportunityId ? { ...r, reminderDate, updatedAt: now } : r
        )
      );
      pushToast('Reminder saved', reminderDate ? `Personal reminder set for ${reminderDate}.` : 'Reminder cleared.');
    },
    [pushToast]
  );

  const recordScanHistory = useCallback((scan: ScanHistoryItem) => {
    setScanHistory((prev) => [scan, ...prev].slice(0, 20));
  }, []);

  const addScannedOpportunity = useCallback(
    (opp: Opportunity, scanItem?: ScanHistoryItem) => {
      setOpportunities((prev) => [opp, ...prev]);
      const customOpps = safeReadStorage<Opportunity[]>(STORAGE_KEYS.CUSTOM_OPPS, []);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_OPPS, JSON.stringify([opp, ...customOpps]));
      if (scanItem) {
        setScanHistory((prev) => [scanItem, ...prev].slice(0, 20));
      }
      saveOpportunity(opp.id, 'Saved');
    },
    [saveOpportunity]
  );

  const adminCreateOpportunity = useCallback(
    async (opp: Partial<Opportunity>): Promise<Opportunity> => {
      const res = await fetch('/api/admin/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-campus-demo-role': profile.role,
        },
        body: JSON.stringify(opp),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error || 'Failed to create opportunity');
      }
      const data = (await res.json()) as { opportunity: Opportunity };
      setOpportunities((prev) => [data.opportunity, ...prev]);
      const customOpps = safeReadStorage<Opportunity[]>(STORAGE_KEYS.CUSTOM_OPPS, []);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_OPPS, JSON.stringify([data.opportunity, ...customOpps]));
      pushToast('Opportunity published', data.opportunity.title);
      return data.opportunity;
    },
    [profile.role, pushToast]
  );

  const adminUpdateOpportunity = useCallback(
    async (id: string, patch: Partial<Opportunity>): Promise<Opportunity> => {
      const res = await fetch(`/api/admin/opportunities/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-campus-demo-role': profile.role,
        },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error || 'Failed to update opportunity');
      }
      const data = (await res.json()) as { opportunity: Opportunity };
      setOpportunities((prev) => prev.map((o) => (o.id === id ? data.opportunity : o)));
      pushToast('Opportunity updated', `${data.opportunity.title} saved.`);
      return data.opportunity;
    },
    [profile.role, pushToast]
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const updateNotificationPrefs = useCallback(
    (patch: Partial<NotificationPreferences>) => {
      setNotificationPrefs((prev) => ({ ...prev, ...patch }));
      pushToast('Preferences saved', 'Notification settings updated.');
    },
    [pushToast]
  );

  const resetDemoWorkspace = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.USER_OPPS);
    localStorage.removeItem(STORAGE_KEYS.SCANS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_OPPS);
    localStorage.removeItem(STORAGE_KEYS.PREFS);
    setProfile(DEFAULT_DEMO_PROFILE);
    setUserOpportunities([]);
    setScanHistory([]);
    setNotifications([]);
    setNotificationPrefs(DEFAULT_PREFS);
    setOpportunities(SAMPLE_OPPORTUNITIES);
    pushToast('Workspace reset', 'Demo workspace restored to clean initial state.', 'info');
  }, [pushToast]);

  const value: AppContextValue = {
    isAuthenticated,
    isDemoMode,
    firebaseStatus,
    geminiConfigured,
    profile,
    opportunities,
    opportunitiesLoading,
    userOpportunities,
    scanHistory,
    notifications,
    notificationPrefs,
    assistantOpen,
    setAssistantOpen,
    toasts,
    pushToast,
    dismissToast,
    signInDemo,
    signUpDemo,
    signOut,
    updateProfile,
    toggleDemoAdminRole,
    getTrackingRecord,
    saveOpportunity,
    removeSavedOpportunity,
    updateOpportunityStatus,
    updateOpportunityNotes,
    updateOpportunityReminder,
    addScannedOpportunity,
    recordScanHistory,
    adminCreateOpportunity,
    adminUpdateOpportunity,
    markNotificationRead,
    markAllNotificationsRead,
    updateNotificationPrefs,
    resetDemoWorkspace,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
