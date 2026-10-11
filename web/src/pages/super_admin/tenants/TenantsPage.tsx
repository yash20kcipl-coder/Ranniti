import {
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
import { CountUp } from '@/components/common/CountUp';
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

  const isTotalActive = !statusFilter;
  const isActiveActive = statusFilter === 'active';
  const isProvisioningActive = statusFilter === 'provisioning';

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
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
              <span className="font-mono">{progress}%</span>
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-mono">
            <AlertCircle size={12} /> {status === 'suspended' ? 'Suspended' : 'Failed'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono">
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
        { label: 'All Accounts', value: '' },
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
            className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
          />
          <div>
            <p className="font-bold text-xs text-slate-900 dark:text-white">
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
          <span className="flex items-center gap-1 text-xs font-medium">
            <Mail size={12} className="text-slate-400 shrink-0" />
            <span className="truncate max-w-[160px]">{t.email}</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono font-semibold text-xs border border-slate-200/60 dark:border-slate-700/60">
            <Database size={11} />
            <span className="truncate max-w-[140px]">
              {t.tenantDbName || 'Pending Provision'}
            </span>
          </span>
          <p className="text-[10px] text-slate-400 font-mono">
            {t.totalVotersCopied ? `${Number(t.totalVotersCopied).toLocaleString()} Voters` : '0 Voters'}
          </p>
        </div>
      ),
    },
    {
      key: 'acIds',
      header: 'Assigned Geography',
      render: (t) => (
        <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
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
    <div className="space-y-4">
      {/* Reusable PageHeader Component (Rule 18) */}
      <PageHeader
        title="Tenant Account Management"
        subtitle="Manage campaign offices, dedicated database allocations, and constituency assignments"
        icon={<Building className="w-5 h-5 text-indigo-500" />}
        badge={
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
              {totalTenants} {totalTenants === 1 ? 'Account' : 'Accounts'}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-mono">
              {activeTenants} Active
            </span>
          </div>
        }
        onAddClick={() => navigate('/dashboard/tenants/new')}
        addLabel="Add Tenant Account"
      />

      {/* KPI Metrics Dashboard Cards (Bento Style matching VoterStatsCards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CARD 1: TOTAL TENANTS (INDIGO GRADIENT) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('')}
          className={`relative p-4 rounded-lg bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-blue-950/20 border transition-all cursor-pointer text-left group active:scale-[0.985] shadow-xs ${
            isTotalActive
              ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20'
              : 'border-indigo-200/90 dark:border-indigo-900/60 hover:border-indigo-400 dark:hover:border-indigo-600'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                Total Tenant Accounts
              </span>
              <div className="text-2xl font-bold text-indigo-950 dark:text-white mt-1">
                <CountUp to={totalTenants} duration={1.2} />
              </div>
            </div>
            <div className="w-9 h-9 rounded-md bg-indigo-600 text-white shadow-md shadow-indigo-500/25 flex items-center justify-center shrink-0">
              <Building size={17} />
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            <span>Campaign Infrastructure</span>
            {isTotalActive ? (
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-300/80 dark:border-indigo-500/40 font-mono">
                All Tenants
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 hover:text-indigo-600 font-medium">
                Click to reset
              </span>
            )}
          </div>
        </div>

        {/* CARD 2: ACTIVE TENANTS (EMERALD GRADIENT) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter((prev) => (prev === 'active' ? '' : 'active'))}
          className={`relative p-4 rounded-lg bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/20 border transition-all cursor-pointer text-left group active:scale-[0.985] shadow-xs ${
            isActiveActive
              ? 'border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/20'
              : 'border-emerald-200/90 dark:border-emerald-900/60 hover:border-emerald-400 dark:hover:border-emerald-600'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                Active Tenants
              </span>
              <div className="text-2xl font-bold text-emerald-950 dark:text-white mt-1">
                <CountUp to={activeTenants} duration={1.2} />
              </div>
            </div>
            <div className="w-9 h-9 rounded-md bg-emerald-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center shrink-0">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            <span>Operating Offices</span>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-300/80 dark:border-emerald-500/40 font-mono">
              {totalTenants > 0 ? `${Math.round((activeTenants / totalTenants) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* CARD 3: PROVISIONING / PENDING (AMBER GRADIENT) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter((prev) => (prev === 'provisioning' ? '' : 'provisioning'))}
          className={`relative p-4 rounded-lg bg-gradient-to-br from-amber-50/90 via-white to-yellow-50/50 dark:from-amber-950/40 dark:via-slate-900 dark:to-yellow-950/20 border transition-all cursor-pointer text-left group active:scale-[0.985] shadow-xs ${
            isProvisioningActive
              ? 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/20'
              : 'border-amber-200/90 dark:border-amber-900/60 hover:border-amber-400 dark:hover:border-amber-600'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
                Provisioning / Pending
              </span>
              <div className="text-2xl font-bold text-amber-950 dark:text-white mt-1">
                <CountUp to={provisioningTenants} duration={1.2} />
              </div>
            </div>
            <div className="w-9 h-9 rounded-md bg-amber-600 text-white shadow-md shadow-amber-500/25 flex items-center justify-center shrink-0">
              <Database size={17} />
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            <span>Schema Allocation</span>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-300/80 dark:border-amber-500/40 font-mono">
              In Pipeline
            </span>
          </div>
        </div>

        {/* CARD 4: TOTAL VOTERS MANAGED (PURPLE GRADIENT) */}
        <div className="relative p-4 rounded-lg bg-gradient-to-br from-purple-50/90 via-white to-fuchsia-50/50 dark:from-purple-950/40 dark:via-slate-900 dark:to-fuchsia-950/20 border border-purple-200/90 dark:border-purple-900/60 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
                Voters Managed
              </span>
              <div className="text-2xl font-bold text-purple-950 dark:text-white mt-1">
                <CountUp to={totalVotersManaged} duration={1.2} />
              </div>
            </div>
            <div className="w-9 h-9 rounded-md bg-purple-600 text-white shadow-md shadow-purple-500/25 flex items-center justify-center shrink-0">
              <ShieldCheck size={17} />
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            <span>Across Tenant Databases</span>
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-300/80 dark:border-purple-500/40 font-mono">
              Synchronized
            </span>
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

      {/* DataTable Container (Rule — clean standard wrapper) */}
      <div className="rounded-lg">
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
