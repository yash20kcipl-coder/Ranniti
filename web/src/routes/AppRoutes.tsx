import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';

// Page Imports - Auth & Layouts
import LoginPage from '@/pages/login';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

// Sub-router Modules for Clean Architecture (Code-Split via React.lazy)
const SuperAdminRoutes = React.lazy(() =>
  import('./SuperAdminRoutes').then((m) => ({ default: m.SuperAdminRoutes }))
);
const TenantRoutes = React.lazy(() =>
  import('./TenantRoutes').then((m) => ({ default: m.TenantRoutes }))
);

const RouteLoadingSpinner = () => (
  <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-6 select-none">
    <div className="relative flex flex-col items-center max-w-xs sm:max-w-sm w-full p-8 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-indigo-500/5 text-center space-y-5">
      {/* Ambient background glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl -z-10 animate-pulse" />

      {/* Centered Logo Box */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-2xl bg-indigo-500/30 animate-ping opacity-25" />
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 p-3 shadow-lg shadow-indigo-600/30 flex items-center justify-center relative z-10">
          <img
            src="/favicon.svg"
            alt="Ranniti Logo"
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Brand Title */}
      <div className="space-y-1">
        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-1.5">
          Ranniti
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 rounded-md">
            HQ
          </span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Electoral Campaign Operations
        </p>
      </div>

      {/* Loading Progress Bar */}
      <div className="flex flex-col items-center space-y-2.5 pt-1 w-full">
        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600 animate-pulse w-3/4 rounded-full" />
        </div>
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
          Loading workspace...
        </span>
      </div>
    </div>
  </div>
);

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <Routes>
      {/* Public Login Route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard/voters" replace /> : <LoginPage />
        }
      />

      {/* Main Protected Dashboard — delegates to SuperAdmin or Tenant route module */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard/*" element={<DashboardLayout />}>
          <Route
            path="*"
            element={
              <React.Suspense fallback={<RouteLoadingSpinner />}>
                {isSuperAdmin ? <SuperAdminRoutes /> : <TenantRoutes />}
              </React.Suspense>
            }
          />
        </Route>
      </Route>

      {/* Global Fallbacks */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/dashboard/voters" : "/login"} replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/dashboard/voters" : "/login"} replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
