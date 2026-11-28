import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal as RNModal, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Phone, Vote, Users, MapPin, History, Award, ArrowRight, ChevronRight, X } from 'lucide-react-native';
import { VolunteerSurveyStatsPayload, SurveyRecentUpdate } from '../../../store/reducers/dashboard';
import { getShadow } from '../../../utils/shadow';
import { FontFamily } from '../../../utils/typography';
import { rfValue } from '../../../utils/responsive';

interface MyPointsTabProps {
  stats: VolunteerSurveyStatsPayload | null;
  theme: any;
  t: (key: any) => string;
}

const FIELD_LABELS: Record<string, string> = {
  mobile_no: 'Mobile Number',
  email: 'Email Address',
  party_id: 'Party Leaning',
  is_family_influencer: 'Family Influencer',
  is_social_influencer: 'Social Influencer',
  caste_id: 'Caste',
  subcaste_name: 'Sub-Caste',
  religion_id: 'Religion',
  profession: 'Profession',
  dob: 'Date of Birth',
  status: 'Voter Status',
  is_dead: 'Deceased Flag',
  full_address: 'Full Address',
  blood_group: 'Blood Group',
  aadhaar_no: 'Aadhaar No',
  pan_no: 'PAN No',
};

export const MyPointsTab: React.FC<MyPointsTabProps> = ({ stats, theme, t }) => {
  const [breakdownVisible, setBreakdownVisible] = useState(false);

  const summary = stats?.summary || {
    totalScore: 0,
    votersSurveyed: 0,
    fieldsUpdated: 0,
    contactPoints: 0,
    politicalPoints: 0,
    demographicPoints: 0,
    statusPoints: 0,
  };
  const fieldEntries = Object.entries(stats?.fieldCounts || {}).sort(([, a], [, b]) => b - a);
  const recentUpdates = stats?.recentUpdates || [];

  const groupedRecent = useMemo(() => {
    const groups: Record<
      string,
      {
        voterId: string;
        voterName: string;
        voterEpicNo: string;
        totalPts: number;
        latestAt: string;
        items: SurveyRecentUpdate[];
      }
    > = {};
    for (const item of recentUpdates) {
      if (!groups[item.voterId]) {
        groups[item.voterId] = {
          voterId: item.voterId,
          voterName: item.voterName,
          voterEpicNo: item.voterEpicNo,
          totalPts: 0,
          latestAt: item.createdAt,
          items: [],
        };
      }
      groups[item.voterId].totalPts += item.pointsAwarded;
      groups[item.voterId].items.push(item);
    }
    return Object.values(groups);
  }, [recentUpdates]);

  const categories = [
    { key: 'contact', label: t('contactPoints'), pts: summary.contactPoints, color: '#10B981', Icon: Phone },
    { key: 'political', label: t('politicalPoints'), pts: summary.politicalPoints, color: '#F59E0B', Icon: Vote },
    { key: 'demographic', label: t('demographicPoints'), pts: summary.demographicPoints, color: '#6366F1', Icon: Users },
    { key: 'status', label: t('statusPoints'), pts: summary.statusPoints, color: '#F43F5E', Icon: MapPin },
  ];

  const totalCatPts = categories.reduce((sum, c) => sum + c.pts, 0);

  return (
    <View style={styles.container}>
      {/* Tappable Score Breakdown Card (opens Field Breakdown bottom sheet) */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setBreakdownVisible(true)}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            ...getShadow(2, theme.colors.shadowColor, 0.05),
          },
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            {t('totalScore')}
          </Text>
          <View style={styles.headerRightTap}>
            <Text style={[styles.totalValueText, { color: theme.colors.primary }]}>
              {summary.totalScore} {t('ptsSuffix')}
            </Text>
            <ChevronRight size={15} color={theme.colors.textSecondary} />
          </View>
        </View>

        {/* Stacked Proportional Bar */}
        <View style={[styles.stackedBarTrack, { backgroundColor: theme.colors.border }]}>
          {totalCatPts > 0 &&
            categories.map((cat) => {
              if (cat.pts <= 0) return null;
              const pct = (cat.pts / totalCatPts) * 100;
              return (
                <View
                  key={cat.key}
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    backgroundColor: cat.color,
                  }}
                />
              );
            })}
        </View>

        {/* Clean 2x2 Legend Grid */}
        <View style={styles.catGrid}>
          {categories.map((cat) => {
            const IconComp = cat.Icon;
            return (
              <View key={cat.key} style={styles.catItem}>
                <View style={[styles.dotIndicator, { backgroundColor: cat.color }]} />
                <IconComp size={13} color={cat.color} />
                <Text style={[styles.catLabel, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {cat.label}
                </Text>
                <Text
                  style={[
                    styles.catPts,
                    { color: cat.pts > 0 ? theme.colors.text : theme.colors.textSecondary },
                  ]}
                >
                  {cat.pts > 0 ? `+${cat.pts}` : '0'}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Subtle Breakdown Hint */}
        <View style={[styles.breakdownHintRow, { paddingTop: 12, borderTopColor: theme.colors.border }]}>
          <View style={styles.breakdownHintLeft}>
            <Award size={13} color={theme.colors.primary} />
            <Text style={[styles.breakdownHintText, { color: theme.colors.primary }]}>
              {t('fieldBreakdown')} ({fieldEntries.length})
            </Text>
          </View>
          <ChevronRight size={14} color={theme.colors.primary} />
        </View>
      </TouchableOpacity>

      {/* Recent Updates (Flat single-level cards, no double border nesting) */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <History size={16} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('recentUpdates')}
          </Text>
        </View>

        {groupedRecent.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('noSurveyUpdatesYet')}
            </Text>
          </View>
        ) : (
          groupedRecent.map((group) => (
            <View
              key={group.voterId}
              style={[
                styles.voterGroupCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  ...getShadow(1, theme.colors.shadowColor, 0.04),
                },
              ]}
            >
              <View
                style={[
                  styles.voterGroupHeader,
                  { borderBottomColor: theme.colors.border },
                ]}
              >
                <View style={styles.voterTitleWrap}>
                  <Text style={[styles.voterName, { color: theme.colors.text }]} numberOfLines={1}>
                    {group.voterName}
                  </Text>
                  {Boolean(group.voterEpicNo) && (
                    <View style={[styles.epicPill, { backgroundColor: theme.colors.background }]}>
                      <Text style={[styles.epicText, { color: theme.colors.textSecondary }]}>
                        {group.voterEpicNo}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.ptsBadge}>
                  <Text style={styles.ptsBadgeText}>
                    +{group.totalPts} {t('ptsSuffix')}
                  </Text>
                </View>
              </View>

              <View style={styles.groupItemsWrap}>
                {group.items.map((item, idx) => (
                  <View
                    key={item.id}
                    style={[
                      styles.groupItemRow,
                      idx < group.items.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View style={styles.changeRow}>
                      <Text style={[styles.fieldLabelText, { color: theme.colors.textSecondary }]}>
                        {item.fieldLabel}
                      </Text>
                      <View style={styles.valPair}>
                        <Text style={[styles.oldValText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                          {item.oldValue || '—'}
                        </Text>
                        <ArrowRight size={11} color={theme.colors.textSecondary} />
                        <Text style={styles.newValText} numberOfLines={1}>
                          {item.newValue || '—'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.itemPtsText}>+{item.pointsAwarded}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Field Breakdown Bottom Sheet Popup */}
      <RNModal
        visible={breakdownVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBreakdownVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setBreakdownVisible(false)}>
          <View style={styles.sheetBackdrop}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.sheetContainer,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <View style={styles.sheetHandle} />
                <View style={styles.sheetHeader}>
                  <View style={styles.sectionHeader}>
                    <Award size={17} color={theme.colors.primary} />
                    <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
                      {t('fieldBreakdown')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setBreakdownVisible(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={styles.sheetScroll}
                  contentContainerStyle={styles.sheetContent}
                >
                  {fieldEntries.length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                      {t('noSurveyUpdatesYet')}
                    </Text>
                  ) : (
                    <View style={styles.fieldChipGrid}>
                      {fieldEntries.map(([fieldKey, count]) => {
                        const label = FIELD_LABELS[fieldKey] || fieldKey.replace(/_/g, ' ');
                        return (
                          <View
                            key={fieldKey}
                            style={[
                              styles.fieldChip,
                              { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                            ]}
                          >
                            <Text style={[styles.fieldName, { color: theme.colors.text }]} numberOfLines={1}>
                              {label}
                            </Text>
                            <View style={[styles.countPill, { backgroundColor: theme.colors.primary + '14' }]}>
                              <Text style={[styles.fieldCount, { color: theme.colors.primary }]}>
                                {count}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </RNModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: rfValue(13.5),
    fontFamily: FontFamily.bodyBold,
  },
  totalValueText: {
    fontSize: rfValue(14),
    fontFamily: FontFamily.bold,
  },
  headerRightTap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breakdownHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  breakdownHintLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownHintText: {
    fontSize: rfValue(11.5),
    fontFamily: FontFamily.bodyBold,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '70%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: rfValue(15),
    fontFamily: FontFamily.bodyBold,
  },
  sheetScroll: {
    maxHeight: 340,
  },
  sheetContent: {
    paddingBottom: 8,
  },
  stackedBarTrack: {
    height: 8,
    borderRadius: 99,
    flexDirection: 'row',
    overflow: 'hidden',
    gap: 1.5,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  catItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  catLabel: {
    flex: 1,
    fontSize: rfValue(11.5),
    fontFamily: FontFamily.medium,
  },
  catPts: {
    fontSize: rfValue(12),
    fontFamily: FontFamily.bodyBold,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: rfValue(13.5),
    fontFamily: FontFamily.bodyBold,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  emptyText: {
    fontSize: rfValue(12),
    fontFamily: FontFamily.body,
    textAlign: 'center',
    paddingVertical: 6,
  },
  fieldChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  fieldChip: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: .5,
    gap: 6,
  },
  fieldName: {
    flex: 1,
    fontSize: rfValue(11.5),
    fontFamily: FontFamily.medium,
    textTransform: 'capitalize',
  },
  countPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  fieldCount: {
    fontSize: rfValue(11),
    fontFamily: FontFamily.bodyBold,
  },
  recentSection: {
    gap: 10,
  },
  voterGroupCard: {
    borderWidth: .5,
    borderRadius: 18,
    overflow: 'hidden',
  },
  voterGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  voterTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minWidth: 0,
  },
  voterName: {
    fontSize: rfValue(12.5),
    fontFamily: FontFamily.bodyBold,
    flexShrink: 1,
  },
  epicPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  epicText: {
    fontSize: rfValue(9.5),
    fontFamily: FontFamily.medium,
  },
  groupItemsWrap: {
    paddingHorizontal: 14,
  },
  groupItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    gap: 8,
  },
  changeRow: {
    flex: 1,
    gap: 2,
  },
  fieldLabelText: {
    fontSize: rfValue(10.5),
    fontFamily: FontFamily.medium,
  },
  valPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  oldValText: {
    fontSize: rfValue(11.5),
    fontFamily: FontFamily.body,
    maxWidth: 110,
  },
  newValText: {
    fontSize: rfValue(11.5),
    fontFamily: FontFamily.bodyBold,
    color: '#059669',
    maxWidth: 150,
  },
  itemPtsText: {
    fontSize: rfValue(11),
    fontFamily: FontFamily.bodyBold,
    color: '#059669',
  },
  ptsBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ptsBadgeText: {
    fontSize: rfValue(10.5),
    fontFamily: FontFamily.bodyBold,
    color: '#059669',
  },
});
