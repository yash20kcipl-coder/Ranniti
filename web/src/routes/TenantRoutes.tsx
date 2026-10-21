import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Tenant Dashboard Page
import TenantDashboardPage from '@/pages/tenant/dashboard';

// Tenant Voters Pages
import {
  VotersPage as TenantVotersPage,
  VoterDetailPage as TenantVoterDetailPage,
  VoterFormPage as TenantVoterFormPage,
} from '@/pages/tenant/voters';

// Tenant Master Data Page
import { TenantMasterPage, TenantElectionTurnoutPage } from '@/pages/tenant/master';

// Tenant Volunteers Page
import { TenantVolunteersPage } from '@/pages/tenant/volunteers/TenantVolunteersPage';

// Tenant Campaign Analytics Page
import { TenantAnalyticsPage } from '@/pages/tenant/analytics';

// Tenant Settings & User Role Manager Pages
import { TenantUserRoleManager } from '@/pages/tenant/roles';
import { TenantSettingsPage, WhatsAppTemplateBuilderPage } from '@/pages/tenant/settings';

export const TenantRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Tenant Campaign Command Dashboard */}
      <Route index element={<TenantDashboardPage />} />
      <Route path="dashboard" element={<TenantDashboardPage />} />

      {/* Voter Management (Tenant endpoints) */}
      <Route path="voters" element={<TenantVotersPage />} />
      <Route path="voters/new" element={<TenantVoterFormPage />} />
      <Route path="voters/:id" element={<TenantVoterDetailPage />} />
      <Route path="voters/:id/edit" element={<TenantVoterFormPage />} />

      {/* Tenant Master Data (AC, Ward, Booth, Elections) */}
      <Route path="tenant-master" element={<TenantMasterPage />} />
      <Route path="tenant-master/acs" element={<TenantMasterPage defaultTab="acs" />} />
      <Route path="tenant-master/wards" element={<TenantMasterPage defaultTab="wards" />} />
      <Route path="tenant-master/booths" element={<TenantMasterPage defaultTab="booths" />} />
      <Route path="tenant-master/elections" element={<TenantMasterPage defaultTab="elections" />} />
      <Route path="tenant-master/elections/:id/turnout" element={<TenantElectionTurnoutPage />} />
      <Route path="elections" element={<TenantMasterPage defaultTab="elections" />} />
      <Route path="elections/:id/turnout" element={<TenantElectionTurnoutPage />} />

      {/* Tenant Volunteers & Cadre */}
      <Route path="volunteers" element={<TenantVolunteersPage />} />

      {/* Tenant Campaign & Outreach Analytics */}
      <Route path="analytics" element={<TenantAnalyticsPage />} />

      {/* Tenant Settings & User Roles */}
      <Route path="settings" element={<TenantSettingsPage />} />
      <Route path="settings/roles" element={<TenantUserRoleManager />} />
      <Route path="settings/*" element={<TenantSettingsPage />} />

      {/* Tenant WhatsApp Message Template Dedicated Standalone Builder Pages */}
      <Route path="whatsapp-templates/new" element={<WhatsAppTemplateBuilderPage />} />
      <Route path="whatsapp-templates/:id/edit" element={<WhatsAppTemplateBuilderPage />} />
      <Route path="whatsapp-templates/:id" element={<WhatsAppTemplateBuilderPage />} />
      <Route path="settings/whatsapp-templates/new" element={<WhatsAppTemplateBuilderPage />} />
      <Route path="settings/whatsapp-templates/:id/edit" element={<WhatsAppTemplateBuilderPage />} />

      {/* Fallback within Tenant dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default TenantRoutes;
