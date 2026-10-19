import React, { memo } from 'react';
import { Activity } from 'lucide-react-native';
import { useLanguage } from '../../../languages';
import { rfValue } from '../../../utils/responsive';
import { SectionContainer } from './SectionContainer';
import { FontFamily } from '../../../utils/typography';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface TurnoutAnalyticsProps {
  electionName?: string;
  turnoutData?: {
    votedCount: number;
    totalVoters: number;
  };
  onPressTurnout?: () => void;
}

export const TurnoutAnalyticsSection: React.FC<TurnoutAnalyticsProps> = memo(({
  electionName,
  turnoutData = { votedCount: 0, totalVoters: 0 },
  onPressTurnout,
}) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme(() => ({}));

  // If there is no active election, do not display turnout analytics
  if (!electionName) {
    return null;
  }

  const votedCount = turnoutData?.votedCount || 0;
  const totalVoters = turnoutData?.totalVoters || 0;
  const votedPercent = totalVoters > 0
    ? Math.round((votedCount / totalVoters) * 100)
    : 0;
  const remainingCount = Math.max(totalVoters - votedCount, 0);

  const liveBadge = (
    <View style={styles.liveBadge}>
      <View style={styles.pulseDot} />
      <Text style={styles.liveBadgeText}>{t('live')}</Text>
    </View>
  );

  return (
    <SectionContainer
      accentColor="#F59E0B"
      title={electionName || t('turnoutAnalytics')}
      subtitle={t('turnoutSubtitle')}
      rightElement={liveBadge}
      onPressHeader={onPressTurnout}
      icon={<Activity {...({ size: 18, color: '#F59E0B' } as any)} />}
    >
      <TouchableOpacity
        onPress={onPressTurnout}
        style={styles.container}
        activeOpacity={onPressTurnout ? 0.85 : 1}
      >
        <View style={styles.turnoutHeader}>
          <Text style={[styles.turnoutLabel, { color: theme.colors.text || '#0F172A' }]}>
            {t('voted')}: <Text style={styles.boldText}>{votedCount.toLocaleString()}</Text> ({votedPercent}%)
          </Text>
          <Text style={[styles.turnoutLabel, { color: theme.colors.textSecondary || '#64748B' }]}>
            {t('totalVoters')}: <Text style={styles.boldText}>{totalVoters.toLocaleString()}</Text>
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressSegment,
              { flex: Math.max(votedCount, 0), backgroundColor: '#10B981' },
            ]}
          />
          <View
            style={[
              styles.progressSegment,
              {
                flex: totalVoters === 0 ? 1 : remainingCount,
                backgroundColor: '#E2E8F0',
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    </SectionContainer>
  );
});

export default TurnoutAnalyticsSection;

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingVertical: 2,
  },
  turnoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  turnoutLabel: {
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
  progressSegment: {
    height: '100%',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  liveBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(9.5),
    color: '#065F46',
    letterSpacing: 0.5,
  },
});
