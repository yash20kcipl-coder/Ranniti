import React from 'react';
import { MapPin } from 'lucide-react';
import SectionContainer from './SectionContainer';
import FormInput from '../../../components/common/FormInput';
import type { Option } from '../../../components/common/FormInput';

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          label="Taluka / Tehsil"
          name="taluka"
          value={formData.taluka}
          onChange={handleChange}
          placeholder="e.g. Haveli, Karjat"
        />

        <FormInput
          label="Village / Locality"
          name="village"
          value={formData.village}
          onChange={handleChange}
          placeholder="e.g. Wagholi, Rahata"
        />
      </div>

      {/* Address Blocks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Permanent Full Address</label>
        </div>
        <textarea
          name="fullAddress"
          rows={2}
          value={formData.fullAddress}
          onChange={handleChange}
          placeholder="Enter complete permanent residential address"
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-all"
        />

        <div className="flex items-center justify-between pt-2">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Electoral Roll Voting Address</label>
          <label className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer">
            <input
              type="checkbox"
              checked={sameAddress}
              onChange={handleSameAddressToggle}
              className="w-3.5 h-3.5 rounded accent-indigo-600 dark:accent-indigo-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
            />
            <span>Same as Permanent Full Address</span>
          </label>
        </div>
        <textarea
          name="voterAddress"
          rows={2}
          value={formData.voterAddress}
          disabled={sameAddress}
          onChange={handleChange}
          placeholder="Enter voting address as listed on electoral roll"
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
        />
      </div>
    </SectionContainer>
  );
};

export default VoterGeographyFormSection;
