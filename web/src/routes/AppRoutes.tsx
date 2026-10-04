import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';

// Page Imports - Auth & Layouts
import LoginPage from '@/pages/login';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

// Page Imports - Tenant Features
import {
  VotersPage,
  VoterDetailPage,
  VoterFormPage,
} from '@/pages/tenant/voters';
import { TenantMasterPage } from '@/pages/tenant/master';
import { TenantUserRoleManager } from '@/pages/tenant/roles';
import { TenantSettingsPage } from '@/pages/tenant/settings';
import { TenantVolunteersPage } from '@/pages/tenant/volunteers/TenantVolunteersPage';

// Page Imports - Super Admin Features
import { SuperAdminSettingsPage } from '@/pages/super_admin/settings/SuperAdminSettingsPage';
import { TenantRoleManager } from '@/pages/super_admin/roles';
import {
  TenantsPage,
  TenantFormPage,
  TenantDetailPage,
} from '@/pages/super_admin/tenants';
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

// Role constants — exactly two website user types
const SUPER_ADMIN_ROLES = ['super_admin'] as const;
const TENANT_ROLES = ['tenant_admin'] as const;

export const AppRoutes: React.FC = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  return (
    <Routes>
      {/* Public Login Route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard/voters" replace /> : <LoginPage />
        }
      />

      {/* Main Protected Dashboard — any authenticated user */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Redirect /dashboard root to Voters Directory */}
          <Route index element={<Navigate to="/dashboard/voters" replace />} />

          {/* Voter Directory & Detail — both user types */}
          <Route path="voters" element={<VotersPage />} />
          <Route path="voters/:id" element={<VoterDetailPage />} />

          {/* Voter Entry & Editing — both user types */}
          <Route element={<ProtectedRoute allowedRoles={[...SUPER_ADMIN_ROLES, ...TENANT_ROLES]} />}>
            <Route path="voters/new" element={<VoterFormPage />} />
            <Route path="voters/:id/edit" element={<VoterFormPage />} />
          </Route>

          {/* ─── SUPER ADMIN ONLY ──────────────────────────────────── */}

          {/* Tenant Account Provisioning */}
          <Route element={<ProtectedRoute allowedRoles={[...SUPER_ADMIN_ROLES]} />}>
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="tenants/new" element={<TenantFormPage />} />
            <Route path="tenants/:id" element={<TenantDetailPage />} />
            <Route path="tenants/:id/edit" element={<TenantFormPage />} />
          </Route>

          {/* Tenant Role Package Management */}
          <Route element={<ProtectedRoute allowedRoles={[...SUPER_ADMIN_ROLES]} />}>
            <Route path="settings/tenant-roles" element={<TenantRoleManager />} />
          </Route>

          {/* Master Data (full — districts, pcs, religions, parties, etc.) */}
          <Route element={<ProtectedRoute allowedRoles={[...SUPER_ADMIN_ROLES]} />}>
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

          {/* Super Admin Settings */}
          <Route element={<ProtectedRoute allowedRoles={[...SUPER_ADMIN_ROLES]} />}>
            <Route path="super-admin/settings/*" element={<SuperAdminSettingsPage />} />
          </Route>

          {/* ─── TENANT ONLY ───────────────────────────────────────── */}

          {/* Tenant Master Data (AC, Ward, Booth — filtered by Role Package masterSubTabs) */}
          <Route element={<ProtectedRoute allowedRoles={[...TENANT_ROLES]} />}>
            <Route path="tenant-master" element={<TenantMasterPage />} />
            <Route path="tenant-master/acs" element={<TenantMasterPage defaultTab="acs" />} />
            <Route path="tenant-master/wards" element={<TenantMasterPage defaultTab="wards" />} />
            <Route path="tenant-master/booths" element={<TenantMasterPage defaultTab="booths" />} />
          </Route>

          {/* Tenant Volunteers & Field Cadre Management */}
          <Route element={<ProtectedRoute allowedRoles={[...TENANT_ROLES]} />}>
            <Route path="volunteers" element={<TenantVolunteersPage />} />
          </Route>

          {/* Tenant Settings & Role Management */}
          <Route element={<ProtectedRoute allowedRoles={[...TENANT_ROLES]} />}>
            <Route path="settings/roles" element={<TenantUserRoleManager />} />
            <Route path="settings/*" element={<TenantSettingsPage />} />
          </Route>
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
