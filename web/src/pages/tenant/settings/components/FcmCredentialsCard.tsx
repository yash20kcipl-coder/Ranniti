import {
  Bell,
  ShieldCheck,
  FileCode,
  Apple,
  ChevronDown,
  ChevronUp,
  Send,
} from 'lucide-react';
import React, { useState } from 'react';
import { FormInput } from '@/components/common/FormInput';
import type { CampaignSettings } from '../types/settings.types';
import { FileUploadInput } from '@/components/common/FileUploadInput';


interface FcmCredentialsCardProps {
  settings: CampaignSettings;
  onChange: (updatedFields: Partial<CampaignSettings>) => void;
  onOpenTestModal: () => void;
}

export const FcmCredentialsCard: React.FC<FcmCredentialsCardProps> = ({
  settings,
  onChange,
  onOpenTestModal,
}) => {
  const [isApnsOpen, setIsApnsOpen] = useState(false);
  const [jsonUploadError, setJsonUploadError] = useState<string | null>(null);

  // Parse dropped serviceAccountKey.json
  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setJsonUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.project_id) {
          throw new Error('Invalid serviceAccountKey.json: project_id not found.');
        }

        onChange({
          fcmProjectId: parsed.project_id || '',
          fcmClientEmail: parsed.client_email || '',
          fcmPrivateKey: parsed.private_key || '',
        });
      } catch (err: any) {
        setJsonUploadError(err?.message || 'Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const isConfigured = Boolean(settings.fcmProjectId && (settings.fcmPrivateKey || settings.fcmServerKey));

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Firebase Cloud Messaging (FCM)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gateway credentials for push notifications to Karyakarta Mobile App
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Gateway Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Credentials Required
            </span>
          )}

          <button
            type="button"
            onClick={onOpenTestModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>Test Ping</span>
          </button>
        </div>
      </div>

      {/* Quick Service Account JSON File Upload */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-indigo-500" />
            Auto-configure from Firebase `serviceAccountKey.json`
          </span>
          <span className="text-[11px] text-slate-400">Recommended</span>
        </div>

        <div className="flex items-center gap-3">
          <FileUploadInput
            name="serviceAccountKey"
            onChange={(val) => {
              if (val instanceof File) {
                const dummyEvent = { target: { files: [val] } } as any;
                handleJsonFileUpload(dummyEvent);
              }
            }}
            accept=".json,application/json"
            allowedExtensions={['.json']}
            maxSizeMB={2}
            placeholder="Upload serviceAccountKey.json"
          />
        </div>

        {jsonUploadError && (
          <p className="text-xs text-rose-600 font-medium">{jsonUploadError}</p>
        )}
      </div>

      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput
          name="fcm_project_id"
          type="text"
          label="Firebase Project ID"
          placeholder="e.g. ranniti-election-app"
          value={settings.fcmProjectId || ''}
          onChange={(e) => onChange({ fcmProjectId: (e.target as any)?.value ?? e })}
          required
        />

        <FormInput
          name="fcm_client_email"
          type="email"
          label="Firebase Service Account Client Email"
          placeholder="e.g. firebase-adminsdk-xyz@...iam.gserviceaccount.com"
          value={settings.fcmClientEmail || ''}
          onChange={(e) => onChange({ fcmClientEmail: (e.target as any)?.value ?? e })}
        />

        <div className="sm:col-span-2">
          <FormInput
            name="fcm_private_key"
            type="password"
            label="Service Account Private Key"
            placeholder="-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----"
            value={settings.fcmPrivateKey || ''}
            onChange={(e) => onChange({ fcmPrivateKey: (e.target as any)?.value ?? e })}
            helperText="Stored securely in encrypted vault for push notification dispatch"
          />
        </div>

        <div className="sm:col-span-2">
          <FormInput
            name="fcm_server_key"
            type="password"
            label="Legacy FCM Server Key (Optional Fallback)"
            placeholder="AIzaSy..."
            value={settings.fcmServerKey || ''}
            onChange={(e) => onChange({ fcmServerKey: (e.target as any)?.value ?? e })}
          />
        </div>
      </div>

      {/* Apple APNs (iOS Field App) Accordion */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setIsApnsOpen(!isApnsOpen)}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Apple className="w-4 h-4 text-slate-800 dark:text-slate-100" />
            <span>Apple Push Notification service (APNs for iOS Karyakartas)</span>
          </div>
          {isApnsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {isApnsOpen && (
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              name="apns_team_id"
              label="Apple Team ID"
              placeholder="e.g. 10-character Team ID"
              value={settings.apnsTeamId || ''}
              onChange={(e) => onChange({ apnsTeamId: (e.target as any)?.value ?? e })}
            />

            <FormInput
              name="apns_key_id"
              label="Apple Key ID"
              placeholder="e.g. 10-character Key ID"
              value={settings.apnsKeyId || ''}
              onChange={(e) => onChange({ apnsKeyId: (e.target as any)?.value ?? e })}
            />

            <FormInput
              name="apns_bundle_id"
              label="iOS Bundle Identifier"
              placeholder="e.g. com.ranniti.karyakarta"
              value={settings.apnsBundleId || ''}
              onChange={(e) => onChange({ apnsBundleId: (e.target as any)?.value ?? e })}
            />

            <FormInput
              name="apns_auth_key"
              type="password"
              label="Apple Auth Key (.p8 contents)"
              placeholder="-----BEGIN PRIVATE KEY-----"
              value={settings.apnsAuthKey || ''}
              onChange={(e) => onChange({ apnsAuthKey: (e.target as any)?.value ?? e })}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FcmCredentialsCard;
