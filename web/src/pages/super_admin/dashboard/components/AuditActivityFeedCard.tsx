import React from 'react';
import { ShieldCheck, User, Terminal } from 'lucide-react';
import type { RecentAuditRecord } from '@/redux/actions/superAdminDashboard';

interface AuditActivityFeedCardProps {
  logs: RecentAuditRecord[];
}

export const AuditActivityFeedCard: React.FC<AuditActivityFeedCardProps> = ({
  logs,
}) => {
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Platform Audit Feed
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Security & Administrative Event Trail
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
            Immutable Audit Trail
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
            <Terminal className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No audit records logged yet
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Administrative actions, logins, and schema migrations will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-200/70 dark:bg-slate-700/60 flex items-center justify-center shrink-0 mt-0.5 text-slate-600 dark:text-slate-300">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {log.userName}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100/70 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Target: <span className="font-medium text-slate-700 dark:text-slate-300">{log.entityType || 'Platform'}</span>
                      {log.ipAddress && ` • IP: ${log.ipAddress}`}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-400 shrink-0">
                  {formatTime(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Logged Events: <strong>{logs.length}</strong></span>
        <span>Secured via Master DB</span>
      </div>
    </div>
  );
};
