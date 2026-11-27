import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import toast from 'react-hot-toast';
import {
  Check,
  X,
  Loader2,
  Smartphone,
  ShieldCheck,
  UserPlus,
  Globe,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { FormInput } from '@/components/common/FormInput';
import { FORM_ROLE_CATEGORY_OPTIONS } from '@/constants/dropdownOptions';
import {
  fetchTenantUserRoles,
  fetchTenantUserRoleById,
  saveTenantUserRole,
  fetchAvailableTabs,
  fetchAvailableVolunteerPermissions,
} from '@/redux/actions/role';
import type { TenantUserRole, VoterPermissions } from '@/redux/reducers/role';

type RoleScope = 'web' | 'volunteer' | 'all';

// ── Legacy <-> Modern Screen Key Normalization for Live Mobile App Parity ────
const LEGACY_TO_MODERN_SCREEN_MAP: Record<string, string[]> = {
  booth_analytics: ['dashboard', 'assignedbooths', 'electionpolling'],
  voter_search: ['voterlist'],
  family_tree: ['familymapping'],
  gate_meetings: ['influencermapping', 'contactsync'],
  team_management: ['teammanagement'],
  election_polling: ['electionpolling'],
};

const MODERN_TO_LEGACY_SCREEN_MAP: Record<string, string[]> = {
  dashboard: ['booth_analytics'],
  assignedbooths: ['booth_analytics'],
  electionpolling: ['election_polling', 'booth_analytics'],
  voterlist: ['voter_search'],
  familymapping: ['family_tree'],
  influencermapping: ['gate_meetings'],
  contactsync: ['gate_meetings'],
  teammanagement: ['team_management'],
};

export const normalizeToModernScreens = (screens: string[]): string[] => {
  const result = new Set<string>();
  for (const s of screens) {
    if (LEGACY_TO_MODERN_SCREEN_MAP[s]) {
      LEGACY_TO_MODERN_SCREEN_MAP[s].forEach((mod) => result.add(mod));
    } else {
      result.add(s);
    }
  }
  return Array.from(result);
};

export const expandWithLegacyAliases = (modernScreens: string[]): string[] => {
  const result = new Set<string>(modernScreens);
  for (const s of modernScreens) {
    if (MODERN_TO_LEGACY_SCREEN_MAP[s]) {
      MODERN_TO_LEGACY_SCREEN_MAP[s].forEach((leg) => result.add(leg));
    }
  }
  return Array.from(result);
};

export const TenantVolunteerRoleFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { tenantUserRoles = [], availableVolunteerPermissions, availableTabsConfig } = useAppSelector(
    (state) => state.role
  );

  // Destructure mobile catalog from backend
  const {
    mobileScreens = [],
    voterPermissions = [],
    subordinateRoles = [],
  } = availableVolunteerPermissions || {};

  // Destructure web catalog from backend
  const {
    tabs: tabHierarchy = [],
    featureToggles = [],
    allMainTabKeys = [],
    allMasterSubTabKeys = [],
  } = availableTabsConfig || {};

  // Form State
  const [roleScope, setRoleScope] = useState<RoleScope>('web');
  const [roleName, setRoleName] = useState('');
  const [roleKey, setRoleKey] = useState('tenant_user');
  const [description, setDescription] = useState('');

  // Web Permissions State
  const [webTabs, setWebTabs] = useState<string[]>([]);
  const [masterSubTabs, setMasterSubTabs] = useState<string[]>([]);
  const [canCreateWebUsers, setCanCreateWebUsers] = useState(false);
  const [isMasterExpanded, setIsMasterExpanded] = useState(true);

  // Volunteer / Mobile State
  const [selectedMobileScreens, setSelectedMobileScreens] = useState<string[]>([]);
  const [voterPerms, setVoterPerms] = useState<VoterPermissions>({
    canViewVoter: true,
    canEditContact: true,
    canEditDemographics: false,
    canEditInclination: true,
    canEditVoterStatus: false,
    canManageFamily: true,
    canExportData: false,
  });
  const [canCreateRoles, setCanCreateRoles] = useState<string[]>(['supporter']);
  const [isSystemDefault, setIsSystemDefault] = useState(false);

  const [isLoadingRole, setIsLoadingRole] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInitializedNewRole, setHasInitializedNewRole] = useState(false);

  useDebouncedEffect(() => {
    dispatch(fetchAvailableTabs());
    dispatch(fetchAvailableVolunteerPermissions());
    dispatch(fetchTenantUserRoles());
  }, 200, [dispatch]);

  // Lifecycle: Initialize New Role Defaults OR Load Existing Role
  useEffect(() => {
    if (!isEditMode) {
      if (allMainTabKeys.length > 0 && !hasInitializedNewRole) {
        setWebTabs(allMainTabKeys);
        setMasterSubTabs(allMasterSubTabKeys);
        setSelectedMobileScreens(['dashboard', 'assignedbooths', 'voterlist']);
        setHasInitializedNewRole(true);
      }
      setIsLoadingRole(false);
      return;
    }

    if (!id) {
      setIsLoadingRole(false);
      return;
    }

    let isMounted = true;
    const applyRoleData = (role: TenantUserRole) => {
      const cleanName = role.roleName?.includes('/')
        ? role.roleName.split('/')[0].trim()
        : role.roleName || '';
      setRoleName(cleanName);
      setRoleKey(role.roleKey || 'tenant_user');
      setDescription(role.description || '');

      const assignedWebTabs = role.accessibleTabs?.webTabs || [];
      const assignedMasterSubTabs = role.accessibleTabs?.masterSubTabs || [];
      const rawAssignedMobile =
        role.accessibleTabs?.mobileScreens ||
        (role.accessibleTabs as any)?.mobile_screens ||
        [];
      const assignedMobileScreens = normalizeToModernScreens(rawAssignedMobile);
      const userCreationAllowed = Boolean(
        role.accessibleTabs?.canCreateWebUsers || (role.accessibleTabs as any)?.can_create_web_users
      );

      setWebTabs(assignedWebTabs);
      setMasterSubTabs(assignedMasterSubTabs);
      setCanCreateWebUsers(userCreationAllowed);
      setSelectedMobileScreens(assignedMobileScreens);

      // Infer role scope
      if (assignedWebTabs.length > 0 && assignedMobileScreens.length > 0) {
        setRoleScope('all');
      } else if (assignedMobileScreens.length > 0) {
        setRoleScope('volunteer');
      } else {
        setRoleScope('web');
      }

      setVoterPerms({
        canViewVoter: role.voterPermissions?.canViewVoter ?? true,
        canEditContact: role.voterPermissions?.canEditContact ?? false,
        canEditDemographics: role.voterPermissions?.canEditDemographics ?? false,
        canEditInclination: role.voterPermissions?.canEditInclination ?? false,
        canEditVoterStatus: role.voterPermissions?.canEditVoterStatus ?? false,
        canManageFamily: role.voterPermissions?.canManageFamily ?? false,
        canExportData: role.voterPermissions?.canExportData ?? false,
      });
      setCanCreateRoles(role.canCreateRoles || []);
      setIsSystemDefault(Boolean(role.isSystemDefault));
      setIsLoadingRole(false);
    };

    const existing = tenantUserRoles.find((r) => r.id === id);
    if (existing) {
      applyRoleData(existing);
    } else {
      setIsLoadingRole(true);
      dispatch(fetchTenantUserRoleById(id))
        .then((data: any) => {
          if (!isMounted) return;
          if (data) {
            applyRoleData(data);
          } else {
            toast.error('Role not found');
            navigate('/dashboard/settings?tab=tenant-roles', { replace: true });
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingRole(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode, tenantUserRoles, allMainTabKeys.length, hasInitializedNewRole, dispatch, navigate]);

  // Scope Switcher Handler
  const handleScopeChange = (newScope: RoleScope) => {
    setRoleScope(newScope);
    if (newScope === 'web' && (roleKey === 'sub_leader' || roleKey === 'supporter' || roleKey === 'pc_leader' || roleKey === 'ac_leader')) {
      setRoleKey('tenant_user');
    } else if (newScope === 'volunteer' && (roleKey === 'tenant_user' || roleKey === 'campaign_manager' || roleKey === 'data_operator')) {
      setRoleKey('sub_leader');
    }
  };

  // Web Tab Handlers
  const handleToggleMainTab = (key: string) => {
    const isCurrentlyChecked = webTabs.includes(key);

    if (key === 'master_data') {
      if (isCurrentlyChecked) {
        setWebTabs((prev) => prev.filter((k) => k !== 'master_data'));
        setMasterSubTabs([]);
      } else {
        setWebTabs((prev) => [...prev, 'master_data']);
        setMasterSubTabs([...allMasterSubTabKeys]);
      }
    } else {
      if (isCurrentlyChecked) {
        setWebTabs((prev) => prev.filter((k) => k !== key));
      } else {
        setWebTabs((prev) => [...prev, key]);
      }
    }
  };

  const handleToggleSubTab = (subKey: string) => {
    const isCurrentlyChecked = masterSubTabs.includes(subKey);
    let nextSubTabs: string[];

    if (isCurrentlyChecked) {
      nextSubTabs = masterSubTabs.filter((k) => k !== subKey);
    } else {
      nextSubTabs = [...masterSubTabs, subKey];
    }

    setMasterSubTabs(nextSubTabs);

    if (nextSubTabs.length > 0 && !webTabs.includes('master_data')) {
      setWebTabs((prev) => [...prev, 'master_data']);
    } else if (nextSubTabs.length === 0 && webTabs.includes('master_data')) {
      setWebTabs((prev) => prev.filter((k) => k !== 'master_data'));
    }
  };

  const handleSelectAllWebTabs = () => {
    setWebTabs([...allMainTabKeys]);
    setMasterSubTabs([...allMasterSubTabKeys]);
  };

  const handleClearAllWebTabs = () => {
    setWebTabs([]);
    setMasterSubTabs([]);
  };

  // Mobile Screen Handlers
  const handleToggleMobileScreen = (screenKey: string) => {
    setSelectedMobileScreens((prev) =>
      prev.includes(screenKey) ? prev.filter((s) => s !== screenKey) : [...prev, screenKey]
    );
  };

  const handleSelectAllMobileScreens = () => {
    setSelectedMobileScreens(mobileScreens.map((s) => s.key));
  };

  const handleClearAllMobileScreens = () => {
    setSelectedMobileScreens([]);
  };

  const handleToggleCreatableRole = (rk: string) => {
    setCanCreateRoles((prev) =>
      prev.includes(rk) ? prev.filter((r) => r !== rk) : [...prev, rk]
    );
  };

  const handleToggleVoterPermission = (permKey: string) => {
    setVoterPerms((prev) => ({
      ...prev,
      [permKey]: !prev[permKey as keyof VoterPermissions],
    }));
  };

  const handleSelectAllVoterPerms = () => {
    const allEnabled: any = {};
    voterPermissions.forEach((p) => {
      allEnabled[p.key] = true;
    });
    setVoterPerms(allEnabled);
  };

  const handleClearAllVoterPerms = () => {
    const allDisabled: any = {};
    voterPermissions.forEach((p) => {
      allDisabled[p.key] = false;
    });
    setVoterPerms(allDisabled);
  };

  const handleCancel = () => {
    navigate('/dashboard/settings?tab=tenant-roles');
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    const includesWeb = roleScope === 'web' || roleScope === 'all';
    const includesVolunteer = roleScope === 'volunteer' || roleScope === 'all';

    // Dual-key expansion: modern keys for current web UI, plus legacy aliases for live mobile app backwards compatibility
    const dualKeyMobileScreens = includesVolunteer ? expandWithLegacyAliases(selectedMobileScreens) : [];

    try {
      setIsSubmitting(true);
      await dispatch(
        saveTenantUserRole({
          id: id || undefined,
          roleName: roleName.trim(),
          roleKey,
          description: description.trim(),
          accessibleTabs: {
            isWebUser: includesWeb,
            webTabs: includesWeb ? webTabs : [],
            masterSubTabs: includesWeb ? masterSubTabs : [],
            canCreateWebUsers: includesWeb ? canCreateWebUsers : false,
            mobileScreens: dualKeyMobileScreens,
          },
          voterPermissions: includesVolunteer
            ? voterPerms
            : {
              canViewVoter: true,
              canEditContact: false,
              canEditDemographics: false,
              canEditInclination: false,
              canEditVoterStatus: false,
              canManageFamily: false,
              canExportData: false,
            },
          canCreateRoles: includesVolunteer ? canCreateRoles : [],
          isSystemDefault,
        })
      );
      toast.success(isEditMode ? 'Role updated successfully!' : 'Role created successfully!');
      dispatch(fetchTenantUserRoles());
      handleCancel();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeVoterPermsCount = useMemo(() => {
    return Object.values(voterPerms).filter(Boolean).length;
  }, [voterPerms]);

  if (isLoadingRole) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Loading role configuration & permissions catalog...
        </p>
      </div>
    );
  }

  const showWebSections = roleScope === 'web' || roleScope === 'all';
  const showVolunteerSections = roleScope === 'volunteer' || roleScope === 'all';

  return (
    <div className="mx-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isEditMode ? 'Edit role' : 'Create role'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure web portal access, mobile screen access, voter editing rights, and subordinate delegation controls.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body - 2 Columns */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form & Permissions */}
          <div className="lg:col-span-8 space-y-8">
            {/* Step 1: Role Information & Scope */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  1
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Role information & scope
                </h2>
              </div>

              <div className="space-y-4 pl-0 sm:pl-8.5">
                {/* Scope Selector Cards */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Role Target Platform <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleScopeChange('web')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${roleScope === 'web'
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${roleScope === 'web'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                      >
                        <Globe size={16} />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900 dark:text-white">
                          Web Portal User
                        </span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Staff & office dashboard login
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleScopeChange('volunteer')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${roleScope === 'volunteer'
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${roleScope === 'volunteer'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                      >
                        <Smartphone size={16} />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900 dark:text-white">
                          Field Volunteer
                        </span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Mobile app field cadre login
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleScopeChange('all')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${roleScope === 'all'
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${roleScope === 'all'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                      >
                        <Shield size={16} />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900 dark:text-white">
                          Full Access
                        </span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Both web portal & mobile app
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Role Name"
                    name="roleName"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder={
                      roleScope === 'web'
                        ? 'e.g. Campaign Incharge, Data Entry Operator'
                        : 'e.g. Sub-Leader, Booth Captain'
                    }
                    required
                  />

                  <FormInput
                    label="Role Category / Key"
                    name="roleKey"
                    type="select"
                    options={FORM_ROLE_CATEGORY_OPTIONS}
                    value={roleKey}
                    onChange={(e) => setRoleKey(e.target.value)}
                    required
                  />
                </div>

                <FormInput
                  label="Role Description (optional)"
                  name="description"
                  type="textarea"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe responsibilities, portal scope, and assignment duties..."
                />
              </div>
            </div>

            {/* Step 2: Web Portal Permissions & Master Tabs (Shown for Web or All) */}
            {showWebSections && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      2
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Globe size={15} className="text-indigo-600" />
                      Web portal tabs & access controls
                    </h2>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={handleSelectAllWebTabs}
                      className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer hover:underline"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllWebTabs}
                      className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pl-0 sm:pl-8.5">
                  {/* Web User Creation Feature Toggle */}
                  {featureToggles.map((toggle) => {
                    const isChecked = toggle.key === 'canCreateWebUsers' ? canCreateWebUsers : false;
                    return (
                      <div
                        key={toggle.key}
                        className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-all"
                      >
                        <div className="p-3.5 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setCanCreateWebUsers((prev) => !prev)}
                            className={`w-4.5 h-4.5 rounded-md flex items-center justify-center shrink-0 transition-colors cursor-pointer ${isChecked
                              ? 'bg-indigo-600 border border-indigo-600 text-white'
                              : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                              }`}
                          >
                            {isChecked && <Check size={12} strokeWidth={3} />}
                          </button>

                          <span
                            onClick={() => setCanCreateWebUsers((prev) => !prev)}
                            className="text-xs font-semibold text-slate-900 dark:text-white leading-tight cursor-pointer select-none"
                          >
                            {toggle.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Web Main Tabs List */}
                  {tabHierarchy.map((tab) => {
                    const isChecked = webTabs.includes(tab.key);
                    const isMasterTab = tab.key === 'master_data';

                    return (
                      <div
                        key={tab.key}
                        className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-all"
                      >
                        <div className="p-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleMainTab(tab.key)}
                              className={`w-4.5 h-4.5 rounded-md flex items-center justify-center shrink-0 transition-colors cursor-pointer ${isChecked
                                ? 'bg-indigo-600 border border-indigo-600 text-white'
                                : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                }`}
                            >
                              {isChecked && <Check size={12} strokeWidth={3} />}
                            </button>

                            <span
                              onClick={() => handleToggleMainTab(tab.key)}
                              className="text-xs font-semibold text-slate-900 dark:text-white leading-tight cursor-pointer select-none truncate"
                            >
                              {tab.label}
                            </span>
                          </div>

                          {isMasterTab && (
                            <div className="flex items-center gap-2 pl-2 shrink-0">
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {masterSubTabs.length} of {allMasterSubTabKeys.length} selected
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsMasterExpanded((prev) => !prev)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
                              >
                                {isMasterExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Nested Master Data Sub-tabs */}
                        {isMasterTab && isMasterExpanded && tab.subGroups && (
                          <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-4">
                            {tab.subGroups.map((group) => (
                              <div key={group.group} className="space-y-2">
                                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                                  {group.group}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                  {group.items.map((subItem) => {
                                    const isSubChecked = masterSubTabs.includes(subItem.key);
                                    return (
                                      <div
                                        key={subItem.key}
                                        onClick={() => handleToggleSubTab(subItem.key)}
                                        className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-2.5 ${isSubChecked
                                          ? 'bg-white dark:bg-slate-900 border-indigo-400 dark:border-indigo-600 shadow-2xs'
                                          : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                          }`}
                                      >
                                        <div
                                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${isSubChecked
                                            ? 'bg-indigo-600 text-white'
                                            : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                            }`}
                                        >
                                          {isSubChecked && <Check size={11} strokeWidth={3} />}
                                        </div>
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                                          {subItem.label}
                                        </span>
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
            )}

            {/* Step 3: Mobile App Screen Access (Shown for Volunteer or All) */}
            {showVolunteerSections && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {showWebSections ? 3 : 2}
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Smartphone size={15} className="text-indigo-600" />
                      Mobile app screen access
                    </h2>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={handleSelectAllMobileScreens}
                      className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer hover:underline"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllMobileScreens}
                      className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pl-0 sm:pl-8.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    {mobileScreens.map((screen) => {
                      const isChecked = selectedMobileScreens.includes(screen.key);
                      return (
                        <div
                          key={screen.key}
                          onClick={() => handleToggleMobileScreen(screen.key)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${isChecked
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-500/80 dark:border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                        >
                          <div
                            className={`w-4.5 h-4.5 rounded-md flex items-center justify-center shrink-0 transition-colors ${isChecked
                              ? 'bg-indigo-600 text-white'
                              : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                              }`}
                          >
                            {isChecked && <Check size={12} strokeWidth={3} />}
                          </div>
                          <span
                            className={`text-xs font-semibold ${isChecked
                              ? 'text-indigo-950 dark:text-indigo-200'
                              : 'text-slate-800 dark:text-slate-200'
                              }`}
                          >
                            {screen.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: User Delegation & Voter Permissions (Shown for Volunteer or All) */}
            {showVolunteerSections && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {showWebSections ? 4 : 3}
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <UserPlus size={15} className="text-indigo-600" />
                      User delegation & onboarding rights
                    </h2>
                  </div>

                  <div className="space-y-3 pl-0 sm:pl-8.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {subordinateRoles.map((subRole) => {
                        const isChecked = canCreateRoles.includes(subRole.key);
                        return (
                          <div
                            key={subRole.key}
                            onClick={() => handleToggleCreatableRole(subRole.key)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${isChecked
                              ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-500/80 dark:border-indigo-600 shadow-xs'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                          >
                            <div
                              className={`w-4.5 h-4.5 rounded-md flex items-center justify-center shrink-0 transition-colors ${isChecked
                                ? 'bg-indigo-600 text-white'
                                : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                                }`}
                            >
                              {isChecked && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span
                              className={`text-xs font-semibold ${isChecked
                                ? 'text-indigo-950 dark:text-indigo-200'
                                : 'text-slate-800 dark:text-slate-200'
                                }`}
                            >
                              {subRole.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {showWebSections ? 5 : 4}
                      </div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck size={15} className="text-indigo-600" />
                        Voter data edit & action permissions
                      </h2>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={handleSelectAllVoterPerms}
                        className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer hover:underline"
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllVoterPerms}
                        className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer hover:underline"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 pl-0 sm:pl-8.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {voterPermissions.map((def) => {
                        const isChecked = Boolean(voterPerms[def.key as keyof VoterPermissions]);
                        return (
                          <div
                            key={def.key}
                            onClick={() => handleToggleVoterPermission(def.key)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${isChecked
                              ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-500/80 dark:border-indigo-600 shadow-xs'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                          >
                            <div
                              className={`w-4.5 h-4.5 rounded-md flex items-center justify-center shrink-0 transition-colors ${isChecked
                                ? 'bg-indigo-600 text-white'
                                : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                                }`}
                            >
                              {isChecked && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span
                              className={`text-xs font-semibold ${isChecked
                                ? 'text-indigo-950 dark:text-indigo-200'
                                : 'text-slate-800 dark:text-slate-200'
                                }`}
                            >
                              {def.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column: Live Role Summary Card ("Role preview") */}
          <div className="lg:col-span-4 sticky top-6">
            <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Role preview</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Live summary of assigned capabilities.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-950 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800/80 space-y-4 shadow-2xs">
                {/* Role Header */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {roleName.trim() || 'Untitled Role'}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 uppercase tracking-wider font-mono">
                      {roleKey}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                      {roleScope === 'web'
                        ? 'Web Portal Staff'
                        : roleScope === 'volunteer'
                          ? 'Field Volunteer'
                          : 'Web + Mobile'}
                    </span>
                    {isSystemDefault && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                        Default
                      </span>
                    )}
                  </div>
                  {description.trim() && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {description.trim()}
                    </p>
                  )}
                </div>

                {/* Web Tabs Preview (if web enabled) */}
                {showWebSections && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Globe size={12} className="text-indigo-500" /> Web Tabs ({webTabs.length})
                      </span>
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                        {masterSubTabs.length} masters
                      </span>
                    </div>
                    {webTabs.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No web tabs selected</p>
                    ) : (
                      <div className="space-y-1">
                        {webTabs.map((key) => {
                          const tabObj = tabHierarchy.find((t) => t.key === key);
                          return (
                            <div
                              key={key}
                              className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-md"
                            >
                              <span>{tabObj?.label || key}</span>
                              {key === 'master_data' && (
                                <span className="text-[10px] text-slate-400">
                                  {masterSubTabs.length} sub-tabs
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Web User Creation:
                      </span>
                      {canCreateWebUsers ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-[10px] bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 font-mono">
                          <Check size={10} strokeWidth={3} /> Enabled
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px] font-mono">Disabled</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Mobile Screens Preview (if volunteer enabled) */}
                {showVolunteerSections && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Smartphone size={12} className="text-indigo-500" /> Mobile Screens (
                      {selectedMobileScreens.length})
                    </div>
                    {selectedMobileScreens.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No screens assigned</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {mobileScreens
                          .filter((s) => selectedMobileScreens.includes(s.key))
                          .map((s) => (
                            <span
                              key={s.key}
                              className="bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] px-2 py-0.5 rounded-md"
                            >
                              {s.label}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Delegation Rights Preview */}
                {showVolunteerSections && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <UserPlus size={12} className="text-indigo-500" /> Onboarding Rights
                    </div>
                    {canCreateRoles.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">None (Leaf Field Worker)</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {canCreateRoles.map((rk) => (
                          <span
                            key={rk}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono"
                          >
                            +{rk.replace('_', ' ').toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Voter Permissions Preview */}
                {showVolunteerSections && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck size={12} className="text-indigo-500" /> Voter Permissions (
                      {activeVoterPermsCount})
                    </div>
                    {activeVoterPermsCount === 0 ? (
                      <p className="text-xs text-slate-400 italic">No editing permissions</p>
                    ) : (
                      <div className="space-y-1">
                        {voterPermissions.map((def) => {
                          const isEnabled = voterPerms[def.key as keyof VoterPermissions];
                          if (!isEnabled) return null;
                          return (
                            <div
                              key={def.key}
                              className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300"
                            >
                              <Check size={11} className="text-emerald-500 shrink-0" strokeWidth={3} />
                              <span>{def.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block shrink-0" />
            <span>
              {roleScope === 'web'
                ? `${webTabs.length} web tabs and ${masterSubTabs.length} sub-tabs selected`
                : roleScope === 'volunteer'
                  ? `${selectedMobileScreens.length} mobile screens and ${activeVoterPermsCount} voter permissions selected`
                  : `${webTabs.length} web tabs, ${selectedMobileScreens.length} mobile screens, and ${activeVoterPermsCount} voter permissions selected`}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSubmitting || !roleName.trim()}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              <span>Save changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantVolunteerRoleFormPage;
