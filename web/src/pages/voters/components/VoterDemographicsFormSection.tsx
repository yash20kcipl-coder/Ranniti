import React from 'react';
import { Phone } from 'lucide-react';
import SectionContainer from './SectionContainer';
import FormInput from '../../../components/common/FormInput';
import type { Option } from '../../../components/common/FormInput';

export interface VoterDemographicsFormSectionProps {
  formData: any;
  casteOptions: Option[];
  religionOptions: Option[];
  errors: Record<string, string>;
  handleChange: (e: any) => void;
}

export const VoterDemographicsFormSection: React.FC<VoterDemographicsFormSectionProps> = ({
  formData,
  errors,
  handleChange,
  religionOptions,
  casteOptions,
}) => {
  return (
    <SectionContainer
      icon={<Phone size={18} />}
      iconBg="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400"
      title="Contact & Socio-Cultural Background"
      subtitle="Mobile, Email, Religion, Caste, and Profession"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Mobile Phone Number"
          type="tel"
          name="mobileNo"
          value={formData.mobileNo}
          onChange={handleChange}
          placeholder="10-digit mobile number"
          error={errors.mobileNo}
        />

        <FormInput
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="voter@domain.com"
          error={errors.email}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormInput
          label="Religion"
          type="select"
          name="religionId"
          value={formData.religionId}
          onChange={handleChange}
          options={[{ label: 'Select Religion', value: '' }, ...religionOptions]}
        />

        <FormInput
          label="Caste / Community"
          type="select"
          name="casteId"
          value={formData.casteId}
          onChange={handleChange}
          options={[{ label: 'Select Caste', value: '' }, ...casteOptions]}
        />

        <FormInput
          label="Subcaste / Category"
          name="subcasteName"
          value={formData.subcasteName}
          onChange={handleChange}
          placeholder="e.g. Deshastha, Maratha"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Profession Category"
          name="professionType"
          value={formData.professionType}
          onChange={handleChange}
          placeholder="e.g. Government, Business, Student, Retired"
        />

        <FormInput
          label="Specific Profession / Occupation"
          name="profession"
          value={formData.profession}
          onChange={handleChange}
          placeholder="e.g. High School Teacher, Civil Engineer"
        />
      </div>
    </SectionContainer>
  );
};

export default VoterDemographicsFormSection;
