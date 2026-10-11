import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useLanguage } from '../../../languages';
import { Theme } from '../../../constants/theme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { SafeImage } from '../../../components/SafeImage';
import type { FamilyGroup } from '../../../store/reducers/familyMapping';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { openPhoneDialer, openWhatsAppChat } from '../../../utils/linkingUtils';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FamilyCardProps {
  item: FamilyGroup;
  isExpanded: boolean;
  onToggle: (familyId: string) => void;
  onToggleVoted: (voterId: string) => void;
}

export const FamilyCard: React.FC<FamilyCardProps> = memo(({
  item,
  isExpanded,
  onToggle,
  onToggleVoted,
}) => {
  const { t } = useLanguage();
  const { theme, styles } = useAppTheme(createStyles);

  const members = item.members || [];
  const totalCount = item.totalMembers || members.length;
  const votedCount = members.filter((m) => m.isVoted).length;
  const allVoted = totalCount > 0 && votedCount === totalCount;
  const noneVoted = votedCount === 0;
  const turnoutPercent = totalCount > 0 ? Math.round((votedCount / totalCount) * 100) : 0;

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle(item.familyId);
  };

  const statusColor = allVoted ? '#16A34A' : noneVoted ? '#94A3B8' : '#D97706';
  const statusBg = allVoted ? '#DCFCE7' : noneVoted ? '#F1F5F9' : '#FEF3C7';

  return (
    <View style={styles.card}>
      {/* Head Header Row */}
      <TouchableOpacity style={styles.headRow} onPress={handleToggle} activeOpacity={0.75}>
        {/* Avatar with Status Ring */}
        <View style={styles.avatarWrapper}>
          <SafeImage
            alt={item.headName}
            src={item.headPhoto}
            placeholderType="avatar"
            style={styles.headPhoto}
          />
          <View style={[styles.statusRing, { borderColor: statusColor }]} />
        </View>

        {/* Name & Info */}
        <View style={styles.headInfo}>
          <View style={styles.badgeRow}>
            <View style={[styles.headBadge, { backgroundColor: '#FEF3C7' }]}>
              <MaterialDesignIcons name="home-account" size={11} color="#B45309" />
              <Text style={styles.headBadgeText}>{t('familyHead') || 'Family Head'}</Text>
            </View>

            <View style={[styles.turnoutBadge, { backgroundColor: statusBg }]}>
              <MaterialDesignIcons name="account-group" size={11} color={statusColor} />
              <Text style={[styles.turnoutBadgeText, { color: statusColor }]}>
                {votedCount}/{totalCount} • {turnoutPercent}%
              </Text>
            </View>
          </View>

          <Text style={[styles.headName, { color: theme.colors.text }]} numberOfLines={1}>
            {item.headName}
          </Text>

          <Text style={[styles.headSub, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {item.headEpic ? `EPIC: ${item.headEpic}` : ''}
            {item.headEpic && item.headMobile ? ' • ' : ''}
            {item.headMobile || ''}
          </Text>
        </View>

        {/* Chevron Indicator */}
        <View style={[styles.chevronBox, { backgroundColor: theme.colors.inputBackground }]}>
          <MaterialDesignIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {/* Address Row */}
      {Boolean(item.address) && (
        <View style={styles.addressRow}>
          <MaterialDesignIcons name="map-marker-outline" size={13} color={theme.colors.textSecondary} />
          <Text style={[styles.addressText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
      )}

      {/* Members Accordion */}
      {isExpanded && (
        <View style={[styles.membersContainer, { backgroundColor: theme.colors.inputBackground }]}>
          <View style={styles.membersHeaderRow}>
            <MaterialDesignIcons name="account-multiple-outline" size={14} color={theme.colors.primary} />
            <Text style={[styles.membersTitle, { color: theme.colors.text }]}>
              {t('familyMembers') || 'Family Members'} ({members.length})
            </Text>
          </View>

          {members.length === 0 ? (
            <Text style={[styles.emptyMembersText, { color: theme.colors.textSecondary }]}>
              {t('noFamilyMembersFound') || 'No members mapped under this family head yet.'}
            </Text>
          ) : (
            members.map((member) => (
              <View
                key={member.id}
                style={[
                  styles.memberRow,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderLeftColor: member.isVoted ? '#16A34A' : '#CBD5E1',
                  },
                ]}
              >
                {/* Member Details */}
                <View style={styles.memberTextCol}>
                  <Text style={[styles.memberName, { color: theme.colors.text }]} numberOfLines={1}>
                    {member.name}
                  </Text>
                  <View style={styles.memberMetaRow}>
                    {Boolean(member.epicNo) && (
                      <View style={styles.epicPill}>
                        <Text style={styles.epicText}>{member.epicNo}</Text>
                      </View>
                    )}
                    <Text style={[styles.memberSub, { color: theme.colors.textSecondary }]}>
                      {member.age ? `${member.age} yrs` : ''}
                      {member.age && member.gender ? ' • ' : ''}
                      {member.gender || ''}
                    </Text>
                  </View>
                </View>

                {/* Quick actions & Voted toggle */}
                <View style={styles.memberActions}>
                  {Boolean(member.mobile) && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#EFF6FF' }]}
                        onPress={() => openPhoneDialer(member.mobile)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <MaterialDesignIcons name="phone-outline" size={13} color="#2563EB" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#F0FDF4' }]}
                        onPress={() => openWhatsAppChat(member.mobile)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <MaterialDesignIcons name="whatsapp" size={13} color="#16A34A" />
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Voted Status Pill Button */}
                  <TouchableOpacity
                    style={[
                      styles.votedBadgeBtn,
                      member.isVoted ? styles.votedActive : styles.votedInactive,
                    ]}
                    onPress={() => onToggleVoted(member.id)}
                    activeOpacity={0.8}
                  >
                    <MaterialDesignIcons
                      name={member.isVoted ? 'check-circle' : 'circle-outline'}
                      size={13}
                      color={member.isVoted ? '#15803D' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.votedBadgeText,
                        member.isVoted ? styles.votedTextActive : styles.votedTextInactive,
                      ]}
                    >
                      {member.isVoted ? t('voted') || 'VOTED' : t('notVoted') || 'PENDING'}
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
});

export default FamilyCard;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 10,
      ...getShadow(2, '#000000', 0.04),
    },
    headRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
    },
    avatarWrapper: {
      position: 'relative',
      width: 50,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headPhoto: {
      width: 46,
      height: 46,
      borderRadius: 23,
    },
    statusRing: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 25,
      borderWidth: 2,
    },
    headInfo: {
      flex: 1,
      gap: 3,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    headBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
    },
    headBadgeText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(9.5),
      color: '#B45309',
    },
    turnoutBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
    },
    turnoutBadgeText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(9.5),
    },
    headName: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(15),
      letterSpacing: -0.2,
    },
    headSub: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11),
    },
    chevronBox: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingBottom: 12,
      marginTop: -4,
    },
    addressText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11),
      flex: 1,
    },
    membersContainer: {
      padding: 12,
      gap: 8,
    },
    membersHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    membersTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(12),
    },
    emptyMembersText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11.5),
      paddingVertical: 8,
      textAlign: 'center',
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderLeftWidth: 3.5,
      gap: 8,
    },
    memberTextCol: {
      flex: 1,
      gap: 3,
    },
    memberName: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13),
    },
    memberMetaRow: {
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
      fontSize: rfValue(9.5),
      color: '#475569',
    },
    memberSub: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10.5),
    },
    memberActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    actionBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
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
