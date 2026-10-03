import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'lucide-react-native';
import { SectionContainer } from './SectionContainer';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { useLanguage } from '../../../languages';

interface PoliticalViewsSectionProps {
  politicalViews: {
    markedTotal: number;
    pendingTotal: number;
    favorable: number;
    neutral: number;
    unfavorable: number;
    opposite: number;
  };
  subtitle?: string;
}

export const PoliticalViewsSection: React.FC<PoliticalViewsSectionProps> = ({
  politicalViews,
  subtitle,
}) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme(() => ({}));

  const marked = politicalViews?.markedTotal || 0;
  const pending = politicalViews?.pendingTotal || 0;
  const total = marked + pending;
  const percentMarked = total > 0 ? Math.round((marked / total) * 100) : 0;

  return (
    <SectionContainer
      title={t('politicalViewChart')}
      subtitle={subtitle || t('politicalViewSubtitle')}
      icon={<PieChart {...({ size: 18, color: '#8B5CF6' } as any)} />}
      accentColor="#8B5CF6"
    >
      <View style={styles.container}>
        {/* Analytics Progress Bar Wrapper */}
        <View style={styles.chartBarWrapper}>
          <View style={styles.barHeader}>
            <Text style={[styles.barLabel, { color: theme.colors.text || '#0F172A' }]}>
              {t('markedVoters')}: <Text style={styles.boldText}>{marked.toLocaleString()}</Text> ({percentMarked}%)
            </Text>
            <Text style={[styles.barLabel, { color: theme.colors.textSecondary || '#64748B' }]}>
              {t('pendingVoters')}: <Text style={styles.boldText}>{pending.toLocaleString()}</Text>
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { flex: marked > 0 ? marked : 0.0001, backgroundColor: '#8B5CF6' },
              ]}
            />
            <View
              style={[
                styles.progressPending,
                { flex: pending > 0 ? pending : 0.0001, backgroundColor: '#E2E8F0' },
              ]}
            />
          </View>
        </View>

        {/* Sentiment Category Grid Chips */}
        <View style={styles.politicalViewsGrid}>
          <View style={[styles.pvChip, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.pvLabel} numberOfLines={1}>
              {t('favorable')}: <Text style={styles.chipVal}>{(politicalViews?.favorable || 0).toLocaleString()}</Text>
            </Text>
          </View>

          <View style={[styles.pvChip, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.pvLabel} numberOfLines={1}>
              {t('neutral')}: <Text style={styles.chipVal}>{(politicalViews?.neutral || 0).toLocaleString()}</Text>
            </Text>
          </View>

          <View style={[styles.pvChip, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.pvLabel} numberOfLines={1}>
              {t('unfavorable')}: <Text style={styles.chipVal}>{(politicalViews?.unfavorable || 0).toLocaleString()}</Text>
            </Text>
          </View>

          <View style={[styles.pvChip, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
            <View style={[styles.dot, { backgroundColor: '#6B7280' }]} />
            <Text style={styles.pvLabel} numberOfLines={1}>
              {t('opposite')}: <Text style={styles.chipVal}>{(politicalViews?.opposite || 0).toLocaleString()}</Text>
            </Text>
          </View>
        </View>
      </View>
    </SectionContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginTop: 4,
  },
  chartBarWrapper: {
    gap: 8,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabel: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(11),
  },
  boldText: {
    fontFamily: FontFamily.bold,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 5,
  },
  progressPending: {
    borderRadius: 5,
  },
  politicalViewsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pvChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '48%',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pvLabel: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(11),
    color: '#334155',
    flex: 1,
  },
  chipVal: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
});
