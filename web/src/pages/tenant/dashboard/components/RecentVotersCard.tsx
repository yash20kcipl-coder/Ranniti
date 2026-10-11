import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, Vote } from 'lucide-react';
import { SafeImage } from '@/components/common/SafeImage';
import type { TenantDashboardPayload } from '@/redux/actions/tenantDashboard';

interface RecentVotersCardProps {
  recentVoters: TenantDashboardPayload['recentVoters'];
  loading: boolean;
}

const getAvatarTheme = (name: string) => {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const themes = [
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  ];
  return themes[Math.abs(hash) % themes.length];
};

const formatRegistrationDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    if (isToday) return 'Today';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const RecentVotersCard: React.FC<RecentVotersCardProps> = ({
  recentVoters,
  loading,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg p-5 border border-slate-200 dark:border-slate-800 shadow-xs animate-pulse">
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-lg p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Clock size={18} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Recent Voter Contacts & Registrations
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Latest constituent updates recorded in campaign database
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/voters')}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
        >
          View All <ChevronRight size={14} />
        </button>
      </div>

      {recentVoters.length === 0 ? (
        <div className="p-8 text-center rounded-lg bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-xs">
          No recent voter registrations recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Constituent</th>
                <th className="py-2.5 px-3">EPIC ID</th>
                <th className="py-2.5 px-3">Demographics</th>
                <th className="py-2.5 px-3">Affiliation / Status</th>
                <th className="py-2.5 px-3 text-right">Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentVoters.map((voter) => (
                <tr
                  key={voter.id}
                  onClick={() => navigate(`/dashboard/voters/${voter.id}`)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
                    <SafeImage
                      alt={voter.name}
                      fallbackText={voter.name}
                      className={`w-8 h-8 rounded-full border object-cover shrink-0 text-xs font-extrabold ${getAvatarTheme(
                        voter.name
                      )}`}
                    />
                    <span className="font-semibold text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {voter.name}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                      {voter.epicNo || 'N/A'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                      <span>{voter.gender || 'Unknown'}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-mono font-semibold">{voter.age} yrs</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
                      <Vote size={11} />
                      {voter.partyName || 'Registered'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400 font-mono text-[11px]">
                    {formatRegistrationDate(voter.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
