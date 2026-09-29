import React from 'react';
import { Building2, MapPin, Vote } from 'lucide-react';

export interface VoterGeographyDetailCardProps {
  voter: any;
}

export const VoterGeographyDetailCard: React.FC<VoterGeographyDetailCardProps> = ({ voter }) => {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none backdrop-blur-xl space-y-4">
      <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <Building2 className="w-4 h-4" />
        <span>Electoral Geography & Polling Booth</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Polling Booth</span>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{voter.boothName || 'Unassigned'}</p>
          {voter.boothNumber && (
            <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 font-semibold text-[11px]">
              Booth #{voter.boothNumber}
            </span>
          )}
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Assembly Constituency (AC)</span>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{voter.acName || 'Not Assigned'}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Parliamentary Constituency (PC)</span>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{voter.pcName || 'Not Assigned'}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Taluka & Village</span>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {[voter.village, voter.taluka].filter(Boolean).join(', ') || 'Not Specified'}
          </p>
        </div>
      </div>

      {/* Address Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Permanent Full Address
          </span>
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            {voter.fullAddress || 'Not specified'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <Vote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Electoral Roll Address
          </span>
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            {voter.voterAddress || 'Same as permanent address'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoterGeographyDetailCard;
