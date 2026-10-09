import React from 'react';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { SCREENS } from '../../../navigation/constants';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { SafeImage } from '../../../components/SafeImage';
import { TeamMember } from '../../../store/reducers/team';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { handleCall, handleWhatsApp } from '../../../utils/linkingUtils';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';


interface TeamMemberCardProps {
  member: TeamMember;
  onEdit?: (member: TeamMember) => void;
  onDelete?: (member: TeamMember) => void;
  canManage?: boolean;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  onEdit,
  onDelete,
  canManage = true,
}) => {
  const navigation = useNavigation<any>();
  const { theme } = useAppTheme();

  const screens = member.accessibleTabs?.mobileScreens || [];

  const handlePressCard = () => {
    navigation.navigate(SCREENS.VOLUNTEER_DETAIL, { member });
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
          activeOpacity={0.7}
          onPress={handlePressCard}
        >
          <SafeImage
            alt={member.name}
            name={member.name}
            src={member.avatar}
            style={styles.avatar}
            placeholderType="avatar"
          />

          <View style={styles.infoCol}>
            <Text style={[styles.nameText, { color: theme.colors.text }]} numberOfLines={1}>
              {member.name}
            </Text>

            <View style={styles.contactRow}>
              {Boolean(member.mobile) && (
                <Text style={[styles.subText, { color: theme.colors.textSecondary }]}>
                  {member.mobile}
                </Text>
              )}
              {Boolean(member.mobile && member.email) && (
                <Text style={[styles.dotSep, { color: theme.colors.textSecondary }]}>•</Text>
              )}
              {Boolean(member.email) && (
                <Text style={[styles.subText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {member.email}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Buttons: WhatsApp, Call, Edit, Delete */}
        <View style={styles.actionButtonsCol}>
          {Boolean(member.mobile) && (
            <>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleWhatsApp(member.mobile)}
                style={[styles.circleActionBtn, { backgroundColor: '#DCFCE7' }]}
                accessibilityLabel="WhatsApp"
              >
                <MaterialDesignIcons name="whatsapp" size={16} color="#15803D" />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleCall(member.mobile)}
                style={[styles.circleActionBtn, { backgroundColor: '#EFF6FF' }]}
                accessibilityLabel="Call"
              >
                <MaterialDesignIcons name="phone-outline" size={16} color="#1D4ED8" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>


      {/* Territory & Booth Details */}
      {(Boolean(member.parentLeaderName) || Boolean(member.assignedAcName) || (member.assignedBoothsCount && member.assignedBoothsCount > 0)) && (
        <View style={[styles.territoryRow, { backgroundColor: theme.colors.subtleSurface || '#F8FAFC' }]}>
          <MaterialDesignIcons name={member.parentLeaderName ? "account-tie-outline" : "map-marker-outline"} size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.territoryText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {member.parentLeaderName ? `Reports to: ${member.parentLeaderName}` : ''}
          </Text>
        </View>
      )}

      {/* Bottom Row: Tab Access Badges & Edit / Delete Actions */}
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
        <Text style={[styles.territoryText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {Boolean(member.parentLeaderName && member.assignedAcName) ? `${member.assignedAcName}` : ''}
          {member.assignedBoothsCount !== undefined && member.assignedBoothsCount > 0 ? ` | ${member.assignedBoothsCount} ${member.assignedBoothsCount === 1 ? 'Booth' : 'Booths'}` : ''}
        </Text>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          {Boolean(canManage && onEdit) && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onEdit!(member)}
              accessibilityLabel="Edit member"
              style={[styles.circleActionBtn, { backgroundColor: theme.colors.subtleSurface || '#F1F5F9' }]}
            >
              <MaterialDesignIcons name="edit" size={15} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          {Boolean(canManage && onDelete) && (
            <TouchableOpacity
              activeOpacity={0.8}
              accessibilityLabel="Delete member"
              onPress={() => onDelete!(member)}
              style={[styles.circleActionBtn, { backgroundColor: '#FEE2E2' }]}
            >
              <MaterialDesignIcons name="trash" size={15} color="#DC2626" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 14,
    borderWidth: .5,
    borderRadius: 16,
    ...getShadow(2, '#000000', 0.04),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 24,
  },
  infoCol: {
    flex: 1,
    gap: 1,
  },
  roleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(10.5),
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(9.5),
    textTransform: 'capitalize',
  },
  nameText: {
    fontSize: rfValue(15),
    fontFamily: FontFamily.bold,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  subText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(12),
  },
  dotSep: {
    fontSize: rfValue(10),
  },
  actionButtonsCol: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  circleActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  territoryRow: {
    gap: 6,
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  territoryText: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(12),
    flex: 1,
  },
  tabAccessContainer: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  tabAccessLabel: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(10.5),
  },
  tabBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tabBadgeText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(9.5),
    textTransform: 'capitalize',
  },
});
