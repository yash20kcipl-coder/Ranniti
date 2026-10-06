import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';

// Page Imports - Auth & Layouts
import LoginPage from '@/pages/login';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

// Sub-router Modules for Clean Architecture
import { SuperAdminRoutes } from './SuperAdminRoutes';
import { TenantRoutes } from './TenantRoutes';

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
            element={isSuperAdmin ? <SuperAdminRoutes /> : <TenantRoutes />}
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
