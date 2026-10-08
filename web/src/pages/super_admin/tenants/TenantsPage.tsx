import {
  Users,
  Database,
  Building,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  Power,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SafeImage } from '@/components/common/SafeImage';
import { PageHeader } from '@/components/common/PageHeader';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { DataTable, type Column } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';
import { TableActions, TableActionButton } from '@/components/common/TableActions';
import { fetchTenantUsers, updateTenantStatus, deleteTenantUser } from '@/redux/actions/tenant';

export const TenantsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { tenants, loading } = useAppSelector((state) => state.tenant);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Deletion Modal state
  const [selectedTenantForDelete, setSelectedTenantForDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Status toggle confirmation state
  const [selectedTenantForStatus, setSelectedTenantForStatus] = useState<any | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Debounced API fetch per Rule 13
  useDebouncedEffect(
    () => {
      dispatch(fetchTenantUsers());
    },
    200,
    []
  );

  // Status toggle — opens confirmation modal first
  const handleToggleStatus = (tenant: any) => {
    setSelectedTenantForStatus(tenant);
  };

  const confirmToggleStatus = async () => {
    if (!selectedTenantForStatus) return;
    const currentStatus = selectedTenantForStatus.status || selectedTenantForStatus.accountStatus;
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setTogglingStatus(true);
    try {
      await dispatch(updateTenantStatus(selectedTenantForStatus.id, newStatus));
      toast.success(`Tenant '${selectedTenantForStatus.organizationName}' ${newStatus === 'active' ? 'enabled' : 'suspended'}`);
      setSelectedTenantForStatus(null);
    } catch (err: any) {
      toast.error('Failed to update status');
    } finally {
      setTogglingStatus(false);
    }
  };

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!selectedTenantForDelete) return;
    setDeleting(true);
    try {
      await dispatch(deleteTenantUser(selectedTenantForDelete.id));
      toast.success(`Tenant '${selectedTenantForDelete.organizationName}' deleted`);
      setSelectedTenantForDelete(null);
    } catch (err: any) {
      toast.error('Failed to delete tenant');
    } finally {
      setDeleting(false);
    }
  };

  // Filter logic
  const filteredTenants = tenants.filter((t: any) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.name?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.mobile?.includes(q) ||
      t.organizationName?.toLowerCase().includes(q) ||
      t.tenantDbName?.toLowerCase().includes(q);

    const tenantStatus = t.status || t.accountStatus;
    const matchesStatus =
      !statusFilter ||
      tenantStatus === statusFilter ||
      t.provisioningStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPI Metrics Calculation
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => (t.status || t.accountStatus) === 'active').length;
  const provisioningTenants = tenants.filter(
    (t) => (t.status || t.provisioningStatus) === 'provisioning' || (t.status || t.provisioningStatus) === 'pending'
  ).length;
  const totalVotersManaged = tenants.reduce(
    (acc, curr) => acc + (Number(curr.totalVotersCopied) || 0),
    0
  );

  // Auto-poll provisioning status every 3s if any tenant is provisioning
  const hasProvisioningTenants = tenants.some(
    (t: any) => (t.status || t.provisioningStatus) === 'provisioning' || (t.status || t.provisioningStatus) === 'pending'
  );

  React.useEffect(() => {
    if (!hasProvisioningTenants) return;
    const interval = setInterval(() => {
      dispatch(fetchTenantUsers(false));
    }, 3000);
    return () => clearInterval(interval);
  }, [hasProvisioningTenants, dispatch]);

  const getStatusBadge = (tenant: any) => {
    const status = tenant.status || tenant.provisioningStatus || tenant.accountStatus || 'pending';
    const progress = tenant.provisioningProgress || 0;

    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={12} /> Active
          </span>
        );
      case 'provisioning':
      case 'pending':
        return (
          <div className="space-y-1.5 min-w-[170px] max-w-[220px]">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <span className="inline-flex items-center gap-1">
                <Loader2 size={11} className="animate-spin" /> Provisioning
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {tenant.currentStep && (
              <p
                className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate flex items-center gap-1"
                title={tenant.currentStep}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="truncate">{tenant.currentStep}</span>
              </p>
            )}
          </div>
        );
      case 'failed':
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <AlertCircle size={12} /> {status === 'suspended' ? 'Suspended' : 'Failed'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Clock size={12} /> Inactive
          </span>
        );
    }
  };

  // FilterBar fields
  const filterFields: FilterField[] = [
    {
      key: 'statusFilter',
      label: 'Account Status',
      type: 'pills',
      isPrimary: true,
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: 'All', value: '' },
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Provisioning', value: 'provisioning' },
      ],
    },
  ];

  // DataTable column definitions
  const columns: Column<any>[] = [
    {
      key: 'organizationName',
      header: 'Organization & Admin',
      sortable: true,
      render: (t) => (
        <div className="flex items-center gap-3">
          <SafeImage
            src={t.avatar}
            alt={t.name}
            fallbackText={t.name}
            className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
          />
          <div>
            <p className="font-bold text-slate-900 dark:text-white">
              {t.organizationName || 'Campaign Office'}
            </p>
            <p className="text-[11px] text-slate-500">{t.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contact Info',
      render: (t) => (
        <div className="flex flex-col gap-0.5 text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1 font-medium">
            <Mail size={12} className="text-slate-400 shrink-0" />
            <span className="truncate max-w-[160px]">{t.email}</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <Phone size={11} className="shrink-0" />
            <span>{t.mobile || 'N/A'}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'tenantDbName',
      header: 'Database Allocation',
      render: (t) => (
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[11px]">
            <Database size={11} />
            <span className="truncate max-w-[140px]">
              {t.tenantDbName || 'Pending Provision'}
            </span>
          </span>
          <p className="text-[10px] text-slate-400">
            {t.totalVotersCopied ? `${t.totalVotersCopied.toLocaleString()} Voters` : '0 Voters'}
          </p>
        </div>
      ),
    },
    {
      key: 'acIds',
      header: 'Assigned Geography',
      render: (t) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          <Layers size={12} className="text-indigo-500" />
          {Array.isArray(t.acIds) ? t.acIds.length : 0} Assembly ACs
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => getStatusBadge(t),
    },
  ];

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Reusable PageHeader Component (Rule 18) */}
      <PageHeader
        title="Tenant Account Management"
        subtitle="Manage campaign offices, dedicated database allocations, and constituency assignments"
        icon={<Users className="w-6 h-6" />}
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Database size={12} className="text-indigo-500" />
            Infrastructure Overview
          </span>
        }
        onAddClick={() => navigate('/dashboard/tenants/new')}
        addLabel="Add Tenant Account"
      />

      {/* KPI Metrics Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Tenant Accounts
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalTenants}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Tenants
            </p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {activeTenants}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Provisioning / Pending DBs
            </p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {provisioningTenants}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Voters Managed
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalVotersManaged.toLocaleString()}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FilterBar (Rule — uses shared FilterBar component) */}
      <FilterBar
        searchPlaceholder="Search by name, email, or DB..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filterFields}
        onReset={() => {
          setSearchQuery('');
          setStatusFilter('');
        }}
      />

      {/* DataTable (Rule — uses shared DataTable component) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 dark:p-1 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredTenants}
          loading={loading}
          showHeader={false}
          searchPlaceholder="Search tenants..."
          actions={(t) => {
            const isActive = (t.status || t.accountStatus) === 'active';
            return (
              <TableActions
                onView={() => navigate(`/dashboard/tenants/${t.id}`)}
                onEdit={() => navigate(`/dashboard/tenants/${t.id}/edit`)}
                onDelete={() => setSelectedTenantForDelete(t)}
                extra={
                  <TableActionButton
                    variant="custom"
                    onClick={() => handleToggleStatus(t)}
                    icon={Power}
                    title={isActive ? 'Suspend Tenant' : 'Activate Tenant'}
                    className={
                      isActive
                        ? 'bg-amber-50/90 text-amber-600 border border-amber-200/90 hover:bg-amber-600 hover:text-white dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-amber-500/80 dark:hover:text-white'
                        : 'bg-emerald-50/90 text-emerald-600 border border-emerald-200/90 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-emerald-500/80 dark:hover:text-white'
                    }
                  />
                }
              />
            );
          }}
        />
      </div>

      {/* Confirmation Modal for Deletion */}
      <ConfirmModal
        isOpen={Boolean(selectedTenantForDelete)}
        onClose={() => setSelectedTenantForDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Tenant Account"
        description={
          selectedTenantForDelete
            ? `Are you sure you want to delete tenant account '${selectedTenantForDelete.organizationName}' (${selectedTenantForDelete.name})? This action will permanently remove database assignments.`
            : ''
        }
        confirmText="Delete Account"
        variant="danger"
        isLoading={deleting}
      />

      {/* Confirmation Modal for Status Toggle */}
      <ConfirmModal
        isOpen={Boolean(selectedTenantForStatus)}
        onClose={() => setSelectedTenantForStatus(null)}
        onConfirm={confirmToggleStatus}
        title={(selectedTenantForStatus?.status || selectedTenantForStatus?.accountStatus) === 'active' ? 'Suspend Tenant?' : 'Activate Tenant?'}
        description={
          selectedTenantForStatus
            ? (selectedTenantForStatus.status || selectedTenantForStatus.accountStatus) === 'active'
              ? `This will suspend '${selectedTenantForStatus.organizationName}'. The tenant will lose access to their account until re-activated.`
              : `This will activate '${selectedTenantForStatus.organizationName}'. The tenant will regain full access to their account.`
            : ''
        }
        confirmText={(selectedTenantForStatus?.status || selectedTenantForStatus?.accountStatus) === 'active' ? 'Yes, Suspend' : 'Yes, Activate'}
        variant={(selectedTenantForStatus?.status || selectedTenantForStatus?.accountStatus) === 'active' ? 'warning' : 'success'}
        isLoading={togglingStatus}
      />
    </div>
  );
};

export default TenantsPage;
