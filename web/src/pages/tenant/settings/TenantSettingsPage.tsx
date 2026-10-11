import React from 'react';
import { Settings } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { TenantUserRoleManager } from '@/pages/tenant/roles';

export const TenantSettingsPage: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Standardized PageHeader Component per Rule 18 */}
      <PageHeader
        title="Tenant Campaign Settings"
        subtitle="Manage volunteer roles, karyakarta access tiers, and voter field permissions"
        icon={<Settings className="w-5 h-5 text-indigo-500" />}
        badge={
          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
            Tenant DB Config
          </span>
        }
      />

      {/* Volunteer Roles & Permissions Manager */}
      <TenantUserRoleManager hideHeader />
    </div>
  );
};

export default TenantSettingsPage;
