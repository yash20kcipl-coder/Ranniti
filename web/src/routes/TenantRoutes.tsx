import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Tenant Dashboard Page
import TenantDashboardPage from '@/pages/tenant/dashboard';
import { MapPreviewPage } from '@/pages/tenant/dashboard/MapPreviewPage';

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

// Tenant Web Users Page (Dedicated Standalone Web User Management)
import { TenantWebUsersPage } from '@/pages/tenant/users';

// Tenant Campaign Reports Pages
import {
  VolunteerOutreachReportPage,
  VoterSyncReportPage,
  VotingReportPage,
} from '@/pages/tenant/reports';

// Tenant Volunteer Surveys & Gamification Page
import { TenantVolunteerSurveysPage } from '@/pages/tenant/surveys';

// Tenant Settings & User Role Manager Pages
import { TenantUserRoleManager, TenantVolunteerRoleFormPage } from '@/pages/tenant/roles';
import { TenantSettingsPage, WhatsAppTemplateBuilderPage } from '@/pages/tenant/settings';

// Import Management Page
import { ImportsManagementPage } from '@/pages/imports';

export const TenantRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Tenant Campaign Command Dashboard */}
      <Route index element={<TenantDashboardPage />} />
      <Route path="dashboard" element={<TenantDashboardPage />} />
      <Route path="map-view" element={<MapPreviewPage />} />
      <Route path="map-preview" element={<MapPreviewPage />} />

      {/* Voter Management (Tenant endpoints) */}
      <Route path="voters" element={<TenantVotersPage />} />
      <Route path="voters/new" element={<TenantVoterFormPage />} />
      <Route path="voters/:id" element={<TenantVoterDetailPage />} />
      <Route path="voters/:id/edit" element={<TenantVoterFormPage />} />

      {/* Tenant Master Data (AC, Ward, Booth, Talukas, Villages, Castes, Professions, Elections) */}
      <Route path="tenant-master" element={<TenantMasterPage />} />
      <Route path="tenant-master/acs" element={<TenantMasterPage defaultTab="acs" />} />
      <Route path="tenant-master/wards" element={<TenantMasterPage defaultTab="wards" />} />
      <Route path="tenant-master/booths" element={<TenantMasterPage defaultTab="booths" />} />
      <Route path="tenant-master/talukas" element={<TenantMasterPage defaultTab="talukas" />} />
      <Route path="tenant-master/villages" element={<TenantMasterPage defaultTab="villages" />} />
      <Route path="tenant-master/castes" element={<TenantMasterPage defaultTab="castes" />} />
      <Route path="tenant-master/profession-categories" element={<TenantMasterPage defaultTab="profession-categories" />} />
      <Route path="tenant-master/professions" element={<TenantMasterPage defaultTab="professions" />} />
      <Route path="tenant-master/elections" element={<TenantMasterPage defaultTab="elections" />} />
      <Route path="tenant-master/elections/:id/turnout" element={<TenantElectionTurnoutPage />} />
      <Route path="elections" element={<TenantMasterPage defaultTab="elections" />} />
      <Route path="elections/:id/turnout" element={<TenantElectionTurnoutPage />} />

      {/* Tenant Volunteers & Cadre */}
      <Route path="volunteers" element={<TenantVolunteersPage />} />

      {/* Tenant Volunteer Surveys & Gamification Scoring (Redirect legacy path to Reports sub-tab) */}
      <Route path="surveys" element={<Navigate to="/dashboard/reports/surveys" replace />} />

      {/* Tenant Web Portal Users (Standalone Page) */}
      <Route path="users" element={<TenantWebUsersPage />} />

      {/* Tenant Campaign Reports (Separate Pages per Sidebar Tab) */}
      <Route path="reports" element={<Navigate to="/dashboard/reports/volunteer-outreach" replace />} />
      <Route path="reports/volunteer-outreach" element={<VolunteerOutreachReportPage />} />
      <Route path="reports/voter-sync" element={<VoterSyncReportPage />} />
      <Route path="reports/voting" element={<VotingReportPage />} />
      <Route path="reports/surveys" element={<TenantVolunteerSurveysPage />} />

      {/* Tenant Import Hub */}
      <Route path="imports" element={<ImportsManagementPage />} />
      <Route path="bulk-imports" element={<Navigate to="/dashboard/imports" replace />} />

      {/* Tenant Settings & User Roles */}
      <Route path="settings" element={<TenantSettingsPage />} />
      <Route path="settings/roles" element={<TenantUserRoleManager />} />
      <Route path="settings/roles/new" element={<TenantVolunteerRoleFormPage />} />
      <Route path="settings/roles/:id" element={<TenantVolunteerRoleFormPage />} />
      <Route path="settings/roles/:id/edit" element={<TenantVolunteerRoleFormPage />} />
      <Route path="roles" element={<TenantUserRoleManager />} />
      <Route path="roles/new" element={<TenantVolunteerRoleFormPage />} />
      <Route path="roles/:id" element={<TenantVolunteerRoleFormPage />} />
      <Route path="roles/:id/edit" element={<TenantVolunteerRoleFormPage />} />
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
