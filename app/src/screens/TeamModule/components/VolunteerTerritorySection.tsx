import React from 'react';
import { Theme } from '../../../constants/theme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { View, Text, StyleSheet } from 'react-native';
import { FontFamily } from '../../../utils/typography';
import { TeamMember } from '../../../store/reducers/team';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

interface VolunteerTerritorySectionProps {
  member: TeamMember;
  t: (key: any) => string;
  theme: Theme;
}

export const VolunteerTerritorySection: React.FC<VolunteerTerritorySectionProps> = ({
  member,
  t,
  theme,
}) => {
  const booths = member.assignedBooths || [];

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.titleRow}>
        <MaterialDesignIcons name="map-marker-radius-outline" size={18} color={theme.colors.primary} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('assignedJurisdiction')}
        </Text>
      </View>

      <View style={styles.content}>
        {Boolean(member.assignedAcName) && (
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              {t('acName') || 'Assembly Constituency'}:
            </Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {member.assignedAcName}
            </Text>
          </View>
        )}

        <View style={styles.boothSection}>
          <View style={styles.boothHeaderRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              {t('assignedBooths')}
            </Text>
            <View style={[styles.countBadge, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={[styles.countBadgeText, { color: theme.colors.primary }]}>
                {member.assignedBoothsCount || booths.length}
              </Text>
            </View>
          </View>

          {booths.length > 0 ? (
            <View style={styles.boothsGrid}>
              {booths.map((b) => (
                <View
                  key={b.id || String(b.boothNumber)}
                  style={[styles.boothPill, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}
                >
                  <MaterialDesignIcons name="office-building-marker" size={12} color={theme.colors.primary} />
                  <Text style={[styles.boothPillText, { color: theme.colors.text }]} numberOfLines={1}>
                    Booth #{b.boothNumber} {b.name ? `- ${b.name}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyBoothsText, { color: theme.colors.textSecondary }]}>
              {t('noBoothsAssigned')}
            </Text>
          )}
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
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(12),
  },
  value: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13),
  },
  boothSection: {
    gap: 8,
  },
  boothHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(11),
  },
  boothsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  boothPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  boothPillText: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(11.5),
  },
  emptyBoothsText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(12),
    fontStyle: 'italic',
    marginTop: 2,
  },
});
