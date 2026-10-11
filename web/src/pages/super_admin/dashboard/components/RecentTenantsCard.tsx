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
    <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recently Provisioned Tenants
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Latest Campaign Accounts & Database Provisioning Pipeline
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/tenants')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
        >
          <span>View All Tenants</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="h-16 rounded-lg bg-slate-100 dark:bg-slate-800/40 animate-pulse"
            />
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/30">
          <Building className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No tenants provisioned yet
          </p>
          <button
            onClick={() => navigate('/dashboard/tenants/new')}
            className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all cursor-pointer shadow-xs"
          >
            Provision First Tenant
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
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
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                        />
                        <div>
                          <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">
                            {item.organizationName || item.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {item.name} • {item.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Database Name */}
                    <td className="py-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                        <Database className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="text-[10px] truncate max-w-[140px]">{item.tenantDbName}</span>
                      </div>
                    </td>

                    {/* Role Package */}
                    <td className="py-3">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {item.roleName || 'Standard Package'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-[9px]  font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 text-[9px]  font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3 h-3" /> {item.provisioningProgress}% Provisioning
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px]  font-semibold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <AlertTriangle className="w-3 h-3" /> Suspended
                        </span>
                      )}
                    </td>

                    {/* Voters Copied */}
                    <td className="py-3 text-right">
                      <span className="text-[11px] font-extrabold text-slate-900 dark:text-white font-mono">
                        {Number(item.totalVotersCopied || 0).toLocaleString()}
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
