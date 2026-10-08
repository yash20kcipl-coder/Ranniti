import {
  Users,
  Building,
  ArrowRight,
  Database,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SafeImage } from '@/components/common/SafeImage';
import { TableActions } from '@/components/common/TableActions';
import type { RecentTenantRecord } from '@/redux/actions/superAdminDashboard';

interface RecentTenantsCardProps {
  tenants: RecentTenantRecord[];
  loading: boolean;
}

export const RecentTenantsCard: React.FC<RecentTenantsCardProps> = ({
  tenants,
  loading,
}) => {
  const navigate = useNavigate();

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recently Provisioned Tenants
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest Campaign Accounts & Database Provisioning Pipeline
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/tenants')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          View All Tenants <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/40 animate-pulse"
            />
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
          <Building className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No tenants provisioned yet
          </p>
          <button
            onClick={() => navigate('/dashboard/tenants/new')}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Provision First Tenant
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-2">Organization / Admin</th>
                <th className="pb-3">Database Instance</th>
                <th className="pb-3">Role Package</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Voters Copied</th>
                <th className="pb-3 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {tenants.map((item) => {
                const isActive = item.status === 'active';
                const isPending = item.status === 'pending';

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Organization & Admin */}
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-3">
                        <SafeImage
                          src={item.avatar}
                          alt={item.name}
                          fallbackText={item.name}
                          className="w-9 h-9 rounded-xl object-cover shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white leading-tight">
                            {item.organizationName || item.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.name} • {item.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Database Name */}
                    <td className="py-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300">
                        <Database className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{item.tenantDbName}</span>
                      </div>
                    </td>

                    {/* Role Package */}
                    <td className="py-3">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {item.roleName || 'Standard Package'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/20">
                          <Clock className="w-3 h-3" /> {item.provisioningProgress}% Provisioning
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-500/20">
                          <AlertTriangle className="w-3 h-3" /> Suspended
                        </span>
                      )}
                    </td>

                    {/* Voters Copied */}
                    <td className="py-3 text-right">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.totalVotersCopied.toLocaleString()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 pr-2 text-right">
                      <TableActions
                        onView={() => navigate(`/dashboard/tenants/${item.id}`)}
                        onEdit={() => navigate(`/dashboard/tenants/${item.id}/edit`)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
