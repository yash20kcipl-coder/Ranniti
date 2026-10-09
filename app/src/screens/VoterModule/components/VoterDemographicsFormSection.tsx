import React from 'react';
import { Theme } from '../../../constants/theme';
import { rfValue } from '../../../utils/responsive';
import { View, Text, StyleSheet } from 'react-native';
import { FontFamily } from '../../../utils/typography';
import { AppTextInput } from '../../../components/AppTextInput';
import { AppDropdown, DropdownOption } from '../../../components/AppDropdown';
import { AppAutocompleteInput } from '../../../components/AppAutocompleteInput';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

export interface VoterDemographicsFormSectionProps {
  formData: any;
  errors: Record<string, string>;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  t: (key: any) => string;
  theme: Theme;
  religionOptions: DropdownOption[];
  casteOptions: DropdownOption[];
  canEditDemographics: boolean;
  canEditContact: boolean;
  subcasteSuggestions?: string[];
  religionSuggestions?: string[];
  casteSuggestions?: string[];
}

export const VoterDemographicsFormSection: React.FC<VoterDemographicsFormSectionProps> = ({
  formData,
  errors,
  setFormData,
  t,
  theme,
  religionOptions,
  casteOptions,
  canEditDemographics,
  canEditContact,
  subcasteSuggestions = [],
  religionSuggestions = [],
  casteSuggestions = [],
}) => {
  const relationOptions: DropdownOption[] = React.useMemo(
    () => [
      { id: 'Father', label: t('relationFather') || 'Father' },
      { id: 'Husband', label: t('relationHusband') || 'Husband' },
      { id: 'Mother', label: t('relationMother') || 'Mother' },
      { id: 'Other', label: t('relationOther') || 'Other' },
    ],
    [t]
  );

  const professionTypeOptions: DropdownOption[] = React.useMemo(
    () => [
      { id: 'Farmer', label: t('professionFarmer') || 'Farmer / Agriculture' },
      { id: 'Business', label: t('professionBusiness') || 'Business / Self-Employed' },
      { id: 'Govt Service', label: t('professionGovtService') || 'Government Service' },
      { id: 'Private Service', label: t('professionPrivateService') || 'Private Sector Employee' },
      { id: 'Homemaker', label: t('professionHomemaker') || 'Homemaker' },
      { id: 'Student', label: t('professionStudent') || 'Student' },
      { id: 'Retired', label: t('professionRetired') || 'Retired' },
      { id: 'Daily Wage', label: t('professionDailyWage') || 'Daily Wage Worker' },
      { id: 'Other', label: t('professionOther') || 'Other' },
    ],
    [t]
  );

  // Cascading caste options filtered by selected religionId if religion is set
  const filteredCasteOptions = React.useMemo(() => {
    if (!formData.religionId) return casteOptions;
    return casteOptions.filter((c: any) => !c.religionId || String(c.religionId) === String(formData.religionId));
  }, [casteOptions, formData.religionId]);

  // Resolve unique autocomplete suggestion lists matching web pattern
  const resolvedReligionSuggestions = React.useMemo(() => {
    if (religionSuggestions.length > 0) return religionSuggestions;
    return religionOptions.map((o) => o.label).filter(Boolean);
  }, [religionSuggestions, religionOptions]);

  const resolvedCasteSuggestions = React.useMemo(() => {
    if (casteSuggestions.length > 0) return casteSuggestions;
    return filteredCasteOptions.map((o) => o.label).filter(Boolean);
  }, [casteSuggestions, filteredCasteOptions]);

  const religionDisplayValue =
    formData.religionName ||
    religionOptions.find((r) => String(r.id) === String(formData.religionId))?.label ||
    '';

  const casteDisplayValue =
    formData.casteName ||
    casteOptions.find((c) => String(c.id) === String(formData.casteId))?.label ||
    '';

  const commonProfessionSuggestions = React.useMemo(() => [
    'Teacher', 'Farmer / Agriculture', 'Business / Trader', 'Doctor', 'Engineer',
    'Lawyer / Advocate', 'Government Servant', 'Police / Security', 'Contractor',
    'Driver', 'Mechanic', 'Accountant', 'Nurse / Healthcare', 'Student', 'Homemaker'
  ], []);

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Title */}
      <View style={styles.titleRow}>
        <View style={[styles.titleIconBox, { backgroundColor: theme.colors.primary + '15' }]}>
          <MaterialDesignIcons name="account-details-outline" size={18} color={theme.colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('demographicsTitle') || 'Contact & Demographics'}
        </Text>
      </View>

      {/* Relative / Guardian Info */}
      <View style={styles.row}>
        <View style={styles.flex2}>
          <AppTextInput
            label={t('relativeName') || 'Relative / Guardian Name'}
            placeholder={t('relativeNamePlaceholder') || 'e.g. Ramesh Chandra Sharma'}
            value={formData.guardianName || formData.relativeName || ''}
            onChangeText={(text) => {
              setFormData((prev: any) => ({
                ...prev,
                guardianName: text,
                relativeName: text,
              }));
            }}
            icon="account-outline"
            editable={canEditDemographics}
          />
        </View>
        <View style={styles.flex1}>
          <AppDropdown
            label={t('relationType') || 'Relation'}
            placeholder={t('relationType') || 'Relation'}
            value={formData.relation || ''}
            options={relationOptions}
            icon="users"
            disabled={!canEditDemographics}
            onSelect={(val) => {
              setFormData((prev: any) => ({ ...prev, relation: val }));
            }}
          />
        </View>
      </View>

      {/* Contact Details (Mobile & Email) */}
      <View style={styles.row}>
        <View style={styles.flex1}>
          <AppTextInput
            label={t('enterMobileNumber') || 'Mobile Number'}
            placeholder={t('mobilePlaceholder') || '10-digit mobile number'}
            value={formData.mobileNo || formData.mobile || ''}
            onChangeText={(text) => {
              setFormData((prev: any) => ({
                ...prev,
                mobileNo: text,
                mobile: text,
              }));
            }}
            icon="phone"
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.mobileNo}
            editable={canEditContact}
          />
        </View>
        <View style={styles.flex1}>
          <AppTextInput
            label={t('emailAddress') || 'Email Address'}
            placeholder={t('emailPlaceholder') || 'voter@example.com'}
            value={formData.email || ''}
            onChangeText={(text) => {
              setFormData((prev: any) => ({ ...prev, email: text }));
            }}
            icon="mail"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            editable={canEditContact}
          />
        </View>
      </View>

      {/* Identification Documents (Aadhaar & PAN) */}
      <View style={styles.row}>
        <View style={styles.flex1}>
          <AppTextInput
            label={t('aadhaarNo') || 'Aadhaar Card No'}
            placeholder={t('aadhaarPlaceholder') || '12-digit Aadhaar'}
            value={formData.aadhaarNo || ''}
            onChangeText={(text) => {
              setFormData((prev: any) => ({ ...prev, aadhaarNo: text }));
            }}
            icon="id-card"
            keyboardType="numeric"
            maxLength={12}
            editable={canEditDemographics}
          />
        </View>
        <View style={styles.flex1}>
          <AppTextInput
            label={t('panNo') || 'PAN Card No'}
            placeholder={t('panPlaceholder') || '10-character PAN'}
            value={formData.panNo || ''}
            onChangeText={(text) => {
              setFormData((prev: any) => ({ ...prev, panNo: text.toUpperCase() }));
            }}
            icon="credit-card"
            autoCapitalize="characters"
            maxLength={10}
            editable={canEditDemographics}
          />
        </View>
      </View>

      {/* Socio-Cultural: Religion, Caste, Subcaste */}
      <View style={styles.row}>
        <View style={styles.flex1}>
          <AppAutocompleteInput
            label={t('religion') || 'Religion'}
            placeholder={t('selectReligion') || 'Select Religion'}
            value={religionDisplayValue}
            suggestions={resolvedReligionSuggestions}
            disabled={!canEditDemographics}
            icon="church"
            onChangeText={(text) => {
              const matched = religionOptions.find(
                (r) => r.label.toLowerCase() === text.toLowerCase().trim()
              );
              setFormData((prev: any) => ({
                ...prev,
                religionId: matched ? matched.id : '',
                religionName: text,
                casteId: prev.casteId ? '' : prev.casteId,
                casteName: prev.casteId ? '' : prev.casteName,
              }));
            }}
            onSelectSuggestion={(item) => {
              const name = typeof item === 'string' ? item : item.name;
              const matched = religionOptions.find(
                (r) => r.label.toLowerCase() === name.toLowerCase().trim()
              );
              setFormData((prev: any) => ({
                ...prev,
                religionId: matched ? matched.id : '',
                religionName: name,
                casteId: prev.casteId ? '' : prev.casteId,
                casteName: prev.casteId ? '' : prev.casteName,
              }));
            }}
          />
        </View>
        <View style={styles.flex1}>
          <AppAutocompleteInput
            label={t('caste') || 'Caste'}
            placeholder={t('selectCaste') || 'Select Caste'}
            value={casteDisplayValue}
            suggestions={resolvedCasteSuggestions}
            disabled={!canEditDemographics}
            icon="account-group"
            onChangeText={(text) => {
              const matched = filteredCasteOptions.find(
                (c) => c.label.toLowerCase() === text.toLowerCase().trim()
              );
              setFormData((prev: any) => ({
                ...prev,
                casteId: matched ? matched.id : '',
                casteName: text,
              }));
            }}
            onSelectSuggestion={(item) => {
              const name = typeof item === 'string' ? item : item.name;
              const matched = filteredCasteOptions.find(
                (c) => c.label.toLowerCase() === name.toLowerCase().trim()
              );
              setFormData((prev: any) => ({
                ...prev,
                casteId: matched ? matched.id : '',
                casteName: name,
              }));
            }}
          />
        </View>
      </View>

      <AppAutocompleteInput
        label={t('subCaste') || 'Sub-Caste'}
        placeholder={t('subCastePlaceholder') || 'e.g. Gaur, Khandelwal, Meena'}
        value={formData.subcasteName || ''}
        suggestions={subcasteSuggestions}
        onChangeText={(text) => {
          setFormData((prev: any) => ({ ...prev, subcasteName: text }));
        }}
        disabled={!canEditDemographics}
        icon="account-outline"
      />

      {/* Profession */}
      <View style={styles.row}>
        <View style={styles.flex1}>
          <AppDropdown
            icon="briefcase"
            label={t('professionType') || 'Profession Category'}
            placeholder={t('selectProfessionType') || 'Select Profession Type'}
            value={formData.professionType || ''}
            options={professionTypeOptions}
            disabled={!canEditDemographics}
            searchable={true}
            onSelect={(val) => {
              setFormData((prev: any) => ({ ...prev, professionType: val }));
            }}
          />
        </View>
        <View style={styles.flex1}>
          <AppAutocompleteInput
            label={t('profession') || 'Specific Occupation'}
            placeholder={t('professionPlaceholder') || 'e.g. Civil Engineer, Teacher'}
            value={formData.profession || ''}
            suggestions={commonProfessionSuggestions}
            onChangeText={(text) => {
              setFormData((prev: any) => ({ ...prev, profession: text }));
            }}
            disabled={!canEditDemographics}
            icon="briefcase-outline"
          />
        </View>
      </View>

      {!canEditDemographics && (
        <Text style={[styles.permissionHint, { color: theme.colors.textSecondary }]}>
          {t('permissionDemographicsRequired') || 'Permission required to edit voter demographic details'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: rfValue(15),
    fontFamily: FontFamily.bodyBold,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  permissionHint: {
    fontSize: rfValue(11),
    fontFamily: FontFamily.body,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
