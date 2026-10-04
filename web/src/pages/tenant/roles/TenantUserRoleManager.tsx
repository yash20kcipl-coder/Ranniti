import React, { useState } from 'react';
import { Users, UserCheck, Edit3, Smartphone, ShieldCheck, Lock, UserPlus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { PageHeader } from '@/components/common/PageHeader';
import { TableActions } from '@/components/common/TableActions';
import { Modal } from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { FormInput } from '@/components/common/FormInput';
import {
  fetchTenantUserRoles,
  saveTenantUserRole,
  deleteTenantUserRole,
} from '@/redux/actions/role';
import type { TenantUserRole, VoterPermissions } from '@/redux/reducers/role';
import toast from 'react-hot-toast';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import {
  FORM_VOLUNTEER_ROLE_OPTIONS,
  SUBORDINATE_ROLE_DELEGATION_OPTIONS,
} from '@/constants/dropdownOptions';

const VOTER_PERM_DEFINITIONS: { key: keyof VoterPermissions; label: string; desc: string }[] = [
  { key: 'canViewVoter', label: 'View Voter Records', desc: 'Allows viewing voter profiles, booth details, and list items.' },
  { key: 'canEditContact', label: 'Edit Contact Details', desc: 'Allows updating voter mobile number, address, and email.' },
  { key: 'canEditDemographics', label: 'Edit Demographics', desc: 'Allows updating caste, subcaste, and religion mappings.' },
  { key: 'canEditInclination', label: 'Edit Political Inclination', desc: 'Allows marking political preference status (Favor / Neutral / Against).' },
  { key: 'canEditVoterStatus', label: 'Edit Voter Status', desc: 'Allows updating voter living status (Alive, Deceased, Shifted, NRI).' },
  { key: 'canManageFamily', label: 'Manage Family Tree', desc: 'Allows adding/removing family head tags & member mappings.' },
  { key: 'canExportData', label: 'Export Voter Lists', desc: 'Allows downloading voter lists as PDF or Excel files.' },
];

const AVAILABLE_MOBILE_SCREENS = [
  { key: 'voter_search', label: 'Voter Search & Directory' },
  { key: 'family_tree', label: 'Family Tree Mapping' },
  { key: 'survey', label: 'Cadre / Voter Survey' },
  { key: 'booth_analytics', label: 'Booth Analytics' },
  { key: 'gate_meetings', label: 'Gate Meetings' },
];

export const TenantUserRoleManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tenantUserRoles = [] } = useAppSelector((state) => state.role);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<TenantUserRole> | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useDebouncedEffect(() => {
    dispatch(fetchTenantUserRoles());
  }, 500, [dispatch]);

  const handleOpenCreateModal = () => {
    setEditingRole({
      roleName: '',
      roleKey: 'sub_leader',
      description: '',
      accessibleTabs: {
        webTabs: [],
        masterSubTabs: [],
        mobileScreens: ['voter_search', 'family_tree', 'survey'],
      },
      voterPermissions: {
        canViewVoter: true,
        canEditContact: true,
        canEditDemographics: false,
        canEditInclination: true,
        canEditVoterStatus: false,
        canManageFamily: true,
        canExportData: false,
      },
      canCreateRoles: ['supporter'],
      isSystemDefault: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: TenantUserRole) => {
    setEditingRole({
      id: role.id,
      roleName: role.roleName,
      roleKey: role.roleKey,
      description: role.description,
      accessibleTabs: {
        webTabs: [],
        masterSubTabs: [],
        mobileScreens: role.accessibleTabs?.mobileScreens || [],
      },
      voterPermissions: {
        canViewVoter: role.voterPermissions?.canViewVoter ?? true,
        canEditContact: role.voterPermissions?.canEditContact ?? false,
        canEditDemographics: role.voterPermissions?.canEditDemographics ?? false,
        canEditInclination: role.voterPermissions?.canEditInclination ?? false,
        canEditVoterStatus: role.voterPermissions?.canEditVoterStatus ?? false,
        canManageFamily: role.voterPermissions?.canManageFamily ?? false,
        canExportData: role.voterPermissions?.canExportData ?? false,
      },
      canCreateRoles: role.canCreateRoles || [],
      isSystemDefault: role.isSystemDefault,
    });
    setIsModalOpen(true);
  };

  const handleToggleVoterPermission = (permKey: keyof VoterPermissions) => {
    if (!editingRole || !editingRole.voterPermissions) return;
    setEditingRole({
      ...editingRole,
      voterPermissions: {
        ...editingRole.voterPermissions,
        [permKey]: !editingRole.voterPermissions[permKey],
      },
    });
  };

  const handleToggleMobileScreen = (screenKey: string) => {
    if (!editingRole) return;
    const currentScreens = editingRole.accessibleTabs?.mobileScreens || [];
    const nextScreens = currentScreens.includes(screenKey)
      ? currentScreens.filter((s) => s !== screenKey)
      : [...currentScreens, screenKey];

    setEditingRole({
      ...editingRole,
      accessibleTabs: {
        webTabs: [],
        masterSubTabs: [],
        mobileScreens: nextScreens,
      },
    });
  };

  const handleToggleCreatableRole = (roleKey: string) => {
    if (!editingRole) return;
    const currentRoles = editingRole.canCreateRoles || [];
    const nextRoles = currentRoles.includes(roleKey)
      ? currentRoles.filter((r) => r !== roleKey)
      : [...currentRoles, roleKey];

    setEditingRole({
      ...editingRole,
      canCreateRoles: nextRoles,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole?.roleName?.trim()) {
      toast.error('Role name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await dispatch(
        saveTenantUserRole({
          ...editingRole,
          accessibleTabs: {
            webTabs: [],
            masterSubTabs: [],
            mobileScreens: editingRole.accessibleTabs?.mobileScreens || [],
          },
        })
      );
      toast.success(editingRole.id ? 'User role updated successfully' : 'Custom user role created successfully');
      setIsModalOpen(false);
      setEditingRole(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await dispatch(deleteTenantUserRole(deleteTargetId));
      toast.success('User role deleted successfully');
      setDeleteTargetId(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete role');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header Standard */}
      <PageHeader
        title="Field Roles & Volunteer Permissions"
        subtitle="Manage fixed mobile roles (PC Leader, AC Leader, Sub-Leader, Supporter) and field delegation rights"
        icon={<UserCheck size={22} />}
        onAddClick={handleOpenCreateModal}
        addLabel="Create Custom Role"
      />

      {/* Role Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
        {tenantUserRoles.map((role) => (
          <div
            key={role.id}
            className="group relative flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800/60">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      {role.roleName}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 uppercase tracking-wider">
                        {role.roleKey}
                      </span>
                      {role.isSystemDefault && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          System Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <TableActions
                  onEdit={() => handleOpenEditModal(role)}
                  onDelete={role.isSystemDefault ? undefined : () => setDeleteTargetId(role.id)}
                />
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                {role.description || 'No description provided.'}
              </p>

              {/* Delegation & Onboarding Rights Badge */}
              <div className="mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <UserPlus size={13} className="text-indigo-500" /> Authorized to Onboard:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {role.canCreateRoles && role.canCreateRoles.length > 0 ? (
                    role.canCreateRoles.map((rk) => (
                      <span
                        key={rk}
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                      >
                        +{rk.replace('_', ' ').toUpperCase()}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">None (Leaf Field Worker)</span>
                  )}
                </div>
              </div>

              {/* Permissions Quick Matrix Badges */}
              <div className="space-y-2 py-3 border-t border-b border-slate-100 dark:border-slate-800/80 text-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Voter Editing Rights (Mobile)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {VOTER_PERM_DEFINITIONS.map((def) => {
                    const isEnabled = role.voterPermissions?.[def.key];
                    return (
                      <span
                        key={def.key}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 ${isEnabled
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 line-through opacity-60'
                          }`}
                      >
                        {isEnabled ? '✓' : '✕'} {def.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Smartphone size={13} /> Mobile Only Access
              </span>
              <span>Mobile Screens: <strong className="text-slate-700 dark:text-slate-200">{role.accessibleTabs?.mobileScreens?.length || 0}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Custom User Role Creation & Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole?.id ? 'Edit Volunteer Role & Field Permissions' : 'Create Custom Volunteer Role'}
        subtitle="Configure mobile screen access, voter editing rights, and subordinate delegation controls"
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        maxWidth="3xl"
        submitText={editingRole?.id ? 'Update Role' : 'Create Role'}
      >
        {editingRole && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Role Name"
                name="roleName"
                value={editingRole.roleName || ''}
                onChange={(e) => setEditingRole({ ...editingRole, roleName: e.target.value })}
                placeholder="e.g. Ward Coordinator"
                required
              />

              <FormInput
                label="Role Category / Key"
                name="roleKey"
                type="select"
                options={FORM_VOLUNTEER_ROLE_OPTIONS}
                value={editingRole.roleKey || 'sub_leader'}
                onChange={(e) => setEditingRole({ ...editingRole, roleKey: e.target.value })}
                required
              />
            </div>

            <FormInput
              label="Role Description"
              name="description"
              type="textarea"
              rows={2}
              value={editingRole.description || ''}
              onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
              placeholder="Describe field responsibilities and booth assignment scope..."
            />

            {/* Subordinate Role Delegation Matrix (can_create_roles) */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <UserPlus size={16} /> User Delegation & Onboarding Rights
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Select which subordinate roles this leader is authorized to onboard and assign booths to from the mobile app
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SUBORDINATE_ROLE_DELEGATION_OPTIONS.map((subRole) => {
                  const isChecked = editingRole.canCreateRoles?.includes(subRole.key);
                  return (
                    <div
                      key={subRole.key}
                      onClick={() => handleToggleCreatableRole(subRole.key)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between gap-2 ${isChecked
                        ? 'bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-500 shadow-sm'
                        : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-70'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`font-semibold ${isChecked ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>
                          {subRole.label}
                        </span>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}>
                          {isChecked && <span className="text-[9px] font-bold">✓</span>}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{subRole.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile App Screens Access */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Smartphone size={14} /> Mobile App Screen Access
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_MOBILE_SCREENS.map((screen) => {
                  const isChecked = editingRole.accessibleTabs?.mobileScreens?.includes(screen.key);
                  return (
                    <div
                      key={screen.key}
                      onClick={() => handleToggleMobileScreen(screen.key)}
                      className={`p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${isChecked
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                    >
                      <span className="truncate">{screen.label}</span>
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white shrink-0 ml-1 ${isChecked ? 'bg-emerald-600' : 'border border-slate-300 dark:border-slate-700'}`}>
                        {isChecked && <span className="text-[9px] font-bold">✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Voter Data Editing & Field Action Matrix */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-slate-50 to-violet-50/70 dark:from-slate-800/80 dark:to-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <ShieldCheck size={16} /> Voter Data Action & Edit Permission Matrix
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Controls what field leaders and supporters can view or modify on voters in the mobile app
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {VOTER_PERM_DEFINITIONS.map((def) => {
                  const isChecked = Boolean(editingRole.voterPermissions?.[def.key]);
                  return (
                    <div
                      key={def.key}
                      onClick={() => handleToggleVoterPermission(def.key)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-3 ${isChecked
                        ? 'bg-white dark:bg-slate-900 border-indigo-400 dark:border-indigo-600 shadow-sm'
                        : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-70'
                        }`}
                    >
                      <div>
                        <div className={`font-semibold text-xs flex items-center gap-1.5 ${isChecked ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400'}`}>
                          {isChecked ? <Edit3 size={12} className="text-indigo-600" /> : <Lock size={12} className="text-slate-400" />}
                          {def.label}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{def.desc}</p>
                      </div>

                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}>
                        {isChecked && <span className="text-[10px] font-bold">✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete User Role"
        description="Are you sure you want to delete this custom user role? Users assigned to this role will need to be re-assigned."
        confirmText="Delete Role"
        variant="danger"
      />
    </div>
  );
};

export default TenantUserRoleManager;
