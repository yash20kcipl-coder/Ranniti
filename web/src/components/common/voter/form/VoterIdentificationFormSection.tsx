import React from 'react';
import SectionContainer from '../SectionContainer';
import { IdCard, AlertTriangle } from 'lucide-react';
import FormInput from '@/components/common/FormInput';
import type { Option } from '@/components/common/FormInput';
import { FileUploadInput } from '@/components/common/FileUploadInput';

export interface VoterIdentificationFormSectionProps {
  formData: any;
  statusOptions: Option[];
  genderOptions: Option[];
  voterTypeOptions: Option[];
  bloodGroupOptions: Option[];
  errors: Record<string, string>;
  handleChange: (e: any) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export const VoterIdentificationFormSection: React.FC<VoterIdentificationFormSectionProps> = ({
  formData,
  errors,
  handleChange,
  setFormData,
  statusOptions,
  voterTypeOptions,
  genderOptions,
  bloodGroupOptions,
}) => {
  return (
    <SectionContainer
      icon={<IdCard size={18} />}
      iconBg="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
      title="Identification & Profile Status"
      subtitle="EPIC card number, voter photo, and active status"
      action={
        <label
          htmlFor="isDeadSwitch"
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer select-none ${formData.isDead
            ? 'bg-rose-100 dark:bg-rose-950/70 border-rose-300 dark:border-rose-600/60 text-rose-800 dark:text-rose-200 shadow-xs'
            : 'bg-rose-50/70 dark:bg-slate-800/80 border-rose-200 dark:border-slate-700 text-rose-700 dark:text-rose-300 hover:bg-rose-100/60 dark:hover:bg-slate-800'
            }`}
        >
          <AlertTriangle
            size={14}
            className={formData.isDead ? 'text-rose-600 dark:text-rose-400' : 'text-rose-500/80 dark:text-rose-400'}
          />
          <span className="text-xs font-semibold">Mark as Deceased</span>
          <input
            id="isDeadSwitch"
            type="checkbox"
            name="isDead"
            checked={formData.isDead}
            onChange={handleChange}
            className="sr-only"
          />
          <div
            className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center p-0.5 ${formData.isDead ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform shadow-xs ${formData.isDead ? 'translate-x-3.5' : 'translate-x-0'
                }`}
            />
          </div>
        </label>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        {/* Single Integrated Avatar Photo Uploader */}
        <div className="h-full flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
          <FileUploadInput
            variant="avatar"
            name="avatar"
            value={formData.avatar}
            fallbackText={`${formData.engFirstName?.slice(0, 1) || 'V'}${formData.engSurname?.slice(0, 1) || 'P'}`}
            category="avatars"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            allowedExtensions={['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']}
            maxSizeMB={5}
            onChange={(uploadedPath) => setFormData((prev: any) => ({ ...prev, avatar: uploadedPath }))}
          />
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            label="EPIC Number (Voter ID)"
            name="epicNo"
            value={formData.epicNo}
            onChange={handleChange}
            placeholder="e.g. ABC1234567"
            required
            error={errors.epicNo}
          />

          <FormInput
            label="Voter Status"
            type="select"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={statusOptions}
          />

          <FormInput
            label="Voter Category / Type"
            type="select"
            name="voterType"
            value={formData.voterType}
            onChange={handleChange}
            options={voterTypeOptions}
          />

          <FormInput
            label="Gender"
            type="select"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            options={genderOptions}
          />

          <FormInput
            label="Date of Birth"
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            helperText={formData.age ? `Auto-calculated Age: ${formData.age} yrs` : 'Age is calculated automatically'}
          />

          <FormInput
            label="Blood Group"
            type="select"
            name="bloodGroup"
            value={formData.bloodGroup}
            onChange={handleChange}
            options={bloodGroupOptions}
          />
        </div>
      </div>

      {/* English Name Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormInput
          label="First Name (English)"
          name="engFirstName"
          value={formData.engFirstName}
          onChange={handleChange}
          placeholder="First Name in English"
          required
          error={errors.engFirstName}
        />

        <FormInput
          label="Middle Name (English)"
          name="engMiddleName"
          value={formData.engMiddleName}
          onChange={handleChange}
          placeholder="Middle Name in English"
        />

        <FormInput
          label="Surname / Last Name (English)"
          name="engSurname"
          value={formData.engSurname}
          onChange={handleChange}
          placeholder="Surname in English"
        />
      </div>

      {/* Local / Vernacular Language Name Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormInput
          label="First Name (Hindi / Local)"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="प्रथम नाम (हिन्दी)"
        />

        <FormInput
          label="Middle Name (Hindi / Local)"
          name="middleName"
          value={formData.middleName}
          onChange={handleChange}
          placeholder="मध्य नाम (हिन्दी)"
        />

        <FormInput
          label="Surname (Hindi / Local)"
          name="surname"
          value={formData.surname}
          onChange={handleChange}
          placeholder="उपनाम (हिन्दी)"
        />
      </div>

      {/* Identity Documents Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormInput
          label="Aadhaar Card Number"
          name="aadhaarNo"
          value={formData.aadhaarNo}
          onChange={handleChange}
          placeholder="12-digit Aadhaar Number"
        />

        <FormInput
          label="PAN Card Number"
          name="panNo"
          value={formData.panNo}
          onChange={handleChange}
          placeholder="10-digit PAN Number"
        />
      </div>
    </SectionContainer>
  );
};

export default VoterIdentificationFormSection;
