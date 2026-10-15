import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useLanguage } from '../../../languages';
import { Modal } from '../../../components/Modal';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { Skeleton } from '../../../components/Skeleton';
import { useAppTheme } from '../../../hooks/useAppTheme';
import React, { useEffect, useState, useCallback } from 'react';
import { fetchVoterFamilyAction } from '../../../store/actions/voters';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

interface FamilyMember {
  id: string;
  name?: string;       // Hindi/vernacular name
  engName?: string;    // English name from backend
  age?: number;
  gender?: string;
  epicNo?: string;
  mobileNo?: string;
  relation?: string;
  guardianName?: string;
  isVoted?: boolean;
  isFamilyInfluencer?: boolean;  // backend uses this for family head
}

interface VoterFamilyModalProps {
  visible: boolean;
  voterId: string;
  voterName?: string;
  onClose: () => void;
}

const GENDER_ICON: Record<string, string> = {
  male: 'human-male',
  female: 'human-female',
  M: 'human-male',
  F: 'human-female',
};

function MemberSkeleton({ theme }: { theme: any }) {
  return (
    <View style={[styles.memberCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
      <View style={styles.memberLeft}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={{ gap: 6 }}>
          <Skeleton width={130} height={14} borderRadius={4} />
          <Skeleton width={80} height={11} borderRadius={4} />
        </View>
      </View>
      <Skeleton width={55} height={22} borderRadius={11} />
    </View>
  );
}

export const VoterFamilyModal: React.FC<VoterFamilyModalProps> = ({
  visible,
  voterId,
  voterName,
  onClose,
}) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const dispatch = useDispatch<any>();

  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [houseNo, setHouseNo] = useState<string | null>(null);
  const [votedCount, setVotedCount] = useState(0);

  const fetchFamily = useCallback(async () => {
    if (!voterId) return;
    setLoading(true);
    setMembers([]);
    const data = await dispatch(fetchVoterFamilyAction(voterId));
    if (data) {
      setMembers(data.members || []);
      setHouseNo(data.houseNo || null);
      setVotedCount(data.votedMembers ?? 0);
    }
    setLoading(false);
  }, [dispatch, voterId]);

  useEffect(() => {
    if (visible) {
      fetchFamily();
    }
  }, [visible, fetchFamily]);

  const renderMember = ({ item }: { item: FamilyMember }) => {
    const displayName = item.name || item.engName || '—';
    const genderIcon = GENDER_ICON[item.gender || ''] || 'account';
    const isHead = item.isFamilyInfluencer;
    const roleLabel = isHead ? t('familyHead') : t('familyMember');

    return (
      <View
        style={[
          styles.memberCard,
          {
            borderColor: isHead ? theme.colors.primary + '35' : theme.colors.border,
            backgroundColor: isHead ? theme.colors.primary + '06' : theme.colors.surface,
          },
        ]}
      >
        {/* Left: Avatar + Info */}
        <View style={styles.memberLeft}>
          <View
            style={[
              styles.avatarCircle,
              {
                backgroundColor: isHead
                  ? theme.colors.primary + '20'
                  : theme.colors.textSecondary + '18',
              },
            ]}
          >
            <MaterialDesignIcons
              name={genderIcon}
              size={22}
              color={isHead ? theme.colors.primary : theme.colors.textSecondary}
            />
          </View>
          <View style={styles.memberInfo}>
            <View style={styles.memberNameRow}>
              <Text
                style={[styles.memberName, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              {isHead && (
                <View
                  style={[
                    styles.headBadge,
                    { backgroundColor: theme.colors.primary + '18' },
                  ]}
                >
                  <MaterialDesignIcons name="star" size={9} color={theme.colors.primary} />
                </View>
              )}
            </View>
            <Text style={[styles.memberMeta, { color: theme.colors.textSecondary }]}>
              {roleLabel}
              {item.age ? `  ·  ${item.age} ${t('familyYearsOld')}` : ''}
            </Text>
            {item.epicNo ? (
              <Text style={[styles.memberEpic, { color: theme.colors.textSecondary }]}>
                {t('familyEpic')}: {item.epicNo}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Right: Voted Pill */}
        <View
          style={[
            styles.votedPill,
            {
              backgroundColor: item.isVoted ? '#DCFCE7' : '#FEF9C3',
              borderColor: item.isVoted ? '#86EFAC' : '#FDE047',
            },
          ]}
        >
          <MaterialDesignIcons
            name={item.isVoted ? 'check-circle' : 'clock-outline'}
            size={11}
            color={item.isVoted ? '#15803D' : '#A16207'}
          />
          <Text
            style={[
              styles.votedPillText,
              { color: item.isVoted ? '#15803D' : '#A16207' },
            ]}
          >
            {item.isVoted ? t('markAsNotVoted') : t('markAsVoted')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onClose}
      contentContainerStyle={[
        styles.sheetContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {/* Drag handle */}
      <View style={styles.dragHandleRow}>
        <View style={[styles.dragHandle, { backgroundColor: theme.colors.border }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerIcon, { backgroundColor: theme.colors.primary + '18' }]}>
            <MaterialDesignIcons name="family" size={20} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {t('familyPopupTitle')}
            </Text>
            {voterName ? (
              <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {voterName}
              </Text>
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeBtn, { backgroundColor: theme.colors.border + '60' }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialDesignIcons name="close" size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      {!loading && members.length > 0 && (
        <View style={[styles.statsRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {houseNo ? (
            <View style={styles.statItem}>
              <MaterialDesignIcons name="home-outline" size={14} color={theme.colors.primary} />
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('familyHouseNo')}</Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{houseNo}</Text>
            </View>
          ) : null}
          <View style={styles.statItem}>
            <MaterialDesignIcons name="account-multiple" size={14} color={theme.colors.primary} />
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('familyTotalMembers')}</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{members.length}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialDesignIcons name="vote-outline" size={14} color="#15803D" />
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('familyVotedCount')}</Text>
            <Text style={[styles.statValue, { color: '#15803D' }]}>{votedCount}</Text>
          </View>
        </View>
      )}

      {/* Body */}
      {loading ? (
        <View style={styles.bodyPad}>
          {[0, 1, 2].map((i) => (
            <MemberSkeleton key={i} theme={theme} />
          ))}
        </View>
      ) : members.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialDesignIcons name="account-group-outline" size={48} color={theme.colors.border} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {t('familyNoData')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderMember}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 28,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  dragHandleRow: {
    paddingBottom: 4,
    alignItems: 'center',
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(15),
  },
  headerSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(11.5),
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 12,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(10),
  },
  statValue: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13),
  },
  bodyPad: {
    gap: 10,
  },
  listContent: {
    paddingBottom: 10,
  },
  separator: {
    height: 8,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  memberName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(13.5),
    flexShrink: 1,
  },
  headBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberMeta: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(11),
  },
  memberEpic: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(10.5),
  },
  votedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  votedPillText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(9.5),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(13),
    textAlign: 'center',
    lineHeight: 20,
  },
});
