import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Tenant Voters Pages
import {
  VotersPage as TenantVotersPage,
  VoterDetailPage as TenantVoterDetailPage,
  VoterFormPage as TenantVoterFormPage,
} from '@/pages/tenant/voters';

// Tenant Master Data Page
import { TenantMasterPage } from '@/pages/tenant/master';

// Tenant Volunteers Page
import { TenantVolunteersPage } from '@/pages/tenant/volunteers/TenantVolunteersPage';

// Tenant Settings & User Role Manager Pages
import { TenantUserRoleManager } from '@/pages/tenant/roles';
import { TenantSettingsPage } from '@/pages/tenant/settings';

export const TenantRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Default Dashboard Redirect -> Voters Directory */}
      <Route index element={<Navigate to="/dashboard/voters" replace />} />

      {/* Voter Management (Tenant endpoints) */}
      <Route path="voters" element={<TenantVotersPage />} />
      <Route path="voters/new" element={<TenantVoterFormPage />} />
      <Route path="voters/:id" element={<TenantVoterDetailPage />} />
      <Route path="voters/:id/edit" element={<TenantVoterFormPage />} />

      {/* Tenant Master Data (AC, Ward, Booth) */}
      <Route path="tenant-master" element={<TenantMasterPage />} />
      <Route path="tenant-master/acs" element={<TenantMasterPage defaultTab="acs" />} />
      <Route path="tenant-master/wards" element={<TenantMasterPage defaultTab="wards" />} />
      <Route path="tenant-master/booths" element={<TenantMasterPage defaultTab="booths" />} />

      {/* Tenant Volunteers & Cadre */}
      <Route path="volunteers" element={<TenantVolunteersPage />} />

      {/* Tenant Settings & User Roles */}
      <Route path="settings/roles" element={<TenantUserRoleManager />} />
      <Route path="settings/*" element={<TenantSettingsPage />} />

      {/* Fallback within Tenant dashboard */}
      <Route path="*" element={<Navigate to="/dashboard/voters" replace />} />
    </Routes>
  );
};

export default TenantRoutes;
