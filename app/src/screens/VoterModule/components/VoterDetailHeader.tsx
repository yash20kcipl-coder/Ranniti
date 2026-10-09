import React from 'react';
import { Theme } from '../../../constants/theme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { Voter } from '../../../store/reducers/voters';
import { SafeImage } from '../../../components/SafeImage';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { openPhoneDialer, openWhatsAppChat } from '../../../utils/linkingUtils';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

interface VoterDetailHeaderProps {
  voter: Voter;
  t: (key: any) => string;
  theme: Theme;
}

export const VoterDetailHeader: React.FC<VoterDetailHeaderProps> = ({ voter, t, theme }) => {
  const hindiName = voter.hindiName || voter.name;
  const englishName = voter.englishName || '';
  const mobile = voter.mobile || voter.mobileNo || '';

  const handleSms = () => {
    if (mobile) {
      const clean = mobile.replace(/[^0-9+]/g, '');
      Linking.openURL(`sms:${clean}`);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Top Profile Row */}
      <View style={styles.topRow}>
        <View style={styles.avatarWrapper}>
          <SafeImage
            uri={voter.image || voter.avatar}
            placeholderType="avatar"
            name={englishName || hindiName}
            style={styles.avatar}
            containerStyles={[
              styles.avatarContainer,
              { borderColor: voter.isVoted ? '#86EFAC' : '#E2E8F0' },
            ]}
          />
          {voter.isVoted && (
            <View style={styles.votedStatusDot}>
              <MaterialDesignIcons name="check" size={11} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.infoCol}>
          <Text style={[styles.nameText, { color: theme.colors.text }]} numberOfLines={1}>
            {hindiName}
          </Text>
          {Boolean(englishName) && (
            <Text style={[styles.engNameText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {englishName}
            </Text>
          )}

          {/* Badges Row: Voting, Party, Living/Deceased, Shifted */}
          <View style={styles.badgeRow}>
            {/* Voted / Not Voted Badge */}
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: voter.isVoted ? '#DCFCE7' : '#FEE2E2',
                  borderColor: voter.isVoted ? '#BBF7D0' : '#FECACA',
                },
              ]}
            >
              <MaterialDesignIcons
                name={voter.isVoted ? 'check-circle' : 'close-circle'}
                size={13}
                color={voter.isVoted ? '#15803D' : '#B91C1C'}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: voter.isVoted ? '#15803D' : '#B91C1C' },
                ]}
              >
                {voter.isVoted ? t('voted') : t('notVoted')}
              </Text>
            </View>

            {/* Supporting Party Badge */}
            {Boolean(voter.supportingParty) && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: theme.colors.primary + '12',
                    borderColor: theme.colors.primary + '30',
                  },
                ]}
              >
                {voter.partySymbol ? (
                  <SafeImage
                    uri={voter.partySymbol}
                    placeholderType="landscape"
                    name={voter.supportingParty}
                    style={styles.partyIconSmall}
                    containerStyles={styles.partyIconContainer}
                  />
                ) : (
                  <MaterialDesignIcons name="flag-variant-outline" size={12} color={theme.colors.primary} />
                )}
                <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
                  {voter.partyAbbreviation || voter.supportingParty}
                </Text>
              </View>
            )}

            {/* Living / Deceased Flag */}
            {Boolean(voter.isDead) && (
              <View style={[styles.badge, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}>
                <MaterialDesignIcons name="skull-crossbones-outline" size={12} color="#64748B" />
                <Text style={[styles.badgeText, { color: '#64748B' }]}>
                  {t('deceased')}
                </Text>
              </View>
            )}

            {/* Shifted Flag */}
            {Boolean(voter.isShifted) && (
              <View style={[styles.badge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                <MaterialDesignIcons name="account-arrow-right-outline" size={12} color="#D97706" />
                <Text style={[styles.badgeText, { color: '#D97706' }]}>
                  {t('shifted')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Influencer Highlight Banner */}
      {(Boolean(voter.isSocialInfluencer) || Boolean(voter.isFamilyInfluencer) || Boolean(voter.isFamilyHead)) && (
        <View style={styles.influencerBanner}>
          {Boolean(voter.isSocialInfluencer) && (
            <View style={[styles.influencerChip, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
              <MaterialDesignIcons name="star-circle" size={15} color="#D97706" />
              <Text style={[styles.influencerChipText, { color: '#B45309' }]}>
                {t('socialInfluencer')}
                {voter.socialInfluencedCount ? ` • ${voter.socialInfluencedCount} ${t('votersCount')}` : ''}
              </Text>
            </View>
          )}

          {Boolean(voter.isFamilyInfluencer || voter.isFamilyHead) && (
            <View style={[styles.influencerChip, { backgroundColor: '#EDE9FE', borderColor: '#DDD6FE' }]}>
              <MaterialDesignIcons name="crown-outline" size={15} color="#7C3AED" />
              <Text style={[styles.influencerChipText, { color: '#6D28D9' }]}>
                {t('familyInfluencer')}
                {voter.familyInfluencedCount ? ` • ${voter.familyInfluencedCount} ${t('votersCount')}` : ''}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Quick Meta Highlight Strip (EPIC, Serial, Booth) */}
      <View style={[styles.metaStrip, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
        <View style={styles.metaCol}>
          <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>{t('epicNumber')}</Text>
          <Text style={[styles.metaValue, { color: theme.colors.text }]}>
            {voter.epicNo || '—'}
          </Text>
        </View>

        <View style={styles.metaDivider} />

        <View style={styles.metaCol}>
          <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>{t('serialNumber')}</Text>
          <Text style={[styles.metaValue, { color: theme.colors.text }]}>
            {voter.serialNo ? `#${voter.serialNo}` : '—'}
          </Text>
        </View>

        <View style={styles.metaDivider} />

        <View style={styles.metaCol}>
          <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>{t('booth')}</Text>
          <Text style={[styles.metaValue, { color: theme.colors.text }]} numberOfLines={1}>
            {voter.boothNumber ? `#${voter.boothNumber}` : (voter.boothNo ? voter.boothNo : '—')}
          </Text>
        </View>
      </View>

      {/* Quick Communication Actions Bar */}
      {Boolean(mobile) && (
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openPhoneDialer(mobile)}
            style={[styles.actionBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#DBEAFE' }]}>
              <MaterialDesignIcons name="phone" size={15} color="#1D4ED8" />
            </View>
            <Text style={[styles.actionBtnText, { color: '#1D4ED8' }]}>{t('call')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              openWhatsAppChat(
                mobile,
                `Namaste ${englishName || hindiName}, greetings from Ranniti.`
              )
            }
            style={[styles.actionBtn, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#BBF7D0' }]}>
              <MaterialDesignIcons name="whatsapp" size={15} color="#15803D" />
            </View>
            <Text style={[styles.actionBtnText, { color: '#15803D' }]}>{t('whatsApp')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSms}
            style={[styles.actionBtn, { backgroundColor: '#F3E8FF', borderColor: '#E9D5FF' }]}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#E9D5FF' }]}>
              <MaterialDesignIcons name="message-text-outline" size={15} color="#7E22CE" />
            </View>
            <Text style={[styles.actionBtnText, { color: '#7E22CE' }]}>{t('sms')}</Text>
          </TouchableOpacity>
        </View>
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
    ...getShadow(2, '#000000', 0.06),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  votedStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    gap: 3,
  },
  nameText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(17),
  },
  engNameText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(13),
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(11),
  },
  partyIconContainer: {
    width: 14,
    height: 14,
  },
  partyIconSmall: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  influencerBanner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  influencerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  influencerChipText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(11.5),
  },
  metaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
  },
  metaCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metaLabel: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(10.5),
  },
  metaValue: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(12.5),
  },
  metaDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(12),
  },
});
