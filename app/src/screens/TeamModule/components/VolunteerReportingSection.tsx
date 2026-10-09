import React from 'react';
import { Theme } from '../../../constants/theme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { View, Text, StyleSheet } from 'react-native';
import { FontFamily } from '../../../utils/typography';
import { TeamMember } from '../../../store/reducers/team';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

interface VolunteerReportingSectionProps {
  member: TeamMember;
  t: (key: any) => string;
  theme: Theme;
}

export const VolunteerReportingSection: React.FC<VolunteerReportingSectionProps> = ({
  member,
  t,
  theme,
}) => {
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.titleRow}>
        <MaterialDesignIcons name="account-tie-outline" size={18} color={theme.colors.primary} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('reportsTo')}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.leaderRow}>
          <View style={[styles.iconBox, { backgroundColor: theme.colors.primary + '15' }]}>
            <MaterialDesignIcons name="account-supervisor" size={20} color={theme.colors.primary} />
          </View>

          <View style={styles.leaderInfo}>
            <Text style={[styles.leaderName, { color: theme.colors.text }]}>
              {member.parentLeaderName || 'Campaign Leadership Team'}
            </Text>
            <Text style={[styles.leaderRole, { color: theme.colors.textSecondary }]}>
              Senior Campaign Coordinator
            </Text>
          </View>
        </View>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(14),
  },
  content: {
    gap: 8,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderInfo: {
    flex: 1,
    gap: 2,
  },
  leaderName: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13.5),
  },
  leaderRole: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(11.5),
  },
});
