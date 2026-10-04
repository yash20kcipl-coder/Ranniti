import React from 'react';
import { Phone, Mail, ShieldCheck, Briefcase, FileText } from 'lucide-react';

export interface VoterContactKycDetailCardProps {
  voter: any;
}

export const VoterContactKycDetailCard: React.FC<VoterContactKycDetailCardProps> = ({ voter }) => {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none backdrop-blur-xl space-y-3.5">
      <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <Phone className="w-4 h-4" />
        <span>Contacts & Identification KYC</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shrink-0">
            <Phone className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Mobile Phone</span>
            {voter.mobileNo ? (
              <a
                href={`tel:${voter.mobileNo}`}
                className="font-semibold text-xs text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate block"
              >
                {voter.mobileNo}
              </a>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">Not provided</span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shrink-0">
            <Mail className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Email Address</span>
            <span className="font-semibold text-xs text-slate-900 dark:text-white truncate block">{voter.email || 'Not provided'}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Aadhaar Identification</span>
            <span className="font-mono font-semibold text-xs text-slate-900 dark:text-white truncate block">
              {voter.aadhaarNo || 'Not linked'}
            </span>
          </div>
        </div>

        {voter.panNo && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">PAN Identification</span>
              <span className="font-mono font-semibold text-xs text-slate-900 dark:text-white truncate block">
                {voter.panNo}
              </span>
            </div>
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 shrink-0">
            <Briefcase className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Profession & Type</span>
            <span className="font-semibold text-xs text-slate-900 dark:text-white truncate block">
              {[voter.professionType, voter.profession].filter(Boolean).join(' - ') || 'Not specified'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoterContactKycDetailCard;
