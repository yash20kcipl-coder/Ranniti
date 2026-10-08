import {
  Building,
  Mail,
  Phone,
  Database,
  ArrowLeft,
  Edit,
  Trash2,
  Power,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Landmark,
  Layers,
  Sparkles,
  KeyRound,
  RefreshCw,
  Check,
  X,
  FileSpreadsheet,
  Copy,
  CheckCheck,
  Search,
  Server,
  Users,
  ChevronDown,
  ChevronUp,
  Shield,
  RotateCcw,
  Activity,
} from 'lucide-react';
import {
  fetchTenantById,
  updateTenantStatus,
  deleteTenantUser,
  fetchTenantProvisioningStatus,
  fetchTenantDbSyncStatus,
  retryTenantProvisioning,
  type TenantDbSyncStatus,
} from '@/redux/actions/tenant';
import toast from 'react-hot-toast';
import { SafeImage } from '@/components/common/SafeImage';
import { PageHeader } from '@/components/common/PageHeader';
import React, { useState, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { fetchSuperAdminMasterCategoryData as fetchMasterCategoryData } from '@/redux/actions/masterSuperAdmin';

// Clean, readable label mappings for lookup tables (prevents ugly text truncation)
const TABLE_FRIENDLY_NAMES: Record<string, { label: string; short: string }> = {
  states: { label: 'States', short: 'States' },
  districts: { label: 'Districts', short: 'Districts' },
  talukas: { label: 'Talukas', short: 'Talukas' },
  villages: { label: 'Villages', short: 'Villages' },
  religions: { label: 'Religions', short: 'Religions' },
  castes: { label: 'Castes', short: 'Castes' },
  parties: { label: 'Parties', short: 'Parties' },
  parliamentary_constituencies: { label: 'Parliamentary (PC)', short: 'PC Seats' },
  assembly_constituencies: { label: 'Assembly (AC)', short: 'AC Seats' },
  wards: { label: 'Wards', short: 'Wards' },
  booths: { label: 'Booths', short: 'Booths' },
  voters: { label: 'Voters', short: 'Voters' },
  influencers: { label: 'Influencers', short: 'Influencers' },
};

const PROVISIONING_PIPELINE_STAGES = [
  { id: 'db_init', label: 'Database Setup', short: 'DB Init', desc: 'Create database & assign credentials' },
  { id: 'schema', label: 'Schema Setup', short: 'Schema', desc: '18 relational tables & constraints' },
  { id: 'master_data', label: 'Master Data', short: 'Master Data', desc: 'Districts, ACs, Parties & Booths' },
  { id: 'voters', label: 'Voters Stream', short: 'Voters', desc: 'High-volume keyset streaming' },
  { id: 'indexing', label: 'Search Indexing', short: 'Search Indexes', desc: 'Fast GIN trigram indexes' },
];

const getStageStatus = (stageId: string, currentPhase: string, tenantStatus: string) => {
  const stageOrder = ['db_init', 'schema', 'master_data', 'voters', 'influencers', 'indexing', 'completed'];
  const stageIdx = stageOrder.indexOf(stageId);
  const currentIdx = stageOrder.indexOf(currentPhase || 'db_init');

  if (tenantStatus === 'active' || currentPhase === 'completed') {
    return 'completed';
  }
  if (tenantStatus === 'failed') {
    if (stageIdx === currentIdx || (currentIdx === -1 && stageIdx === 0)) {
      return 'failed';
    }
    if (stageIdx < currentIdx) {
      return 'completed';
    }
    return 'pending';
  }
  if (stageIdx < currentIdx) {
    return 'completed';
  }
  if (stageIdx === currentIdx) {
    return 'in_progress';
  }
  return 'pending';
};

export const TenantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const pcs = useAppSelector((state) => (state.master as any)?.pcs || []);
  const acs = useAppSelector((state) => (state.master as any)?.acs || []);

  const [tenant, setTenant] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync health audit state
  const [syncStatus, setSyncStatus] = useState<TenantDbSyncStatus | null>(null);
  const [checkingSync, setCheckingSync] = useState(false);
  const [isDriftExpanded, setIsDriftExpanded] = useState(false);
  const [retryingProvisioning, setRetryingProvisioning] = useState(false);

  // UI state for search & copy feedback
  const [constituencySearch, setConstituencySearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRetryProvisioning = async () => {
    if (!id) return;
    setRetryingProvisioning(true);
    try {
      await dispatch(retryTenantProvisioning(id));
      toast.success('Tenant provisioning job restarted successfully');
      setTenant((prev: any) =>
        prev
          ? {
              ...prev,
              status: 'provisioning',
              provisioningStatus: 'provisioning',
              errorMessage: null,
              currentStep: 'Restarting provisioning pipeline...',
              currentPhase: 'db_init',
              provisioningProgress: 5,
            }
          : prev
      );
    } catch {
      // Handled by Redux errorHandler
    } finally {
      setRetryingProvisioning(false);
    }
  };

  const handleCheckSync = useCallback(
    async (targetId?: string) => {
      const tenantId = targetId || id;
      if (!tenantId) return;
      setCheckingSync(true);
      try {
        const result = await dispatch(fetchTenantDbSyncStatus(tenantId));
        setSyncStatus(result);
      } catch {
        // Handled by Redux errorHandler
      } finally {
        setCheckingSync(false);
      }
    },
    [id, dispatch]
  );

  useDebouncedEffect(
    () => {
      if (!pcs.length) {
        dispatch(fetchMasterCategoryData('pcs', '/masters/pcs', false));
      }
      if (!acs.length) {
        dispatch(fetchMasterCategoryData('acs', '/masters/acs', false));
      }

      if (id) {
        setLoading(true);
        dispatch(fetchTenantById(id))
          .then((data: any) => {
            setTenant(data);
            if (data?.tenantDbName && data?.status !== 'pending' && data?.status !== 'failed') {
              handleCheckSync(data.id);
            }
          })
          .catch(() => {
            toast.error('Failed to fetch tenant details');
            navigate('/dashboard/tenants');
          })
          .finally(() => {
            setLoading(false);
          });
      }
    },
    200,
    [id]
  );

  // Poll real-time provisioning status every 2.5 seconds while status is 'provisioning' or 'pending'
  const isProvisioning =
    (tenant?.status || tenant?.provisioningStatus) === 'provisioning' ||
    (tenant?.status || tenant?.provisioningStatus) === 'pending';

  const isFailed = (tenant?.status || tenant?.provisioningStatus) === 'failed';

  React.useEffect(() => {
    if (!id || !isProvisioning) return;
    const interval = setInterval(() => {
      dispatch(fetchTenantProvisioningStatus(id)).then((statusData: any) => {
        if (statusData) {
          setTenant((prev: any) => (prev ? { ...prev, ...statusData } : prev));
          if (statusData.provisioningStatus === 'active') {
            handleCheckSync(id);
          }
        }
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [id, isProvisioning, dispatch, handleCheckSync]);

  const getAcLabel = (acId: string) => {
    const found = acs.find((item: any) => item.id === acId);
    if (found) {
      const acNoStr = found.acNo ? `${found.acNo} - ` : '';
      return `${acNoStr}${found.acName || found.name}`;
    }
    return `AC #${acId.substring(0, 8)}`;
  };

  const getPcLabel = (pcId: string) => {
    const found = pcs.find((item: any) => item.id === pcId);
    if (found) {
      const pcNoStr = found.pcNo ? `${found.pcNo} - ` : '';
      return `${pcNoStr}${found.pcName || found.name}`;
    }
    return `PC #${pcId.substring(0, 8)}`;
  };

  const handleStatusToggle = async () => {
    if (!tenant) return;
    const currentStatus = tenant.status || tenant.accountStatus;
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await dispatch(updateTenantStatus(tenant.id, newStatus));
      setTenant((prev: any) => ({ ...prev, status: newStatus, accountStatus: newStatus }));
      toast.success(`Tenant account set to ${newStatus}`);
    } catch {
      toast.error('Failed to update tenant status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!tenant) return;
    setDeleting(true);
    try {
      await dispatch(deleteTenantUser(tenant.id));
      toast.success('Tenant account deleted successfully');
      navigate('/dashboard/tenants');
    } catch {
      toast.error('Failed to delete tenant');
    } finally {
      setDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Filtered constituencies based on search query
  const filteredAcIds = useMemo(() => {
    const list = Array.isArray(tenant?.acIds) ? tenant.acIds : [];
    if (!constituencySearch.trim()) return list;
    const query = constituencySearch.toLowerCase().trim();
    return list.filter((acId: string) => getAcLabel(acId).toLowerCase().includes(query));
  }, [tenant?.acIds, constituencySearch, acs]);

  const filteredPcIds = useMemo(() => {
    const list = Array.isArray(tenant?.pcIds) ? tenant.pcIds : [];
    if (!constituencySearch.trim()) return list;
    const query = constituencySearch.toLowerCase().trim();
    return list.filter((pcId: string) => getPcLabel(pcId).toLowerCase().includes(query));
  }, [tenant?.pcIds, constituencySearch, pcs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-9 h-9 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Loading tenant account details & database status...
          </p>
        </div>
      </div>
    );
  }

  if (!tenant) return null;

  const currentStatus = tenant.status || tenant.accountStatus || 'pending';
  const isActive = currentStatus === 'active';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <CheckCircle2 size={13} /> Active Account
          </span>
        );
      case 'provisioning':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm shadow-amber-500/10">
            <Loader2 size={13} className="animate-spin" /> Provisioning DB
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm shadow-rose-500/10">
            <AlertCircle size={13} /> Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Clock size={13} /> Inactive
          </span>
        );
    }
  };

  const getSyncStatusBadge = () => {
    if (!syncStatus) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
          <Clock size={12} /> Not Audited
        </span>
      );
    }

    switch (syncStatus.syncStatus) {
      case 'synced':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <CheckCircle2 size={13} /> Synced with Master
          </span>
        );
      case 'partially_synced':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm shadow-amber-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <AlertCircle size={13} /> Partially Synced
          </span>
        );
      case 'out_of_sync':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle size={13} /> Out of Sync
          </span>
        );
      case 'unreachable':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <X size={13} /> DB Unreachable
          </span>
        );
    }
  };

  // Compute Voter Parity Progress %
  const voterParityMaster = syncStatus?.voterCountMaster || 0;
  const voterParityTenant = syncStatus?.voterCountTenant || (tenant.totalVotersCopied || 0);
  const voterParityPct =
    voterParityMaster > 0
      ? Math.min(100, Math.round((voterParityTenant / voterParityMaster) * 100))
      : 100;

  // Compute Schema Integrity display state (avoids confusing "0 Missing / Drift" in red)
  const schemaState = (() => {
    if (!syncStatus) {
      return {
        label: 'Standard Schema',
        subtext: 'Awaiting sync audit',
        status: 'neutral',
      };
    }
    if (syncStatus.isSchemaSynced) {
      return {
        label: 'All 17 Tables Intact',
        subtext: 'Zero schema drift detected',
        status: 'synced',
      };
    }
    if (syncStatus.missingTables && syncStatus.missingTables.length > 0) {
      return {
        label: `${syncStatus.missingTables.length} Missing Table${syncStatus.missingTables.length > 1 ? 's' : ''}`,
        subtext: 'Required tables not created',
        status: 'missing',
      };
    }
    if (syncStatus.schemaDrift && syncStatus.schemaDrift.length > 0) {
      return {
        label: `${syncStatus.schemaDrift.length} Column Difference${syncStatus.schemaDrift.length > 1 ? 's' : ''}`,
        subtext: 'Column variations vs master',
        status: 'drift',
      };
    }
    return {
      label: 'Schema Synced',
      subtext: '17 tables verified',
      status: 'synced',
    };
  })();

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Reusable PageHeader Component (Rule 18) */}
      <PageHeader
        title={tenant.organizationName}
        subtitle={`Tenant Database: ${tenant.tenantDbName || 'Provisioning'}`}
        icon={<Building className="w-6 h-6" />}
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Sparkles size={12} className="text-amber-500" />
            Dedicated PostgreSQL Instance
          </span>
        }
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to="/dashboard/tenants"
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </Link>

            <button
              type="button"
              onClick={handleStatusToggle}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${isActive
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                }`}
            >
              <Power size={14} />
              <span>{isActive ? 'Suspend Tenant' : 'Activate Tenant'}</span>
            </button>

            <Link
              to={`/dashboard/tenants/${tenant.id}/edit`}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit size={14} />
              <span>Edit Account</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        }
      />

      {/* Grid Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Admin Profile & Tenant Command Center */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          {/* Ambient Banner Header */}
          <div className="h-28 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 dark:from-indigo-950 dark:via-purple-950 dark:to-slate-950 relative overflow-hidden flex items-end justify-end p-3">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-[11px] font-bold text-indigo-200 border border-white/10">
              <Server size={11} className="text-cyan-400" />
              <span>Tenant Node</span>
            </div>
          </div>

          {/* Profile Card Body */}
          <div className="px-6 pb-6 pt-0 space-y-6">
            {/* Avatar & Core Identity */}
            <div className="flex flex-col items-center text-center -mt-12 space-y-2.5 pb-5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="relative group">
                <SafeImage
                  src={tenant.avatar}
                  alt={tenant.name}
                  fallbackText={tenant.name}
                  className="w-24 h-24 rounded-full object-cover shadow-xl border-4 border-white dark:border-slate-900 ring-2 ring-indigo-500/30 text-lg font-black"
                />
                <span
                  className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${isActive ? 'bg-emerald-500' : currentStatus === 'provisioning' ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                  title={`Status: ${currentStatus}`}
                />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {tenant.name}
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                  Tenant Administrator
                </p>
              </div>

              <div>{getStatusBadge(currentStatus)}</div>
            </div>

            {/* Structured Contact & Specification Tiles */}
            <div className="space-y-2.5">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                Account Specifications
              </p>

              {/* Email Tile */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs transition-colors hover:border-indigo-500/30">
                <div className="flex items-center gap-2.5 truncate min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Mail size={13} />
                  </div>
                  <div className="truncate">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Email Address</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{tenant.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(tenant.email, 'email', 'Email address')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 transition-all shrink-0 cursor-pointer"
                  title="Copy email"
                >
                  {copiedKey === 'email' ? <CheckCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>

              {/* Phone Tile */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs transition-colors hover:border-indigo-500/30">
                <div className="flex items-center gap-2.5 truncate min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Phone size={13} />
                  </div>
                  <div className="truncate">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Contact Phone</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {tenant.mobile || 'No contact specified'}
                    </p>
                  </div>
                </div>
                {tenant.mobile && (
                  <button
                    type="button"
                    onClick={() => handleCopy(tenant.mobile, 'mobile', 'Mobile number')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 transition-all shrink-0 cursor-pointer"
                    title="Copy phone"
                  >
                    {copiedKey === 'mobile' ? <CheckCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                )}
              </div>

              {/* Organization Tile */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs transition-colors hover:border-indigo-500/30">
                <div className="flex items-center gap-2.5 truncate min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Building size={13} />
                  </div>
                  <div className="truncate">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Organization</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{tenant.organizationName}</p>
                  </div>
                </div>
              </div>

              {/* Access Role Package Tile */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs transition-colors hover:border-indigo-500/30">
                <div className="flex items-center gap-2.5 truncate min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <KeyRound size={13} />
                  </div>
                  <div className="truncate">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Permission Package</p>
                    <p className="font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                      {tenant.tenantRoleName || 'Full Political Campaign Suite'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dedicated Database Name Tile */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs transition-colors hover:border-indigo-500/30">
                <div className="flex items-center gap-2.5 truncate min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Database size={13} />
                  </div>
                  <div className="truncate">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Dedicated Database</p>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                      {tenant.tenantDbName || 'Provisioning...'}
                    </p>
                  </div>
                </div>
                {tenant.tenantDbName && (
                  <button
                    type="button"
                    onClick={() => handleCopy(tenant.tenantDbName, 'dbname', 'Database name')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 transition-all shrink-0 cursor-pointer"
                    title="Copy database name"
                  >
                    {copiedKey === 'dbname' ? <CheckCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics 2x2 Grid (Balances height & eliminates empty void) */}
            <div className="space-y-2.5 pt-1">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                Deployment Scope
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Assembly (AC)
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {Array.isArray(tenant.acIds) ? tenant.acIds.length : 0}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Assigned</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Parliamentary (PC)
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {Array.isArray(tenant.pcIds) ? tenant.pcIds.length : 0}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Assigned</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Voters Synced
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {(syncStatus?.voterCountTenant ?? tenant.totalVotersCopied ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    DB Isolation
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <ShieldCheck size={14} className="shrink-0" />
                    <span>100% Dedicated</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
              <Link
                to={`/dashboard/tenants/${tenant.id}/edit`}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Edit size={13} />
                <span>Edit Profile</span>
              </Link>

              <button
                type="button"
                onClick={() => handleCheckSync()}
                disabled={checkingSync}
                className="py-2.5 px-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                title="Audit Database Sync"
              >
                <RefreshCw size={13} className={checkingSync ? 'animate-spin' : ''} />
                <span>Audit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Database Health, Sync Parity & Geography */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active or Failed Provisioning Progress Monitor Card */}
          {(isProvisioning || isFailed) && (
            <div
              className={`rounded-3xl p-6 sm:p-7 border shadow-sm space-y-6 transition-all ${
                isFailed
                  ? 'bg-rose-500/5 border-rose-500/30 dark:bg-rose-950/20 dark:border-rose-900/40'
                  : 'bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-cyan-500/5 border-indigo-500/30 dark:border-indigo-500/20'
              }`}
            >
              {/* Header with Title, Live Badge, and Retry Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                      isFailed
                        ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/30'
                        : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30'
                    }`}
                  >
                    {isFailed ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">
                        {isFailed ? 'Tenant Provisioning Failed' : 'Tenant Data Provisioning in Progress'}
                      </h3>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isFailed
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 animate-pulse'
                        }`}
                      >
                        {isFailed ? 'Action Required' : 'Live Stream'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isFailed
                        ? 'Encountered an issue during tenant database initialization.'
                        : 'Real-time database isolation and multi-table data ingestion.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {tenant.provisioningProgress || 0}%
                    </span>
                    <span className="text-[10px] block font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Overall Progress
                    </span>
                  </div>

                  {/* Retry / Restart Pipeline Button */}
                  <button
                    type="button"
                    onClick={handleRetryProvisioning}
                    disabled={retryingProvisioning}
                    className={`py-2 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                      isFailed
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                    } disabled:opacity-50`}
                    title={isFailed ? 'Retry Provisioning Pipeline' : 'Restart Provisioning Pipeline'}
                  >
                    <RotateCcw size={13} className={retryingProvisioning ? 'animate-spin' : ''} />
                    <span>{retryingProvisioning ? 'Starting...' : isFailed ? 'Retry Pipeline' : 'Restart'}</span>
                  </button>
                </div>
              </div>

              {/* Overall Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                      isFailed
                        ? 'bg-gradient-to-r from-rose-500 to-red-600'
                        : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500'
                    }`}
                    style={{ width: `${Math.max(4, tenant.provisioningProgress || 0)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-medium">
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[70%]">
                    {tenant.currentStep || 'Initializing database environment...'}
                  </span>
                  <span className="font-semibold text-slate-400 text-right">
                    DB: <span className="font-mono text-slate-700 dark:text-slate-300">{tenant.tenantDbName || 'pending'}</span>
                  </span>
                </div>
              </div>

              {/* 5-Stage Stepper Pipeline */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {PROVISIONING_PIPELINE_STAGES.map((stage, idx) => {
                  const stageStatus = getStageStatus(stage.id, tenant.currentPhase, tenant.status);
                  const isDone = stageStatus === 'completed';
                  const isCurrent = stageStatus === 'in_progress';
                  const isError = stageStatus === 'failed';

                  return (
                    <div
                      key={stage.id}
                      className={`rounded-2xl p-3 border transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400/60 dark:border-indigo-600/60 shadow-sm ring-1 ring-indigo-500/20'
                          : isDone
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                          : isError
                          ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-400 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800/60 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          0{idx + 1}
                        </span>
                        {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                        {isCurrent && <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />}
                        {isError && <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                        {!isDone && !isCurrent && !isError && (
                          <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight truncate text-slate-900 dark:text-white">
                          {stage.short}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {isCurrent
                            ? 'Active now'
                            : isDone
                            ? 'Completed'
                            : isError
                            ? 'Failed here'
                            : 'Pending'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Granular Active Data Ticker */}
              <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                      Active Data Segment
                    </div>
                    <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>
                        {tenant.activeTable
                          ? TABLE_FRIENDLY_NAMES[tenant.activeTable]?.label || tenant.activeTable
                          : isFailed
                          ? 'Provisioning Halted'
                          : 'Schema Initialization'}
                      </span>
                      {tenant.activeTable && (
                        <span className="font-mono text-[10px] text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                          {tenant.activeTable}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row Counter (when available) */}
                {Boolean(tenant.totalRecords && tenant.totalRecords > 0) && (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                        Segment Progress
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {(tenant.processedRecords || 0).toLocaleString()} / {(tenant.totalRecords || 0).toLocaleString()} records
                      </div>
                    </div>
                    <div className="w-20 sm:w-28 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(((tenant.processedRecords || 0) / tenant.totalRecords) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Total Voters Copied Counter */}
                <div className="text-right border-l border-slate-100 dark:border-slate-800 pl-4">
                  <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                    Total Voters Seeded
                  </div>
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {(tenant.totalVotersCopied || 0).toLocaleString()} voters
                  </div>
                </div>
              </div>

              {/* Error Callout if Failed */}
              {isFailed && tenant.errorMessage && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div className="space-y-1">
                    <p className="font-bold">Failure Details:</p>
                    <p className="font-mono text-[11px] break-all">{tenant.errorMessage}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Database Sync Health & Parity Inspector Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            {/* Header with Title & Audit Action */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">
                    Database Sync & Parity Status
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time bidirectional parity audit against Master database
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {getSyncStatusBadge()}

                <button
                  type="button"
                  onClick={() => handleCheckSync()}
                  disabled={checkingSync}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                  title="Run Real-Time Sync Audit"
                >
                  <RefreshCw size={13} className={checkingSync ? 'animate-spin text-indigo-600' : ''} />
                  <span>{checkingSync ? 'Auditing...' : 'Audit Sync'}</span>
                </button>
              </div>
            </div>

            {/* Core Metric Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Database Allocation */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Server size={12} className="text-cyan-500" />
                    <span>Database Allocation</span>
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[180px]">
                      {tenant.tenantDbName || 'Pending Provision'}
                    </p>
                    {tenant.tenantDbName && (
                      <button
                        type="button"
                        onClick={() => handleCopy(tenant.tenantDbName, 'metric_db', 'Database name')}
                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1"
                        title="Copy database name"
                      >
                        {copiedKey === 'metric_db' ? (
                          <CheckCheck size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                  <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Physical DB Isolation</span>
                </div>
              </div>

              {/* Card 2: Voter Parity */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={12} className="text-indigo-500" />
                    <span>Voter Parity</span>
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {syncStatus
                        ? syncStatus.voterCountTenant.toLocaleString()
                        : (tenant.totalVotersCopied || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      / {syncStatus ? syncStatus.voterCountMaster.toLocaleString() : '—'} Master
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${voterParityPct === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      style={{ width: `${voterParityPct}%` }}
                    />
                  </div>
                  <div className="text-[11px] flex items-center justify-between">
                    {syncStatus ? (
                      syncStatus.voterCountDiff === 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                          <Check size={12} /> 100% Voters Synced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                          <AlertCircle size={12} /> {Math.abs(syncStatus.voterCountDiff).toLocaleString()} Diff
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400 font-medium">Click Audit to compare</span>
                    )}
                    <span className="font-mono text-slate-400 text-[10px]">{voterParityPct}%</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Schema Integrity */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Shield size={12} className="text-purple-500" />
                    <span>Schema Integrity</span>
                  </p>
                  <div className="mt-2">
                    <div className="flex items-center gap-1.5">
                      {schemaState.status === 'synced' ? (
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle
                          size={16}
                          className={schemaState.status === 'missing' ? 'text-rose-500' : 'text-amber-500'}
                        />
                      )}
                      <span
                        className={`text-sm font-black tracking-tight ${schemaState.status === 'synced'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : schemaState.status === 'missing'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                          }`}
                      >
                        {schemaState.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">{schemaState.subtext}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                  <span>
                    {syncStatus?.checkedAt
                      ? `Audit: ${new Date(syncStatus.checkedAt).toLocaleTimeString()}`
                      : 'Audit pending'}
                  </span>
                  {syncStatus?.schemaDrift && syncStatus.schemaDrift.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsDriftExpanded((prev) => !prev)}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{isDriftExpanded ? 'Hide' : 'Details'}</span>
                      {isDriftExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Missing Tables Banner (High Severity Alert) */}
            {syncStatus && syncStatus.missingTables && syncStatus.missingTables.length > 0 && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs space-y-2">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
                  <AlertCircle size={15} />
                  <span>Missing Tables in Tenant Database:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {syncStatus.missingTables.map((tbl) => (
                    <span
                      key={tbl}
                      className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 font-mono text-[11px] font-bold"
                    >
                      {tbl}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Expandable Schema Drift Inspector */}
            {syncStatus && syncStatus.schemaDrift && syncStatus.schemaDrift.length > 0 && isDriftExpanded && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black">
                    <AlertCircle size={15} />
                    <span>Schema Column Drift Details ({syncStatus.schemaDrift.length} tables):</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDriftExpanded(false)}
                    className="text-amber-600 hover:text-amber-800 text-[11px] font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-2">
                  {syncStatus.schemaDrift.map((drift, idx) => (
                    <div
                      key={`${drift.table}-${idx}`}
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/70 dark:border-amber-900/60 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-700 dark:text-amber-400 capitalize">
                          {drift.table}
                        </span>
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                          Column Drift
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        {drift.issue}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Master Lookup Tables Sync Parity Breakdown */}
            {syncStatus && Object.keys(syncStatus.masterLookupSync || {}).length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <FileSpreadsheet size={14} className="text-indigo-500" />
                    <span>Master Lookup Tables Parity Breakdown</span>
                  </p>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {Object.values(syncStatus.masterLookupSync).filter((v) => v.synced).length} of{' '}
                    {Object.keys(syncStatus.masterLookupSync).length} Tables Synced
                  </span>
                </div>

                {/* 4-Column Responsive Grid with Clean, Untruncated Labels */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Object.entries(syncStatus.masterLookupSync).map(([table, stat]) => {
                    const friendly = TABLE_FRIENDLY_NAMES[table] || {
                      label: table.replace(/_/g, ' '),
                      short: table.replace(/_/g, ' '),
                    };

                    return (
                      <div
                        key={table}
                        className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-all hover:shadow-sm ${stat.synced
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/50 text-emerald-950 dark:text-emerald-200'
                          : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/50 text-amber-950 dark:text-amber-200'
                          }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-black text-slate-900 dark:text-white truncate" title={friendly.label}>
                            {friendly.label}
                          </p>
                          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                            {stat.tenant.toLocaleString()} / {stat.master.toLocaleString()}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {stat.synced ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                              <Check size={13} className="stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                              <AlertCircle size={13} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Assigned Constituencies Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight">
                    Assigned Constituencies
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Jurisdiction limits configured for this tenant's field operations
                  </p>
                </div>
              </div>

              {/* Quick Search for Constituencies */}
              {(Array.isArray(tenant.acIds) && tenant.acIds.length > 5) ||
                (Array.isArray(tenant.pcIds) && tenant.pcIds.length > 3) ? (
                <div className="relative min-w-[200px]">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={constituencySearch}
                    onChange={(e) => setConstituencySearch(e.target.value)}
                    placeholder="Search seats..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-5">
              {/* Assembly Constituencies (AC) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={13} className="text-indigo-500" />
                    <span>Assembly Constituencies</span>
                  </p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {Array.isArray(tenant.acIds) ? tenant.acIds.length : 0} Seats
                  </span>
                </div>

                {filteredAcIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {filteredAcIds.map((acId: string, idx: number) => (
                      <span
                        key={`${acId}-${idx}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/80 dark:border-indigo-800/80 transition-all shadow-sm"
                      >
                        <Layers size={12} className="text-indigo-500" />
                        <span>{getAcLabel(acId)}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-400 font-medium italic">
                      {constituencySearch ? 'No matching Assembly Constituencies found' : 'No Assembly Constituencies assigned'}
                    </p>
                  </div>
                )}
              </div>

              {/* Parliamentary Constituencies (PC) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Landmark size={13} className="text-emerald-500" />
                    <span>Parliamentary Constituencies</span>
                  </p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {Array.isArray(tenant.pcIds) ? tenant.pcIds.length : 0} Seats
                  </span>
                </div>

                {filteredPcIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {filteredPcIds.map((pcId: string, idx: number) => (
                      <span
                        key={`${pcId}-${idx}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200/80 dark:border-emerald-800/80 transition-all shadow-sm"
                      >
                        <Landmark size={12} className="text-emerald-500" />
                        <span>{getPcLabel(pcId)}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-400 font-medium italic">
                      {constituencySearch ? 'No matching Parliamentary Constituencies found' : 'No Parliamentary Constituencies assigned'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Deletion (Rule 10) */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Tenant Account"
        description={`Are you sure you want to delete tenant account for '${tenant.organizationName}' (${tenant.name})? This action will permanently remove database assignments and voter links.`}
        confirmText="Delete Account"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
};

export default TenantDetailPage;
