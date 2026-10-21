import {
  fetchTenantWhatsAppTemplates,
  deleteTenantWhatsAppTemplate,
} from '@/redux/actions/settings';
import { useSearchParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { TenantUserRoleManager } from '@/pages/tenant/roles';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { Settings, Shield, MessageSquare } from 'lucide-react';
import { WhatsAppTemplatesSection } from '@/components/settings';
import { TabContainer, type TabItem } from '@/components/common/TabContainer';

type TenantSettingsTabKey = 'whatsapp-templates' | 'tenant-roles';

export const TenantSettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { whatsappTemplates = [], loading = false } = useAppSelector((state) => state.settings);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TenantSettingsTabKey | null;

  const [activeTab, setActiveTab] = useState<TenantSettingsTabKey>(
    () => (tabParam === 'tenant-roles' ? 'tenant-roles' : 'whatsapp-templates')
  );

  useEffect(() => {
    if (tabParam && tabParam !== activeTab && (tabParam === 'whatsapp-templates' || tabParam === 'tenant-roles')) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (tabId: TenantSettingsTabKey) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const navTabs: TabItem<TenantSettingsTabKey>[] = [
    {
      id: 'tenant-roles',
      label: 'Volunteer Roles & Permissions',
      icon: Shield,
    },
    {
      id: 'whatsapp-templates',
      label: 'WhatsApp Message Templates',
      icon: MessageSquare,
      count: whatsappTemplates.length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Standardized PageHeader Component per Rule 18 */}
      <PageHeader
        title="Campaign & Messaging Settings"
        subtitle="Manage campaign WhatsApp message templates and volunteer cadre access permissions"
        icon={<Settings className="w-5 h-5 text-indigo-500" />}
        badge={
          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
            Tenant Isolated DB
          </span>
        }
      />

      {/* Tab Navigation Header & Views */}
      <TabContainer<TenantSettingsTabKey>
        tabs={navTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        views={{
          'whatsapp-templates': (
            <WhatsAppTemplatesSection
              loading={loading}
              templates={whatsappTemplates}
              onFetchTemplates={() => dispatch(fetchTenantWhatsAppTemplates())}
              onDeleteTemplate={(id) => dispatch(deleteTenantWhatsAppTemplate(id))}
            />
          ),
          'tenant-roles': <TenantUserRoleManager hideHeader />,
        }}
      />
    </div>
  );
};

export default TenantSettingsPage;
