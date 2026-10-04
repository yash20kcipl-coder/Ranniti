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
} from 'lucide-react';
import toast from 'react-hot-toast';
import React, { useState } from 'react';
import { SafeImage } from '@/components/common/SafeImage';
import { PageHeader } from '@/components/common/PageHeader';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { fetchSuperAdminMasterCategoryData as fetchMasterCategoryData } from '@/redux/actions/masterSuperAdmin';
import { fetchTenantById, updateTenantStatus, deleteTenantUser, fetchTenantProvisioningStatus } from '@/redux/actions/tenant';

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
  const isProvisioning = tenant?.provisioningStatus === 'provisioning' || tenant?.provisioningStatus === 'pending';

  React.useEffect(() => {
    if (!id || !isProvisioning) return;
    const interval = setInterval(() => {
      dispatch(fetchTenantProvisioningStatus(id)).then((statusData: any) => {
        if (statusData) {
          setTenant((prev: any) => (prev ? { ...prev, ...statusData } : prev));
        }
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [id, isProvisioning, dispatch]);

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
    const newStatus = tenant.accountStatus === 'active' ? 'inactive' : 'active';
    try {
      await dispatch(updateTenantStatus(tenant.id, newStatus));
      setTenant((prev: any) => ({ ...prev, accountStatus: newStatus }));
      toast.success(`Tenant account set to ${newStatus}`);
    } catch (err: any) {
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
    } catch (err: any) {
      toast.error('Failed to delete tenant');
    } finally {
      setDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Loading tenant account details...
          </p>
        </div>
      </div>
    );
  }

  if (!tenant) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={14} /> Active Account
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <AlertCircle size={14} /> Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock size={14} /> Inactive
          </span>
        );
    }
  };

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
            Isolated Schema
          </span>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/dashboard/tenants"
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>

            <button
              type="button"
              onClick={handleStatusToggle}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${tenant.accountStatus === 'active'
                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                }`}
            >
              <Power size={14} />
              <span>{tenant.accountStatus === 'active' ? 'Disable Tenant' : 'Enable Tenant'}</span>
            </button>

            <Link
              to={`/dashboard/tenants/${tenant.id}/edit`}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit size={14} />
              <span>Edit Account</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        }
      />

      {/* Grid Inspector Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Admin Profile */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col items-center text-center space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <SafeImage
              src={tenant.avatar}
              alt={tenant.name}
              fallbackText={tenant.name}
              className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-indigo-500/20"
            />
            <div>
              <h3 className="text-md font-extrabold text-slate-900 dark:text-white">
                {tenant.name}
              </h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                Tenant Administrator
              </p>
            </div>
            {getStatusBadge(tenant.accountStatus)}
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="truncate">{tenant.email}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Phone className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>{tenant.mobile || 'N/A'}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Building className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="font-semibold">{tenant.organizationName}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Created: {new Date(tenant.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Credentials Info Badge (Manual Provisioning) */}
          <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
              <KeyRound size={14} />
              <span>Account Credentials</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Login credentials for this account are manually assigned and communicated directly to the tenant admin.
            </p>
          </div>
        </div>

        {/* Right Column: Database Health & Geography Assignments */}
        <div className="md:col-span-2 space-y-6">
          {/* Real-time Provisioning Progress Monitor Card */}
          {(tenant.provisioningStatus === 'provisioning' || tenant.provisioningStatus === 'pending') && (
            <div className="bg-gradient-to-r from-amber-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/60 rounded-2xl p-6 border-2 border-amber-400/80 dark:border-amber-500/40 shadow-lg space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Loader2 size={18} className="animate-spin" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                      Live Database Provisioning in Progress
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Creating schema & streaming voter dataset asynchronously
                    </p>
                  </div>
                </div>

                <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  {tenant.provisioningProgress || 0}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${tenant.provisioningProgress || 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={11} className="animate-spin shrink-0" />
                    {tenant.currentStep
                      ? tenant.currentStep
                      : tenant.provisioningProgress < 30
                        ? 'Creating PostgreSQL database & schemas...'
                        : tenant.provisioningProgress < 45
                          ? 'Replicating master tables...'
                          : `Streaming voter records...`}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {(tenant.totalVotersCopied || 0).toLocaleString()} Voters Loaded
                  </span>
                </div>
              </div>
            </div>
          )}


          {/* Database Health Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  PostgreSQL Schema Isolation Status
                </h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${tenant.provisioningStatus === 'active'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : tenant.provisioningStatus === 'provisioning'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                  }`}
              >
                {tenant.provisioningStatus === 'active'
                  ? 'Schema Active'
                  : tenant.provisioningStatus === 'provisioning'
                    ? 'Provisioning DB'
                    : tenant.provisioningStatus || 'Pending'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Database Schema Name</p>
                <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-300 mt-1 truncate">
                  {tenant.tenantDbName || 'Provisioning'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Total Copied Voters</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {tenant.totalVotersCopied ? tenant.totalVotersCopied.toLocaleString() : '0'} Voters
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Full read/write isolation enabled for campaign managers and ground volunteers.</span>
            </div>
          </div>

          {/* Assigned Geography Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Landmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Assigned Constituencies
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Assembly Constituencies ({Array.isArray(tenant.acIds) ? tenant.acIds.length : 0})
                </p>
                {Array.isArray(tenant.acIds) && tenant.acIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tenant.acIds.map((acId: string, idx: number) => (
                      <span
                        key={`${acId}-${idx}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800"
                      >
                        <Layers size={12} />
                        <span>{getAcLabel(acId)}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No Assembly Constituencies assigned</p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Parliamentary Constituencies ({Array.isArray(tenant.pcIds) ? tenant.pcIds.length : 0})
                </p>
                {Array.isArray(tenant.pcIds) && tenant.pcIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tenant.pcIds.map((pcId: string, idx: number) => (
                      <span
                        key={`${pcId}-${idx}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700"
                      >
                        <Landmark size={12} />
                        <span>{getPcLabel(pcId)}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No Parliamentary Constituencies assigned</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Deletion */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Tenant Account"
        description={`Are you sure you want to delete tenant account for '${tenant.organizationName}' (${tenant.name})? This action will permanently remove database assignments.`}
        confirmText="Delete Account"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
};

export default TenantDetailPage;
