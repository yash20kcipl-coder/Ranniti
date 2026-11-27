import React from 'react';
import { MapPin } from 'lucide-react';
import SectionContainer from '../SectionContainer';
import FormInput from '@/components/common/FormInput';
import type { Option } from '@/components/common/FormInput';
import { useAppSelector } from '@/redux/hooks';

export interface VoterGeographyFormSectionProps {
  formData: any;
  pcOptions: Option[];
  acOptions: Option[];
  sameAddress: boolean;
  boothOptions: Option[];
  stateOptions: Option[];
  districtOptions: Option[];
  errors: Record<string, string>;
  handleChange: (e: any) => void;
  handleSameAddressToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disableGeography?: boolean;
  talukas?: any[];
  villages?: any[];
  onSearchTalukas?: (query: string) => Promise<any[]>;
  onSearchVillages?: (query: string) => Promise<any[]>;
  onSelectTaluka?: (taluka: any) => void;
  onSelectVillage?: (village: any) => void;
}

export const VoterGeographyFormSection: React.FC<VoterGeographyFormSectionProps> = ({
  formData,
  errors,
  handleChange,
  stateOptions,
  districtOptions,
  pcOptions,
  acOptions,
  boothOptions,
  sameAddress,
  handleSameAddressToggle,
  disableGeography = false,
  talukas,
  villages,
  onSearchTalukas,
  onSearchVillages,
  onSelectTaluka,
  onSelectVillage,
}) => {
  const master = useAppSelector((state) => state.master);
  const activeTalukas = talukas || master.talukas || [];
  const activeVillages = villages || master.villages || [];

  // Suggestions: district-matched talukas strictly when districtId is set
  const talukaSuggestions = React.useMemo(() => {
    if (!formData.districtId) {
      return Array.from(new Set(activeTalukas.map((t: any) => t.name).filter(Boolean)));
    }
    return Array.from(
      new Set(
        activeTalukas
          .filter((t: any) => String(t.districtId) === String(formData.districtId))
          .map((t: any) => t.name)
          .filter(Boolean)
      )
    );
  }, [activeTalukas, formData.districtId]);

  // Suggestions: prioritize district/taluka matched villages, but keep all active villages as fallback
  const villageSuggestions = React.useMemo(() => {
    if (formData.taluka) {
      const trimmedTaluka = String(formData.taluka).trim().toLowerCase();
      const matchedTaluka = activeTalukas.find(
        (t: any) => (t.name || '').trim().toLowerCase() === trimmedTaluka
      );
      const filtered = activeVillages.filter((v: any) => {
        if (matchedTaluka && (v.talukaId || v.taluka_id)) {
          return String(v.talukaId || v.taluka_id) === String(matchedTaluka.id);
        }
        return (v.talukaName || v.taluka_name || '').trim().toLowerCase() === trimmedTaluka;
      });
      if (filtered.length > 0) {
        return Array.from(new Set(filtered.map((v: any) => v.name).filter(Boolean)));
      }
    }

    if (formData.districtId) {
      const filtered = activeVillages.filter((v: any) => String(v.districtId || v.district_id) === String(formData.districtId));
      if (filtered.length > 0) {
        return Array.from(new Set(filtered.map((v: any) => v.name).filter(Boolean)));
      }
    }

    return Array.from(new Set(activeVillages.map((v: any) => v.name).filter(Boolean)));
  }, [activeVillages, activeTalukas, formData.taluka, formData.districtId]);

  return (
    <SectionContainer
      id="geography"
      icon={<MapPin size={18} />}
      iconBg="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
      title="Electoral Geography & Full Addresses"
      subtitle="Booth station, Taluka, Village, and voting addresses"
    >
      {disableGeography && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/50 text-xs text-indigo-700 dark:text-indigo-300">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
          <span>
            <strong>Tenant Scope Locked:</strong> State, District, and PC are automatically assigned from your tenant campaign scope.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <FormInput
          label="State"
          type="select"
          name="stateId"
          value={formData.stateId}
          onChange={handleChange}
          options={[{ label: 'Select State', value: '' }, ...stateOptions]}
          disabled={disableGeography}
          helperText={disableGeography ? 'Locked to tenant state' : undefined}
        />

        <FormInput
          label="District"
          type="select"
          name="districtId"
          value={formData.districtId}
          onChange={handleChange}
          options={[{ label: 'Select District', value: '' }, ...districtOptions]}
          disabled={disableGeography}
          helperText={disableGeography ? 'Locked to constituency district' : undefined}
        />

        <FormInput
          label="Parliamentary Constituency (PC)"
          type="select"
          name="pcId"
          value={formData.pcId}
          onChange={handleChange}
          options={[{ label: 'Select PC', value: '' }, ...pcOptions]}
          disabled={disableGeography}
          helperText={disableGeography ? 'Locked to assigned PC' : undefined}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <FormInput
          label="Assembly Constituency (AC)"
          type="select"
          name="acId"
          value={formData.acId}
          onChange={handleChange}
          options={[...(acOptions.length === 1 ? [] : [{ label: 'Select AC', value: '' }]), ...acOptions]}
        />

        <FormInput
          label="Polling Booth"
          type="select"
          name="boothId"
          value={formData.boothId}
          onChange={handleChange}
          options={[{ label: 'Select Polling Station', value: '' }, ...boothOptions]}
          required
          error={errors.boothId}
        />

        <FormInput
          label="House Number"
          name="houseNo"
          value={formData.houseNo}
          onChange={handleChange}
          placeholder="House Number"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <FormInput
          label="Voter Serial Number"
          type="number"
          name="serialNo"
          value={formData.serialNo}
          onChange={handleChange}
          placeholder="e.g. 452"
        />

        <FormInput
          label="Section Number"
          type="number"
          name="sectionNo"
          value={formData.sectionNo}
          onChange={handleChange}
          placeholder="e.g. 1"
        />

        <FormInput
          name="taluka"
          type="autocomplete"
          label="Taluka"
          value={formData.taluka}
          onChange={handleChange}
          placeholder="Select or type Taluka"
          suggestions={talukaSuggestions}
          onRemoteSearch={onSearchTalukas}
          onSelectDetailed={onSelectTaluka}
        />

        <FormInput
          name="village"
          type="autocomplete"
          label="Village"
          value={formData.village}
          onChange={handleChange}
          placeholder="Select or type Village"
          suggestions={villageSuggestions}
          onRemoteSearch={onSearchVillages}
          onSelectDetailed={onSelectVillage}
        />
      </div>

      {/* Address Blocks */}
      <div className="space-y-4">
        <FormInput
          type="textarea"
          label="Permanent Full Address"
          name="fullAddress"
          rows={2}
          value={formData.fullAddress}
          onChange={handleChange}
          placeholder="Enter complete permanent residential address"
        />

        <FormInput
          type="textarea"
          label="Electoral Roll Voting Address"
          name="voterAddress"
          rows={2}
          value={formData.voterAddress}
          disabled={sameAddress}
          onChange={handleChange}
          placeholder="Enter voting address as listed on electoral roll"
          labelRightAction={
            <label className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer font-normal">
              <input
                type="checkbox"
                checked={sameAddress}
                onChange={handleSameAddressToggle}
                className="w-3.5 h-3.5 rounded accent-indigo-600 dark:accent-indigo-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
              />
              <span>Same as Permanent Full Address</span>
            </label>
          }
        />
      </div>
    </SectionContainer>
  );
};

export default VoterGeographyFormSection;
