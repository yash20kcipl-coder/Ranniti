import React from 'react';
import { Phone } from 'lucide-react';
import SectionContainer from '../SectionContainer';
import FormInput from '@/components/common/FormInput';
import type { Option } from '@/components/common/FormInput';
import { FORM_RELATION_OPTIONS } from '@/constants/dropdownOptions';
import { useAppSelector } from '@/redux/hooks';

export interface VoterDemographicsFormSectionProps {
  formData: any;
  religionSuggestions?: string[];
  casteSuggestions?: string[];
  subcasteSuggestions?: string[];
  casteOptions?: Option[];
  religionOptions?: Option[];
  relationOptions?: Option[];
  professionCategories?: any[];
  professions?: any[];
  errors: Record<string, string>;
  handleChange: (e: any) => void;
  onSearchProfessions?: (query: string) => Promise<any[]>;
  onSearchSubcastes?: (query: string) => Promise<any[]>;
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
  relationOptions = FORM_RELATION_OPTIONS,
  professionCategories,
  professions,
  onSearchProfessions,
  onSearchSubcastes,
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
    formData.religion ||
    formData.religionName ||
    religionOptions.find((r) => String(r.value) === String(formData.religionId))?.label ||
    '';

  const casteDisplayValue =
    formData.caste ||
    formData.casteName ||
    casteOptions.find((c) => String(c.value) === String(formData.casteId))?.label ||
    '';

  const master = useAppSelector((state) => state.master);
  const rawCategories = professionCategories || master.professionCategories || [];
  const rawProfessions = professions || master.professions || [];

  const professionCategorySuggestions = React.useMemo(() => {
    return rawCategories.map((c: any) => c.name).filter(Boolean);
  }, [rawCategories]);

  const specificProfessionSuggestions = React.useMemo(() => {
    if (formData.professionType) {
      const selectedCat = rawCategories.find(
        (c: any) => (c.name || '').toLowerCase() === String(formData.professionType).toLowerCase()
      );
      if (selectedCat) {
        return rawProfessions
          .filter((p: any) => String(p.categoryId) === String(selectedCat.id))
          .map((p: any) => p.name)
          .filter(Boolean);
      }
    }
    return rawProfessions.map((p: any) => p.name).filter(Boolean);
  }, [rawProfessions, rawCategories, formData.professionType]);

  return (
    <SectionContainer
      id="demographics"
      icon={<Phone size={18} />}
      iconBg="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400"
      title="Contact & Socio-Cultural Background"
      subtitle="Relative, Mobile, Email, Religion, Caste, and Profession"
    >
      {/* Relative Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <FormInput
          label="Relative Name"
          name="guardianName"
          value={formData.guardianName || ''}
          onChange={handleChange}
          placeholder="e.g. Ramesh Chandra Sharma"
        />

        <FormInput
          label="Relation Type"
          type="select"
          name="relation"
          value={formData.relation || ''}
          onChange={handleChange}
          options={relationOptions}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
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
          label="Caste"
          type="autocomplete"
          name="caste"
          value={casteDisplayValue}
          onChange={handleChange}
          placeholder="Select or type Caste"
          suggestions={resolvedCasteSuggestions}
          error={errors.caste || errors.casteId}
        />

        <FormInput
          label="Subcaste"
          type="autocomplete"
          name="subcasteName"
          value={formData.subcasteName || ''}
          onChange={handleChange}
          placeholder="Select or type Subcaste"
          suggestions={resolvedSubcasteSuggestions}
          error={errors.subcasteName}
          onRemoteSearch={onSearchSubcastes}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <FormInput
          label="Profession Category"
          type="autocomplete"
          name="professionType"
          value={formData.professionType || ''}
          onChange={handleChange}
          placeholder="e.g. Government, Healthcare, Education"
          suggestions={professionCategorySuggestions}
        />

        <FormInput
          label="Profession"
          type="autocomplete"
          name="profession"
          value={formData.profession || ''}
          onChange={handleChange}
          placeholder="e.g. High School Teacher, Civil Engineer"
          suggestions={specificProfessionSuggestions}
          onRemoteSearch={onSearchProfessions}
        />
      </div>
    </SectionContainer>
  );
};

export default VoterDemographicsFormSection;
