import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Super Admin Dashboard Overview Page
import { SuperAdminDashboardPage } from '@/pages/super_admin/dashboard';
import { MapPreviewPage } from '@/pages/tenant/dashboard/MapPreviewPage';

// Super Admin Voters Pages
import {
  VotersPage as SuperAdminVotersPage,
  VoterDetailPage as SuperAdminVoterDetailPage,
  VoterFormPage as SuperAdminVoterFormPage,
} from '@/pages/super_admin/voters';

// Super Admin Tenant Management Pages
import {
  TenantsPage,
  TenantFormPage,
  TenantDetailPage,
} from '@/pages/super_admin/tenants';

// Super Admin Role & Feature Package Pages
import {
  TenantRoleManager,
  TenantRolePackageFormPage,
} from '@/pages/super_admin/roles';


// Super Admin Master Data Pages
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
  BulkUploadTestPage,
  SuperAdminElectionsPage,
  ProfessionCategoriesPage,
  ProfessionsPage,
} from '@/pages/super_admin/master';

// Super Admin Settings Page
import { SuperAdminSettingsPage } from '@/pages/super_admin/settings/SuperAdminSettingsPage';

// Import Management Page
import { ImportsManagementPage } from '@/pages/imports';

// UI Showcase / Component Gallery Page
import { UiShowcasePage } from '@/pages/super_admin/ui_gallery';

export const SuperAdminRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Default Dashboard -> Dedicated Super Admin Dashboard Overview */}
      <Route index element={<SuperAdminDashboardPage />} />
      <Route path="dashboard" element={<SuperAdminDashboardPage />} />
      <Route path="map-view" element={<MapPreviewPage />} />
      <Route path="map-preview" element={<MapPreviewPage />} />

      {/* Voter Management (Super Admin endpoints) */}
      <Route path="voters" element={<SuperAdminVotersPage />} />
      <Route path="voters/new" element={<SuperAdminVoterFormPage />} />
      <Route path="voters/:id" element={<SuperAdminVoterDetailPage />} />
      <Route path="voters/:id/edit" element={<SuperAdminVoterFormPage />} />

      {/* Aliases for super-admin/voters paths to ensure robust direct routing */}
      <Route path="super-admin/voters" element={<SuperAdminVotersPage />} />
      <Route path="super-admin/voters/new" element={<SuperAdminVoterFormPage />} />
      <Route path="super-admin/voters/:id" element={<SuperAdminVoterDetailPage />} />
      <Route path="super-admin/voters/:id/edit" element={<SuperAdminVoterFormPage />} />

      {/* Tenant Account Provisioning */}
      <Route path="tenants" element={<TenantsPage />} />
      <Route path="tenants/new" element={<TenantFormPage />} />
      <Route path="tenants/:id" element={<TenantDetailPage />} />
      <Route path="tenants/:id/edit" element={<TenantFormPage />} />

      {/* Roles & Feature Packages */}
      <Route path="roles" element={<TenantRoleManager />} />
      <Route path="roles/new" element={<TenantRolePackageFormPage />} />
      <Route path="roles/:id" element={<TenantRolePackageFormPage />} />
      <Route path="roles/:id/edit" element={<TenantRolePackageFormPage />} />
      <Route path="settings/tenant-roles" element={<Navigate to="/dashboard/settings?tab=tenant-roles" replace />} />
      <Route path="settings/roles/new" element={<TenantRolePackageFormPage />} />
      <Route path="settings/roles/:id/edit" element={<TenantRolePackageFormPage />} />

      {/* Master Data */}
      <Route path="master" element={<Navigate to="/dashboard/master/districts" replace />} />
      <Route path="imports" element={<ImportsManagementPage />} />
      <Route path="bulk-imports" element={<Navigate to="/dashboard/imports" replace />} />
      <Route path="master/religions" element={<ReligionsPage />} />
      <Route path="master/castes" element={<CastesPage />} />
      <Route path="master/profession-categories" element={<ProfessionCategoriesPage />} />
      <Route path="master/professions" element={<ProfessionsPage />} />
      <Route path="master/districts" element={<DistrictsPage />} />
      <Route path="master/talukas" element={<TalukasPage />} />
      <Route path="master/villages" element={<VillagesPage />} />
      <Route path="master/pcs" element={<PcsPage />} />
      <Route path="master/acs" element={<AcsPage />} />
      <Route path="master/wards" element={<WardsPage />} />
      <Route path="master/parties" element={<PartiesPage />} />
      <Route path="master/booths" element={<BoothsPage />} />
      <Route path="master/elections" element={<SuperAdminElectionsPage />} />
      <Route path="master/bulk-test" element={<BulkUploadTestPage />} />
      <Route path="master/demo" element={<Navigate to="/dashboard/master/bulk-test" replace />} />
      <Route path="StateAssembly/*" element={<Navigate to="/dashboard/master/acs" replace />} />

      {/* UI Showcase / Design System Gallery */}
      <Route path="ui-gallery" element={<UiShowcasePage />} />
      <Route path="ui-components" element={<Navigate to="/dashboard/ui-gallery" replace />} />

      {/* Super Admin System Settings */}
      <Route path="settings" element={<SuperAdminSettingsPage />} />
      <Route path="settings/*" element={<SuperAdminSettingsPage />} />
      <Route path="super-admin/settings" element={<SuperAdminSettingsPage />} />
      <Route path="super-admin/settings/*" element={<SuperAdminSettingsPage />} />

      {/* Fallback within Super Admin dashboard - absolute path prevents relative loop */}
      <Route path="*" element={<Navigate to="/dashboard/voters" replace />} />
    </Routes>
  );
};

export default SuperAdminRoutes;
