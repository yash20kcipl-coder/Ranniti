import React from 'react';
import { Theme } from '../../../constants/theme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { TeamMember } from '../../../store/reducers/team';
import { SafeImage } from '../../../components/SafeImage';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { handleCall, handleWhatsApp, handleEmail } from '../../../utils/linkingUtils';

interface VolunteerDetailHeaderProps {
  member: TeamMember;
  t: (key: any) => string;
  theme: Theme;
}

export const VolunteerDetailHeader: React.FC<VolunteerDetailHeaderProps> = ({
  member,
  t,
  theme,
}) => {
  const isActive = member.status === 'active' || member.status === 'Active';

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.topRow}>
        <SafeImage
          src={member.avatar}
          placeholderType="avatar"
          name={member.name}
          alt={member.name}
          style={styles.avatar}
          containerStyles={styles.avatarContainer}
        />

        <View style={styles.infoCol}>
          <Text style={[styles.nameText, { color: theme.colors.text }]} numberOfLines={1}>
            {member.name}
          </Text>

          {/* Badges: Role & Active Status */}
          <View style={styles.badgeRow}>
            <View style={[styles.roleBadge, { backgroundColor: theme.colors.primary + '15' }]}>
              <MaterialDesignIcons name="shield-account" size={12} color={theme.colors.primary} />
              <Text style={[styles.roleBadgeText, { color: theme.colors.primary }]}>
                {member.roleName || member.role}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isActive ? '#DCFCE7' : '#FEE2E2' },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isActive ? '#15803D' : '#B91C1C' },
                ]}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: isActive ? '#15803D' : '#B91C1C' },
                ]}
              >
                {isActive ? t('activeStatus') : t('inactiveStatus')}
              </Text>
            </View>
          </View>

          {Boolean(member.createdAt) && (
            <Text style={[styles.joinedText, { color: theme.colors.textSecondary }]}>
              {t('joinedOn')}: {new Date(member.createdAt!).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.quickActionsRow}>
        {Boolean(member.mobile) && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleCall(member.mobile)}
            style={[styles.actionBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
          >
            <MaterialDesignIcons name="phone" size={16} color="#1D4ED8" />
            <Text style={[styles.actionBtnText, { color: '#1D4ED8' }]}>{t('call')}</Text>
          </TouchableOpacity>
        )}

        {Boolean(member.mobile) && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleWhatsApp(member.mobile)}
            style={[styles.actionBtn, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]}
          >
            <MaterialDesignIcons name="whatsapp" size={16} color="#15803D" />
            <Text style={[styles.actionBtnText, { color: '#15803D' }]}>{t('whatsApp')}</Text>
          </TouchableOpacity>
        )}

        {Boolean(member.email) && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleEmail(member.email)}
            style={[styles.actionBtn, { backgroundColor: '#F3E8FF', borderColor: '#E9D5FF' }]}
          >
            <MaterialDesignIcons name="email-outline" size={16} color="#7E22CE" />
            <Text style={[styles.actionBtnText, { color: '#7E22CE' }]}>Email</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    ...getShadow(2, '#000000', 0.05),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  nameText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(17),
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(11.5),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(11),
  },
  joinedText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(11),
    marginTop: 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
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
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(13),
  },
});
