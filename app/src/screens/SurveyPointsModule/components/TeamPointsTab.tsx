import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Users, Award, ChevronRight } from 'lucide-react-native';
import { TeamSurveyScoreRow } from '../../../store/reducers/dashboard';
import { FontFamily } from '../../../utils/typography';
import { rfValue } from '../../../utils/responsive';

interface TeamPointsTabProps {
  teamScores: TeamSurveyScoreRow[];
  onSelectMember: (memberId: string) => void;
  theme: any;
  t: (key: any) => string;
}

const ROLE_LABELS: Record<string, string> = {
  pc_leader: 'PC Leader',
  ac_leader: 'AC Leader',
  sub_leader: 'Sub-Leader',
  supporter: 'Volunteer',
};

export const TeamPointsTab: React.FC<TeamPointsTabProps> = ({
  teamScores,
  onSelectMember,
  theme,
  t,
}) => {
  if (!teamScores || teamScores.length === 0) {
    return (
      <View
        style={[
          styles.emptyCard,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Users size={36} color={theme.colors.textSecondary} />
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          {t('noTeamSurveyData')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        {t('teamPointsSubtitle')} ({teamScores.length})
      </Text>

      {teamScores.map((member) => {
        const rankBg =
          member.rank === 1
            ? '#FEF3C7'
            : member.rank === 2
              ? '#E2E8F0'
              : member.rank === 3
                ? '#FFEDD5'
                : theme.colors.background;
        const rankText =
          member.rank === 1
            ? '#B45309'
            : member.rank === 2
              ? '#334155'
              : member.rank === 3
                ? '#C2410C'
                : theme.colors.textSecondary;

        return (
          <TouchableOpacity
            key={member.volunteerId}
            activeOpacity={0.75}
            onPress={() => onSelectMember(member.volunteerId)}
            style={[
              styles.memberCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={[styles.rankBadge, { backgroundColor: rankBg }]}>
              <Text style={[styles.rankText, { color: rankText }]}>#{member.rank}</Text>
            </View>

            <View style={styles.infoWrap}>
              <View style={styles.nameRow}>
                <Text style={[styles.memberName, { color: theme.colors.text }]} numberOfLines={1}>
                  {member.name}
                </Text>
                <View style={[styles.rolePill, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.roleText, { color: theme.colors.textSecondary }]}>
                    {ROLE_LABELS[member.role] || member.role}
                  </Text>
                </View>
              </View>
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                {member.votersSurveyed} {t('votersSurveyed')} • {member.fieldsUpdated} {t('updatesCount')}
              </Text>
            </View>

            <View style={styles.rightWrap}>
              <View style={styles.scorePill}>
                <Award size={12} color="#4F46E5" />
                <Text style={styles.scoreText}>
                  {member.totalScore} {t('ptsSuffix')}
                </Text>
              </View>
              <ChevronRight size={16} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  subtitle: {
    fontSize: rfValue(11.5),
    fontFamily: FontFamily.medium,
    marginBottom: 2,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: rfValue(12.5),
    fontFamily: FontFamily.body,
    textAlign: 'center',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: rfValue(11.5),
    fontFamily: FontFamily.bodyBold,
  },
  infoWrap: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: rfValue(13),
    fontFamily: FontFamily.bodyBold,
  },
  rolePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: rfValue(9.5),
    fontFamily: FontFamily.medium,
  },
  metaText: {
    fontSize: rfValue(11),
    fontFamily: FontFamily.body,
  },
  rightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(79, 70, 229, 0.10)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
  },
  scoreText: {
    fontSize: rfValue(11.5),
    fontFamily: FontFamily.bodyBold,
    color: '#4F46E5',
  },
});
