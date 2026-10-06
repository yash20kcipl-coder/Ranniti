import React from 'react';
import { Phone } from 'lucide-react';
import SectionContainer from '../SectionContainer';
import FormInput from '@/components/common/FormInput';
import type { Option } from '@/components/common/FormInput';

export interface VoterDemographicsFormSectionProps {
  formData: any;
  religionSuggestions?: string[];
  casteSuggestions?: string[];
  subcasteSuggestions?: string[];
  casteOptions?: Option[];
  religionOptions?: Option[];
  errors: Record<string, string>;
  handleChange: (e: any) => void;
}

export const VoterDemographicsFormSection: React.FC<VoterDemographicsFormSectionProps> = ({
  formData,
  errors,
  handleChange,
  religionSuggestions = [],
  casteSuggestions = [],
  subcasteSuggestions = [],
  religionOptions = [],
  casteOptions = [],
}) => {
  // Resolve unique autocomplete suggestion lists
  const resolvedReligionSuggestions = React.useMemo(() => {
    if (religionSuggestions.length > 0) return religionSuggestions;
    return Array.from(new Set(
      religionOptions
        .map((o) => o.label)
        .filter((l) => l && !l.toLowerCase().startsWith('select '))
    ));
  }, [religionSuggestions, religionOptions]);

  const resolvedCasteSuggestions = React.useMemo(() => {
    if (casteSuggestions.length > 0) return casteSuggestions;
    return Array.from(new Set(
      casteOptions
        .map((o) => o.label)
        .filter((l) => l && !l.toLowerCase().startsWith('select '))
    ));
  }, [casteSuggestions, casteOptions]);

  const resolvedSubcasteSuggestions = React.useMemo(() => {
    return Array.from(new Set((subcasteSuggestions || []).filter(Boolean)));
  }, [subcasteSuggestions]);

  // Current display values with fallbacks to mapped labels
  const religionDisplayValue =
    formData.religionName ||
    formData.religion ||
    religionOptions.find((r) => String(r.value) === String(formData.religionId))?.label ||
    '';

  const casteDisplayValue =
    formData.casteName ||
    formData.caste ||
    casteOptions.find((c) => String(c.value) === String(formData.casteId))?.label ||
    '';

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
          type="autocomplete"
          name="religion"
          value={religionDisplayValue}
          onChange={handleChange}
          placeholder="Select or type Religion"
          suggestions={resolvedReligionSuggestions}
          error={errors.religion || errors.religionId}
        />

        <FormInput
          label="Caste / Community"
          type="autocomplete"
          name="caste"
          value={casteDisplayValue}
          onChange={handleChange}
          placeholder="Select or type Caste"
          suggestions={resolvedCasteSuggestions}
          error={errors.caste || errors.casteId}
        />

        <FormInput
          label="Subcaste / Category"
          type="autocomplete"
          name="subcasteName"
          value={formData.subcasteName || ''}
          onChange={handleChange}
          placeholder="Select or type Subcaste"
          suggestions={resolvedSubcasteSuggestions}
          error={errors.subcasteName}
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
