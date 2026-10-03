import {
  MessageSquare,
  ShieldCheck,
  Send,
  Zap,
  Globe,
  Layers,
} from 'lucide-react';
import React from 'react';
import { FormInput } from '@/components/common/FormInput';
import type { CampaignSettings } from '@/types/settings.types';

interface WhatsAppConfigSectionProps {
  settings: CampaignSettings;
  onChange: (updated: Partial<CampaignSettings>) => void;
  onOpenTestSend: () => void;
}

export const WhatsAppConfigSection: React.FC<WhatsAppConfigSectionProps> = ({
  settings,
  onChange,
  onOpenTestSend,
}) => {
  const safeSettings = settings || ({} as CampaignSettings);
  const isConfigured = Boolean(
    safeSettings.whatsappWabaId && safeSettings.whatsappPhoneNumberId && safeSettings.whatsappAccessToken
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Meta WhatsApp Cloud API Configuration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct connection to Meta Graph API for official verified voter communications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              API Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Setup Incomplete
            </span>
          )}

          <button
            type="button"
            onClick={onOpenTestSend}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Test Message</span>
          </button>
        </div>
      </div>

      {/* Health & Tier Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Quality Rating</p>
            <h4 className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {safeSettings.whatsappQualityRating || 'GREEN (High Quality)'}
            </h4>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Daily Messaging Limit</p>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {safeSettings.whatsappDailyLimit || '10,000 Voters/Day'}
            </h4>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">API Version</p>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">v20.0 (Cloud API)</h4>
          </div>
        </div>
      </div>

      {/* Credentials Form Box */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          Meta Business Credentials
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            name="wa_phone_id"
            label="Phone Number ID"
            placeholder="e.g. 1092837465..."
            value={safeSettings.whatsappPhoneNumberId || ''}
            onChange={(e) => onChange({ whatsappPhoneNumberId: (e.target as any)?.value ?? e })}
            required
            helperText="Provided in Meta App Dashboard > WhatsApp > API Setup"
          />

          <FormInput
            name="wa_waba_id"
            label="WhatsApp Business Account (WABA) ID"
            placeholder="e.g. 2938475610..."
            value={safeSettings.whatsappWabaId || ''}
            onChange={(e) => onChange({ whatsappWabaId: (e.target as any)?.value ?? e })}
            required
            helperText="Found under Meta Business Settings > Accounts > WhatsApp Accounts"
          />

          <div className="sm:col-span-2">
            <FormInput
              name="wa_access_token"
              type="password"
              label="System User Permanent Access Token"
              placeholder="EAA..."
              value={safeSettings.whatsappAccessToken || ''}
              onChange={(e) => onChange({ whatsappAccessToken: (e.target as any)?.value ?? e })}
              required
              helperText="Generate a permanent token with whatsapp_business_messaging & whatsapp_business_management permissions"
            />
          </div>

          <div className="sm:col-span-2">
            <FormInput
              name="wa_verify_token"
              type="text"
              label="Webhook Verify Token (Secret)"
              placeholder="e.g. ranniti_webhook_secret_2026"
              value={safeSettings.whatsappWebhookVerifyToken || ''}
              onChange={(e) => onChange({ whatsappWebhookVerifyToken: (e.target as any)?.value ?? e })}
              helperText="Used to verify inbound delivery receipts & voter quick replies from Meta Webhooks"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConfigSection;
