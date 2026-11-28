import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Award, Trophy, Users, Sparkles, ListChecks, X } from 'lucide-react-native';
import { SafeView, AppHeader, ScrollView, Modal } from '../../components';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useLanguage } from '../../languages';
import { RootState } from '../../store/store';
import {
  fetchMySurveyScoreAction,
  fetchTeamMemberSurveyScoreAction,
} from '../../store/actions/dashboard';
import { getShadow } from '../../utils/shadow';
import { FontFamily } from '../../utils/typography';
import { rfValue } from '../../utils/responsive';
import { SurveyPointsSkeleton } from './components/SurveyPointsSkeleton';
import { MyPointsTab } from './components/MyPointsTab';
import { PointRulesTab } from './components/PointRulesTab';
import { TeamPointsTab } from './components/TeamPointsTab';

type TabKey = 'my' | 'rules' | 'team';
type TimeRangeKey = 'today' | '7d' | '30d' | 'all';

export const SurveyPointsScreen: React.FC<any> = ({ navigation }) => {
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const dispatch = useDispatch<any>();

  const surveyScore = useSelector((state: RootState) => state.dashboard.surveyScore);
  const [activeTab, setActiveTab] = useState<TabKey>('my');
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('30d');
  const [memberModalVisible, setMemberModalVisible] = useState(false);

  const loadData = useCallback(
    (range: TimeRangeKey) => {
      dispatch(fetchMySurveyScoreAction(range));
    },
    [dispatch]
  );

  useEffect(() => {
    loadData(timeRange);
  }, [loadData, timeRange]);

  const handleSelectMember = (memberId: string) => {
    setMemberModalVisible(true);
    dispatch(fetchTeamMemberSurveyScoreAction(memberId));
  };

  const mySummary = surveyScore.myStats?.summary || {
    totalScore: 0,
    votersSurveyed: 0,
    fieldsUpdated: 0,
    contactPoints: 0,
    politicalPoints: 0,
    demographicPoints: 0,
    statusPoints: 0,
  };

  const hasTeam = (surveyScore.teamScores?.length || 0) > 0;

  const timeRanges: { key: TimeRangeKey; label: string }[] = [
    { key: 'today', label: t('today') },
    { key: '7d', label: t('last7Days') },
    { key: '30d', label: t('last30Days') },
    { key: 'all', label: t('allTime') },
  ];

  const tabs: { key: TabKey; label: string; Icon: any; count?: number }[] = [
    { key: 'my', label: t('myPoints'), Icon: Award },
    { key: 'rules', label: t('pointRules'), Icon: ListChecks },
    ...(hasTeam
      ? [{ key: 'team' as TabKey, label: t('myTeamPoints'), Icon: Users, count: surveyScore.teamScores.length }]
      : []),
  ];

  return (
    <SafeView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader
        showBack={true}
        variant="primary"
        statusBar="hidden"
        style={styles.headerShell}
        title={t('surveyPointsTitle')}
        onBack={() => navigation.goBack()}
        bottomContent={
          <View style={styles.heroWrap}>
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroOverline}>{t('totalScore')}</Text>
                <View style={styles.heroScoreRow}>
                  <Text style={styles.heroScoreValue}>{mySummary.totalScore}</Text>
                  <Text style={styles.heroScoreUnit}>{t('ptsSuffix')}</Text>
                </View>
              </View>

              <View style={styles.goldRankPill}>
                <Trophy size={13} color="#0F172A" />
                <Text style={styles.goldRankText}>
                  #{surveyScore.rank || 1} {t('campaignRank')}
                </Text>
              </View>
            </View>

            <View style={styles.heroMetaRow}>
              <View style={styles.heroStatItem}>
                <Sparkles size={13} color="#FDE047" />
                <Text style={styles.heroStatText}>
                  {mySummary.votersSurveyed} {t('votersSurveyed')}
                </Text>
              </View>
              <Text style={styles.heroDot}>•</Text>
              <View style={styles.heroStatItem}>
                <Award size={13} color="rgba(255,255,255,0.85)" />
                <Text style={styles.heroStatText}>
                  {mySummary.fieldsUpdated} {t('fieldsEnriched')}
                </Text>
              </View>
            </View>

            {/* Integrated Time Range Pills */}
            <View style={styles.rangeRow}>
              {timeRanges.map((r) => {
                const active = timeRange === r.key;
                return (
                  <TouchableOpacity
                    key={r.key}
                    activeOpacity={0.8}
                    onPress={() => setTimeRange(r.key)}
                    style={[
                      styles.rangePill,
                      active ? styles.rangePillActive : styles.rangePillInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.rangeText,
                        active
                          ? { color: theme.colors.primary }
                          : styles.rangeTextInactive,
                      ]}
                      numberOfLines={1}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
      />
      <View style={styles.tabWrapper}>
        <View
          style={[
            styles.tabBar,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              ...getShadow(4, theme.colors.shadowColor, 0.1),
            },
          ]}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            const IconComp = tab.Icon;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.82}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tabItem,
                  active && { backgroundColor: theme.colors.primary },
                ]}
              >
                <IconComp size={14} color={active ? '#FFFFFF' : theme.colors.textSecondary} />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: active ? '#FFFFFF' : theme.colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                  {tab.count !== undefined ? ` (${tab.count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>


      {surveyScore.loading && !surveyScore.myStats ? (
        <SurveyPointsSkeleton />
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshApi={() => loadData(timeRange)}
          contentContainerStyle={styles.content}
        >

          {/* Tab Content */}
          {activeTab === 'my' && (
            <MyPointsTab stats={surveyScore.myStats} theme={theme} t={t} />
          )}
          {activeTab === 'rules' && (
            <PointRulesTab rules={surveyScore.rules} theme={theme} t={t} />
          )}
          {activeTab === 'team' && (
            <TeamPointsTab
              teamScores={surveyScore.teamScores}
              onSelectMember={handleSelectMember}
              theme={theme}
              t={t}
            />
          )}
        </ScrollView>
      )}

      {/* Subordinate Scorecard Modal */}
      <Modal
        visible={memberModalVisible}
        onDismiss={() => setMemberModalVisible(false)}
        contentContainerStyle={[
          styles.memberModalBox,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.memberModalHeader}>
          <Text style={[styles.memberModalTitle, { color: theme.colors.text }]}>
            {surveyScore.selectedMemberStats?.volunteer?.name || t('myTeamPoints')}
          </Text>
          <TouchableOpacity
            onPress={() => setMemberModalVisible(false)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        {surveyScore.memberLoading ? (
          <View style={styles.modalLoading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.memberModalScroll}>
            <MyPointsTab stats={surveyScore.selectedMemberStats} theme={theme} t={t} />
          </ScrollView>
        )}
      </Modal>
    </SafeView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerShell: {
    paddingBottom: 35,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 10,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroOverline: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: rfValue(10.5),
    fontFamily: FontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  heroScoreValue: {
    color: '#FFFFFF',
    fontSize: rfValue(32),
    fontFamily: FontFamily.bold,
  },
  heroScoreUnit: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: rfValue(14),
    fontFamily: FontFamily.medium,
  },
  goldRankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FACC15',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 22,
  },
  goldRankText: {
    color: '#0F172A',
    fontSize: rfValue(11.5),
    fontFamily: FontFamily.bold,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroStatText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: rfValue(11.5),
    fontFamily: FontFamily.medium,
  },
  heroDot: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: rfValue(12),
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 2,
  },
  rangePill: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 9,
    alignItems: 'center',
  },
  rangePillActive: {
    backgroundColor: '#FFFFFF',
  },
  rangePillInactive: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  rangeText: {
    fontSize: rfValue(10.5),
    fontFamily: FontFamily.bold,
  },
  rangeTextInactive: {
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    marginTop: -50,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 32,
    gap: 14,
  },
  tabWrapper: {
    marginTop: -25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    width: null,
    flexShrink: 1,
    flexDirection: 'row',
    padding: 5,
    borderRadius: 50,
    borderWidth: .5,
    zIndex: 2000,
    gap: 4,
  },
  tabItem: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  tabLabel: {
    fontSize: rfValue(11.5),
    fontFamily: FontFamily.bold,
  },
  modalLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  memberModalBox: {
    borderRadius: 20,
    padding: 16,
    maxHeight: '82%',
    width: '92%',
  },
  memberModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberModalTitle: {
    fontSize: rfValue(16),
    fontFamily: FontFamily.bodyBold,
  },
  memberModalScroll: {
    maxHeight: 440,
  },
});

export default SurveyPointsScreen;
