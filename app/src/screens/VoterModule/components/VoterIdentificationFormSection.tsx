import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { AppTextInput } from '../../../components/AppTextInput';
import { AppDropdown, DropdownOption } from '../../../components/AppDropdown';
import { SafeImage } from '../../../components/SafeImage';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { DateSelectionModal } from '../../../components/DateSelectionModal';
import { AttachmentPickerModal } from '../../../components/AttachmentPickerModal';
import { FontFamily } from '../../../utils/typography';
import { rfValue } from '../../../utils/responsive';
import { Theme } from '../../../constants/theme';

interface VoterIdentificationFormSectionProps {
  formData: any;
  errors: Record<string, string>;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  t: (key: any) => string;
  theme: Theme;
  canEditDemographics: boolean;
  canEditVoterStatus: boolean;
  canEditInclination: boolean;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

const BLOOD_GROUPS: DropdownOption[] = [
  { id: 'A+', label: 'A+' },
  { id: 'A-', label: 'A-' },
  { id: 'B+', label: 'B+' },
  { id: 'B-', label: 'B-' },
  { id: 'O+', label: 'O+' },
  { id: 'O-', label: 'O-' },
  { id: 'AB+', label: 'AB+' },
  { id: 'AB-', label: 'AB-' },
];

const STATUS_LIST: DropdownOption[] = [
  { id: 'ACTIVE', label: 'ACTIVE' },
  { id: 'INACTIVE', label: 'INACTIVE' },
  { id: 'SHIFTED', label: 'SHIFTED' },
  { id: 'DELETED', label: 'DELETED' },
];

const INCLINATION_LIST: DropdownOption[] = [
  { id: 'Voter', label: 'Voter' },
  { id: 'Core Supporter', label: 'Core Supporter' },
  { id: 'Leaning', label: 'Leaning' },
  { id: 'Neutral', label: 'Neutral' },
  { id: 'Opposition', label: 'Opposition' },
  { id: 'Hardcore Opposition', label: 'Hardcore Opposition' },
];

export const VoterIdentificationFormSection: React.FC<VoterIdentificationFormSectionProps> = ({
  formData,
  errors,
  setFormData,
  t,
  theme,
  canEditDemographics,
  canEditVoterStatus,
  canEditInclination,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const statusOptions: DropdownOption[] = React.useMemo(
    () => [
      { id: 'ACTIVE', label: t('statusActive') },
      { id: 'INACTIVE', label: t('statusInactive') },
      { id: 'SHIFTED', label: t('statusShifted') },
      { id: 'DELETED', label: t('statusDeleted') },
    ],
    [t]
  );

  const inclinationOptions: DropdownOption[] = React.useMemo(
    () => [
      { id: 'Voter', label: t('voterTypeVoter') },
      { id: 'Core Supporter', label: t('voterTypeCore') },
      { id: 'Leaning', label: t('voterTypeLeaning') },
      { id: 'Neutral', label: t('voterTypeNeutral') },
      { id: 'Opposition', label: t('voterTypeOpposition') },
      { id: 'Hardcore Opposition', label: t('voterTypeHardcoreOpposition') },
    ],
    [t]
  );

  const calculateAge = (dobString: string): number | null => {
    if (!dobString) return null;
    const parts = dobString.split('-');
    if (parts.length < 3) return null;
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return Math.max(0, age);
  };

  const handleDobSelect = (dateStr: string) => {
    const age = calculateAge(dateStr);
    setFormData((prev: any) => ({
      ...prev,
      dob: dateStr,
      age: age !== null ? String(age) : prev.age,
    }));
  };

  const handleAvatarSelect = (_fileName: string, fileUri: string) => {
    setFormData((prev: any) => ({ ...prev, avatar: fileUri }));
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Title */}
      <View style={styles.titleRow}>
        <View style={[styles.titleIconBox, { backgroundColor: theme.colors.primary + '15' }]}>
          <MaterialDesignIcons name="card-account-details-outline" size={18} color={theme.colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('identificationTitle') || 'Identification & Profile Status'}
        </Text>
      </View>

      {/* Avatar Picker & Preview */}
      <View style={[styles.row]}>
        <View style={[styles.avatarSection, { flex: 1 }]}>
          <View style={styles.avatarWrapper}>
            <SafeImage
              uri={formData.avatar}
              style={styles.avatar}
              placeholderType="avatar"
              containerStyles={styles.avatarContainer}
              name={formData.engFirstName || formData.firstName || 'Voter'}
            />
            {canEditDemographics && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.avatarEditBadge, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowAvatarPicker(true)}
              >
                <MaterialDesignIcons name="camera" size={10} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.avatarTextCol}>
            <Text style={[styles.avatarLabel, { color: theme.colors.text }]}>{t('profilePhoto')}</Text>
            <Text style={[styles.avatarHint, { color: theme.colors.textSecondary }]}>
              {t('tapToChangePhoto')}
            </Text>
          </View>
        </View>

        <View style={[styles.switchRow, { flexShrink: 1 }]}>
          <Text style={[styles.switchLabel, { color: formData.isDead ? '#EF4444' : '#16A34A' }]}>
            {formData.isDead ? t('deceased') : t('living')}
          </Text>
          <Switch
            value={!formData.isDead}
            disabled={!canEditVoterStatus}
            onValueChange={(alive) => setFormData((prev: any) => ({ ...prev, isDead: !alive }))}
            thumbColor={formData.isDead ? '#EF4444' : '#16A34A'}
            trackColor={{ false: '#FECACA', true: '#BBF7D0' }}
          />
        </View>
      </View>

      <View>
        {/* EPIC Card Number */}
        <AppTextInput
          error={errors.epicNo}
          value={formData.epicNo}
          autoCapitalize="characters"
          placeholder="e.g. RJ14829102"
          editable={canEditDemographics}
          label={`${t('epicVoterId')} *`}
          icon="badge-account-horizontal-outline"
          onChangeText={(val) => setFormData((prev: any) => ({ ...prev, epicNo: val.toUpperCase() }))}
        />

        {/* English Names */}
        <Text style={[styles.subheading, { color: theme.colors.textSecondary }]}>
          {t('nameInEnglish')}
        </Text>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <AppTextInput
              label={`${t('firstNameEng')} *`}
              placeholder="First Name"
              value={formData.engFirstName}
              editable={canEditDemographics}
              error={errors.engFirstName}
              onChangeText={(val) => setFormData((prev: any) => ({ ...prev, engFirstName: val }))}
            />
          </View>
          <View style={styles.flex1}>
            <AppTextInput
              label={t('middleNameEng')}
              placeholder="Middle Name"
              value={formData.engMiddleName}
              editable={canEditDemographics}
              onChangeText={(val) => setFormData((prev: any) => ({ ...prev, engMiddleName: val }))}
            />
          </View>
        </View>

        <AppTextInput
          label={t('surnameEng')}
          placeholder="Surname"
          value={formData.engSurname}
          editable={canEditDemographics}
          onChangeText={(val) => setFormData((prev: any) => ({ ...prev, engSurname: val }))}
        />

        {/* Hindi / Regional Names */}
        <Text style={[styles.subheading, { color: theme.colors.textSecondary }]}>
          {t('nameInRegional')}
        </Text>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <AppTextInput
              label={t('firstNameReg')}
              placeholder="पहला नाम"
              value={formData.firstName}
              editable={canEditDemographics}
              onChangeText={(val) => setFormData((prev: any) => ({ ...prev, firstName: val }))}
            />
          </View>
          <View style={styles.flex1}>
            <AppTextInput
              label={t('middleNameReg')}
              placeholder="मध्य नाम"
              value={formData.middleName}
              editable={canEditDemographics}
              onChangeText={(val) => setFormData((prev: any) => ({ ...prev, middleName: val }))}
            />
          </View>
        </View>

        <AppTextInput
          label={t('surnameReg')}
          placeholder="उपनाम"
          value={formData.surname}
          editable={canEditDemographics}
          onChangeText={(val) => setFormData((prev: any) => ({ ...prev, surname: val }))}
        />

        {/* Gender Pills */}
        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>{t('gender')}</Text>
          <View style={[styles.pillRow, !canEditDemographics && { opacity: 0.6 }]}>
            {GENDER_OPTIONS.map((g) => {
              const isSelected = formData.gender === g;
              const genderLabel = g === 'Female' ? t('female') : g === 'Male' ? t('male') : t('other');
              return (
                <TouchableOpacity
                  key={g}
                  activeOpacity={0.8}
                  disabled={!canEditDemographics}
                  style={[
                    styles.genderPill,
                    {
                      backgroundColor: isSelected ? theme.colors.primary : '#F1F5F9',
                      borderColor: isSelected ? theme.colors.primary : '#E2E8F0',
                    },
                  ]}
                  onPress={() => setFormData((prev: any) => ({ ...prev, gender: g }))}
                >
                  <MaterialDesignIcons
                    name={g === 'Female' ? 'gender-female' : g === 'Male' ? 'gender-male' : 'gender-transgender'}
                    size={15}
                    color={isSelected ? '#FFFFFF' : theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.genderPillText,
                      {
                        color: isSelected ? '#FFFFFF' : theme.colors.text,
                        fontFamily: isSelected ? FontFamily.bold : FontFamily.medium,
                      },
                    ]}
                  >
                    {genderLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Date of Birth & Age */}
      <View style={styles.row}>
        <View style={styles.flex1}>
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={!canEditDemographics}
            onPress={() => setShowDatePicker(true)}
          >
            <AppTextInput
              label={t('dob')}
              placeholder="YYYY-MM-DD"
              value={formData.dob}
              editable={false}
              icon="calendar"
              containerStyle={{ marginBottom: 0 }}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.flex1}>
          <AppTextInput
            label={t('age')}
            placeholder="e.g. 42"
            value={formData.age ? String(formData.age) : ''}
            keyboardType="numeric"
            editable={canEditDemographics}
            onChangeText={(val) => setFormData((prev: any) => ({ ...prev, age: val }))}
            icon="numeric"
            containerStyle={{ marginBottom: 0 }}
          />
        </View>
      </View>

      {/* Blood Group */}
      <AppDropdown
        icon="water-outline"
        options={BLOOD_GROUPS}
        label={t('bloodGroup')}
        value={formData.bloodGroup}
        disabled={!canEditDemographics}
        placeholder={t('selectBloodGroup')}
        onSelect={(val) => setFormData((prev: any) => ({ ...prev, bloodGroup: val }))}
      />

      {/* Status & Living Status */}
      <View style={styles.row}>
        <View style={styles.flex1}>
          <AppDropdown
            icon="account-check-outline"
            options={statusOptions}
            value={formData.status}
            label={t('selectStatus')}
            disabled={!canEditVoterStatus}
            placeholder={t('selectStatus')}
            onSelect={(val) => setFormData((prev: any) => ({ ...prev, status: val }))}
          />
        </View>

      </View>

      {/* Voter Type / Inclination */}
      <AppDropdown
        icon="bullseye-arrow"
        value={formData.voterType}
        options={inclinationOptions}
        label={t('selectVoterType')}
        disabled={!canEditInclination}
        placeholder={t('selectVoterType')}
        onSelect={(val) => setFormData((prev: any) => ({ ...prev, voterType: val }))}
      />

      {/* Modals */}
      <DateSelectionModal
        dayType="full"
        endDate={formData.dob}
        startDate={formData.dob}
        visible={showDatePicker}
        onSelectDates={handleDobSelect}
        onClose={() => setShowDatePicker(false)}
      />

      <AttachmentPickerModal
        visible={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        mediaTypesOnly={true}
        onSelectFile={handleAvatarSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(14.5),
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 6,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarEditBadge: {
    right: 0,
    bottom: 0,
    width: 22,
    height: 22,
    borderWidth: 1,
    borderRadius: 11,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#FFFFFF',
  },
  avatarTextCol: {
    flex: 1,
    gap: 2,
  },
  avatarLabel: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13.5),
  },
  avatarHint: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(11),
  },
  subheading: {
    marginTop: 5,
    marginBottom: 10,
    letterSpacing: 0.6,
    fontSize: rfValue(11),
    fontFamily: FontFamily.bold,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  fieldBlock: {
    marginBottom: 0,
  },
  fieldLabel: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13.5),
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  genderPillText: {
    fontSize: rfValue(12),
  },
  livingSwitchCol: {
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchLabel: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(12.5),
  },
});
