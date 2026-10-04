import React from 'react';
import { Flag } from 'lucide-react';
import { SafeImage } from '@/components/common/SafeImage';

export interface VoterAffiliationDetailCardProps {
  voter: any;
}

export const VoterAffiliationDetailCard: React.FC<VoterAffiliationDetailCardProps> = ({ voter }) => {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-3">
      <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
        <Flag className="w-4 h-4" />
        <span>Political & Campaign Affiliation</span>
      </h3>

      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <SafeImage
          src={voter.partySymbol}
          alt={voter.partyName || 'Party Logo'}
          fallbackText={voter.partyName || 'P'}
          className="w-9 h-9 rounded-lg object-contain bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Political Party</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate block">
            {voter.partyName || 'Independent / None'}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-xs pt-1">
        <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800/80">
          <span className="text-slate-500 dark:text-slate-400">Voter Category</span>
          <span className="font-semibold text-amber-700 dark:text-amber-400">{voter.voterType || 'Voter'}</span>
        </div>
        <div className="flex justify-between py-1.5">
          <span className="text-slate-500 dark:text-slate-400">Organization Scope</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{voter.organizationName || 'Default'}</span>
        </div>
      </div>
    </div>
  );
};

export default VoterAffiliationDetailCard;
