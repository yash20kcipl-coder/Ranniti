import React from 'react';
import { HeartHandshake } from 'lucide-react';

export interface VoterDemographicsDetailCardProps {
  voter: any;
}

const formatDob = (dob: any): string => {
  if (!dob) return '-';
  try {
    // If it's an ISO timestamp string like 1981-01-16T18:30:00.000Z
    const d = new Date(dob);
    if (isNaN(d.getTime())) {
      return String(dob).split('T')[0];
    }
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return String(dob).split('T')[0] || '-';
  }
};

export const VoterDemographicsDetailCard: React.FC<VoterDemographicsDetailCardProps> = ({ voter }) => {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none backdrop-blur-xl space-y-3.5">
      <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <HeartHandshake className="w-4 h-4" />
        <span>Demographics & Personal Details</span>
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">Gender</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs block truncate">{voter.gender || '-'}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">Age</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs block truncate">
            {voter.age ? `${voter.age} Years` : '-'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">Blood Group</span>
          <span className="font-semibold text-rose-600 dark:text-rose-400 text-xs block truncate">{voter.bloodGroup || '-'}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">Date of Birth</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs block truncate">{formatDob(voter.dob)}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">Religion</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs block truncate">{voter.religionName || '-'}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">Caste</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs block truncate">{voter.casteName || '-'}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">Sub-Caste</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs block truncate">{voter.subcasteName || '-'}</span>
        </div>
      </div>
    </div>
  );
};

export default VoterDemographicsDetailCard;
