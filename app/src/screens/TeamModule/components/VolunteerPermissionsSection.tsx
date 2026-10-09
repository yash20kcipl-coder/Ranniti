import React from 'react';
import { Theme } from '../../../constants/theme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { View, Text, StyleSheet } from 'react-native';
import { FontFamily } from '../../../utils/typography';
import { TeamMember } from '../../../store/reducers/team';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

interface VolunteerPermissionsSectionProps {
  member: TeamMember;
  t: (key: any) => string;
  theme: Theme;
}

const SCREEN_NAME_MAP: Record<string, { label: string; icon: string }> = {
  voter_search: { label: 'Voters Directory', icon: 'account-search-outline' },
  family_tree: { label: 'Family Mapping', icon: 'account-group-outline' },
  survey: { label: 'Field Survey', icon: 'clipboard-text-outline' },
  booth_analytics: { label: 'Booth Analytics', icon: 'chart-bar' },
  gate_meetings: { label: 'Influencer Mapping', icon: 'star-outline' },
  team_management: { label: 'Cadre Management', icon: 'shield-account-outline' },
};

export const VolunteerPermissionsSection: React.FC<VolunteerPermissionsSectionProps> = ({
  member,
  t,
  theme,
}) => {
  const screens = member.accessibleTabs?.mobileScreens || [];

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.titleRow}>
        <MaterialDesignIcons name="shield-check-outline" size={18} color={theme.colors.primary} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('screenAccess')}
        </Text>
      </View>

      <View style={styles.screensGrid}>
        {screens.length > 0 ? (
          screens.map((screenKey) => {
            const meta = SCREEN_NAME_MAP[screenKey] || {
              label: screenKey.replace(/_/g, ' '),
              icon: 'cellphone',
            };

            return (
              <View
                key={screenKey}
                style={[styles.screenPill, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}
              >
                <MaterialDesignIcons name={meta.icon as any} size={14} color={theme.colors.primary} />
                <Text style={[styles.screenText, { color: theme.colors.text }]} numberOfLines={1}>
                  {meta.label}
                </Text>
              </View>
            );
          })
        ) : (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Standard permissions assigned
          </Text>
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
    marginBottom: 16,
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
  screensGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  screenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  screenText: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(12),
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(12),
    fontStyle: 'italic',
  },
});
