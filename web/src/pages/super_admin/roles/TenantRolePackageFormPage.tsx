import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import toast from 'react-hot-toast';
import {
  Check,
  X,
  Loader2,
  Shield,
  Globe,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { FormInput } from '@/components/common/FormInput';
import {
  fetchTenantRolePackages,
  fetchTenantRolePackageById,
  saveTenantRolePackage,
  fetchAvailableTabs,
} from '@/redux/actions/role';
import type { TenantRolePackage } from '@/redux/reducers/role';

export const TenantRolePackageFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Form State
  const [roleName, setRoleName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [description, setDescription] = useState('');
  const [webTabs, setWebTabs] = useState<string[]>([]);
  const [masterSubTabs, setMasterSubTabs] = useState<string[]>([]);
  const [canCreateWebUsers, setCanCreateWebUsers] = useState(false);
  const [isMasterExpanded, setIsMasterExpanded] = useState(true);

  const [isLoadingPackage, setIsLoadingPackage] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInitializedNewPackage, setHasInitializedNewPackage] = useState(false);

  const { tenantRoles = [], availableTabsConfig } = useAppSelector((state) => state.role);
  const {
    tabs: tabHierarchy = [],
    featureToggles = [],
    allMainTabKeys = [],
    allMasterSubTabKeys = [],
  } = availableTabsConfig || {};

  useDebouncedEffect(() => {
    dispatch(fetchAvailableTabs());
  }, 200, []);

  // Unified Lifecycle: Initialize New Role Defaults OR Load Existing Role
  useEffect(() => {
    // Mode A: Creating a New Role -> Set all tabs from backend catalog once loaded
    if (!isEditMode) {
      if (allMainTabKeys.length > 0 && !hasInitializedNewPackage) {
        setWebTabs(allMainTabKeys);
        setMasterSubTabs(allMasterSubTabKeys);
        setHasInitializedNewPackage(true);
      }
      setIsLoadingPackage(false);
      return;
    }

    // Mode B: Editing an Existing Role
    if (!id) {
      setIsLoadingPackage(false);
      return;
    }

    let isMounted = true;
    const applyPackageData = (pkg: Partial<TenantRolePackage>) => {
      setRoleName(pkg.roleName || '');
      setDescription(pkg.description || '');
      setIsActive(pkg.isActive ?? true);
      setIsDefault(Boolean(pkg.isDefault));
      setWebTabs(pkg.allowedTabs?.webTabs || []);
      setMasterSubTabs(pkg.allowedTabs?.masterSubTabs || []);
      setCanCreateWebUsers(
        Boolean(pkg.allowedTabs?.canCreateWebUsers || (pkg.allowedTabs as any)?.can_create_web_users)
      );
      setIsLoadingPackage(false);
    };

    const existing = tenantRoles.find((r) => r.id === id);
    if (existing) {
      applyPackageData(existing);
    } else {
      setIsLoadingPackage(true);
      dispatch(fetchTenantRolePackageById(id))
        .then((data: any) => {
          if (!isMounted) return;
          if (data) {
            applyPackageData(data);
          } else {
            toast.error('Role not found');
            navigate('/dashboard/settings?tab=tenant-roles', { replace: true });
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingPackage(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode, tenantRoles, allMainTabKeys.length, hasInitializedNewPackage, dispatch, navigate]);

  // Handle Select All
  const handleSelectAll = () => {
    setWebTabs([...allMainTabKeys]);
    setMasterSubTabs([...allMasterSubTabKeys]);
  };

  // Handle Clear All
  const handleClearAll = () => {
    setWebTabs([]);
    setMasterSubTabs([]);
  };

  // Toggle Main Tab
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

  // Toggle Sub-Tab
  const handleToggleSubTab = (subKey: string) => {
    const isCurrentlyChecked = masterSubTabs.includes(subKey);
    let nextSubTabs: string[];

    if (isCurrentlyChecked) {
      nextSubTabs = masterSubTabs.filter((k) => k !== subKey);
    } else {
      nextSubTabs = [...masterSubTabs, subKey];
    }

    setMasterSubTabs(nextSubTabs);

    // Auto-update master_data main tab state
    if (nextSubTabs.length > 0 && !webTabs.includes('master_data')) {
      setWebTabs((prev) => [...prev, 'master_data']);
    } else if (nextSubTabs.length === 0 && webTabs.includes('master_data')) {
      setWebTabs((prev) => prev.filter((k) => k !== 'master_data'));
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/settings?tab=tenant-roles');
  };

  // Submit Handler
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(
        saveTenantRolePackage({
          id: id || undefined,
          roleName: roleName.trim(),
          description: description.trim(),
          isActive,
          isDefault,
          allowedTabs: {
            webTabs,
            masterSubTabs,
            canCreateWebUsers,
          },
        })
      );
      toast.success(isEditMode ? 'Role updated successfully!' : 'Role created successfully!');
      dispatch(fetchTenantRolePackages());
      handleCancel();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save role');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Master Data sub-items lookup map for preview
  const masterItemsMap = useMemo(() => {
    const map: Record<string, string> = {};
    const masterTab = tabHierarchy.find((t) => t.key === 'master_data');
    masterTab?.subGroups?.forEach((g) => {
      g.items.forEach((item) => {
        map[item.key] = item.label;
      });
    });
    return map;
  }, [tabHierarchy]);

  const totalMasterCount = allMasterSubTabKeys.length;
  const selectedMasterCount = masterSubTabs.length;

  if (isLoadingPackage || !availableTabsConfig) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Loading role configuration & permissions catalog...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span>{isEditMode ? 'Edit role' : 'Create role'}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure web portal access, master data permissions, and ceilings assigned to tenant roles.
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
            {/* Step 1: Role Information & Configuration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  1
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  Role information & configuration
                </h2>
              </div>

              <div className="space-y-4 pl-0 sm:pl-8.5">
                {/* Role Name using reusable FormInput */}
                <FormInput
                  label="Role Name"
                  name="roleName"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g. Full Access Admin, Campaign Incharge"
                  required
                />

                {/* Role Description using reusable FormInput */}
                <FormInput
                  label="Role Description (optional)"
                  name="description"
                  type="textarea"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe included access, platform scope, and responsibilities..."
                />

                {/* Active and Default Toggle Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Active Status Card */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                    <div className="pr-3">
                      <span className="block text-xs font-bold text-slate-900 dark:text-white">
                        Active Role
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Allow assigning this role to tenant organizations.
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isActive}
                      onClick={() => setIsActive((prev) => !prev)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden ${isActive ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                      />
                    </button>
                  </div>

                  {/* Default Role Card */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                    <div className="pr-3">
                      <span className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Default Role</span>
                        {isDefault && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-mono">
                            ★ DEFAULT
                          </span>
                        )}
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Newly created tenants will be auto-assigned this role.
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isDefault}
                      onClick={() => setIsDefault((prev) => !prev)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden ${isDefault ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${isDefault ? 'translate-x-5' : 'translate-x-0'
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Web portal tabs & access controls */}
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
                    onClick={handleSelectAll}
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              {/* Feature Toggles & Tab Permissions */}
              <div className="space-y-3 pl-0 sm:pl-8.5">
                {/* Feature Toggles (Web User Creation) */}
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

                        <div
                          onClick={() => setCanCreateWebUsers((prev) => !prev)}
                          className="cursor-pointer select-none flex-1 min-w-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                              {toggle.label}
                            </span>
                            {toggle.badge && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 font-mono">
                                {toggle.badge}
                              </span>
                            )}
                          </div>
                          {toggle.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {toggle.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Main Tabs List */}
                {tabHierarchy.map((tab) => {
                  const isChecked = webTabs.includes(tab.key);
                  const isMasterTab = tab.key === 'master_data';

                  return (
                    <div
                      key={tab.key}
                      className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-all"
                    >
                      {/* Main Tab Item */}
                      <div className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Checkbox */}
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

                          {/* Label & Description */}
                          <div
                            onClick={() => handleToggleMainTab(tab.key)}
                            className="cursor-pointer select-none flex-1 min-w-0"
                          >
                            <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight block truncate">
                              {tab.label}
                            </span>
                            {tab.description && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block truncate">
                                {tab.description}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right Chevron & Count for Master Data */}
                        {isMasterTab && (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {selectedMasterCount} of {totalMasterCount} selected
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsMasterExpanded((prev) => !prev);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
                            >
                              {isMasterExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Nested Master Data Sub-tabs */}
                      {
                        isMasterTab && isMasterExpanded && tab.subGroups && (
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
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider font-mono ${isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}
                    >
                      {isActive ? 'Active Role' : 'Inactive'}
                    </span>
                    {isDefault && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1 font-mono">
                        <Star size={10} className="fill-amber-500 text-amber-500" /> Default Role
                      </span>
                    )}
                  </div>
                  {description.trim() && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">
                      {description.trim()}
                    </p>
                  )}
                </div>

                {/* Web Tabs Preview */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Globe size={12} className="text-indigo-500" /> Web Tabs ({webTabs.length})
                    </span>
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                      {masterSubTabs.length} masters
                    </span>
                  </div>
                  {
                    webTabs.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No web tabs selected</p>
                    ) : (
                      <div className="space-y-1">
                        {tabHierarchy.map((tab) => {
                          if (!webTabs.includes(tab.key)) return null;

                          if (tab.key === 'master_data') {
                            return (
                              <div key={tab.key} className="space-y-1.5 py-1">
                                <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 px-1 pt-1 flex items-center justify-between">
                                  <span>{tab.label}</span>
                                  <span className="text-[10px] font-normal text-slate-400">
                                    {masterSubTabs.length} of {totalMasterCount}
                                  </span>
                                </div>
                                {masterSubTabs.length > 0 ? (
                                  <div className="space-y-1 pl-3 text-xs text-slate-600 dark:text-slate-400">
                                    {masterSubTabs.map((key) => (
                                      <div key={key} className="flex items-center gap-1.5 truncate">
                                        <span className="w-1 h-1 rounded-full bg-indigo-500 shrink-0" />
                                        <span className="truncate">{masterItemsMap[key] || key}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="pl-3 text-[11px] text-slate-400 italic">
                                    No sub-tabs selected
                                  </div>
                                )}
                              </div>
                            );
                          }

                          return (
                            <div
                              key={tab.key}
                              className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-md"
                            >
                              <span>{tab.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )
                  }

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Web User Creation:
                    </span>
                    {canCreateWebUsers ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-[11px] bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 font-mono">
                        <Check size={11} strokeWidth={3} /> Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center font-medium text-slate-400 dark:text-slate-500 text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                        Disabled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block shrink-0" />
            <span>
              {webTabs.length} web tabs and {masterSubTabs.length} sub-tabs selected
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
              onClick={handleSave}
              disabled={isSubmitting || !roleName.trim()}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              <span>{isEditMode ? 'Save changes' : 'Create role'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantRolePackageFormPage;
