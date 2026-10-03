import {
  WhatsAppTemplatesSection,
  WhatsAppConfigSection,
  PushNotificationSection,
} from './sections';
import {
  Settings,
  MessageSquare,
  Key,
  Bell,
  Save,
  Loader2,
  UserCheck,
  Package,
} from 'lucide-react';
import {
  fetchCampaignSettings,
  updateCampaignSettings,
} from '@/redux/actions/settings';
import toast from 'react-hot-toast';
import { TestWhatsAppModal } from './components';
import { TenantUserRoleManager } from '@/pages/tenant/roles';
import { TenantRoleManager } from '@/pages/super_admin/roles';
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import type { CampaignSettings, SettingsTabKey } from './types/settings.types';

export const SettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { settings, saving, whatsappTemplates } = useAppSelector(
    (state) => state.settings
  );
  const user = useAppSelector((state) => state.user.myprofile);
  const isSuperAdmin = user?.role === 'super_admin';

  const [activeTab, setActiveTab] = useState<SettingsTabKey>(isSuperAdmin ? 'tenant-roles' : 'user-roles');
  const [localSettings, setLocalSettings] = useState<CampaignSettings | null>(null);
  const [isTestWhatsAppOpen, setIsTestWhatsAppOpen] = useState(false);

  // Sync activeTab if user profile loads asynchronously
  useEffect(() => {
    if (isSuperAdmin && activeTab === 'user-roles') {
      setActiveTab('tenant-roles');
    }
  }, [isSuperAdmin]);

  // Initial load
  useEffect(() => {
    dispatch(fetchCampaignSettings());
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

  const handleSaveSettings = async () => {
    if (!localSettings) return;
    try {
      await dispatch(updateCampaignSettings(localSettings));
      toast.success('Campaign settings saved successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save settings');
    }
  };

  const navTabs: { id: SettingsTabKey; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    ...(isSuperAdmin
      ? [
          {
            id: 'tenant-roles' as SettingsTabKey,
            label: 'Tenant Feature Packages',
            icon: Package,
          },
        ]
      : [
          {
            id: 'user-roles' as SettingsTabKey,
            label: 'User Roles & Permissions',
            icon: UserCheck,
          },
        ]),
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Save Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Settings & Integrations
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure roles, permissions, feature packages, WhatsApp Cloud API, and push notifications
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab !== 'user-roles' && activeTab !== 'tenant-roles' && (
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

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-900/80 border border-slate-300/60 dark:border-slate-800 overflow-x-auto scrollbar-none">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${isActive
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/40'
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'bg-slate-300/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="animate-fadeIn">
        {activeTab === 'user-roles' && (
          <TenantUserRoleManager />
        )}

        {activeTab === 'tenant-roles' && (
          <TenantRoleManager />
        )}

        {activeTab === 'whatsapp-templates' && (
          <WhatsAppTemplatesSection />
        )}

        {activeTab === 'whatsapp-config' && localSettings && (
          <WhatsAppConfigSection
            settings={localSettings}
            onChange={handleUpdateLocal}
            onOpenTestSend={() => setIsTestWhatsAppOpen(true)}
          />
        )}

        {activeTab === 'push-notifications' && localSettings && (
          <PushNotificationSection
            settings={localSettings}
            onChange={handleUpdateLocal}
          />
        )}
      </div>

      {/* Global Test WhatsApp Modal */}
      <TestWhatsAppModal
        isOpen={isTestWhatsAppOpen}
        onClose={() => setIsTestWhatsAppOpen(false)}
        template={whatsappTemplates[0] || null}
      />
    </div>
  );
};

export default SettingsPage;
