import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';

// Modular Page Imports - Tenant Features
import {
  VotersPage,
  VoterDetailPage,
  VoterFormPage,
} from '@/pages/tenant/voters';
import { TenantUserRoleManager } from '@/pages/tenant/roles';
import { SettingsPage } from '@/pages/tenant/settings';

// Modular Page Imports - Super Admin Features
import {
  TenantsPage,
  TenantFormPage,
  TenantDetailPage,
} from '@/pages/super_admin/tenants';
import { TenantRoleManager } from '@/pages/super_admin/roles';
import {
  ReligionsPage,
  CastesPage,
  DistrictsPage,
  TalukasPage,
  VillagesPage,
  PcsPage,
  AcsPage,
  WardsPage,
  PartiesPage,
  BoothsPage,
} from '@/pages/super_admin/master';

import LoginPage from '@/pages/login';

// Layouts & Guards
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

export const AppRoutes: React.FC = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  return (
    <Routes>
      {/* Public Login Route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />

      {/* Protected Layout Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Universal Authenticated Routes: All Roles */}
          <Route path="voters" element={<VotersPage />} />
          <Route path="voters/:id" element={<VoterDetailPage />} />

          {/* Voter Entry & Edit Routes: Admin, Tenant Admin, Leader, Sub-Leader, DEO */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'tenant_admin', 'leader', 'sub_leader', 'deo']} />}>
            <Route path="voters/new" element={<VoterFormPage />} />
            <Route path="voters/:id/edit" element={<VoterFormPage />} />
          </Route>

          {/* Super Admin Only: Multi-Tenant Provisioning & Management */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} />}>
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="tenants/new" element={<TenantFormPage />} />
            <Route path="tenants/:id" element={<TenantDetailPage />} />
            <Route path="tenants/:id/edit" element={<TenantFormPage />} />
          </Route>

          {/* Super Admin Only: Tenant Feature Package Roles */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
            <Route path="settings/tenant-roles" element={<TenantRoleManager />} />
          </Route>

          {/* Super Admin / Central Admin Only: Master Configuration Data */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} />}>
            <Route path="master" element={<Navigate to="/dashboard/master/religions" replace />} />
            <Route path="master/religions" element={<ReligionsPage />} />
            <Route path="master/castes" element={<CastesPage />} />
            <Route path="master/districts" element={<DistrictsPage />} />
            <Route path="master/talukas" element={<TalukasPage />} />
            <Route path="master/villages" element={<VillagesPage />} />
            <Route path="master/pcs" element={<PcsPage />} />
            <Route path="master/acs" element={<AcsPage />} />
            <Route path="master/wards" element={<WardsPage />} />
            <Route path="master/parties" element={<PartiesPage />} />
            <Route path="master/booths" element={<BoothsPage />} />
            <Route path="StateAssembly/*" element={<Navigate to="/dashboard/master/acs" replace />} />
          </Route>

          {/* Tenant Campaign Settings & User Roles Routes */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'tenant_admin', 'leader']} />}>
            <Route path="settings/roles" element={<TenantUserRoleManager />} />
            <Route path="settings/*" element={<SettingsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallbacks */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
