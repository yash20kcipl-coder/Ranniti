import React from 'react';
import { CreditCard } from 'lucide-react';
import { SafeImage } from '@/components/common/SafeImage';

export interface VoterProfileDetailCardProps {
  voter: any;
  engFullName: string;
  localFullName?: string;
}

export const VoterProfileDetailCard: React.FC<VoterProfileDetailCardProps> = ({
  voter,
  engFullName,
  localFullName,
}) => {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none backdrop-blur-xl text-center space-y-4">
      <div className="w-28 h-28 mx-auto rounded-2xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-500/30 shadow-md dark:shadow-2xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center relative">
        <SafeImage
          src={voter.avatar}
          alt={engFullName}
          fallbackText={engFullName}
          className="w-full h-full object-cover"
        />
        {voter.bloodGroup && (
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] shadow">
            {voter.bloodGroup}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{engFullName}</h2>
        {localFullName && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{localFullName}</p>}
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 font-mono text-sm font-bold">
        <CreditCard className="w-4 h-4" />
        <span>{voter.epicNo}</span>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3 text-left text-xs">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
          <span className="text-slate-500 dark:text-slate-400 block mb-1">Serial Number</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">#{voter.serialNo || '-'}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
          <span className="text-slate-500 dark:text-slate-400 block mb-1">Section Number</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">#{voter.sectionNo || '-'}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 col-span-2">
          <span className="text-slate-500 dark:text-slate-400 block mb-1">House Number</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">{voter.houseNo || 'Not specified'}</span>
        </div>
      </div>
    </div>
  );
};

export default VoterProfileDetailCard;
