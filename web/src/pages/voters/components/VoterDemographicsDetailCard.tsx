import React from 'react';
import { HeartHandshake } from 'lucide-react';

export interface VoterDemographicsDetailCardProps {
  voter: any;
}

export const VoterDemographicsDetailCard: React.FC<VoterDemographicsDetailCardProps> = ({ voter }) => {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none backdrop-blur-xl space-y-4">
      <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <HeartHandshake className="w-4 h-4" />
        <span>Demographics & Personal Details</span>
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400 block mb-1">Gender</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">{voter.gender || '-'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400 block mb-1">Age</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">
            {voter.age ? `${voter.age} Years` : '-'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400 block mb-1">Blood Group</span>
          <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">{voter.bloodGroup || '-'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400 block mb-1">Date of Birth</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">{voter.dob || '-'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400 block mb-1">Religion</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">{voter.religionName || '-'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400 block mb-1">Caste & Category</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">{voter.casteName || '-'}</span>
        </div>
      </div>
    </div>
  );
};

export default VoterDemographicsDetailCard;
