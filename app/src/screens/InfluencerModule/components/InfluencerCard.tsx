import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLanguage } from '../../../languages';
import { Theme } from '../../../constants/theme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { SafeImage } from '../../../components/SafeImage';
import { SocialInfluencer } from '../../../store/reducers/influencers';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { toggleVotedStatusAction } from '../../../store/actions/voters';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { openPhoneDialer, openWhatsAppChat } from '../../../utils/linkingUtils';

interface InfluencerCardProps {
  item: SocialInfluencer;
}

export const InfluencerCard: React.FC<InfluencerCardProps> = ({ item }) => {
  const { t } = useLanguage();
  const dispatch = useDispatch<any>();
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme, styles } = useAppTheme(createStyles);

  const voters = item.influencedVoters || [];

  return (
    <View style={styles.card}>
      {/* Influencer Header Details */}
      <View style={styles.headerRow}>
        <SafeImage
          src={item.photo || item.avatar}
          name={item.name}
          alt={item.name}
          placeholderType="avatar"
          style={styles.photo}
        />
        <View style={styles.infoCol}>
          {/* Badges Row */}
          <View style={styles.badgeRow}>
            {item.isSocialInfluencer && (
              <View style={[styles.typeBadge, styles.socialBadge]}>
                <Text style={styles.socialBadgeText}>{t('socialInfluencer') || 'Social'}</Text>
              </View>
            )}
            {item.isFamilyInfluencer && (
              <View style={[styles.typeBadge, styles.familyBadge]}>
                <Text style={styles.familyBadgeText}>{t('familyHead') || 'Family Head'}</Text>
              </View>
            )}
            {!!item.supportingParty && (
              <View style={styles.partyBadge}>
                <Text style={styles.partyBadgeText}>{item.supportingParty}</Text>
              </View>
            )}
          </View>

          <Text style={styles.nameText}>{item.name}</Text>
          <Text style={styles.professionText}>{item.profession || 'Community Leader'}</Text>
          {!!item.influenceArea && (
            <View style={styles.areaRow}>
              <MaterialDesignIcons name="map-marker-outline" size={12} color={theme.colors.textSecondary} />
              <Text style={styles.areaText} numberOfLines={1}>
                {item.influenceArea}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Contact Buttons */}
        <View style={styles.quickContactCol}>
          {!!item.mobile && (
            <>
              <TouchableOpacity
                style={[styles.actionIconBtn, { backgroundColor: '#EFF6FF' }]}
                onPress={() => openPhoneDialer(item.mobile)}
                activeOpacity={0.7}
              >
                <MaterialDesignIcons name="phone-outline" size={16} color="#2563EB" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionIconBtn, { backgroundColor: '#F0FDF4' }]}
                onPress={() => openWhatsAppChat(item.mobile)}
                activeOpacity={0.7}
              >
                <MaterialDesignIcons name="whatsapp" size={16} color="#16A34A" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Influenced Voters Summary & Accordion Toggle */}
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={() => setIsExpanded((prev) => !prev)}
        activeOpacity={0.8}
      >
        <View style={styles.accordionLabelRow}>
          <MaterialDesignIcons name="account-group-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.accordionTitle}>
            {t('influencedVoters') || 'Influenced Voters'} ({item.influencedVotersCount || voters.length})
          </Text>
        </View>

        <MaterialDesignIcons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Expanded Influenced Voters List */}
      {isExpanded && (
        <View style={styles.votersListContainer}>
          {voters.length === 0 ? (
            <Text style={styles.emptyVotersText}>
              {t('noInfluencedVoters') || 'No voters mapped under this influencer yet.'}
            </Text>
          ) : (
            voters.map((voter) => (
              <View key={voter.id} style={styles.voterItemCard}>
                <View style={styles.voterDetails}>
                  <Text style={styles.voterNameText}>{voter.name}</Text>
                  <Text style={styles.voterMetaText}>
                    EPIC: {voter.epicNo} {voter.boothNo ? `• ${voter.boothNo}` : ''}
                  </Text>
                </View>

                {/* Interactive Voted Status Toggle Button */}
                <TouchableOpacity
                  style={[styles.votedBadgeBtn, voter.isVoted ? styles.votedActive : styles.votedInactive]}
                  onPress={() => dispatch(toggleVotedStatusAction(voter.id))}
                  activeOpacity={0.8}
                >
                  <MaterialDesignIcons
                    name={voter.isVoted ? 'check-circle' : 'close-circle-outline'}
                    size={14}
                    color={voter.isVoted ? '#15803D' : '#64748B'}
                  />
                  <Text style={[styles.votedBadgeText, voter.isVoted ? styles.votedTextActive : styles.votedTextInactive]}>
                    {voter.isVoted ? (t('voted') || 'Voted') : (t('notVoted') || 'Not Voted')}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      padding: 14,
      marginBottom: 12,
      ...getShadow(2, '#000000', 0.04),
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    photo: {
      width: 52,
      height: 52,
      borderRadius: 26,
    },
    infoCol: {
      flex: 1,
      gap: 3,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    typeBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    socialBadge: {
      backgroundColor: '#EFF6FF',
    },
    socialBadgeText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(10),
      color: '#1E40AF',
    },
    familyBadge: {
      backgroundColor: '#F5F3FF',
    },
    familyBadgeText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(10),
      color: '#6D28D9',
    },
    partyBadge: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    partyBadgeText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(10),
      color: '#D97706',
    },
    nameText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(15),
      color: theme.colors.text || '#0F172A',
    },
    professionText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12),
      color: theme.colors.textSecondary || '#475569',
    },
    areaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    areaText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary || '#64748B',
      flex: 1,
    },
    quickContactCol: {
      gap: 8,
    },
    actionIconBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accordionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.subtleSurface || '#F8FAFC',
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
    },
    accordionLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    accordionTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(12),
      color: theme.colors.text || '#0F172A',
    },
    votersListContainer: {
      marginTop: 8,
      gap: 6,
      paddingLeft: 4,
    },
    emptyVotersText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary || '#64748B',
      fontStyle: 'italic',
      paddingVertical: 6,
    },
    voterItemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface || '#FFFFFF',
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
    },
    voterDetails: {
      flex: 1,
      paddingRight: 8,
    },
    voterNameText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(12),
      color: theme.colors.text || '#0F172A',
    },
    voterMetaText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary || '#64748B',
      marginTop: 1,
    },
    votedBadgeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
    },
    votedActive: {
      backgroundColor: '#F0FDF4',
      borderColor: '#BBF7D0',
    },
    votedInactive: {
      backgroundColor: '#F8FAFC',
      borderColor: '#E2E8F0',
    },
    votedBadgeText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10),
    },
    votedTextActive: {
      color: '#15803D',
    },
    votedTextInactive: {
      color: '#64748B',
    },
  });
