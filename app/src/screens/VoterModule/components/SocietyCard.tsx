import React, { memo } from 'react';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { SocietyGroupItem } from '../../../store/reducers/voters';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Building2, Home, Users, ChevronRight, Vote } from 'lucide-react-native';

export interface SocietyCardProps {
  item: SocietyGroupItem;
  onViewVoters: (societyName: string) => void;
  t: (key: any) => string;
}

export const SocietyCard: React.FC<SocietyCardProps> = memo(({
  item,
  onViewVoters,
  t,
}) => {
  const { theme } = useAppTheme();

  const handlePress = () => {
    onViewVoters(item.societyName);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface || '#FFFFFF',
          borderColor: theme.colors.border || '#E2E8F0',
        },
      ]}
    >
      {/* Top Header Row: Building Icon, Society Name, Total Voters Badge */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: `${theme.colors.primary}12`,
            },
          ]}
        >
          <Building2 size={20} color={theme.colors.primary} />
        </View>

        <View style={styles.headerInfo}>
          <Text
            style={[
              styles.societyName,
              { color: theme.colors.text || '#0F172A' },
            ]}
            numberOfLines={2}
          >
            {item.societyName}
          </Text>

          {/* Booth Info Tag */}
          {item.boothNumbers ? (
            <View style={styles.boothTag}>
              <Vote size={12} color={theme.colors.textSecondary || '#64748B'} />
              <Text
                style={[
                  styles.boothText,
                  { color: theme.colors.textSecondary || '#64748B' },
                ]}
                numberOfLines={1}
              >
                {t('booth') || 'Booth'}: {item.boothNumbers}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Voter Count Pill */}
        <View
          style={[
            styles.voterBadge,
            {
              backgroundColor: `${theme.colors.primary}15`,
              borderColor: `${theme.colors.primary}30`,
            },
          ]}
        >
          <Users size={13} color={theme.colors.primary} />
          <Text style={[styles.voterCountText, { color: theme.colors.primary }]}>
            {item.totalVoters}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View
        style={[
          styles.divider,
          { backgroundColor: theme.colors.border || '#F1F5F9' },
        ]}
      />

      {/* Metrics Row: Households, Male, Female, Action */}
      <View style={styles.bottomRow}>
        <View style={styles.metricsGroup}>
          {/* Households */}
          <View style={styles.metricItem}>
            <Home size={14} color="#64748B" />
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary || '#64748B' }]}>
              {t('households') || 'Households'}:{' '}
              <Text style={[styles.metricValue, { color: theme.colors.text || '#0F172A' }]}>
                {item.totalHouseholds}
              </Text>
            </Text>
          </View>

          {/* Gender Demographics Pills */}
          <View style={styles.genderRow}>
            <View style={[styles.genderPill, { backgroundColor: '#EFF6FF' }]}>
              <Text style={styles.maleText}>
                {t('male') || 'M'}: {item.maleCount}
              </Text>
            </View>
            <View style={[styles.genderPill, { backgroundColor: '#FDF2F8' }]}>
              <Text style={styles.femaleText}>
                {t('female') || 'F'}: {item.femaleCount}
              </Text>
            </View>
          </View>
        </View>

        {/* View Voters CTA */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handlePress}
          style={[
            styles.viewButton,
            {
              backgroundColor: theme.colors.primary,
            },
          ]}
        >
          <Text style={styles.viewButtonText}>
            {t('viewSocietyVoters') || 'View'}
          </Text>
          <ChevronRight size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

export default SocietyCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  societyName: {
    fontSize: rfValue(14),
    fontFamily: FontFamily.bodyBold,
    lineHeight: rfValue(18),
  },
  boothTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  boothText: {
    fontSize: rfValue(11),
    fontFamily: FontFamily.body,
  },
  voterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  voterCountText: {
    fontSize: rfValue(12),
    fontFamily: FontFamily.bold,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricsGroup: {
    flex: 1,
    gap: 4,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: rfValue(11),
    fontFamily: FontFamily.medium,
  },
  metricValue: {
    fontFamily: FontFamily.bold,
  },
  genderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  genderPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  maleText: {
    fontSize: rfValue(10),
    fontFamily: FontFamily.medium,
    color: '#2563EB',
  },
  femaleText: {
    fontSize: rfValue(10),
    fontFamily: FontFamily.medium,
    color: '#DB2777',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 2,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: rfValue(11),
    fontFamily: FontFamily.bodyBold,
  },
});
