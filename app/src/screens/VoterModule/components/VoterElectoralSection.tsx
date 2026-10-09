import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { FontFamily } from '../../../utils/typography';
import { rfValue } from '../../../utils/responsive';
import { getShadow } from '../../../utils/shadow';
import { Theme } from '../../../constants/theme';
import { Voter } from '../../../store/reducers/voters';

interface VoterElectoralSectionProps {
  voter: Voter;
  t: (key: any) => string;
  theme: Theme;
}

export const VoterElectoralSection: React.FC<VoterElectoralSectionProps> = ({ voter, t, theme }) => {
  const boothDisplay = voter.boothName || (voter.boothNumber ? `Booth #${voter.boothNumber}` : (voter.boothNo || '—'));

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Section Header */}
      <View style={styles.titleRow}>
        <View style={[styles.titleIconBox, { backgroundColor: theme.colors.primary + '15' }]}>
          <MaterialDesignIcons name="office-building-marker-outline" size={18} color={theme.colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('electoralInfo')}
        </Text>
      </View>

      {/* Primary Electoral Card Highlights */}
      <View style={[styles.highlightRow, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
        <View style={styles.highlightCol}>
          <Text style={[styles.highlightLabel, { color: theme.colors.textSecondary }]}>
            {t('epicNumber')}
          </Text>
          <Text style={[styles.highlightValue, { color: theme.colors.text }]}>
            {voter.epicNo || '—'}
          </Text>
        </View>

        <View style={styles.highlightDivider} />

        <View style={styles.highlightCol}>
          <Text style={[styles.highlightLabel, { color: theme.colors.textSecondary }]}>
            {t('serialNumber')}
          </Text>
          <Text style={[styles.highlightValue, { color: theme.colors.primary }]}>
            {voter.serialNo ? `#${voter.serialNo}` : '—'}
          </Text>
        </View>
      </View>

      {/* Grid of Electoral Info */}
      <View style={styles.grid}>
        {/* Assembly Constituency (AC) */}
        <View style={[styles.tile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
          <View style={styles.tileHeader}>
            <MaterialDesignIcons name="crosshairs-gps" size={15} color={theme.colors.textSecondary} />
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              {t('assemblyConstituency')}
            </Text>
          </View>
          <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={1}>
            {voter.acName || '—'}
          </Text>
        </View>

        {/* Parliamentary Constituency (PC) */}
        <View style={[styles.tile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
          <View style={styles.tileHeader}>
            <MaterialDesignIcons name="map-outline" size={15} color={theme.colors.textSecondary} />
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('parliamentaryConstituency') || 'PC'}</Text>
          </View>
          <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={1}>
            {voter.pcName || '—'}
          </Text>
        </View>

        {/* Section Number */}
        <View style={[styles.tile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
          <View style={styles.tileHeader}>
            <MaterialDesignIcons name="format-list-numbered" size={15} color={theme.colors.textSecondary} />
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('sectionNo')}</Text>
          </View>
          <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={1}>
            {voter.sectionNo || '—'}
          </Text>
        </View>

        {/* Ward Number */}
        <View style={[styles.tile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
          <View style={styles.tileHeader}>
            <MaterialDesignIcons name="home-city-outline" size={15} color={theme.colors.textSecondary} />
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('ward') || 'Ward'}</Text>
          </View>
          <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={1}>
            {voter.wardNo || '—'}
          </Text>
        </View>

        {/* Polling Station / Booth Full Tile */}
        <View style={[styles.fullTile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
          <View style={styles.tileHeader}>
            <MaterialDesignIcons name="office-building" size={15} color={theme.colors.primary} />
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              {t('pollingStation')}
            </Text>
          </View>
          <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={2}>
            {boothDisplay}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    ...getShadow(2, '#000000', 0.05),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(14.5),
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  highlightCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  highlightLabel: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(10.5),
  },
  highlightValue: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13.5),
  },
  highlightDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '48.2%',
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  fullTile: {
    width: '100%',
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(11),
  },
  value: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13),
  },
});
