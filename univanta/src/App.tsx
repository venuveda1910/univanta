/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/AppShell.tsx';
import { AssistantDrawer } from './components/AssistantDrawer.tsx';
import { ToastContainer } from './components/ToastContainer.tsx';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { LoginPage, SignupPage } from './pages/AuthPages.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { DeadlinesPage } from './pages/DeadlinesPage.tsx';
import { DiscoverPage } from './pages/DiscoverPage.tsx';
import { EligibilityPage } from './pages/EligibilityPage.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { MyOpportunitiesPage } from './pages/MyOpportunitiesPage.tsx';
import { OpportunityDetailPage } from './pages/OpportunityDetailPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { ScannerPage } from './pages/ScannerPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

function WorkspaceRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Publicly browsable discovery routes inside the workspace shell */}
      <Route
        path="/discover"
        element={
          <AppShell>
            <DiscoverPage />
          </AppShell>
        }
      />
      <Route
        path="/opportunity/:id"
        element={
          <AppShell>
            <OpportunityDetailPage />
          </AppShell>
        }
      />

      {/* Protected student workspace routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>
              <DashboardPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/scanner"
        element={
          <ProtectedRoute>
            <AppShell>
              <ScannerPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/eligibility"
        element={
          <ProtectedRoute>
            <AppShell>
              <EligibilityPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/deadlines"
        element={
          <ProtectedRoute>
            <AppShell>
              <DeadlinesPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-opportunities"
        element={
          <ProtectedRoute>
            <AppShell>
              <MyOpportunitiesPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppShell>
              <ProfilePage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppShell>
              <SettingsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AppShell>
              <AdminPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <WorkspaceRoutes />
        <AssistantDrawer />
        <ToastContainer />
      </BrowserRouter>
    </AppProvider>
  );
}
