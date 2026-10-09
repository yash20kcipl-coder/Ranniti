import React from 'react';
import { Theme } from '../../../constants/theme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { Voter } from '../../../store/reducers/voters';
import { SafeImage } from '../../../components/SafeImage';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

interface VoterAffinitySectionProps {
  voter: Voter;
  t: (key: any) => string;
  theme: Theme;
  canEditInclination?: boolean;
  onEditParty?: () => void;
  onViewFamilyTree?: () => void;
}

export const VoterAffinitySection: React.FC<VoterAffinitySectionProps> = ({
  voter,
  t,
  theme,
  canEditInclination,
  onEditParty,
  onViewFamilyTree,
}) => {
  const partyDisplayName = voter.partyName || voter.partyAbbreviation || voter.supportingParty || 'Undecided';
  const hasInfluenceProfile =
    Boolean(voter.isSocialInfluencer) ||
    Boolean(voter.isFamilyInfluencer) ||
    Boolean(voter.isFamilyHead) ||
    Boolean(voter.familyInfluencerName) ||
    Boolean(voter.socialInfluencerName);

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Section Header */}
      <View style={styles.titleRow}>
        <View style={[styles.titleIconBox, { backgroundColor: theme.colors.primary + '15' }]}>
          <MaterialDesignIcons name="handshake-outline" size={18} color={theme.colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('politicalAffinity')}
        </Text>
      </View>

      <View style={styles.grid}>
        {/* Supporting Party Tile */}
        <View style={[styles.tile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
          <View style={styles.tileHeaderRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('supportingParty')}</Text>
            {Boolean(canEditInclination && onEditParty) && (
              <TouchableOpacity
                onPress={onEditParty}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.editActionBtn}
              >
                <MaterialDesignIcons name="pencil" size={12} color={theme.colors.primary} />
                <Text style={[styles.editActionText, { color: theme.colors.primary }]}>{t('edit') || 'Edit'}</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            disabled={!canEditInclination || !onEditParty}
            onPress={onEditParty}
            activeOpacity={0.7}
            style={[
              styles.partyPill,
              {
                backgroundColor: theme.colors.primary + '12',
                borderColor: theme.colors.primary + '25',
              },
            ]}
          >
            {voter.partySymbol ? (
              <SafeImage
                uri={voter.partySymbol}
                placeholderType="landscape"
                name={partyDisplayName}
                style={styles.partyIcon}
                containerStyles={styles.partyIconContainer}
              />
            ) : (
              <MaterialDesignIcons name="flag" size={13} color={theme.colors.primary} />
            )}
            <Text style={[styles.partyText, { color: theme.colors.primary }]}>
              {partyDisplayName}
            </Text>
            {Boolean(canEditInclination && onEditParty) && (
              <MaterialDesignIcons name="chevron-right" size={14} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Political View Tile */}
        <View style={[styles.tile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('politicalView')}</Text>
          <View style={[styles.viewPill, { borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' }]}>
            <MaterialDesignIcons name="chart-bubble" size={13} color="#475569" />
            <Text style={styles.viewText}>
              {voter.politicalView || voter.voterType || 'Pending'}
            </Text>
          </View>
        </View>

        {/* Living & Status Row */}
        <View style={[styles.tile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('livingStatus')}</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: voter.isDead ? '#EF4444' : '#22C55E' },
              ]}
            />
            <Text style={[styles.statusText, { color: theme.colors.text }]}>
              {voter.isDead ? t('deceased') : t('living')}
              {voter.isShifted ? ` • ${t('shifted')}` : ''}
            </Text>
          </View>
        </View>

        {/* Influence Profile Section */}
        {hasInfluenceProfile && (
          <View style={[styles.influenceBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <View style={styles.influenceHeader}>
              <MaterialDesignIcons name="account-star" size={18} color="#D97706" />
              <Text style={styles.influenceTitle}>{t('influencerStatus')}</Text>
            </View>

            {/* Social Influencer Metric */}
            {Boolean(voter.isSocialInfluencer) && (
              <View style={styles.metricItem}>
                <View style={[styles.metricDot, { backgroundColor: '#D97706' }]} />
                <Text style={styles.metricLabel}>{t('socialInfluencer')}:</Text>
                <Text style={styles.metricValue}>
                  {voter.socialInfluencedCount ? `${t('influencesVoters')} ${voter.socialInfluencedCount} ${t('votersCount')}` : 'Active'}
                </Text>
              </View>
            )}

            {/* Family Influencer Metric */}
            {Boolean(voter.isFamilyInfluencer || voter.isFamilyHead) && (
              <View style={styles.metricItem}>
                <View style={[styles.metricDot, { backgroundColor: '#7C3AED' }]} />
                <Text style={styles.metricLabel}>{t('familyInfluencer')}:</Text>
                <Text style={styles.metricValue}>
                  {voter.familyInfluencedCount ? `${t('influencesVoters')} ${voter.familyInfluencedCount} ${t('votersCount')}` : t('familyHead')}
                </Text>
              </View>
            )}

            {/* Influenced by Family Influencer */}
            {Boolean(voter.familyInfluencerName) && (
              <View style={styles.metricItem}>
                <View style={[styles.metricDot, { backgroundColor: '#64748B' }]} />
                <Text style={styles.metricLabel}>{t('influencedBy')}:</Text>
                <Text style={styles.metricValue}>{voter.familyInfluencerName}</Text>
              </View>
            )}

            {/* Influenced by Social Influencer */}
            {Boolean(voter.socialInfluencerName) && (
              <View style={styles.metricItem}>
                <View style={[styles.metricDot, { backgroundColor: '#64748B' }]} />
                <Text style={styles.metricLabel}>{t('socialInfluencer')}:</Text>
                <Text style={styles.metricValue}>
                  {voter.socialInfluencerName}
                  {voter.socialInfluencerEpic ? ` (${voter.socialInfluencerEpic})` : ''}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* View Family Tree Navigation Button */}
        {Boolean(onViewFamilyTree) && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onViewFamilyTree}
            style={[
              styles.familyBtn,
              {
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.primary + '08',
              },
            ]}
          >
            <MaterialDesignIcons name="account-group" size={18} color={theme.colors.primary} />
            <Text style={[styles.familyBtnText, { color: theme.colors.primary }]}>
              {t('viewFamilyTree')}
            </Text>
            <MaterialDesignIcons name="chevron-right" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    ...getShadow(2, '#000000', 0.05),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingBottom: 12,
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
  grid: {
    gap: 10,
  },
  tile: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  tileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  editActionText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(10.5),
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(11),
  },
  partyPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  partyIconContainer: {
    width: 16,
    height: 16,
  },
  partyIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  partyText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(12.5),
  },
  viewPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(12.5),
    color: '#334155',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13),
  },
  influenceBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  influenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  influenceTitle: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(12.5),
    color: '#92400E',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricLabel: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(11.5),
    color: '#78350F',
  },
  metricValue: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(12),
    color: '#92400E',
  },
  familyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  familyBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(13),
    flex: 1,
    marginLeft: 8,
  },
});
