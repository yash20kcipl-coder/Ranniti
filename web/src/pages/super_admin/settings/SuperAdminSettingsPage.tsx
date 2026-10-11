import { TabContainer, type TabItem } from '@/components/common/TabContainer';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  WhatsAppTemplatesSection,
  WhatsAppConfigSection,
  PushNotificationSection,
  TestWhatsAppModal,
  AppVersionSection,
} from '@/components/settings';
import {
  Settings,
  MessageSquare,
  Key,
  Bell,
  Save,
  Loader2,
  Smartphone,
  Shield,
} from 'lucide-react';
import {
  fetchSuperAdminSettings,
  updateSuperAdminSettings,
  fetchSuperAdminWhatsAppTemplates,
  createSuperAdminWhatsAppTemplate,
  updateSuperAdminWhatsAppTemplate,
  deleteSuperAdminWhatsAppTemplate,
  syncSuperAdminMetaTemplates,
  fetchSuperAdminAppVersions,
  updateSuperAdminAppVersionConfig,
} from '@/redux/actions/settings';
import toast from 'react-hot-toast';
import { TenantRoleManager } from '@/pages/super_admin/roles';
import type { CampaignSettings, WhatsAppTemplate, SettingsTabKey, AppVersionConfig } from '@/types/settings.types';

export const SuperAdminSettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { settings, loading, saving, whatsappTemplates = [], appVersions = [] } = useAppSelector((state) => state.settings);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as SettingsTabKey | null;

  const [isTestWhatsAppOpen, setIsTestWhatsAppOpen] = useState(false);
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

  const handleFetchTemplates = React.useCallback(() => {
    dispatch(fetchSuperAdminWhatsAppTemplates());
  }, [dispatch]);

  const handleCreateTemplate = React.useCallback((data: Partial<WhatsAppTemplate>) => {
    return dispatch(createSuperAdminWhatsAppTemplate(data));
  }, [dispatch]);

  const handleUpdateTemplate = React.useCallback((id: string, data: Partial<WhatsAppTemplate>) => {
    return dispatch(updateSuperAdminWhatsAppTemplate(id, data));
  }, [dispatch]);

  const handleDeleteTemplate = React.useCallback((id: string) => {
    return dispatch(deleteSuperAdminWhatsAppTemplate(id));
  }, [dispatch]);

  const handleSyncTemplates = React.useCallback(() => {
    return dispatch(syncSuperAdminMetaTemplates());
  }, [dispatch]);

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
      id: 'whatsapp-templates',
      label: 'WhatsApp Templates (Master)',
      icon: MessageSquare,
      count: whatsappTemplates.length,
    },
    {
      id: 'whatsapp-config',
      label: 'WhatsApp Meta API (Master)',
      icon: Key,
    },
    {
      id: 'push-notifications',
      label: 'Push Notifications (Master)',
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
                Manage global tenant feature packages, app version force updates, master Meta API credentials, and default push settings
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
          'whatsapp-templates': (
            <WhatsAppTemplatesSection
              onFetchTemplates={handleFetchTemplates}
              onCreateTemplate={handleCreateTemplate}
              onUpdateTemplate={handleUpdateTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onSyncTemplates={handleSyncTemplates}
              loading={loading}
            />
          ),
          'whatsapp-config': (
            <WhatsAppConfigSection
              settings={localSettings || ({} as CampaignSettings)}
              onChange={handleUpdateLocal}
              onOpenTestSend={() => setIsTestWhatsAppOpen(true)}
              loading={loading || !localSettings}
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

      {/* Global Test WhatsApp Modal */}
      <TestWhatsAppModal
        isOpen={isTestWhatsAppOpen}
        onClose={() => setIsTestWhatsAppOpen(false)}
        template={whatsappTemplates[0] || null}
      />
    </div>
  );
};

export default SuperAdminSettingsPage;
