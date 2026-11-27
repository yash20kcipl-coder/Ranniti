import React from 'react';
import { Card } from '@/components/common/Card';
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
      <Card loading className="h-full min-h-[260px]">
        <div className="h-32" />
      </Card>
    );
  }

  const velocityPoints = data.registrationVelocity || [];
  const counts = velocityPoints.map((d) => d.count);
  const peakVolume = counts.length > 0 ? Math.max(...counts) : 0;
  const activeDays = counts.filter((c) => c > 0).length;

  return (
    <Card
      footer={
        <div className="flex items-center justify-between text-xs w-full">
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
      }
      className="h-full flex flex-col justify-between"
    >
      <VelocityAreaChart data={velocityPoints} height={175} />
    </Card>
  );
};
