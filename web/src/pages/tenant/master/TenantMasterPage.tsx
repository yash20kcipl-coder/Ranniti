import React from 'react';
import { useAppSelector } from '@/redux/hooks';
import { Building2 } from 'lucide-react';
import { TenantAcsPage } from './TenantAcsPage';
import { TenantWardsPage } from './TenantWardsPage';
import { TenantBoothsPage } from './TenantBoothsPage';

type TenantMasterTabKey = 'acs' | 'wards' | 'booths';
const TENANT_ALLOWED_KEYS: TenantMasterTabKey[] = ['acs', 'wards', 'booths'];

interface TenantMasterPageProps {
  defaultTab?: TenantMasterTabKey;
}

export const TenantMasterPage: React.FC<TenantMasterPageProps> = ({ defaultTab }) => {
  const user = useAppSelector((state) => (state as any).user?.user ?? (state as any).auth?.user);

  // Allowed tabs from Role Package (falls back to all 3)
  const userAllowed: TenantMasterTabKey[] = (
    (user?.allowedMasterSubTabs as TenantMasterTabKey[] | undefined) ?? TENANT_ALLOWED_KEYS
  ).filter((t): t is TenantMasterTabKey => TENANT_ALLOWED_KEYS.includes(t));

  const resolveActiveTab = (): TenantMasterTabKey => {
    if (defaultTab && userAllowed.includes(defaultTab)) return defaultTab;
    return userAllowed[0] ?? 'acs';
  };

  const activeTab = resolveActiveTab();

  if (userAllowed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Your role package does not include access to Master Data.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Contact your administrator to update your role package.
        </p>
      </div>
    );
  }

  switch (activeTab) {
    case 'wards':
      return <TenantWardsPage />;
    case 'booths':
      return <TenantBoothsPage />;
    case 'acs':
    default:
      return <TenantAcsPage />;
  }
};

export default TenantMasterPage;
