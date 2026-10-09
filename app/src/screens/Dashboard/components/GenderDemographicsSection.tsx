import React, { memo } from 'react';
import { useLanguage } from '../../../languages';
import { PieChart } from 'react-native-chart-kit';
import { rfValue } from '../../../utils/responsive';
import { SectionContainer } from './SectionContainer';
import { FontFamily } from '../../../utils/typography';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Users, Calendar, Activity } from 'lucide-react-native';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';

export interface GenderDemographicsProps {
  genderData?: {
    male: number;
    female: number;
    other: number;
  };
  ageData?: {
    youth: number; // 18-30
    adult: number; // 31-50
    senior: number; // 50+
  };
  turnoutData?: {
    votedCount: number;
    totalVoters: number;
  };
  onPressGender?: () => void;
  onPressAge?: () => void;
  onPressTurnout?: () => void;
}

const screenWidth = Dimensions.get('window').width - 48;

export const GenderDemographicsSection: React.FC<GenderDemographicsProps> = memo(({
  onPressAge,
  onPressGender,
  onPressTurnout,
  ageData = { youth: 0, adult: 0, senior: 0 },
  genderData = { male: 0, female: 0, other: 0 },
  turnoutData = { votedCount: 0, totalVoters: 0 },
}) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme(() => ({}));

  const maleCount = genderData.male;
  const femaleCount = genderData.female;
  const otherCount = genderData.other;
  const totalGender = maleCount + femaleCount + otherCount || 1;

  const malePercent = Math.round((maleCount / totalGender) * 100);
  const femalePercent = Math.round((femaleCount / totalGender) * 100);
  const otherPercent = (100 - malePercent - femalePercent);

  const votedPercent = turnoutData.totalVoters > 0
    ? Math.round((turnoutData.votedCount / turnoutData.totalVoters) * 100)
    : 0;

  const pieChartData = [
    {
      name: t('male'),
      population: maleCount,
      color: '#2563EB',
      legendFontColor: '#475569',
      legendFontSize: rfValue(10.5),
    },
    {
      name: t('female'),
      population: femaleCount,
      color: '#EC4899',
      legendFontColor: '#475569',
      legendFontSize: rfValue(10.5),
    },
    {
      name: t('otherGender'),
      population: otherCount,
      color: '#8B5CF6',
      legendFontColor: '#475569',
      legendFontSize: rfValue(10.5),
    },
  ];

  const ageChartData = [
    {
      name: 'Youth (18-30)',
      population: ageData.youth,
      color: '#10B981',
      legendFontColor: '#475569',
      legendFontSize: rfValue(10.5),
    },
    {
      name: 'Adult (31-50)',
      population: ageData.adult,
      color: '#0284C7',
      legendFontColor: '#475569',
      legendFontSize: rfValue(10.5),
    },
    {
      name: 'Senior (50+)',
      population: ageData.senior,
      color: '#F59E0B',
      legendFontColor: '#475569',
      legendFontSize: rfValue(10.5),
    },
  ];

  const totalAgeVoters = ageData.youth + ageData.adult + ageData.senior;

  return (
    <View style={styles.outerWrapper}>
      {/* 1. Gender Demographics Section */}
      <SectionContainer
        accentColor="#2563EB"
        onPressHeader={onPressGender}
        subtitle={t('genderSubtitle')}
        title={t('genderDemographics')}
        icon={<Users {...({ size: 18, color: '#2563EB' } as any)} />}
      >
        <TouchableOpacity
          onPress={onPressGender}
          style={styles.container}
          activeOpacity={onPressGender ? 0.85 : 1}
        >
          {/* Pie Chart Representation */}
          <View style={styles.chartWrapper}>
            <PieChart
              data={pieChartData}
              width={screenWidth}
              height={160}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute
            />
          </View>
        </TouchableOpacity>
      </SectionContainer>

      {/* 2. Age Group Demographics Section */}
      <SectionContainer
        title={t('ageGroupAnalytics')}
        subtitle={t('ageGroupSubtitle')}
        icon={<Calendar {...({ size: 18, color: '#10B981' } as any)} />}
        accentColor="#10B981"
        onPressHeader={onPressAge}
      >
        <TouchableOpacity
          activeOpacity={onPressAge ? 0.85 : 1}
          onPress={onPressAge}
          style={styles.container}
        >
          {/* Donut Chart Representation */}
          <View style={styles.chartWrapper}>
            <PieChart
              data={ageChartData}
              width={screenWidth}
              height={165}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute
            />
            {/* Donut Hole Overlay */}
            <View style={styles.donutCenter}>
              <Text style={styles.donutCenterValue}>{totalAgeVoters.toLocaleString()}</Text>
              <Text style={styles.donutCenterLabel}>{t('total') || 'Total'}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </SectionContainer>

      {/* 3. Real-time Voting Turnout Section */}
      <SectionContainer
        accentColor="#F59E0B"
        title={t('turnoutAnalytics')}
        onPressHeader={onPressTurnout}
        subtitle={t('turnoutSubtitle')}
        icon={<Activity {...({ size: 18, color: '#F59E0B' } as any)} />}
      >
        <TouchableOpacity
          onPress={onPressTurnout}
          style={styles.container}
          activeOpacity={onPressTurnout ? 0.85 : 1}
        >
          <View style={styles.turnoutHeader}>
            <Text style={[styles.turnoutLabel, { color: theme.colors.text || '#0F172A' }]}>
              Voted: <Text style={styles.boldText}>{turnoutData.votedCount.toLocaleString()}</Text> ({votedPercent}%)
            </Text>
            <Text style={[styles.turnoutLabel, { color: theme.colors.textSecondary || '#64748B' }]}>
              Total Voters: <Text style={styles.boldText}>{turnoutData.totalVoters.toLocaleString()}</Text>
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressSegment,
                { flex: turnoutData.votedCount, backgroundColor: '#10B981' },
              ]}
            />
            <View
              style={[
                styles.progressSegment,
                {
                  flex: turnoutData.totalVoters - turnoutData.votedCount,
                  backgroundColor: '#E2E8F0',
                },
              ]}
            />
          </View>
        </TouchableOpacity>
      </SectionContainer>
    </View>
  );
});

export default GenderDemographicsSection;

const styles = StyleSheet.create({
  outerWrapper: {
    gap: 16,
  },
  container: {
    gap: 12,
    marginTop: 4,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    position: 'relative',
  },
  donutCenter: {
    position: 'absolute',
    left: (screenWidth / 4) - 25,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  donutCenterValue: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(10.5),
    color: '#0F172A',
  },
  donutCenterLabel: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(8.5),
    color: '#64748B',
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
  statGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statTitle: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(10.5),
    color: '#475569',
  },
  ageCategoryTitle: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(10.5),
    color: '#334155',
  },
  statValue: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13),
    color: '#0F172A',
    marginTop: 2,
  },
  statPercent: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(10),
    color: '#64748B',
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
});
