import {
  PushNotificationSection,
  AppVersionSection,
} from '@/components/settings';
import {
  Settings,
  Bell,
  Save,
  Loader2,
  Smartphone,
  Shield,
} from 'lucide-react';
import {
  fetchSuperAdminSettings,
  updateSuperAdminSettings,
  fetchSuperAdminAppVersions,
  updateSuperAdminAppVersionConfig,
} from '@/redux/actions/settings';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { TenantRoleManager } from '@/pages/super_admin/roles';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { TabContainer, type TabItem } from '@/components/common/TabContainer';
import type { CampaignSettings, SettingsTabKey, AppVersionConfig } from '@/types/settings.types';

export const SuperAdminSettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { settings, loading, saving, appVersions = [] } = useAppSelector((state) => state.settings);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as SettingsTabKey | null;

  const [activeTab, setActiveTab] = useState<SettingsTabKey>(() => tabParam || 'tenant-roles');
  const [localSettings, setLocalSettings] = useState<CampaignSettings | null>(null);

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (tabId: SettingsTabKey) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  // Initial load for Master DB & App Versions
  useEffect(() => {
    dispatch(fetchSuperAdminSettings());
    dispatch(fetchSuperAdminAppVersions());
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

  const handleSaveSettings = async () => {
    if (!localSettings) return;
    try {
      await dispatch(updateSuperAdminSettings(localSettings));
      toast.success('Master Campaign settings saved successfully to Master Database!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save master settings');
    }
  };

  const navTabs: TabItem<SettingsTabKey>[] = [
    {
      id: 'tenant-roles',
      label: 'Tenant Roles & Packages',
      icon: Shield,
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
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Save Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Super Admin Master Settings
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage global tenant feature packages and app version force updates
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab !== 'tenant-roles' && activeTab !== 'app-versions' && (
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving || !localSettings}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Saving Changes...' : 'Save Master Settings'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Reusable Tab Navigation Header & Active Views */}
      <TabContainer<SettingsTabKey>
        tabs={navTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        views={{
          'user-roles': <TenantRoleManager />,
          'tenant-roles': <TenantRoleManager />,
          'app-versions': (
            <AppVersionSection
              appVersions={appVersions}
              saving={saving}
              loading={loading}
              onUpdateVersion={handleUpdateAppVersion}
            />
          ),
          'push-notifications': (
            <PushNotificationSection
              settings={localSettings || ({} as CampaignSettings)}
              onChange={handleUpdateLocal}
              loading={loading || !localSettings}
            />
          ),
        }}
      />
    </div>
  );
};

export default SuperAdminSettingsPage;
