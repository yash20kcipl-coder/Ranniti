import React from 'react';
import { Theme } from '../../../constants/theme';
import { rfValue } from '../../../utils/responsive';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { AppTextInput } from '../../../components/AppTextInput';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { AppDropdown, DropdownOption } from '../../../components/AppDropdown';
import { AppAutocompleteInput } from '../../../components/AppAutocompleteInput';
import { FontFamily } from '../../../utils/typography';

interface VoterGeographyFormSectionProps {
  formData: any;
  errors: Record<string, string>;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  t: (key: any) => string;
  theme: Theme;
  stateOptions: DropdownOption[];
  districtOptions: DropdownOption[];
  pcOptions: DropdownOption[];
  acOptions: DropdownOption[];
  boothOptions: DropdownOption[];
  sameAddress: boolean;
  setSameAddress: (same: boolean) => void;
  canEditContact: boolean;
  talukaSuggestions?: string[];
  villageSuggestions?: string[];
}

export const VoterGeographyFormSection: React.FC<VoterGeographyFormSectionProps> = ({
  formData,
  errors,
  setFormData,
  t,
  theme,
  stateOptions,
  districtOptions,
  pcOptions,
  acOptions,
  boothOptions,
  sameAddress,
  setSameAddress,
  canEditContact,
  talukaSuggestions = [],
  villageSuggestions = [],
}) => {
  const handleSameAddressChange = (enabled: boolean) => {
    setSameAddress(enabled);
    if (enabled) {
      setFormData((prev: any) => ({ ...prev, voterAddress: prev.fullAddress }));
    }
  };

  const handleFullAddressChange = (text: string) => {
    setFormData((prev: any) => {
      const updated = { ...prev, fullAddress: text };
      if (sameAddress) {
        updated.voterAddress = text;
      }
      return updated;
    });
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Title */}
      <View style={styles.titleRow}>
        <View style={[styles.titleIconBox, { backgroundColor: theme.colors.primary + '15' }]}>
          <MaterialDesignIcons name="map-marker-radius-outline" size={18} color={theme.colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('electoralInfo') || 'Electoral Geography & Addresses'}
        </Text>
      </View>

      {/* Cascading Electoral Dropdowns */}
      <View style={styles.row}>
        <View style={styles.flex1}>
          <AppDropdown
            label={t('selectState')}
            placeholder={t('selectState')}
            icon="map-outline"
            value={formData.stateId}
            options={stateOptions}
            searchable={true}
            onSelect={(val) => {
              setFormData((prev: any) => ({
                ...prev,
                stateId: val,
                districtId: '',
                pcId: '',
                acId: '',
                boothId: '',
              }));
            }}
          />
        </View>
        <View style={styles.flex1}>
          <AppDropdown
            label={t('selectDistrict')}
            placeholder={t('selectDistrict')}
            icon="city-variant-outline"
            value={formData.districtId}
            options={districtOptions}
            searchable={true}
            onSelect={(val) => {
              setFormData((prev: any) => ({
                ...prev,
                districtId: val,
                boothId: '',
              }));
            }}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.flex1}>
          <AppDropdown
            label={t('selectPc')}
            placeholder={t('selectPc')}
            icon="sign-direction"
            value={formData.pcId}
            options={pcOptions}
            searchable={true}
            onSelect={(val) => {
              setFormData((prev: any) => ({
                ...prev,
                pcId: val,
                acId: '',
                boothId: '',
              }));
            }}
          />
        </View>
        <View style={styles.flex1}>
          <AppDropdown
            label={t('selectAc')}
            placeholder={t('selectAc')}
            icon="crosshairs-gps"
            value={formData.acId}
            options={acOptions}
            searchable={true}
            onSelect={(val) => {
              setFormData((prev: any) => ({
                ...prev,
                acId: val,
                boothId: '',
              }));
            }}
          />
        </View>
      </View>

      {/* Polling Booth Dropdown (Mandatory) */}
      <AppDropdown
        label={`${t('selectBooth')} *`}
        placeholder={t('selectBooth')}
        icon="office-building"
        value={formData.boothId}
        options={boothOptions}
        searchable={true}
        searchPlaceholder={t('searchBoothPlaceholder') || 'Search booth number or name...'}
        onSelect={(val) => {
          setFormData((prev: any) => ({
            ...prev,
            boothId: val,
            familyInfluencerId: '',
            socialInfluencerId: '',
          }));
        }}
      />
      {Boolean(errors.boothId) && (
        <Text style={[styles.errorText, { color: theme.colors.error || '#EF4444' }]}>
          {errors.boothId}
        </Text>
      )}

      {/* Serial, Section & House Numbers */}
      <View style={styles.row}>
        <View style={styles.flex1}>
          <AppTextInput
            label={t('serialNumber')}
            placeholder="e.g. 142"
            keyboardType="numeric"
            value={formData.serialNo ? String(formData.serialNo) : ''}
            onChangeText={(val) => setFormData((prev: any) => ({ ...prev, serialNo: val }))}
            icon="numeric"
          />
        </View>
        <View style={styles.flex1}>
          <AppTextInput
            label={t('sectionNo')}
            placeholder="e.g. 2"
            keyboardType="numeric"
            value={formData.sectionNo ? String(formData.sectionNo) : ''}
            onChangeText={(val) => setFormData((prev: any) => ({ ...prev, sectionNo: val }))}
            icon="format-list-numbered"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.flex1}>
          <AppTextInput
            label={t('houseNo')}
            placeholder="e.g. 45-B"
            value={formData.houseNo}
            onChangeText={(val) => setFormData((prev: any) => ({ ...prev, houseNo: val }))}
            icon="home-outline"
          />
        </View>
        <View style={styles.flex1}>
          <AppAutocompleteInput
            icon="city"
            label={t('village')}
            disabled={!canEditContact}
            value={formData.village || ''}
            suggestions={villageSuggestions}
            placeholder={t('villagePlaceholder') || 'Village / Town'}
            onChangeText={(val) => setFormData((prev: any) => ({ ...prev, village: val }))}
          />
        </View>
      </View>

      <AppAutocompleteInput
        label={t('taluka')}
        icon="map-marker-outline"
        disabled={!canEditContact}
        value={formData.taluka || ''}
        suggestions={talukaSuggestions}
        placeholder={t('talukaPlaceholder') || 'Taluka / Tehsil'}
        onChangeText={(val) => setFormData((prev: any) => ({ ...prev, taluka: val }))}
      />

      {/* Current Residence Address */}
      <AppTextInput
        label={t('currentAddress')}
        placeholder={t('currentAddressPlaceholder') || 'Enter current residential address...'}
        value={formData.fullAddress}
        multiline={true}
        numberOfLines={2}
        editable={canEditContact}
        onChangeText={handleFullAddressChange}
        icon="home-map-marker"
      />

      {/* Same Address Switch */}
      <View style={styles.sameAddressRow}>
        <Text style={[styles.sameAddressLabel, { color: theme.colors.text }]}>
          {t('sameAsCurrentAddress')}
        </Text>
        <Switch
          value={sameAddress}
          disabled={!canEditContact}
          onValueChange={handleSameAddressChange}
          thumbColor={sameAddress ? theme.colors.primary : '#F1F5F9'}
          trackColor={{ false: '#E2E8F0', true: theme.colors.primary + '55' }}
        />
      </View>

      {/* Permanent / Voter Electoral Address */}
      {!sameAddress && (
        <AppTextInput
          label={t('permanentAddress')}
          placeholder={t('permanentAddressPlaceholder') || 'Enter permanent electoral address...'}
          value={formData.voterAddress}
          multiline={true}
          numberOfLines={2}
          editable={canEditContact}
          onChangeText={(val) => setFormData((prev: any) => ({ ...prev, voterAddress: val }))}
          icon="card-text-outline"
        />
      )}
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
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  sameAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  sameAddressLabel: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13.5),
  },
  errorText: {
    fontSize: rfValue(11),
    fontFamily: FontFamily.body,
    marginTop: -8,
    marginBottom: 6,
    paddingLeft: 4,
  },
});
