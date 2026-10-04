import React, { useState, useEffect } from 'react';
import { Package, Shield, Layers, ChevronDown, ChevronRight, Check, UserCheck, Search, Users, Star, CheckCircle2, Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { PageHeader } from '@/components/common/PageHeader';
import { TableActions, TableActionButton } from '@/components/common/TableActions';
import { SafeImage } from '@/components/common/SafeImage';
import { Modal } from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { FormInput } from '@/components/common/FormInput';
import {
  fetchTenantRolePackages,
  saveTenantRolePackage,
  deleteTenantRolePackage,
} from '@/redux/actions/role';
import { fetchTenantUsers, updateTenantUser } from '@/redux/actions/tenant';
import type { TenantRolePackage } from '@/redux/reducers/role';
import toast from 'react-hot-toast';

export interface TabStructure {
  key: string;
  label: string;
  description?: string;
  subGroups?: {
    group: string;
    items: { key: string; label: string }[];
  }[];
}

const TAB_HIERARCHY: TabStructure[] = [
  {
    key: 'dashboard',
    label: 'Dashboard Overview',
    description: 'Main campaign key metrics, voter stats, and analytics overview',
  },
  {
    key: 'voter_directory',
    label: 'Voter Directory',
    description: 'Voter database search, household mapping, and voter details',
  },
  {
    key: 'master_data',
    label: 'Master Data Management',
    description: 'Administrative boundaries, demographics, and political entity masters',
    subGroups: [
      {
        group: 'Geography & Administrative Divisions',
        items: [
          { key: 'acs', label: 'Assembly (AC)' },
          { key: 'booths', label: 'Polling Booths' },
          { key: 'wards', label: 'Wards (Prabhags)' },
        ],
      }
    ],
  },
  {
    key: 'settings',
    label: 'Campaign Settings & Integrations',
    description: 'WhatsApp Meta API, push notification triggers, and system configuration',
  },
];

const TAB_LABEL_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  voter_directory: 'Voter Directory',
  master_data: 'Master Data',
  tenant_accounts: 'Tenants Manager',
  settings: 'Settings & Integrations',
};


export const TenantRoleManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tenants = [] } = useAppSelector((state) => state.tenant);
  const { tenantRoles = [] } = useAppSelector((state) => state.role);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Partial<TenantRolePackage> | null>(null);
  const [expandedTabs, setExpandedTabs] = useState<Record<string, boolean>>({ master_data: true });

  // Assign Package State
  const [assigningRolePackage, setAssigningRolePackage] = useState<TenantRolePackage | null>(null);
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    dispatch(fetchTenantRolePackages());
    dispatch(fetchTenantUsers(false));
  }, [dispatch]);

  const handleOpenCreateModal = () => {
    setEditingRole({
      roleName: '',
      description: '',
      isActive: true,
      isDefault: false,
      allowedTabs: {
        webTabs: ['dashboard', 'voter_directory', 'master_data'],
        masterSubTabs: ['booths', 'castes'],
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rolePackage: TenantRolePackage) => {
    setEditingRole({
      ...rolePackage,
      allowedTabs: {
        webTabs: rolePackage.allowedTabs?.webTabs || [],
        masterSubTabs: rolePackage.allowedTabs?.masterSubTabs || [],
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenAssignModal = (rolePackage: TenantRolePackage) => {
    setAssigningRolePackage(rolePackage);
    setTenantSearchQuery('');
    const currentlyAssigned = tenants
      .filter((t: any) => t.tenantRoleId === rolePackage.id || t.tenantRole?.id === rolePackage.id || t.rolePackageId === rolePackage.id)
      .map((t: any) => t.id);
    setSelectedTenantIds(currentlyAssigned);
  };

  const handleToggleTenantSelection = (tenantId: string) => {
    setSelectedTenantIds((prev) =>
      prev.includes(tenantId) ? prev.filter((id) => id !== tenantId) : [...prev, tenantId]
    );
  };

  const handleSaveAssignments = async () => {
    if (!assigningRolePackage) return;
    setIsAssigning(true);
    try {
      const promises = tenants.map(async (tenant: any) => {
        const currentlyAssigned =
          tenant.tenantRoleId === assigningRolePackage.id ||
          tenant.tenantRole?.id === assigningRolePackage.id ||
          tenant.rolePackageId === assigningRolePackage.id;
        const shouldBeAssigned = selectedTenantIds.includes(tenant.id);

        if (shouldBeAssigned && !currentlyAssigned) {
          await dispatch(updateTenantUser(tenant.id, { tenantRoleId: assigningRolePackage.id }));
        } else if (!shouldBeAssigned && currentlyAssigned) {
          await dispatch(updateTenantUser(tenant.id, { tenantRoleId: null }));
        }
      });

      await Promise.all(promises);
      toast.success(`Updated tenant assignments for '${assigningRolePackage.roleName}'`);
      dispatch(fetchTenantRolePackages());
      dispatch(fetchTenantUsers(false));
      setAssigningRolePackage(null);
    } catch (err: any) {
      toast.error('Failed to update tenant assignments');
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleExpandTab = (tabKey: string) => {
    setExpandedTabs((prev) => ({
      ...prev,
      [tabKey]: !prev[tabKey],
    }));
  };

  const handleToggleMainTab = (tab: TabStructure) => {
    if (!editingRole) return;
    const currentWebTabs = editingRole.allowedTabs?.webTabs || [];
    const currentMasterSubTabs = editingRole.allowedTabs?.masterSubTabs || [];
    const isChecked = currentWebTabs.includes(tab.key);

    let nextWebTabs: string[];
    let nextMasterSubTabs: string[] = [...currentMasterSubTabs];

    if (isChecked) {
      nextWebTabs = currentWebTabs.filter((k) => k !== tab.key);
      if (tab.subGroups) {
        const subTabKeysToClear = tab.subGroups.flatMap((g) => g.items.map((i) => i.key));
        nextMasterSubTabs = nextMasterSubTabs.filter((k) => !subTabKeysToClear.includes(k));
      }
    } else {
      nextWebTabs = [...currentWebTabs, tab.key];
      if (tab.subGroups) {
        const allSubTabKeys = tab.subGroups.flatMap((g) => g.items.map((i) => i.key));
        nextMasterSubTabs = Array.from(new Set([...nextMasterSubTabs, ...allSubTabKeys]));
      }
    }

    setEditingRole({
      ...editingRole,
      allowedTabs: {
        webTabs: nextWebTabs,
        masterSubTabs: nextMasterSubTabs,
      },
    });
  };

  const handleToggleSubTab = (parentTabKey: string, subTabKey: string) => {
    if (!editingRole) return;
    const currentWebTabs = editingRole.allowedTabs?.webTabs || [];
    const currentMasterSubTabs = editingRole.allowedTabs?.masterSubTabs || [];
    const isSubChecked = currentMasterSubTabs.includes(subTabKey);

    let nextMasterSubTabs = isSubChecked
      ? currentMasterSubTabs.filter((k) => k !== subTabKey)
      : [...currentMasterSubTabs, subTabKey];

    let nextWebTabs = [...currentWebTabs];
    if (!isSubChecked && !nextWebTabs.includes(parentTabKey)) {
      nextWebTabs.push(parentTabKey);
    }

    setEditingRole({
      ...editingRole,
      allowedTabs: {
        webTabs: nextWebTabs,
        masterSubTabs: nextMasterSubTabs,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole?.roleName?.trim()) {
      toast.error('Role Package name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(saveTenantRolePackage(editingRole));
      toast.success(editingRole.id ? 'Tenant package updated successfully!' : 'New tenant package created successfully!');
      setIsModalOpen(false);
      setEditingRole(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save package');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await dispatch(deleteTenantRolePackage(deleteTargetId));
      toast.success('Tenant package deleted successfully');
      setDeleteTargetId(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete package');
    }
  };

  const defaultPackage = tenantRoles.find((r) => r.isDefault);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header Standard */}
      <PageHeader
        title="Tenant Feature Packages (Super Admin)"
        subtitle="Configure feature access packages & tab ceilings assigned to tenant subscriptions"
        icon={<Package size={22} />}
        onAddClick={handleOpenCreateModal}
        addLabel="Create Tenant Package"
      />

      {/* Top Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
            <Shield size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Packages</span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{tenantRoles.length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/60">
            <Star size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Default Provision Package</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {defaultPackage?.roleName || 'None Set'}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Active Tenants</span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{tenants.length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/60">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ceiling Enforcement</span>
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={14} /> Strict Subscriptions
            </h3>
          </div>
        </div>
      </div>

      {/* Package Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tenantRoles.map((role) => {
          const assignedCount = Array.isArray(tenants) && tenants.length > 0
            ? tenants.filter((t: any) => t.tenantRoleId === role.id || t.tenantRole?.id === role.id || t.rolePackageId === role.id).length
            : (role.tenantCount || 0);

          return (
            <div
              key={role.id}
              className={`group relative flex flex-col justify-between bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:shadow-xl transition-all duration-300 ${role.isDefault
                ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/20'
                : 'border-slate-200/80 dark:border-slate-800'
                }`}
            >
              {/* Top Accent Gradient Line for Default */}
              {role.isDefault && (
                <div className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 rounded-b-full" />
              )}

              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 shrink-0">
                      <Shield size={20} />
                      {role.isDefault && (
                        <span className="shrink-0 p-1 absolute -bottom-1 -right-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                          <Star size={10} className="fill-amber-500 text-amber-500" />
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate w-full" title={role.roleName}>
                        {role.roleName}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${role.isActive ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>
                          {role.isActive ? 'Active Package' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {role.description || 'No description provided.'}
                </p>

                {/* Feature Summaries & Visual Tab Badges */}
                <div className="space-y-3 py-3 border-t border-b border-slate-100 dark:border-slate-800/80 text-xs">
                  <div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Layers size={13} className="text-indigo-500" /> Web Main Tabs
                      </span>
                      <span className="font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md text-[11px]">
                        {role.allowedTabs?.webTabs?.length || 0} Enabled
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(role.allowedTabs?.webTabs || []).map((tabKey) => (
                        <span key={tabKey} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 rounded-md text-[10px] font-medium border border-slate-200/60 dark:border-slate-700/60">
                          {TAB_LABEL_MAP[tabKey] || tabKey}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Package size={13} className="text-purple-500" /> Master Data Sub-Tabs
                      </span>
                      <span className="font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-md text-[11px]">
                        {role.allowedTabs?.masterSubTabs?.length || 0} Sub-Tabs
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Footer Action */}
              <div className="mt-2 pt-2 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleOpenAssignModal(role)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 transition-all cursor-pointer font-semibold group/btn border border-indigo-100 dark:border-indigo-800/40"
                  title="Click to manage assigned tenants"
                >
                  <UserCheck size={14} className="text-indigo-600 dark:text-indigo-400 group-hover/btn:scale-110 transition-transform" />
                  <span>Assigned Tenants: <strong className="text-indigo-900 dark:text-indigo-100 font-extrabold">{assignedCount}</strong></span>
                </button>
                <TableActions
                  onEdit={() => handleOpenEditModal(role)}
                  onDelete={role.isDefault ? undefined : () => setDeleteTargetId(role.id)}
                  extra={
                    <div className="flex items-center gap-1">
                      <TableActionButton
                        variant="custom"
                        icon={UserCheck}
                        title="Assign Package to Tenants"
                        onClick={() => handleOpenAssignModal(role)}
                        className="bg-indigo-50/90 text-indigo-600 border border-indigo-200/90 hover:bg-indigo-600 hover:text-white dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-indigo-500/80 dark:hover:text-white"
                      />
                    </div>
                  }
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Package Creation & Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole?.id ? 'Edit Tenant Package' : 'Create Tenant Package'}
        subtitle="Configure hierarchical main tab and nested sub-tab access ceilings"
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        maxWidth="3xl"
        submitText={editingRole?.id ? 'Update Package' : 'Create Package'}
      >
        {editingRole && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="md:col-span-6">
                <FormInput
                  label="Package / Role Name"
                  name="roleName"
                  value={editingRole.roleName || ''}
                  onChange={(e) => setEditingRole({ ...editingRole, roleName: e.target.value })}
                  placeholder="e.g. Full Political Suite"
                  required
                />
              </div>

              <div className="md:col-span-3">
                <div className="bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                  <FormInput
                    label="Active"
                    name="isActive"
                    type="switch"
                    value={editingRole.isActive}
                    onChange={(e) => setEditingRole({ ...editingRole, isActive: Boolean(e.target.value) })}
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <div className="bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                  <FormInput
                    label="Default"
                    name="isDefault"
                    type="switch"
                    value={editingRole.isDefault}
                    onChange={(e) => setEditingRole({ ...editingRole, isDefault: Boolean(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <FormInput
              label="Package Description"
              name="description"
              type="textarea"
              rows={2}
              value={editingRole.description || ''}
              onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
              placeholder="Describe the scope and capabilities of this package..."
            />

            {/* Hierarchical Tab -> Sub-Tab Access Manager */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Layers size={14} /> Tab & Sub-Tab Access Matrix
                </h4>
                <span className="text-xs text-slate-500 font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800/60">
                  {editingRole.allowedTabs?.webTabs?.length || 0} Main Tabs, {editingRole.allowedTabs?.masterSubTabs?.length || 0} Sub-Tabs Active
                </span>
              </div>

              <div className="space-y-3">
                {TAB_HIERARCHY.map((tab) => {
                  const isMainChecked = Boolean(editingRole.allowedTabs?.webTabs?.includes(tab.key));
                  const hasSubGroups = Boolean(tab.subGroups && tab.subGroups.length > 0);
                  const isExpanded = expandedTabs[tab.key] ?? hasSubGroups;

                  return (
                    <div
                      key={tab.key}
                      className={`rounded-2xl border transition-all ${isMainChecked
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                    >
                      {/* Main Tab Header Row */}
                      <div className="p-3.5 flex items-center justify-between gap-3">
                        <div
                          onClick={() => handleToggleMainTab(tab)}
                          className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
                        >
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${isMainChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                              }`}
                          >
                            {isMainChecked && <Check size={12} strokeWidth={3} />}
                          </div>

                          <div className="min-w-0">
                            <h5 className={`text-sm font-bold tracking-tight ${isMainChecked ? 'text-indigo-950 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-200'}`}>
                              {tab.label}
                            </h5>
                            {tab.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {tab.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Expand Accordion Button if Sub-Groups exist */}
                        {hasSubGroups && (
                          <button
                            type="button"
                            onClick={() => toggleExpandTab(tab.key)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </button>
                        )}
                      </div>

                      {/* Nested Sub-Tabs Panel (renders directly under parent Main Tab) */}
                      {hasSubGroups && isExpanded && (
                        <div className="px-3.5 pb-4 pt-1 border-t border-indigo-100 dark:border-indigo-900/40 space-y-3 mt-1">
                          {tab.subGroups!.map((subGroup) => (
                            <div key={subGroup.group} className="space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                                {subGroup.group}
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {subGroup.items.map((subItem) => {
                                  const isSubChecked = Boolean(editingRole.allowedTabs?.masterSubTabs?.includes(subItem.key));
                                  return (
                                    <div
                                      key={subItem.key}
                                      onClick={() => handleToggleSubTab(tab.key, subItem.key)}
                                      className={`p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between gap-2 ${isSubChecked
                                        ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200 font-semibold shadow-2xs'
                                        : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                        }`}
                                    >
                                      <span className="truncate">{subItem.label}</span>
                                      <div
                                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all ${isSubChecked ? 'bg-purple-600 text-white' : 'border border-slate-300 dark:border-slate-700'
                                          }`}
                                      >
                                        {isSubChecked && <Check size={10} strokeWidth={3} />}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Package to Tenants Modal */}
      <Modal
        isOpen={Boolean(assigningRolePackage)}
        onClose={() => setAssigningRolePackage(null)}
        title={`Assign '${assigningRolePackage?.roleName}' to Tenants`}
        subtitle="Select tenant organizations to grant this feature ceiling & tab access package"
        onSubmit={handleSaveAssignments}
        isLoading={isAssigning}
        maxWidth="2xl"
        submitText="Save Assignments"
      >
        {assigningRolePackage && (
          <div className="space-y-4">
            <FormInput
              name="tenantSearchQuery"
              placeholder="Search tenants by organization, admin name or email..."
              value={tenantSearchQuery}
              onChange={(e) => setTenantSearchQuery(e.target.value)}
              icon={<Search size={16} />}
            />

            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                {selectedTenantIds.length} of {tenants.length} Tenants Selected
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedTenantIds.length === tenants.length) {
                    setSelectedTenantIds([]);
                  } else {
                    setSelectedTenantIds(tenants.map((t: any) => t.id));
                  }
                }}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
              >
                {selectedTenantIds.length === tenants.length ? 'Deselect All' : 'Select All Tenants'}
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {tenants.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500">No tenant accounts found in system.</p>
                </div>
              ) : (
                tenants
                  .filter((t: any) => {
                    const q = tenantSearchQuery.toLowerCase().trim();
                    return (
                      !q ||
                      t.organizationName?.toLowerCase().includes(q) ||
                      t.name?.toLowerCase().includes(q) ||
                      t.email?.toLowerCase().includes(q)
                    );
                  })
                  .map((tenant: any) => {
                    const isChecked = selectedTenantIds.includes(tenant.id);
                    return (
                      <div
                        key={tenant.id}
                        onClick={() => handleToggleTenantSelection(tenant.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isChecked
                          ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700/80 shadow-2xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                              }`}
                          >
                            {isChecked && <Check size={12} strokeWidth={3} />}
                          </div>

                          <SafeImage
                            src={tenant.avatar || tenant.organizationLogo}
                            alt={tenant.organizationName || tenant.name}
                            className="w-8 h-8 rounded-lg shrink-0 object-cover"
                            fallbackText={tenant.organizationName || tenant.name}
                          />

                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {tenant.organizationName || tenant.name}
                            </h5>
                            <p className="text-[11px] text-slate-400 truncate">
                              {tenant.email || tenant.mobile || 'No admin contact'}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${isChecked
                            ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                          {isChecked ? 'Assigned' : 'Unassigned'}
                        </span>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Tenant Package"
        description="Are you sure you want to delete this tenant package? Any tenant assigned to this package will need to be re-assigned."
        confirmText="Delete Package"
        variant="danger"
      />
    </div>
  );
};

export default TenantRoleManager;
