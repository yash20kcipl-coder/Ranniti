import { TabContainer, type TabItem } from '@/components/common/TabContainer';
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  WhatsAppTemplatesSection,
  WhatsAppConfigSection,
  PushNotificationSection,
  TestWhatsAppModal,
} from '@/components/settings';
import {
  Settings,
  MessageSquare,
  Key,
  Bell,
  Save,
  Loader2,
  UserCheck,
} from 'lucide-react';
import {
  fetchTenantSettings,
  updateTenantSettings,
  fetchTenantWhatsAppTemplates,
  createTenantWhatsAppTemplate,
  updateTenantWhatsAppTemplate,
  deleteTenantWhatsAppTemplate,
  syncTenantMetaTemplates,
} from '@/redux/actions/settings';
import toast from 'react-hot-toast';
import { TenantUserRoleManager } from '@/pages/tenant/roles';
import type { CampaignSettings, WhatsAppTemplate } from '@/types/settings.types';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';

type TenantSettingsTabKey = 'user-roles' | 'whatsapp-templates' | 'whatsapp-config' | 'push-notifications';

export const TenantSettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { settings, saving, whatsappTemplates = [] } = useAppSelector((state) => state.settings);

  const [isTestWhatsAppOpen, setIsTestWhatsAppOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TenantSettingsTabKey>('user-roles');
  const [localSettings, setLocalSettings] = useState<CampaignSettings | null>(null);

  // Initial load from Tenant DB
  useDebouncedEffect(() => {
    dispatch(fetchTenantSettings());
  }, 500, [dispatch]);

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
    dispatch(fetchTenantWhatsAppTemplates());
  }, [dispatch]);

  const handleCreateTemplate = React.useCallback((data: Partial<WhatsAppTemplate>) => {
    return dispatch(createTenantWhatsAppTemplate(data));
  }, [dispatch]);

  const handleUpdateTemplate = React.useCallback((id: string, data: Partial<WhatsAppTemplate>) => {
    return dispatch(updateTenantWhatsAppTemplate(id, data));
  }, [dispatch]);

  const handleDeleteTemplate = React.useCallback((id: string) => {
    return dispatch(deleteTenantWhatsAppTemplate(id));
  }, [dispatch]);

  const handleSyncTemplates = React.useCallback(() => {
    return dispatch(syncTenantMetaTemplates());
  }, [dispatch]);

  const handleSaveSettings = async () => {
    if (!localSettings) return;
    try {
      await dispatch(updateTenantSettings(localSettings));
      toast.success('Tenant settings saved successfully to Tenant Database!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save tenant settings');
    }
  };

  const navTabs: TabItem<TenantSettingsTabKey>[] = [
    {
      id: 'user-roles',
      label: 'Volunteer Roles & Permissions',
      icon: UserCheck,
    },
    {
      id: 'whatsapp-templates',
      label: 'WhatsApp Templates',
      icon: MessageSquare,
      count: whatsappTemplates.length,
    },
    {
      id: 'whatsapp-config',
      label: 'WhatsApp Meta API',
      icon: Key,
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
                Tenant Campaign Settings
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure volunteer roles, voter field permissions, WhatsApp Cloud API, and push notifications
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab !== 'user-roles' && (
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
              <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Reusable Tab Navigation Header & Active Views */}
      <TabContainer<TenantSettingsTabKey>
        tabs={navTabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
        views={{
          'user-roles': <TenantUserRoleManager />,
          'whatsapp-templates': (
            <WhatsAppTemplatesSection
              onFetchTemplates={handleFetchTemplates}
              onCreateTemplate={handleCreateTemplate}
              onUpdateTemplate={handleUpdateTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onSyncTemplates={handleSyncTemplates}
            />
          ),
          'whatsapp-config': localSettings ? (
            <WhatsAppConfigSection
              settings={localSettings}
              onChange={handleUpdateLocal}
              onOpenTestSend={() => setIsTestWhatsAppOpen(true)}
            />
          ) : (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ),
          'push-notifications': localSettings ? (
            <PushNotificationSection
              settings={localSettings}
              onChange={handleUpdateLocal}
            />
          ) : (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
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

export default TenantSettingsPage;
