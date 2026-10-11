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
      id="identity"
      icon={<IdCard size={18} />}
      iconBg="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
      title="Identification & Profile Status"
      subtitle="EPIC card number, voter photo, active status and personal names"
      action={
        <label
          htmlFor="isDeadSwitch"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none text-xs font-semibold ${formData.isDead
            ? 'bg-rose-100 dark:bg-rose-950/70 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 shadow-xs'
            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
        >
          <AlertTriangle
            size={14}
            className={formData.isDead ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}
          />
          <span>Mark as Deceased</span>
          <input
            id="isDeadSwitch"
            type="checkbox"
            name="isDead"
            checked={Boolean(formData.isDead)}
            onChange={handleChange}
            className="sr-only"
          />
          <div
            className={`w-7 h-4 rounded-full transition-colors relative flex items-center p-0.5 ${formData.isDead ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white transition-transform shadow-xs ${formData.isDead ? 'translate-x-3' : 'translate-x-0'
                }`}
            />
          </div>
        </label>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-stretch">
        {/* Single Integrated Avatar Photo Uploader */}
        <div className="h-full flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
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

        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
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
            helperText={formData.age ? `Calculated Age: ${formData.age} yrs` : 'Auto-calculated from DOB'}
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

      {/* Bilingual Names Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* English Name Card */}
        <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">English Name</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
              EN
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormInput
              label="First Name"
              name="engFirstName"
              value={formData.engFirstName}
              onChange={handleChange}
              placeholder="First Name"
              required
              error={errors.engFirstName}
            />

            <FormInput
              label="Middle Name"
              name="engMiddleName"
              value={formData.engMiddleName}
              onChange={handleChange}
              placeholder="Middle Name"
            />

            <FormInput
              label="Surname / Last"
              name="engSurname"
              value={formData.engSurname}
              onChange={handleChange}
              placeholder="Surname"
            />
          </div>
        </div>

        {/* Regional / Hindi Name Card */}
        <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">Regional / Local Name</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40">
              हिन्दी / Local
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormInput
              label="First Name (Local)"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="प्रथम नाम"
            />

            <FormInput
              label="Middle Name (Local)"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              placeholder="मध्य नाम"
            />

            <FormInput
              label="Surname (Local)"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              placeholder="उपनाम"
            />
          </div>
        </div>
      </div>

      {/* Identity Documents Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
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
