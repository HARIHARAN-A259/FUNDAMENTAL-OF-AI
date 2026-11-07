import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { getActiveAlertsApi } from './api/client';

// Layout & Pages
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UnitsPage } from './pages/UnitsPage';
import { UnitDetailPage } from './pages/UnitDetailPage';
import { AlertsPage } from './pages/AlertsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { AdminPage } from './pages/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2000,
      retry: 1,
    },
  },
});

// Guard for protected routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuthStore();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Global audio alarm manager for critical excursions
const AlarmManager: React.FC = () => {
  const { isMuted, token } = useAuthStore();
  const { data: activeAlerts = [] } = useQuery({
    queryKey: ['activeAlerts'],
    queryFn: getActiveAlertsApi,
    enabled: Boolean(token),
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (isMuted) return;
    const hasCritical = activeAlerts.some(
      (a) => a.severity === 'CRITICAL' && !a.acknowledged_by
    );
    if (hasCritical) {
      // Play brief audible web audio beep
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3); // 300ms beep
      } catch {
        // audio context blocked until user interaction
      }
    }
  }, [activeAlerts, isMuted]);

  return null;
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AlarmManager />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/units" element={<UnitsPage />} />
            <Route path="/units/:id" element={<UnitDetailPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

