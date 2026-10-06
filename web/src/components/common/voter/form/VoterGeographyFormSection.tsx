import React from 'react';
import { MapPin } from 'lucide-react';
import SectionContainer from '../SectionContainer';
import FormInput from '@/components/common/FormInput';
import type { Option } from '@/components/common/FormInput';
import { useTenantMasterData } from '@/hooks/useTenantMasterData';

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
}) => {
  const { talukas, villages } = useTenantMasterData(['talukas', 'villages']);

  // Suggestions: district-matched talukas appear first, then all others — deduplicated so no duplicates appear
  const talukaSuggestions = React.useMemo(() => {
    if (!formData.districtId) {
      return Array.from(new Set(talukas.map((t: any) => t.name).filter(Boolean)));
    }
    const districtMatches = talukas.filter((t: any) => t.districtId === formData.districtId).map((t: any) => t.name);
    const others = talukas.filter((t: any) => t.districtId !== formData.districtId).map((t: any) => t.name);
    return Array.from(new Set([...districtMatches, ...others].filter(Boolean)));
  }, [talukas, formData.districtId]);

  const villageSuggestions = React.useMemo(() => {
    if (!formData.districtId) {
      return Array.from(new Set(villages.map((v: any) => v.name).filter(Boolean)));
    }
    const districtMatches = villages.filter((v: any) => v.districtId === formData.districtId).map((v: any) => v.name);
    const others = villages.filter((v: any) => v.districtId !== formData.districtId).map((v: any) => v.name);
    return Array.from(new Set([...districtMatches, ...others].filter(Boolean)));
  }, [villages, formData.districtId]);

  return (
    <SectionContainer
      icon={<MapPin size={18} />}
      iconBg="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
      title="Electoral Geography & Full Addresses"
      subtitle="Booth station, Taluka, Village, and voting addresses"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FormInput
          label="State"
          type="select"
          name="stateId"
          value={formData.stateId}
          onChange={handleChange}
          options={[{ label: 'Select State', value: '' }, ...stateOptions]}
        />

        <FormInput
          label="District"
          type="select"
          name="districtId"
          value={formData.districtId}
          onChange={handleChange}
          options={[{ label: 'Select District', value: '' }, ...districtOptions]}
        />

        <FormInput
          label="Parliamentary Constituency (PC)"
          type="select"
          name="pcId"
          value={formData.pcId}
          onChange={handleChange}
          options={[{ label: 'Select PC', value: '' }, ...pcOptions]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FormInput
          label="Assembly Constituency (AC)"
          type="select"
          name="acId"
          value={formData.acId}
          onChange={handleChange}
          options={[{ label: 'Select AC', value: '' }, ...acOptions]}
        />

        <FormInput
          label="Polling Station / Booth"
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
          placeholder="House / Flat / Door No."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          label="Taluka / Tehsil"
          value={formData.taluka}
          onChange={handleChange}
          placeholder="Select or type Taluka"
          suggestions={talukaSuggestions}
        />

        <FormInput
          name="village"
          type="autocomplete"
          label="Village / Locality"
          value={formData.village}
          onChange={handleChange}
          placeholder="Select or type Village"
          suggestions={villageSuggestions}
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
