import {
  fetchTenantWhatsAppTemplates,
  deleteTenantWhatsAppTemplate,
} from '@/redux/actions/settings';
import { useSearchParams } from 'react-router-dom';
import React from 'react';
import { Shield, MessageSquare } from 'lucide-react';
import { TenantUserRoleManager } from '@/pages/tenant/roles';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { WhatsAppTemplatesSection } from '@/components/settings';
import { TabContainer, type TabItem } from '@/components/common/TabContainer';

type TenantSettingsTabKey = 'tenant-roles' | 'whatsapp-templates';

export const TenantSettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TenantSettingsTabKey | null;
  const { whatsappTemplates = [], loading = false } = useAppSelector((state) => state.settings);
  const { tenantUserRoles = [] } = useAppSelector((state) => state.role);

  const activeTab: TenantSettingsTabKey =
    tabParam === 'whatsapp-templates' || tabParam === 'tenant-roles' ? tabParam : 'tenant-roles';

  const handleTabChange = (tabId: TenantSettingsTabKey) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const navTabs: TabItem<TenantSettingsTabKey>[] = [
    {
      id: 'tenant-roles',
      label: 'Roles & Permissions',
      icon: Shield,
      count: tenantUserRoles.length,
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
      <TabContainer<TenantSettingsTabKey>
        tabs={navTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        views={{
          'tenant-roles': <TenantUserRoleManager hideHeader />,
          'whatsapp-templates': (
            <WhatsAppTemplatesSection
              loading={loading}
              templates={whatsappTemplates}
              onFetchTemplates={() => dispatch(fetchTenantWhatsAppTemplates())}
              onDeleteTemplate={(id) => dispatch(deleteTenantWhatsAppTemplate(id))}
            />
          ),
        }}
      />
    </div>
  );
};

export default TenantSettingsPage;
