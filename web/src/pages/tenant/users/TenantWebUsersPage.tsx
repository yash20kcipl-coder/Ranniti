import {
  Users,
  Mail,
  Phone,
  ShieldCheck,
  Shield,
  Lock,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  UserX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '@/components/common/Modal';
import { CountUp } from '@/components/common/CountUp';
import { FormInput } from '@/components/common/FormInput';
import { SafeImage } from '@/components/common/SafeImage';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { TableActions } from '@/components/common/TableActions';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { USER_STATUS_OPTIONS } from '@/constants/dropdownOptions';
import { DataTable, type Column } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';
import { FileUploadInput } from '@/components/common/FileUploadInput';
import { fetchTenantUserRoles } from '@/redux/actions/role';
import {
  fetchTenantWebUsers,
  createTenantWebUser,
  updateTenantWebUser,
  deleteTenantWebUser,
  toggleTenantWebUserStatus,
  type WebUserRecord,
} from '@/redux/actions/tenantWebUser';

export const TenantWebUsersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.myprofile);
  const { tenantUserRoles = [] } = useAppSelector((state) => state.role);
  const { webUsers = [], webUsersLoading = false } = useAppSelector((state) => state.settings);

  // Check if current tenant's package / plan permits creating web users
  const isSuperAdmin = user?.role === 'super_admin';
  const allowedWebTabs = (user as any)?.allowedWebTabs as string[] | undefined;
  const canCreateWebUsers =
    isSuperAdmin ||
    Boolean(
      user?.canCreateWebUsers ||
      (user as any)?.allowedTabs?.canCreateWebUsers ||
      (user as any)?.allowedTabs?.can_create_web_users ||
      allowedWebTabs?.includes('web_users') ||
      allowedWebTabs?.includes('users')
    );
  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formRoleId, setFormRoleId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formStatus, setFormStatus] = useState('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formRoleKey, setFormRoleKey] = useState('tenant_user');
  const [formRoleName, setFormRoleName] = useState('Campaign Operator');
  const [formAccessibleTabs, setFormAccessibleTabs] = useState<any>(null);
  const [formAvatar, setFormAvatar] = useState<File | string | null>(null);
  const [editingUser, setEditingUser] = useState<Partial<WebUserRecord> | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<WebUserRecord | null>(null);

  // Web roles pool from tenant_user_roles
  const webRoles = useMemo(() => {
    return tenantUserRoles.filter(
      (r) => (r.accessibleTabs?.webTabs?.length || 0) > 0 || r.roleKey === 'tenant_user' || !r.accessibleTabs?.mobileScreens?.length
    );
  }, [tenantUserRoles]);

  const roleDropdownOptions = useMemo(() => {
    const pool = webRoles.length > 0 ? webRoles : tenantUserRoles;
    return pool.map((r) => ({
      label: r.roleName,
      value: r.roleName,
    }));
  }, [webRoles, tenantUserRoles]);

  // Debounced API fetch on mount per Rule 13
  useDebouncedEffect(() => {
    dispatch(fetchTenantWebUsers());
    dispatch(fetchTenantUserRoles());
  }, 200, [dispatch]);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormMobile('');

    const defaultRole = webRoles.find((r) => r.isSystemDefault) || webRoles[0];
    if (defaultRole) {
      setFormRoleId(defaultRole.id);
      setFormRoleName(defaultRole.roleName);
      setFormRoleKey(defaultRole.roleKey || 'tenant_user');
      setFormAccessibleTabs(defaultRole.accessibleTabs || null);
    } else {
      setFormRoleId('custom');
      setFormRoleName('Campaign Operator');
      setFormRoleKey('tenant_user');
      setFormAccessibleTabs(null);
    }

    setFormPassword('');
    setFormStatus('active');
    setFormAvatar(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: WebUserRecord) => {
    setEditingUser(u);
    setFormName(u.name || '');
    setFormEmail(u.email || '');
    setFormMobile(u.mobile || '');

    const matched = tenantUserRoles.find(
      (r) => r.roleName === u.roleName || r.roleKey === (u as any).role
    );
    if (matched) {
      setFormRoleId(matched.id);
      setFormRoleName(matched.roleName);
      setFormRoleKey(matched.roleKey || (u as any).role || 'tenant_user');
      setFormAccessibleTabs(matched.accessibleTabs || u.accessibleTabs || null);
    } else {
      setFormRoleId('custom');
      setFormRoleName(u.roleName || 'Tenant Web User');
      setFormRoleKey((u as any).role || 'tenant_user');
      setFormAccessibleTabs(u.accessibleTabs || null);
    }

    setFormPassword('');
    setFormStatus(u.status || 'active');
    setFormAvatar(u.avatar || null);
    setIsModalOpen(true);
  };

  const handleRoleSelectChange = (selectedVal: string) => {
    setFormRoleId(selectedVal);
    if (selectedVal === 'custom') {
      setFormRoleName('');
      setFormRoleKey('tenant_user');
      setFormAccessibleTabs(null);
    } else {
      const selected = tenantUserRoles.find((r) => r.id === selectedVal);
      if (selected) {
        setFormRoleName(selected.roleName);
        setFormRoleKey(selected.roleKey || 'tenant_user');
        setFormAccessibleTabs(selected.accessibleTabs || null);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // Auto Password Preview Generator matching backend generateTenantPassword: CapitalizedFirstName + "@" + last4Digits
  const safeFormName = typeof formName === 'string' ? formName : '';
  const safeFormMobile = typeof formMobile === 'string' ? formMobile : '';
  const cleanFirstName = (safeFormName.trim().split(/\s+/)[0] || 'User').replace(/[^a-zA-Z]/g, '').slice(0, 15) || 'User';
  const capitalized = cleanFirstName.charAt(0).toUpperCase() + cleanFirstName.slice(1).toLowerCase();
  const cleanDigits = (safeFormMobile.replace(/\D/g, '').slice(-4) || '1234').padStart(4, '0');
  const autoGeneratedPassword = `${capitalized}@${cleanDigits}`;

  const handleSubmitForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = safeFormName.trim();
    const trimmedEmail = typeof formEmail === 'string' ? formEmail.trim().toLowerCase() : '';

    if (!trimmedName) {
      toast.error('Please enter full name');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    const selectedRole = tenantUserRoles.find((r) => r.id === formRoleId);
    const roleKeyToSend = selectedRole?.roleKey || formRoleKey || 'tenant_user';
    const roleNameToSend = formRoleName.trim() || selectedRole?.roleName || 'Tenant Web User';
    const tabsToSend =
      selectedRole?.accessibleTabs ||
      formAccessibleTabs ||
      editingUser?.accessibleTabs || {
        isWebUser: true,
        webTabs: ['dashboard', 'voter_directory', 'master_data', 'settings'],
        masterSubTabs: ['acs', 'wards', 'booths', 'elections', 'talukas', 'villages', 'castes', 'profession-categories', 'professions'],
      };

    setIsSubmitting(true);
    try {
      if (editingUser?.id) {
        await dispatch(
          updateTenantWebUser(editingUser.id, {
            name: trimmedName,
            email: trimmedEmail,
            mobile: safeFormMobile.trim() || undefined,
            role: roleKeyToSend,
            roleName: roleNameToSend,
            accessibleTabs: tabsToSend,
            status: formStatus,
            password: typeof formPassword === 'string' && formPassword.trim() ? formPassword.trim() : undefined,
            avatar: formAvatar,
          })
        );
      } else {
        await dispatch(
          createTenantWebUser({
            name: trimmedName,
            email: trimmedEmail,
            mobile: safeFormMobile.trim() || undefined,
            role: roleKeyToSend,
            roleName: roleNameToSend,
            accessibleTabs: tabsToSend,
            status: formStatus,
            password: typeof formPassword === 'string' && formPassword.trim() ? formPassword.trim() : autoGeneratedPassword,
            avatar: formAvatar,
          })
        );
      }
      handleCloseModal();
    } catch {
      // Error handled by redux
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetUser) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteTenantWebUser(deleteTargetUser.id));
      setDeleteTargetUser(null);
    } catch {
      // Error handled by redux
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (targetUser: WebUserRecord) => {
    const nextStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    await dispatch(toggleTenantWebUserStatus(targetUser.id, nextStatus));
  };

  // Filter Web Users
  const filteredUsers = webUsers.filter((u: WebUserRecord) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.mobile?.includes(q) ||
      u.roleName?.toLowerCase().includes(q);

    const matchesStatus = !statusFilter || u.status === statusFilter;
    const matchesRole = !roleFilter || u.roleName === roleFilter || (u as any).role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        key: 'role',
        label: 'Role',
        type: 'select',
        value: roleFilter,
        defaultValue: '',
        excludeFromCount: true,
        onChange: (val) => setRoleFilter(val),
        options: [{ label: 'All Roles', value: '' }, ...roleDropdownOptions],
        isPrimary: true,
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        value: statusFilter,
        defaultValue: '',
        excludeFromCount: true,
        onChange: (val) => setStatusFilter(val),
        options: [
          { label: 'All Statuses', value: '' },
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
        isPrimary: true,
      },
    ],
    [roleFilter, statusFilter, roleDropdownOptions]
  );

  // KPI Calculations
  const totalCount = webUsers.length;
  const activeCount = webUsers.filter((u) => u.status === 'active').length;
  const inactiveCount = webUsers.filter((u) => u.status !== 'active').length;

  // Table Columns
  const columns: Column<WebUserRecord>[] = [
    {
      key: 'name',
      header: 'User Details',
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <SafeImage
            src={u.avatar}
            alt={u.name}
            fallbackText={u.name}
            className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
          />
          <div className="flex flex-col min-w-0 justify-center gap-0.5">
            <p className="font-semibold text-[10.5px] text-slate-900 dark:text-white leading-tight truncate max-w-[190px]">
              {u.name}
            </p>
            <span className="inline-flex items-center gap-1 text-[9.5px] font-mono text-indigo-600 dark:text-indigo-400 font-medium">
              <ShieldCheck size={10} />
              {u.roleName || 'Tenant Web User'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Login Credentials',
      render: (u) => (
        <div className="flex flex-col gap-0.5 text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1 text-[10px] font-medium leading-tight">
            <Mail size={11} className="text-slate-400 shrink-0" />
            <span className="truncate max-w-[170px]">{u.email}</span>
          </span>
          {u.mobile ? (
            <span className="flex items-center gap-1 text-[9.5px] text-slate-400 font-mono">
              <Phone size={10} className="shrink-0" />
              <span>{formatPhoneNumber(u.mobile)}</span>
            </span>
          ) : (
            <span className="text-[9px] text-slate-400 italic">No phone attached</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (u) => {
        const isActive = u.status === 'active';
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold font-mono border ${isActive
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
              }`}
          >
            {isActive ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created On',
      sortable: true,
      render: (u) => (
        <span className="inline-flex items-center gap-1 text-[9.5px] font-mono text-slate-500 dark:text-slate-400">
          <Calendar size={11} className="text-slate-400 shrink-0" />
          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <TableActions
          onEdit={() => handleOpenEditModal(u)}
          onDelete={() => setDeleteTargetUser(u)}
          extra={
            <button
              type="button"
              onClick={() => handleToggleStatus(u)}
              title={u.status === 'active' ? 'Deactivate Web User' : 'Activate Web User'}
              className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Clock size={13} />
            </button>
          }
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Standardized PageHeader Component per Rule 18 */}
      <PageHeader
        title="Web Portal Users"
        subtitle="Manage campaign office users with web portal login access, roles, and credentials"
        icon={<Users className="w-5 h-5 text-indigo-500" />}
        addLabel={canCreateWebUsers ? 'Add Web User' : undefined}
        onAddClick={canCreateWebUsers ? handleOpenAddModal : undefined}
      />

      {/* Locked Plan Banner if Tenant Plan Does NOT permit web user creation */}
      {!canCreateWebUsers && (
        <div className="p-4 rounded-xl border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Lock size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
              Web User Creation Locked by Subscription Plan
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5 leading-relaxed">
              Your organization's current subscription plan does not include permissions to create secondary web login accounts. Please contact your Super Administrator to enable the Web Users tab in your plan.
            </p>
          </div>
        </div>
      )}

      {/* KPI Metrics Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Total Users */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('')}
          className={`p-4 rounded-xl border transition-all cursor-pointer bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-blue-950/20 ${!statusFilter
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
            : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
              Total Web Users
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-950 dark:text-white mt-1">
            <CountUp to={totalCount} duration={1} />
          </div>
        </div>

        {/* Card 2: Active Users */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter((prev) => (prev === 'active' ? '' : 'active'))}
          className={`p-4 rounded-xl border transition-all cursor-pointer bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/20 ${statusFilter === 'active'
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
            : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Active Accounts
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-950 dark:text-white mt-1">
            <CountUp to={activeCount} duration={1} />
          </div>
        </div>

        {/* Card 3: Inactive Users */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter((prev) => (prev === 'inactive' ? '' : 'inactive'))}
          className={`p-4 rounded-xl border transition-all cursor-pointer bg-gradient-to-br from-slate-50 via-white to-slate-100/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/40 ${statusFilter === 'inactive'
            ? 'border-slate-500 ring-2 ring-slate-500/20 shadow-xs'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Inactive Accounts
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <UserX size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            <CountUp to={inactiveCount} duration={1} />
          </div>
        </div>
      </div>

      {/* Users DataTable */}
      <DataTable
        columns={columns}
        showHeader={false}
        selectable={false}
        data={filteredUsers}
        loading={webUsersLoading}
        filterBar={
          <FilterBar
            embedded
            filters={filterFields}
            showDrawerButton={false}
            showResetButton={false}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search web users by name, email, phone, or role..."
          />
        }
      />

      {/* Add / Edit Web User Modal (Rule 10 & 14) */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingUser ? `Edit Web User: ${editingUser.name}` : 'Create Web User for Tenant Login'}
        maxWidth="md"
        onSubmit={handleSubmitForm}
        submitText={editingUser ? 'Save Changes' : 'Create Web User'}
        cancelText="Cancel"
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <FormInput
            required
            label="Full Name"
            value={formName}
            placeholder="Enter Full Name"
            onChange={(e: any) => setFormName(e.target.value)}
          />

          <FormInput
            required
            type="email"
            value={formEmail}
            label="Email Address"
            placeholder="Enter Email Address"
            onChange={(e: any) => setFormEmail(e.target.value)}
          />

          <FormInput
            type="tel"
            value={formMobile}
            label="Mobile Number"
            placeholder="10-digit mobile number"
            onChange={(e: any) => setFormMobile(e.target.value)}
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Assigned Role <span className="text-rose-500">*</span>
              </label>
              <Link
                to="/dashboard/settings?tab=tenant-roles"
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Shield size={12} /> Manage Roles
              </Link>
            </div>
            <FormInput
              type="select"
              name="roleSelect"
              value={formRoleId}
              options={roleDropdownOptions}
              onChange={(e: any) => handleRoleSelectChange(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <FormInput
              type="password"
              label={editingUser ? 'New Password (Leave blank to keep existing)' : 'Login Password'}
              placeholder={editingUser ? 'Leave blank to preserve current password' : `Auto: ${autoGeneratedPassword}`}
              value={formPassword}
              onChange={(e: any) => setFormPassword(e.target.value)}
            />
            {!editingUser && !formPassword && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono">
                <Sparkles size={11} className="text-amber-500" />
                Default password will be auto-generated: <strong className="text-slate-600 dark:text-slate-300">{autoGeneratedPassword}</strong>
              </p>
            )}
          </div>

          <FormInput
            type="select"
            value={formStatus}
            label="Account Status"
            options={USER_STATUS_OPTIONS}
            onChange={(e: any) => setFormStatus(e.target.value)}
          />

          <FileUploadInput
            label="Profile Picture (Avatar)"
            value={formAvatar}
            onChange={setFormAvatar}
            accept="image/*"
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal (Rule 10 & 24) */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetUser)}
        onClose={() => setDeleteTargetUser(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Web User"
        description={`Are you sure you want to delete web user '${deleteTargetUser?.name}' (${deleteTargetUser?.email})? They will immediately lose web portal access.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete User'}
        confirmVariant="danger"
      />
    </div>
  );
};

export default TenantWebUsersPage;
