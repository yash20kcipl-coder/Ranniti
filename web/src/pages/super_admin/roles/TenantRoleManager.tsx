import React, { useState, useMemo } from 'react';
import {
  Shield,
  Star,
  Globe,
  Users,
  Check,
  Search,
  UserCheck,
  Layers,
  Plus,
} from 'lucide-react';
import {
  fetchTenantRolePackages,
  deleteTenantRolePackage,
  fetchAvailableTabs,
} from '@/redux/actions/role';
import { fetchTenantUsers, updateTenantUser } from '@/redux/actions/tenant';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { TableActions, TableActionButton } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Modal } from '@/components/common/Modal';
import { SafeImage } from '@/components/common/SafeImage';
import { FormInput } from '@/components/common/FormInput';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { DataTable, type Column } from '@/components/common/DataTable';
import type { TenantRolePackage } from '@/redux/reducers/role';

const TAB_LABEL_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  voter_directory: 'Voter Directory',
  master_data: 'Master Data',
  imports: 'Import Hub',
  tenant_accounts: 'Tenants Manager',
  settings: 'Settings & Integrations',
};

interface TenantRoleManagerProps {
  hideHeader?: boolean;
}

export const TenantRoleManager: React.FC<TenantRoleManagerProps> = ({ hideHeader = false }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { tenants = [] } = useAppSelector((state) => state.tenant);
  const { tenantRoles = [], loading = false } = useAppSelector(
    (state) => state.role
  );

  const [search, setSearch] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Client-side filtering
  const filteredRoles = useMemo(() => {
    if (!search.trim()) return tenantRoles;
    const query = search.toLowerCase();
    return tenantRoles.filter((role) => {
      const matchName = role.roleName?.toLowerCase().includes(query);
      const matchDesc = role.description?.toLowerCase().includes(query);
      return matchName || matchDesc;
    });
  }, [tenantRoles, search]);

  // Assign Role Modal State
  const [assigningRolePackage, setAssigningRolePackage] = useState<TenantRolePackage | null>(null);
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useDebouncedEffect(() => {
    dispatch(fetchTenantRolePackages());
    dispatch(fetchTenantUsers(false));
    dispatch(fetchAvailableTabs());
  }, 300, [dispatch]);

  const handleCreateRole = () => {
    navigate('/dashboard/roles/new');
  };

  const handleEditRole = (rolePackage: TenantRolePackage) => {
    navigate(`/dashboard/roles/${rolePackage.id}/edit`);
  };

  const handleOpenAssignModal = (rolePackage: TenantRolePackage) => {
    setAssigningRolePackage(rolePackage);
    setTenantSearchQuery('');
    const currentlyAssigned = tenants
      .filter(
        (t: any) =>
          t.tenantRoleId === rolePackage.id ||
          t.tenantRole?.id === rolePackage.id ||
          t.rolePackageId === rolePackage.id
      )
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

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await dispatch(deleteTenantRolePackage(deleteTargetId));
      toast.success('Role deleted successfully');
      setDeleteTargetId(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete role');
    }
  };

  // DataTable column definitions matching TenantUserRoleManager design
  const columns: Column<TenantRolePackage>[] = useMemo(
    () => [
      {
        key: 'roleName',
        header: 'Role & Details',
        sortable: true,
        render: (role) => {
          const cleanRoleName = role.roleName?.includes('/')
            ? role.roleName.split('/')[0].trim()
            : role.roleName;

          return (
            <div className="flex items-start gap-2.5 py-1">
              <div className="relative p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xs shrink-0 mt-0.5">
                <Shield size={15} />
                {role.isDefault && (
                  <span
                    className="p-0.5 absolute -bottom-1 -right-1 rounded-full text-[8px] bg-amber-500 text-white ring-1 ring-white dark:ring-slate-900"
                    title="Default Provisioning Role"
                  >
                    <Star size={7} className="fill-white" />
                  </span>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white leading-tight">
                    {cleanRoleName}
                  </span>
                  {role.isDefault && (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 flex items-center gap-0.5">
                      <Star size={8} className="fill-amber-500 text-amber-500" /> DEFAULT
                    </span>
                  )}
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${role.isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    {role.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 max-w-[280px]">
                  {role.description || 'No description provided.'}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        key: 'webTabs',
        header: 'Web Portal Access',
        render: (role) => {
          const webTabsCount = role.allowedTabs?.webTabs?.length || 0;
          const masterSubTabsCount = role.allowedTabs?.masterSubTabs?.length || 0;

          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Globe size={10} />
                  <span>{webTabsCount} Web Tabs</span>
                </span>
                {masterSubTabsCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <Layers size={10} />
                    <span>{masterSubTabsCount} Masters</span>
                  </span>
                )}
              </div>
              <div
                className="text-[9.5px] text-slate-500 dark:text-slate-400 max-w-[220px] truncate"
                title={(role.allowedTabs?.webTabs || [])
                  .map((k) => TAB_LABEL_MAP[k] || k)
                  .join(', ')}
              >
                {(role.allowedTabs?.webTabs || []).map((k) => TAB_LABEL_MAP[k] || k).join(', ') ||
                  'No tabs enabled'}
              </div>
            </div>
          );
        },
      },
      {
        key: 'capabilities',
        header: 'Capabilities & Ceilings',
        render: (role) => {
          const canCreateWebUsers = Boolean(
            role.allowedTabs?.canCreateWebUsers || (role.allowedTabs as any)?.can_create_web_users
          );

          return (
            <div className="flex flex-col gap-1 max-w-xs">
              {canCreateWebUsers ? (
                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono w-fit flex items-center gap-1">
                  <Check size={10} strokeWidth={3} />
                  <span>Can Create Web Users</span>
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 italic">
                  Secondary Web Logins Disabled
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: 'assignedTenants',
        header: 'Assigned Tenants',
        render: (role) => {
          const assignedCount =
            Array.isArray(tenants) && tenants.length > 0
              ? tenants.filter(
                (t: any) =>
                  t.tenantRoleId === role.id ||
                  t.tenantRole?.id === role.id ||
                  t.rolePackageId === role.id
              ).length
              : role.tenantCount || 0;

          return (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${assignedCount > 0
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
              >
                <Users size={10} />
                <span>{assignedCount} {assignedCount === 1 ? 'Tenant' : 'Tenants'}</span>
              </span>
              <button
                type="button"
                onClick={() => handleOpenAssignModal(role)}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold hover:underline cursor-pointer"
                title="Manage tenant assignments"
              >
                Assign
              </button>
            </div >
          );
        },
      },
    ],
    [tenants]
  );

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <PageHeader
          title="Roles & Feature Packages"
          subtitle="Manage campaign web access, master data permissions, and ceilings assigned to tenant roles"
          icon={<Shield size={22} />}
          onAddClick={handleCreateRole}
          addLabel="Create Role"
        />
      )}

      <DataTable<TenantRolePackage>
        columns={columns}
        loading={loading}
        data={filteredRoles}
        showHeader={false}
        selectable={false}
        filterBar={
          <FilterBar
            embedded
            searchValue={search}
            showDrawerButton={false}
            showResetButton={false}
            onSearchChange={setSearch}
            searchPlaceholder="Search roles by name, key, or description..."
            onReset={() => setSearch('')}
            extraActions={
              hideHeader ? (
                <button
                  type="button"
                  onClick={handleCreateRole}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create Role</span>
                </button>
              ) : undefined
            }
          />
        }
        actions={(role) => (
          <TableActions
            onEdit={() => handleEditRole(role)}
            onDelete={role.isDefault ? undefined : () => setDeleteTargetId(role.id)}
            extra={
              <TableActionButton
                variant="custom"
                icon={UserCheck}
                title="Assign to Tenants"
                onClick={() => handleOpenAssignModal(role)}
              />
            }
          />
        )}
      />

      {/* Assign Tenants Modal */}
      <Modal
        isOpen={Boolean(assigningRolePackage)}
        onClose={() => setAssigningRolePackage(null)}
        title={
          assigningRolePackage
            ? `Assign '${assigningRolePackage.roleName}' to Tenants`
            : 'Assign Role'
        }
        maxWidth="lg"
        submitText={isAssigning ? 'Updating...' : 'Save Assignments'}
        onSubmit={handleSaveAssignments}
        isLoading={isAssigning}
      >
        {assigningRolePackage && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select which tenant organizations should be provisioned under this role.
            </p>

            <FormInput
              label="Search Organizations"
              name="tenantSearch"
              value={tenantSearchQuery}
              onChange={(e) => setTenantSearchQuery(e.target.value)}
              placeholder="Search by name, organization or email..."
              icon={<Search size={14} className="text-slate-400" />}
            />

            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Selected: {selectedTenantIds.length} of {tenants.length} tenants
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
        variant="danger"
        title="Delete Role"
        confirmText="Delete Role"
        onConfirm={handleDeleteConfirm}
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        description="Are you sure you want to delete this role? Any tenant assigned to this role will need to be re-assigned."
      />
    </div >
  );
};

export default TenantRoleManager;
