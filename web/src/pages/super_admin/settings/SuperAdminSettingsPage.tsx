import {
  PushNotificationSection,
  AppVersionSection,
} from '@/components/settings';
import {
  Bell,
  Smartphone,
  Shield,
  Award,
} from 'lucide-react';
import {
  fetchSuperAdminSettings,
  fetchSuperAdminAppVersions,
  updateSuperAdminAppVersionConfig,
} from '@/redux/actions/settings';
import { fetchTenantRolePackages } from '@/redux/actions/role';
import { useSearchParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { TenantRoleManager } from '@/pages/super_admin/roles';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { TabContainer, type TabItem } from '@/components/common/TabContainer';
import { SurveyPointsConfigSection } from '@/pages/tenant/settings/components/SurveyPointsConfigSection';
import type { CampaignSettings, SettingsTabKey, AppVersionConfig } from '@/types/settings.types';

export const SuperAdminSettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as SettingsTabKey | null;
  const [localSettings, setLocalSettings] = useState<CampaignSettings | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTabKey>(() => tabParam || 'tenant-roles');
  const { settings, loading, saving, appVersions = [] } = useAppSelector((state) => state.settings);
  const { tenantRoles = [] } = useAppSelector((state) => state.role);

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (tabId: SettingsTabKey) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  // Initial load for Master DB & App Versions & Tenant Roles
  useEffect(() => {
    dispatch(fetchSuperAdminSettings());
    dispatch(fetchSuperAdminAppVersions());
    dispatch(fetchTenantRolePackages());
  }, [dispatch]);

  // Sync local draft settings with store
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleUpdateLocal = (updated: Partial<CampaignSettings>) => {
    setLocalSettings((prev) => {
      if (!prev) return null;
      return { ...prev, ...updated };
    });
  };

  const handleUpdateAppVersion = React.useCallback(
    (idOrPlatform: string, payload: Partial<AppVersionConfig>) => {
      return dispatch(updateSuperAdminAppVersionConfig(idOrPlatform, payload));
    },
    [dispatch]
  );

  const navTabs: TabItem<SettingsTabKey>[] = [
    {
      id: 'tenant-roles',
      label: 'Roles & Permissions',
      icon: Shield,
      count: tenantRoles.length,
    },
    {
      id: 'app-versions',
      label: 'App Force Update Control',
      icon: Smartphone,
      count: appVersions.length,
    },
    {
      id: 'push-notifications',
      label: 'Push Notifications',
      icon: Bell,
    },
    {
      id: 'survey-field-points',
      label: 'Survey Scoring Rules',
      icon: Award,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Reusable Tab Navigation Header & Active Views */}
      <TabContainer<SettingsTabKey>
        tabs={navTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        views={{
          'user-roles': <TenantRoleManager hideHeader />,
          'tenant-roles': <TenantRoleManager hideHeader />,
          'app-versions': (
            <AppVersionSection
              saving={saving}
              loading={loading}
              appVersions={appVersions}
              onUpdateVersion={handleUpdateAppVersion}
            />
          ),
          'push-notifications': (
            <PushNotificationSection
              onChange={handleUpdateLocal}
              loading={loading || !localSettings}
              settings={localSettings || ({} as CampaignSettings)}
            />
          ),
          'survey-field-points': <SurveyPointsConfigSection mode="super-admin" />,
        }}
      />
    </div>
  );
};

export default SuperAdminSettingsPage;
