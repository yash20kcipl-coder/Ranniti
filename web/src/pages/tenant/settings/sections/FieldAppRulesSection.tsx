import React from 'react';
import { FormInput } from '@/components/common/FormInput';
import { Smartphone, MapPin, WifiOff, PhoneCall, Camera } from 'lucide-react';
import type { CampaignSettings, FieldRulesConfig } from '../types/settings.types';

interface FieldAppRulesSectionProps {
  settings: CampaignSettings;
  onChange: (updated: Partial<CampaignSettings>) => void;
}

export const FieldAppRulesSection: React.FC<FieldAppRulesSectionProps> = ({
  settings,
  onChange,
}) => {
  const updateRule = (field: keyof FieldRulesConfig, value: any) => {
    onChange({
      fieldRules: {
        ...settings.fieldRules,
        [field]: value,
      },
    });
  };

  const { fieldRules } = settings;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Field Worker & Survey App Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rules, geofencing validations, and survey constraints enforced on the Karyakarta Mobile App
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        {/* Rule 1: Geofencing */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                GPS Geofencing Verification
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Requires the karyakarta's physical GPS coordinates to be within the booth radius before submitting a door-to-door survey.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {fieldRules.geofencingEnabled && (
              <div className="w-32">
                <FormInput
                  name="geofence_radius"
                  type="number"
                  placeholder="200"
                  value={fieldRules.geofenceRadiusMeters}
                  onChange={(e) => updateRule('geofenceRadiusMeters', Number((e.target as any)?.value ?? e))}
                  helperText="Radius (meters)"
                />
              </div>
            )}
            <FormInput
              name="geofence_toggle"
              type="switch"
              value={fieldRules.geofencingEnabled}
              onChange={(e) => updateRule('geofencingEnabled', (e.target as any)?.value ?? e)}
            />
          </div>
        </div>

        {/* Rule 2: Offline Sync */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mt-0.5">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Offline Survey Mode & Local SQLite Caching
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Allows field workers in rural booths with patchy connectivity to record surveys locally and auto-sync when online.
              </p>
            </div>
          </div>

          <div className="self-end sm:self-center">
            <FormInput
              name="offline_sync_toggle"
              type="switch"
              value={fieldRules.offlineSyncAllowed}
              onChange={(e) => updateRule('offlineSyncAllowed', (e.target as any)?.value ?? e)}
            />
          </div>
        </div>

        {/* Rule 3: Mandatory Mobile Number */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mt-0.5">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Mandatory Mobile Number Collection
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Block survey submission unless at least 1 valid mobile number is entered for the voter family.
              </p>
            </div>
          </div>

          <div className="self-end sm:self-center">
            <FormInput
              name="mandatory_mobile_toggle"
              type="switch"
              value={fieldRules.mandatoryMobile}
              onChange={(e) => updateRule('mandatoryMobile', (e.target as any)?.value ?? e)}
            />
          </div>
        </div>

        {/* Rule 4: Photo Capture */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mt-0.5">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Enable Voter / House Photo Capture
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enables camera capture in the field app to record house number or voter portrait with consent.
              </p>
            </div>
          </div>

          <div className="self-end sm:self-center">
            <FormInput
              name="photo_capture_toggle"
              type="switch"
              value={fieldRules.allowPhotoCapture}
              onChange={(e) => updateRule('allowPhotoCapture', (e.target as any)?.value ?? e)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldAppRulesSection;
