import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../../constants/theme';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { getShadow } from '../../../utils/shadow';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { ProfileInfoTile } from './ProfileInfoTile';

interface ProfileJurisdictionSectionProps {
  user: any;
  t: (key: any) => string;
  theme: Theme;
}

export const ProfileJurisdictionSection: React.FC<ProfileJurisdictionSectionProps> = ({
  user,
  t,
  theme,
}) => {
  const pc = user?.assignedPc || user?.assignedPcName || 'All Constituencies';
  const area = user?.assignedArea || user?.assignedWard || 'Constituency Wide';
  const booths = (user?.assignedBoothIds?.length ? `${user.assignedBoothIds.length} Booths` : 'All Booths');
  const parentLeader = user?.parentLeaderName || (user?.parentLeaderId ? `Leader #${user.parentLeaderId}` : null);

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={[styles.headerIconBox, { backgroundColor: theme.colors.primary + '15' }]}>
          <MaterialDesignIcons name="office-building-marker-outline" size={18} color={theme.colors.primary} />
        </View>
        <View style={styles.headerTextCol}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('jurisdictionDetails')}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            {t('jurisdictionSubtitle')}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        {/* Parliamentary Constituency */}
        <ProfileInfoTile
          label={t('assignedPcLabel')}
          value={pc}
          icon="city-variant-outline"
          iconColor="#2563EB"
          iconBg="#EFF6FF"
          theme={theme}
        />

        {/* Assigned Booths */}
        <ProfileInfoTile
          label={t('assignedBoothsLabel')}
          value={booths}
          icon="vote-outline"
          iconColor="#059669"
          iconBg="#ECFDF5"
          style={styles.flex1}
          theme={theme}
        />

        {/* Assigned Area / Ward */}
        <ProfileInfoTile
          label={t('assignedAreaLabel')}
          value={area}
          icon="map-marker-outline"
          iconColor="#EA580C"
          iconBg="#FFF7ED"
          style={styles.flex1}
          theme={theme}
        />

        {/* Reporting Leader if present */}
        {Boolean(parentLeader) && (
          <ProfileInfoTile
            label={t('parentLeaderLabel')}
            value={parentLeader}
            icon="account-tie-outline"
            iconColor="#DB2777"
            iconBg="#FDF2F8"
            theme={theme}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    ...getShadow(2, '#000000', 0.04),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(15),
  },
  sectionSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(11),
    marginTop: 1,
  },
  grid: {
    gap: 10,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
});
