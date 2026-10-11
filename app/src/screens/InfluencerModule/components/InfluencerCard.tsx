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
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { toggleVotedStatusAction } from '../../../store/actions/voters';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { openPhoneDialer, openWhatsAppChat } from '../../../utils/linkingUtils';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface InfluencerCardProps {
  item: SocialInfluencer;
}

export const InfluencerCard: React.FC<InfluencerCardProps> = ({ item }) => {
  const { t } = useLanguage();
  const dispatch = useDispatch<any>();
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme, styles } = useAppTheme(createStyles);

  const voters = item.influencedVoters || [];
  const totalInfluenced = item.influencedVotersCount || voters.length;
  const votedCount = voters.filter((v) => v.isVoted).length;
  const turnoutPercent = totalInfluenced > 0 ? Math.round((votedCount / totalInfluenced) * 100) : 0;

  const handleToggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  };

  return (
    <View style={styles.card}>
      {/* Influencer Header Details */}
      <View style={styles.headerRow}>
        <View style={styles.avatarWrapper}>
          <SafeImage
            src={item.photo || item.avatar}
            name={item.name}
            alt={item.name}
            placeholderType="avatar"
            style={styles.photo}
          />
          <View style={styles.starBadgeDot}>
            <MaterialDesignIcons name="star" size={11} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.infoCol}>
          {/* Badges Row */}
          <View style={styles.badgeRow}>
            {item.isSocialInfluencer && (
              <View style={[styles.typeBadge, styles.socialBadge]}>
                <MaterialDesignIcons name="account-star" size={10} color="#4338CA" />
                <Text style={styles.socialBadgeText}>{t('socialInfluencer') || 'Social'}</Text>
              </View>
            )}
            {item.isFamilyInfluencer && (
              <View style={[styles.typeBadge, styles.familyBadge]}>
                <MaterialDesignIcons name="home-account" size={10} color="#B45309" />
                <Text style={styles.familyBadgeText}>{t('familyHead') || 'Family Head'}</Text>
              </View>
            )}
            {Boolean(item.supportingParty) && (
              <View style={[styles.typeBadge, styles.partyBadge]}>
                <Text style={styles.partyBadgeText}>{item.supportingParty}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.nameText, { color: theme.colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>

          <View style={styles.professionRow}>
            <MaterialDesignIcons name="briefcase-outline" size={12} color={theme.colors.textSecondary} />
            <Text style={[styles.professionText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {item.profession || 'Community Leader'}
            </Text>
          </View>

          {Boolean(item.influenceArea) && (
            <View style={styles.areaRow}>
              <MaterialDesignIcons name="map-marker-outline" size={12} color={theme.colors.textSecondary} />
              <Text style={[styles.areaText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {item.influenceArea}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Contact Buttons */}
        <View style={styles.quickContactCol}>
          {Boolean(item.mobile) && (
            <>
              <TouchableOpacity
                style={[styles.actionIconBtn, { backgroundColor: '#EFF6FF' }]}
                onPress={() => openPhoneDialer(item.mobile)}
                activeOpacity={0.75}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <MaterialDesignIcons name="phone-outline" size={15} color="#2563EB" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionIconBtn, { backgroundColor: '#F0FDF4' }]}
                onPress={() => openWhatsAppChat(item.mobile)}
                activeOpacity={0.75}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <MaterialDesignIcons name="whatsapp" size={15} color="#16A34A" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Influenced Voters Accordion Toggle */}
      <TouchableOpacity
        style={[styles.accordionHeader, { backgroundColor: theme.colors.inputBackground }]}
        onPress={handleToggleExpand}
        activeOpacity={0.8}
      >
        <View style={styles.accordionLabelRow}>
          <MaterialDesignIcons name="account-group-outline" size={16} color={theme.colors.primary} />
          <Text style={[styles.accordionTitle, { color: theme.colors.text }]}>
            {t('influencedVoters') || 'Influenced Voters'} ({totalInfluenced})
          </Text>
        </View>

        <View style={styles.accordionRightRow}>
          {totalInfluenced > 0 && (
            <View
              style={[
                styles.turnoutPill,
                {
                  backgroundColor:
                    turnoutPercent === 100
                      ? '#DCFCE7'
                      : turnoutPercent > 0
                        ? '#FEF3C7'
                        : '#F1F5F9',
                },
              ]}
            >
              <Text
                style={[
                  styles.turnoutPillText,
                  {
                    color:
                      turnoutPercent === 100
                        ? '#15803D'
                        : turnoutPercent > 0
                          ? '#B45309'
                          : '#64748B',
                  },
                ]}
              >
                {votedCount}/{totalInfluenced} • {turnoutPercent}%
              </Text>
            </View>
          )}

          <MaterialDesignIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Influenced Voters List */}
      {isExpanded && (
        <View style={styles.votersListContainer}>
          {voters.length === 0 ? (
            <View style={styles.emptyVotersBox}>
              <MaterialDesignIcons name="information-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyVotersText, { color: theme.colors.textSecondary }]}>
                {t('noInfluencedVoters') || 'No voters mapped under this influencer yet.'}
              </Text>
            </View>
          ) : (
            voters.map((voter) => (
              <View
                key={voter.id}
                style={[
                  styles.voterItemCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderLeftColor: voter.isVoted ? '#16A34A' : '#CBD5E1',
                  },
                ]}
              >
                <View style={styles.voterDetails}>
                  <Text style={[styles.voterNameText, { color: theme.colors.text }]} numberOfLines={1}>
                    {voter.name}
                  </Text>
                  <View style={styles.voterMetaRow}>
                    <View style={styles.epicPill}>
                      <Text style={styles.epicText}>{voter.epicNo || 'NO EPIC'}</Text>
                    </View>
                    {Boolean(voter.boothNo) && (
                      <Text style={[styles.boothText, { color: theme.colors.textSecondary }]}>
                        Booth #{voter.boothNo}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Quick actions & Voted status toggle button */}
                <View style={styles.voterActionsRow}>
                  {Boolean(voter.mobile) && (
                    <TouchableOpacity
                      style={styles.voterCallBtn}
                      onPress={() => openPhoneDialer(voter.mobile)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <MaterialDesignIcons name="phone-outline" size={13} color="#2563EB" />
                    </TouchableOpacity>
                  )}

                  {/* Interactive Voted Status Toggle Button */}
                  <TouchableOpacity
                    style={[
                      styles.votedBadgeBtn,
                      voter.isVoted ? styles.votedActive : styles.votedInactive,
                    ]}
                    onPress={() => dispatch(toggleVotedStatusAction(voter.id))}
                    activeOpacity={0.8}
                  >
                    <MaterialDesignIcons
                      name={voter.isVoted ? 'check-circle' : 'circle-outline'}
                      size={13}
                      color={voter.isVoted ? '#15803D' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.votedBadgeText,
                        voter.isVoted ? styles.votedTextActive : styles.votedTextInactive,
                      ]}
                    >
                      {voter.isVoted ? t('voted') || 'VOTED' : t('notVoted') || 'PENDING'}
                    </Text>
                  </TouchableOpacity>
                </View>
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
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      padding: 14,
      marginBottom: 10,
      gap: 12,
      ...getShadow(2, '#000000', 0.04),
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatarWrapper: {
      position: 'relative',
    },
    photo: {
      width: 52,
      height: 52,
      borderRadius: 26,
    },
    starBadgeDot: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#4F46E5',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.surface || '#FFFFFF',
    },
    infoCol: {
      flex: 1,
      gap: 3,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 5,
      marginBottom: 2,
    },
    typeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
    },
    socialBadge: {
      backgroundColor: '#EEF2FF',
    },
    socialBadgeText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(9.5),
      color: '#4338CA',
    },
    familyBadge: {
      backgroundColor: '#FEF3C7',
    },
    familyBadgeText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(9.5),
      color: '#B45309',
    },
    partyBadge: {
      backgroundColor: '#F1F5F9',
    },
    partyBadgeText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(9.5),
      color: '#475569',
    },
    nameText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(15),
      letterSpacing: -0.2,
    },
    professionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    professionText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11.5),
    },
    areaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    areaText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11),
    },
    quickContactCol: {
      flexDirection: 'column',
      gap: 6,
      alignItems: 'center',
    },
    actionIconBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    accordionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    accordionLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    accordionTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(12.5),
    },
    accordionRightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    turnoutPill: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
    },
    turnoutPillText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(10),
    },
    votersListContainer: {
      gap: 8,
      paddingTop: 4,
    },
    emptyVotersBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      padding: 10,
      backgroundColor: 'rgba(0,0,0,0.02)',
      borderRadius: 10,
    },
    emptyVotersText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11.5),
      flex: 1,
    },
    voterItemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderLeftWidth: 3.5,
      gap: 8,
    },
    voterDetails: {
      flex: 1,
      gap: 3,
    },
    voterNameText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13),
    },
    voterMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    epicPill: {
      backgroundColor: '#F1F5F9',
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 6,
    },
    epicText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10),
      color: '#475569',
    },
    boothText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10.5),
    },
    voterActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    voterCallBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    votedBadgeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
    },
    votedActive: {
      backgroundColor: '#DCFCE7',
      borderColor: '#86EFAC',
    },
    votedInactive: {
      backgroundColor: '#F8FAFC',
      borderColor: '#E2E8F0',
    },
    votedBadgeText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(10),
      letterSpacing: 0.3,
    },
    votedTextActive: {
      color: '#15803D',
    },
    votedTextInactive: {
      color: '#64748B',
    },
  });
