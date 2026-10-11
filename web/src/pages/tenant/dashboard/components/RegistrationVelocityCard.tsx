import React from 'react';
import { VelocityAreaChart } from '@/components/common/charts/VelocityAreaChart';
import type { TenantDashboardPayload } from '@/redux/actions/tenantDashboard';

interface RegistrationVelocityCardProps {
  data: TenantDashboardPayload | null;
  loading: boolean;
}

export const RegistrationVelocityCard: React.FC<RegistrationVelocityCardProps> = ({
  data,
  loading,
}) => {
  if (loading || !data) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-800 shadow-xs animate-pulse space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
    );
  }

  const velocityPoints = data.registrationVelocity || [];
  const counts = velocityPoints.map((d) => d.count);
  const peakVolume = counts.length > 0 ? Math.max(...counts) : 0;
  const activeDays = counts.filter((c) => c > 0).length;

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-lg p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs h-full flex flex-col justify-between space-y-4">
      <VelocityAreaChart data={velocityPoints} height={175} />

      {/* Velocity Summary Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Active Contact Dates:
          </span>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
            {activeDays} {activeDays === 1 ? 'batch' : 'batches'} recorded
          </span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          Peak Velocity:{' '}
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {peakVolume.toLocaleString()} / day
          </span>
        </div>
      </div>
    </div>
  );
};
