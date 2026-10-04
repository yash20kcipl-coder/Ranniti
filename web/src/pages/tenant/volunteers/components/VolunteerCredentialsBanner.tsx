import React, { useState } from 'react';
import { Sparkles, Copy, Check, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface VolunteerCredentialsBannerProps {
  credentials: {
    name: string;
    mobile: string;
    defaultPassword?: string;
  };
  onDismiss: () => void;
}

export const VolunteerCredentialsBanner: React.FC<VolunteerCredentialsBannerProps> = ({
  credentials,
  onDismiss,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `Namaste ${credentials.name} ji,\nYour Ranniti Mobile Field App login:\n• Mobile: ${credentials.mobile}\n• Password: ${credentials.defaultPassword}\nPlease download the Ranniti Mobile App to start booth campaigning.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Namaste ${credentials.name} ji,\n\nYour Ranniti Mobile Field App login credentials are:\n📱 Mobile: ${credentials.mobile}\n🔑 Password: ${credentials.defaultPassword}\n\nPlease log into the Ranniti Mobile App to access your assigned polling booths and voter search.`
    );
    window.open(`https://wa.me/91${credentials.mobile}?text=${text}`, '_blank');
  };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-300 dark:border-emerald-800/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
          <Sparkles size={20} />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            Volunteer Successfully Onboarded: {credentials.name}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-3 mt-0.5">
            <span>
              Mobile: <strong className="font-mono">{credentials.mobile}</strong>
            </span>
            <span>
              Default Password:{' '}
              <strong className="font-mono bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded text-emerald-800 dark:text-emerald-200">
                {credentials.defaultPassword}
              </strong>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all shadow-sm"
        >
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy Credentials'}
        </button>
        <button
          onClick={handleShareWhatsApp}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Share2 size={14} /> Share on WhatsApp
        </button>
        <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 text-sm px-1.5">
          ✕
        </button>
      </div>
    </div>
  );
};
