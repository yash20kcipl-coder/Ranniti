import React from 'react';
import { Phone, Mail, ShieldCheck, Briefcase } from 'lucide-react';

export interface VoterContactKycDetailCardProps {
  voter: any;
}

export const VoterContactKycDetailCard: React.FC<VoterContactKycDetailCardProps> = ({ voter }) => {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none backdrop-blur-xl space-y-4">
      <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <Phone className="w-4 h-4" />
        <span>Contacts & Identification KYC</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Mobile Phone</span>
            {voter.mobileNo ? (
              <a
                href={`tel:${voter.mobileNo}`}
                className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                {voter.mobileNo}
              </a>
            ) : (
              <span className="text-slate-400 dark:text-slate-500">Not provided</span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Email Address</span>
            <span className="font-bold text-slate-900 dark:text-white">{voter.email || 'Not provided'}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Aadhaar Identification</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {voter.aadhaarNo || 'Not linked'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Profession & Type</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {[voter.professionType, voter.profession].filter(Boolean).join(' - ') || 'Not specified'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoterContactKycDetailCard;
