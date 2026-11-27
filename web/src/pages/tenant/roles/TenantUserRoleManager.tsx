import {
  Smartphone,
  Shield,
  Star,
  ShieldCheck,
  Globe,
  Plus,
} from 'lucide-react';
import {
  fetchTenantUserRoles,
  deleteTenantUserRole,
  fetchAvailableVolunteerPermissions,
  fetchAvailableTabs,
} from '@/redux/actions/role';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { TableActions } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { DataTable, type Column } from '@/components/common/DataTable';
import type { TenantUserRole, VoterPermissions } from '@/redux/reducers/role';

interface TenantUserRoleManagerProps {
  hideHeader?: boolean;
}

export const TenantUserRoleManager: React.FC<TenantUserRoleManagerProps> = ({ hideHeader = false }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    tenantUserRoles = [],
    availableVolunteerPermissions,
    availableTabsConfig,
    loading = false,
  } = useAppSelector((state) => state.role);

  // Permissions and mobile screens from catalog
  const {
    mobileScreens = [],
    voterPermissions = [],
  } = availableVolunteerPermissions || {};

  const {
    tabs: tabHierarchy = [],
  } = availableTabsConfig || {};

  const [search, setSearch] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Client-side filtering
  const filteredRoles = useMemo(() => {
    if (!search.trim()) return tenantUserRoles;
    const query = search.toLowerCase();
    return tenantUserRoles.filter((role) => {
      const matchName = role.roleName?.toLowerCase().includes(query);
      const matchKey = role.roleKey?.toLowerCase().includes(query);
      const matchDesc = role.description?.toLowerCase().includes(query);
      return matchName || matchKey || matchDesc;
    });
  }, [tenantUserRoles, search]);

  useDebouncedEffect(() => {
    dispatch(fetchTenantUserRoles());
    dispatch(fetchAvailableVolunteerPermissions());
    dispatch(fetchAvailableTabs());
  }, 300, [dispatch]);

  const handleCreateRole = () => {
    navigate('/dashboard/roles/new');
  };

  const handleEditRole = (role: TenantUserRole) => {
    navigate(`/dashboard/roles/${role.id}/edit`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await dispatch(deleteTenantUserRole(deleteTargetId));
      toast.success('Role deleted successfully');
      setDeleteTargetId(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete role');
    }
  };

  // DataTable column definitions
  const columns: Column<TenantUserRole>[] = useMemo(
    () => [
      {
        key: 'roleName',
        header: 'Role & Hierarchy',
        sortable: true,
        render: (role) => {
          const hasWebTabs = (role.accessibleTabs?.webTabs?.length || 0) > 0 || role.roleKey === 'tenant_user';
          const hasMobileScreens = (role.accessibleTabs?.mobileScreens?.length || 0) > 0;
          const cleanRoleName = role.roleName?.includes('/')
            ? role.roleName.split('/')[0].trim()
            : role.roleName;

          return (
            <div className="flex items-start gap-2.5 py-1">
              <div className="relative p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xs shrink-0 mt-0.5">
                {hasWebTabs && !hasMobileScreens ? (
                  <Globe size={15} />
                ) : (
                  <Shield size={15} />
                )}
                {role.isSystemDefault && (
                  <span
                    className="p-0.5 absolute -bottom-1 -right-1 rounded-full text-[8px] bg-amber-500 text-white ring-1 ring-white dark:ring-slate-900"
                    title="System Default Role"
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
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${role.isSystemDefault
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60'
                      }`}
                  >
                    {role.roleKey}
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
        key: 'scope',
        header: 'Platform Scope',
        render: (role) => {
          const hasWebTabs = (role.accessibleTabs?.webTabs?.length || 0) > 0 || role.roleKey === 'tenant_user';
          const hasMobileScreens = (role.accessibleTabs?.mobileScreens?.length || 0) > 0;

          if (hasWebTabs && hasMobileScreens) {
            return (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 font-mono inline-flex">
                  <Shield size={11} className="text-indigo-500" />
                  {role.accessibleTabs?.webTabs?.length || 0} tabs • {role.accessibleTabs?.mobileScreens?.length || 0} screens
                </span>
              </div>
            );
          }
          if (hasWebTabs) {
            return (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 font-mono inline-flex">
                  <Globe size={11} className="text-purple-500" />
                  {role.accessibleTabs?.webTabs?.length || 0} Web Tabs
                </span>
              </div>
            );
          }
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400 font-mono inline-flex">
                <Smartphone size={11} className="text-emerald-500" />
                {role.accessibleTabs?.mobileScreens?.length || 0} Mobile Screens
              </span>
            </div>
          );
        },
      },
      {
        key: 'accessibleModules',
        header: 'Accessible Screens & Tabs',
        render: (role) => {
          const hasWebTabs = (role.accessibleTabs?.webTabs?.length || 0) > 0 || role.roleKey === 'tenant_user';
          const hasMobileScreens = (role.accessibleTabs?.mobileScreens?.length || 0) > 0;

          return (
            <div className="flex flex-col gap-1.5 max-w-sm">
              {hasWebTabs && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mr-0.5">Web:</span>
                  {(role.accessibleTabs?.webTabs || []).slice(0, 3).map((tabKey) => {
                    const tabObj = tabHierarchy.find((t) => t.key === tabKey);
                    return (
                      <span
                        key={tabKey}
                        className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[9.5px] font-medium border border-slate-200/80 dark:border-slate-700/80"
                      >
                        {tabObj?.label || tabKey}
                      </span>
                    );
                  })}
                  {(role.accessibleTabs?.webTabs?.length || 0) > 4 && (
                    <span className="text-[9.5px] font-semibold text-slate-400">
                      +{(role.accessibleTabs?.webTabs?.length || 0) - 4} more
                    </span>
                  )}
                  {role.accessibleTabs?.masterSubTabs && role.accessibleTabs.masterSubTabs.length > 0 && (
                    <span className="text-[9px] text-purple-600 dark:text-purple-400 font-mono">
                      ({role.accessibleTabs.masterSubTabs.length} sub-tabs)
                    </span>
                  )}
                </div>
              )}
              {hasMobileScreens && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mr-0.5">Mobile:</span>
                  {(role.accessibleTabs?.mobileScreens || []).slice(0, 3).map((screenKey) => {
                    const screenObj = mobileScreens.find((s) => s.key === screenKey);
                    return (
                      <span
                        key={screenKey}
                        className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[9.5px] font-medium border border-slate-200/80 dark:border-slate-700/80"
                      >
                        {screenObj?.label || screenKey}
                      </span>
                    );
                  })}
                  {(role.accessibleTabs?.mobileScreens?.length || 0) > 4 && (
                    <span className="text-[9.5px] font-semibold text-slate-400">
                      +{(role.accessibleTabs?.mobileScreens?.length || 0) - 4} more
                    </span>
                  )}
                </div>
              )}
              {!hasWebTabs && !hasMobileScreens && (
                <span className="text-slate-400 text-[10px] italic">No modules assigned</span>
              )}
            </div>
          );
        },
      },
      {
        key: 'canCreateRoles',
        header: 'Authorized to Onboard',
        render: (role) => {
          const hasMobileScreens = (role.accessibleTabs?.mobileScreens?.length || 0) > 0;
          const canCreateWebUsers = Boolean(
            role.accessibleTabs?.canCreateWebUsers || (role.accessibleTabs as any)?.can_create_web_users
          );

          return (
            <div className="flex flex-col gap-1 max-w-xs">
              {hasMobileScreens && (
                <div className="flex flex-wrap items-center gap-1">
                  {role.canCreateRoles && role.canCreateRoles.length > 0 ? (
                    role.canCreateRoles.map((rk) => (
                      <span
                        key={rk}
                        className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono"
                      >
                        +{rk.replace('_', ' ').toUpperCase()}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Leaf Field Worker</span>
                  )}
                </div>
              )}
              {canCreateWebUsers && (
                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono w-fit">
                  Can Create Web Users
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: 'voterPermissions',
        header: 'Voter Permissions',
        render: (role) => {
          const hasMobileScreens = (role.accessibleTabs?.mobileScreens?.length || 0) > 0;
          if (!hasMobileScreens) {
            return <span className="text-slate-400 text-[10px] italic">Web Portal Access</span>;
          }
          const totalVoterPerms = voterPermissions.length || 7;
          const activeCount = Object.values(role.voterPermissions || {}).filter(Boolean).length;

          const activePermLabels = voterPermissions
            .filter((def) => role.voterPermissions?.[def.key as keyof VoterPermissions])
            .map((def) => def.label);

          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold ${activeCount === totalVoterPerms
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : activeCount > 0
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                >
                  <ShieldCheck size={11} />
                  <span>
                    {activeCount} / {totalVoterPerms} Active
                  </span>
                </span>
              </div>
              <div
                className="text-[9.5px] text-slate-500 dark:text-slate-400 max-w-[200px] truncate"
                title={activePermLabels.join(', ')}
              >
                {activePermLabels.length > 0 ? activePermLabels.join(', ') : 'No voter permissions'}
              </div>
            </div >
          );
        },
      },
    ],
    [tabHierarchy, mobileScreens, voterPermissions]
  );

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <PageHeader
          title="Roles & Permissions"
          subtitle="Manage campaign web access, mobile screens, delegation tiers, and voter action permissions"
          icon={<Shield size={22} />}
          onAddClick={handleCreateRole}
          addLabel="Create Role"
        />
      )}

      {/* Standard DataTable for Roles with Embedded FilterBar */}
      <DataTable<TenantUserRole>
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
            onDelete={role.isSystemDefault ? undefined : () => setDeleteTargetId(role.id)}
          />
        )}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        variant="danger"
        title="Delete Role"
        confirmText="Delete Role"
        onConfirm={handleDeleteConfirm}
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        description="Are you sure you want to delete this role? Users or volunteers assigned to this role will need to be re-assigned."
      />
    </div>
  );
};

export default TenantUserRoleManager;
