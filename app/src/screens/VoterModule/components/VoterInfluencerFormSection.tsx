import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { AppDropdown, DropdownOption } from '../../../components/AppDropdown';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { FontFamily } from '../../../utils/typography';
import { rfValue } from '../../../utils/responsive';
import { Theme } from '../../../constants/theme';

export interface VoterInfluencerFormSectionProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  partyOptions: DropdownOption[];
  familyInfluencerOptions: DropdownOption[];
  socialInfluencerOptions: DropdownOption[];
  loadingInfluencers?: boolean;
  t: (key: any) => string;
  theme: Theme;
  canManageFamily: boolean;
  canEditInclination: boolean;
  isEditMode: boolean;
  voterMeta?: any;
}

export const VoterInfluencerFormSection: React.FC<VoterInfluencerFormSectionProps> = ({
  formData,
  setFormData,
  partyOptions,
  familyInfluencerOptions,
  socialInfluencerOptions,
  loadingInfluencers = false,
  t,
  theme,
  canManageFamily,
  canEditInclination,
  isEditMode,
  voterMeta,
}) => {
  const handleFamilyInfluencerToggle = (value: boolean) => {
    setFormData((prev: any) => ({
      ...prev,
      isFamilyInfluencer: value,
      // If designated as family head, cannot be linked under another head
      familyInfluencerId: value ? '' : prev.familyInfluencerId,
    }));
  };

  const handleSocialInfluencerToggle = (value: boolean) => {
    setFormData((prev: any) => ({
      ...prev,
      isSocialInfluencer: value,
    }));
  };

  const handleUnlinkFamily = () => {
    setFormData((prev: any) => ({
      ...prev,
      familyInfluencerId: '',
    }));
  };

  const handleUnlinkSocial = () => {
    setFormData((prev: any) => ({
      ...prev,
      socialInfluencerId: '',
    }));
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Title */}
      <View style={styles.titleRow}>
        <View style={[styles.titleIconBox, { backgroundColor: theme.colors.primary + '15' }]}>
          <MaterialDesignIcons name="account-group-outline" size={18} color={theme.colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('influencerStatus') || 'Party Affiliation & Influencer Networks'}
        </Text>
      </View>

      {/* Political Party Selection */}
      <View style={styles.inputContainer}>
        <AppDropdown
          label={t('selectParty') || 'Political Party Affiliation'}
          placeholder={t('selectParty') || 'Select Supporting Party'}
          icon="flag-outline"
          value={formData.partyId}
          options={partyOptions}
          disabled={!canEditInclination}
          searchable={true}
          onSelect={(val) => {
            setFormData((prev: any) => ({ ...prev, partyId: val }));
          }}
        />
        {!canEditInclination && (
          <Text style={[styles.permissionHint, { color: theme.colors.textSecondary }]}>
            {t('permissionPartyRequired') || 'Permission required to edit party affiliation'}
          </Text>
        )}
      </View>

      {/* Family Network & Household Influencer Card */}
      <View
        style={[
          styles.subCard,
          {
            backgroundColor: formData.isFamilyInfluencer
              ? theme.colors.primary + '0A'
              : theme.colors.background,
            borderColor: formData.isFamilyInfluencer
              ? theme.colors.primary + '30'
              : theme.colors.border,
          },
        ]}
      >
        <View style={styles.subCardHeader}>
          <View style={styles.subCardTitleRow}>
            <MaterialDesignIcons
              name="crown-outline"
              size={18}
              color={formData.isFamilyInfluencer ? theme.colors.primary : theme.colors.textSecondary}
            />
            <View style={styles.subCardTitleTexts}>
              <Text style={[styles.subCardTitle, { color: theme.colors.text }]}>
                {t('familyInfluencer') || 'Family Network'}
              </Text>
              <Text style={[styles.subCardSubtitle, { color: theme.colors.textSecondary }]}>
                {t('influencesHousehold') || 'Household mapping & leadership'}
              </Text>
            </View>
          </View>

          {/* Toggle Switch */}
          <Switch
            value={Boolean(formData.isFamilyInfluencer)}
            onValueChange={handleFamilyInfluencerToggle}
            disabled={!canManageFamily}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '80' }}
            thumbColor={formData.isFamilyInfluencer ? theme.colors.primary : '#f4f3f4'}
          />
        </View>

        {/* State 1: Marked as Family Influencer */}
        {formData.isFamilyInfluencer ? (
          <View
            style={[
              styles.infoBadgeBox,
              { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '30' },
            ]}
          >
            <View style={styles.infoBadgeTop}>
              <Text style={[styles.badgeLabel, { color: theme.colors.primary }]}>
                {t('designatedFamilyHead') || 'Designated Head of Household'}
              </Text>
              {isEditMode && voterMeta?.familyInfluencedCount !== undefined && (
                <View style={[styles.countBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.countBadgeText}>
                    {voterMeta.familyInfluencedCount} {t('votersCount') || 'voters'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.badgeDescription, { color: theme.colors.text }]}>
              {isEditMode && Number(voterMeta?.familyInfluencedCount) > 0
                ? `${t('influencesVoters') || 'Influences'} ${voterMeta.familyInfluencedCount} ${t('votersCount') || 'voters'} in this household.`
                : t('familyHeadDescription') || 'Head of household. Family members can be linked under this voter.'}
            </Text>
          </View>
        ) : (
          /* State 2: Can link under existing Family Head */
          <View style={styles.linkContainer}>
            <View style={styles.dropdownWithAction}>
              <View style={styles.flex1}>
                <AppDropdown
                  label={t('linkFamilyHead') || 'Link Under Family Head'}
                  placeholder={
                    loadingInfluencers
                      ? t('loadingInfluencers') || 'Loading influencers...'
                      : familyInfluencerOptions.length > 0
                      ? t('linkFamilyHead')
                      : t('noInfluencersAvailable')
                  }
                  icon="account-tie-outline"
                  value={formData.familyInfluencerId}
                  options={familyInfluencerOptions}
                  disabled={!canManageFamily || familyInfluencerOptions.length === 0}
                  searchable={true}
                  onSelect={(val) => {
                    setFormData((prev: any) => ({ ...prev, familyInfluencerId: val }));
                  }}
                />
              </View>
              {Boolean(formData.familyInfluencerId) && canManageFamily && (
                <TouchableOpacity
                  style={[styles.unlinkButton, { borderColor: theme.colors.error || '#EF4444' }]}
                  onPress={handleUnlinkFamily}
                >
                  <MaterialDesignIcons name="link-off" size={16} color={theme.colors.error || '#EF4444'} />
                  <Text style={[styles.unlinkText, { color: theme.colors.error || '#EF4444' }]}>
                    {t('unlink') || 'Unlink'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Community & Social Leader Card */}
      <View
        style={[
          styles.subCard,
          {
            backgroundColor: formData.isSocialInfluencer
              ? theme.colors.primary + '0A'
              : theme.colors.background,
            borderColor: formData.isSocialInfluencer
              ? theme.colors.primary + '30'
              : theme.colors.border,
          },
        ]}
      >
        <View style={styles.subCardHeader}>
          <View style={styles.subCardTitleRow}>
            <MaterialDesignIcons
              name="star-circle-outline"
              size={18}
              color={formData.isSocialInfluencer ? theme.colors.primary : theme.colors.textSecondary}
            />
            <View style={styles.subCardTitleTexts}>
              <Text style={[styles.subCardTitle, { color: theme.colors.text }]}>
                {t('designatedSocialLeader') || 'Community / Social Influencer'}
              </Text>
              <Text style={[styles.subCardSubtitle, { color: theme.colors.textSecondary }]}>
                {t('isSocialLeaderToggle') || 'Mark community leaders and influencers'}
              </Text>
            </View>
          </View>

          {/* Toggle Switch */}
          <Switch
            value={Boolean(formData.isSocialInfluencer)}
            onValueChange={handleSocialInfluencerToggle}
            disabled={!canManageFamily}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '80' }}
            thumbColor={formData.isSocialInfluencer ? theme.colors.primary : '#f4f3f4'}
          />
        </View>

        {formData.isSocialInfluencer ? (
          <View
            style={[
              styles.infoBadgeBox,
              { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '30' },
            ]}
          >
            <View style={styles.infoBadgeTop}>
              <Text style={[styles.badgeLabel, { color: theme.colors.primary }]}>
                {t('designatedSocialLeader') || 'Community / Social Leader'}
              </Text>
              {isEditMode && voterMeta?.socialInfluencedCount !== undefined && (
                <View style={[styles.countBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.countBadgeText}>
                    {voterMeta.socialInfluencedCount} {t('votersCount') || 'voters'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.badgeDescription, { color: theme.colors.text }]}>
              {isEditMode && Number(voterMeta?.socialInfluencedCount) > 0
                ? `${t('influencesVoters') || 'Influences'} ${voterMeta.socialInfluencedCount} ${t('votersCount') || 'voters'} across this community.`
                : t('socialLeaderDescription') || 'Community leader. Other voters can be mapped under this influencer.'}
            </Text>
          </View>
        ) : (
          <View style={styles.linkContainer}>
            <View style={styles.dropdownWithAction}>
              <View style={styles.flex1}>
                <AppDropdown
                  label={t('linkSocialLeader') || 'Link Under Social Leader'}
                  placeholder={
                    loadingInfluencers
                      ? t('loadingLeaders') || 'Loading leaders...'
                      : socialInfluencerOptions.length > 0
                      ? t('linkSocialLeader')
                      : t('noInfluencersAvailable')
                  }
                  icon="account-star-outline"
                  value={formData.socialInfluencerId}
                  options={socialInfluencerOptions}
                  disabled={!canManageFamily || socialInfluencerOptions.length === 0}
                  searchable={true}
                  onSelect={(val) => {
                    setFormData((prev: any) => ({ ...prev, socialInfluencerId: val }));
                  }}
                />
              </View>
              {Boolean(formData.socialInfluencerId) && canManageFamily && (
                <TouchableOpacity
                  style={[styles.unlinkButton, { borderColor: theme.colors.error || '#EF4444' }]}
                  onPress={handleUnlinkSocial}
                >
                  <MaterialDesignIcons name="link-off" size={16} color={theme.colors.error || '#EF4444'} />
                  <Text style={[styles.unlinkText, { color: theme.colors.error || '#EF4444' }]}>
                    {t('unlink') || 'Unlink'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {!canManageFamily && (
        <Text style={[styles.permissionHint, { color: theme.colors.textSecondary }]}>
          {t('permissionInfluencersRequired') || 'Permission required to manage family and social influencer links'}
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
  inputContainer: {
    marginBottom: 16,
  },
  permissionHint: {
    fontSize: rfValue(11),
    fontFamily: FontFamily.body,
    marginTop: 4,
    fontStyle: 'italic',
  },
  subCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  subCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  subCardTitleTexts: {
    marginLeft: 8,
    flex: 1,
  },
  subCardTitle: {
    fontSize: rfValue(13),
    fontFamily: FontFamily.bodyBold,
  },
  subCardSubtitle: {
    fontSize: rfValue(11),
    fontFamily: FontFamily.body,
    marginTop: 1,
  },
  infoBadgeBox: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  infoBadgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badgeLabel: {
    fontSize: rfValue(11),
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: rfValue(10),
    fontFamily: FontFamily.bold,
  },
  badgeDescription: {
    fontSize: rfValue(11),
    fontFamily: FontFamily.body,
    lineHeight: 16,
  },
  linkContainer: {
    marginTop: 12,
  },
  dropdownWithAction: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
  unlinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 4,
  },
  unlinkText: {
    fontSize: rfValue(12),
    fontFamily: FontFamily.medium,
  },
});
