import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { Modal } from '../../../components/Modal';
import { SafeImage } from '../../../components/SafeImage';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { useLanguage } from '../../../languages';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Theme } from '../../../constants/theme';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import toast from '../../../utils/toast';
import {
  fetchFamilyCandidatesAction,
  fetchSocialCandidatesAction,
  bulkAssignInfluencerAction,
} from '../../../store/actions/voters';
import { MdFlatList } from '../../../components';

export interface InfluencerTarget {
  id: string;
  name: string;
  epicNo?: string;
  boothId?: string;
  boothName?: string;
  houseNo?: string;
  avatar?: string;
  memberCount?: number;
}

export interface InfluencerMemberAssignModalProps {
  visible: boolean;
  onClose: () => void;
  influencer: InfluencerTarget | null;
  type: 'family' | 'social';
  onSuccess?: () => void;
}

export const InfluencerMemberAssignModal: React.FC<InfluencerMemberAssignModalProps> = ({
  visible,
  onClose,
  influencer,
  type,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const dispatch = useDispatch<any>();
  const { theme, styles } = useAppTheme(modalStyles);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [sameSurnameOnly, setSameSurnameOnly] = useState(type === 'family');
  const [sameHouseOnly, setSameHouseOnly] = useState(false);
  const [unassignedOnly, setUnassignedOnly] = useState(false);

  // Pagination & Data State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedVoterIds, setSelectedVoterIds] = useState<string[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSearch('');
      setSameSurnameOnly(type === 'family');
      setSameHouseOnly(false);
      setUnassignedOnly(false);
      setPage(1);
      setTotalPages(1);
      setTotalCount(0);
      setCandidates([]);
      setSelectedVoterIds([]);
    }
  }, [visible, influencer?.id, type]);

  // Fetch candidates
  const fetchCandidates = useCallback(
    async (pageNum: number, isLoadMore: boolean = false) => {
      if (!visible || !influencer?.id) return;
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params: any = {
          influencerId: influencer.id,
          boothId: influencer.boothId || undefined,
          search: search.trim() || undefined,
          unassignedOnly: unassignedOnly ? 'true' : undefined,
          page: pageNum,
          limit: 15,
        };

        if (type === 'family') {
          params.sameSurnameOnly = sameSurnameOnly ? 'true' : undefined;
          params.sameHouseOnly = sameHouseOnly ? 'true' : undefined;
        }

        const action = type === 'family' ? fetchFamilyCandidatesAction : fetchSocialCandidatesAction;
        const res = await dispatch(action(params));
        const list = res?.voters || res?.data || [];

        setCandidates((prev) => (isLoadMore ? [...prev, ...list] : list));
        setPage(pageNum);
        setTotalCount((prev) => res?.pagination?.total ?? (isLoadMore ? prev : list.length));
        setTotalPages(res?.pagination?.totalPages ?? 1);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load candidates');
      } finally {
        if (isLoadMore) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [
      visible,
      influencer?.id,
      influencer?.boothId,
      type,
      search,
      sameSurnameOnly,
      sameHouseOnly,
      unassignedOnly,
      dispatch,
    ]
  );

  useEffect(() => {
    if (!visible || !influencer?.id) return;
    const timer = setTimeout(() => {
      fetchCandidates(1, false);
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchCandidates, visible, influencer?.id]);

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || page >= totalPages || candidates.length === 0) return;
    fetchCandidates(page + 1, true);
  }, [loading, loadingMore, page, totalPages, candidates.length, fetchCandidates]);

  const toggleSelectVoter = (id: string) => {
    setSelectedVoterIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const pageIds = candidates.map((v) => String(v.id));
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedVoterIds.includes(id));

    if (allSelected) {
      setSelectedVoterIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedVoterIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleSubmit = async () => {
    if (!influencer?.id) return;
    if (selectedVoterIds.length === 0) {
      toast.error(t('selectAtLeastOne') || 'Please select at least one voter to link.');
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(
        bulkAssignInfluencerAction({
          influencerId: influencer.id,
          influencerType: type,
          voterIds: selectedVoterIds,
        })
      );
      toast.success(
        `${t('membersLinkedSuccess') || 'Successfully linked'} ${selectedVoterIds.length} ${t('votersCount') || 'voters'}!`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to link voters');
    } finally {
      setSubmitting(false);
    }
  };

  const isAllPageSelected =
    candidates.length > 0 &&
    candidates.every((v) => selectedVoterIds.includes(String(v.id)));

  const titleText =
    type === 'family'
      ? t('manageFamilyMembers') || 'Manage Family Members'
      : t('manageSocialFollowers') || 'Manage Community Network';

  const titleIcon = type === 'family' ? 'crown-outline' : 'star-circle-outline';

  return (
    <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modalContainer}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.titleIconBox, { backgroundColor: theme.colors.primary + '15' }]}>
              <MaterialDesignIcons name={titleIcon} size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
                {titleText}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {influencer?.name} {influencer?.epicNo ? `(${influencer.epicNo})` : ''}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialDesignIcons name="close" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Influencer Meta Card */}
        {influencer && (
          <View style={[styles.influencerCard, { backgroundColor: theme.colors.primary + '0A', borderColor: theme.colors.primary + '25' }]}>
            <SafeImage
              uri={influencer.avatar || undefined}
              name={influencer.name}
              style={styles.influencerAvatar}
            />
            <View style={styles.influencerDetails}>
              <Text style={[styles.influencerName, { color: theme.colors.text }]} numberOfLines={1}>
                {influencer.name}
              </Text>
              <Text style={[styles.influencerMeta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {influencer.boothName || `Booth #${influencer.boothId || '—'}`}
                {influencer.houseNo ? ` • H.No: ${influencer.houseNo}` : ''}
              </Text>
            </View>
            <View style={[styles.memberCountBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.memberCountText}>
                {influencer.memberCount || 0} {t('votersCount') || 'linked'}
              </Text>
            </View>
          </View>
        )}

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
          <MaterialDesignIcons name="magnify" size={18} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder={t('searchPlaceholder') || 'Search by name, EPIC, or house number...'}
            placeholderTextColor={theme.colors.textSecondary + '99'}
            value={search}
            onChangeText={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />
          {Boolean(search) && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialDesignIcons name="close-circle" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Filter Chips */}
        <View style={styles.filterRow}>
          {type === 'family' && (
            <>
              <TouchableOpacity
                onPress={() => {
                  setSameSurnameOnly((p) => !p);
                  setPage(1);
                }}
                style={[
                  styles.filterChip,
                  sameSurnameOnly
                    ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                    : { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: sameSurnameOnly ? '#FFFFFF' : theme.colors.text },
                  ]}
                >
                  {t('sameSurname') || 'Same Surname'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setSameHouseOnly((p) => !p);
                  setPage(1);
                }}
                style={[
                  styles.filterChip,
                  sameHouseOnly
                    ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                    : { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: sameHouseOnly ? '#FFFFFF' : theme.colors.text },
                  ]}
                >
                  {t('sameHouse') || 'Same House'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            onPress={() => {
              setUnassignedOnly((p) => !p);
              setPage(1);
            }}
            style={[
              styles.filterChip,
              unassignedOnly
                ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                : { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: unassignedOnly ? '#FFFFFF' : theme.colors.text },
              ]}
            >
              {t('unassignedOnly') || 'Unassigned Only'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subheader: Count and Select All */}
        <View style={styles.subHeaderRow}>
          <Text style={[styles.candidatesCountText, { color: theme.colors.textSecondary }]}>
            {totalCount} {t('votersCount') || 'candidates found'}
          </Text>
          {candidates.length > 0 && (
            <TouchableOpacity onPress={handleToggleSelectAll} style={styles.selectAllBtn}>
              <Text style={[styles.selectAllText, { color: theme.colors.primary }]}>
                {isAllPageSelected ? t('deselectAll') || 'Deselect All' : t('selectAll') || 'Select All'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Candidates List */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : candidates.length === 0 ? (
            <View style={styles.centerContainer}>
              <MaterialDesignIcons name="account-search-outline" size={40} color={theme.colors.textSecondary + '60'} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {t('noCandidatesFound') || 'No voter candidates found matching filters.'}
              </Text>
            </View>
          ) : (
            <MdFlatList
              data={candidates}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item: any, index: number) => (item?.id ? String(item.id) : String(index))}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                loadingMore ? () => (
                  <View style={styles.footerLoader}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  </View>
                ) : undefined
              }
              renderItem={({ item }: { item: any }) => {
                const voterId = String(item.id);
                const isSelected = selectedVoterIds.includes(voterId);
                const fullName =
                  [item.engFirstName, item.engMiddleName, item.engSurname].filter(Boolean).join(' ') ||
                  item.engName ||
                  item.name ||
                  item.epicNo;

                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleSelectVoter(voterId)}
                    style={[
                      styles.candidateItem,
                      {
                        backgroundColor: isSelected ? theme.colors.primary + '0E' : theme.colors.surface,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <SafeImage
                      uri={item.avatar || undefined}
                      name={fullName}
                      style={styles.candidateAvatar}
                    />

                    <View style={styles.candidateInfo}>
                      <Text style={[styles.candidateName, { color: theme.colors.text }]} numberOfLines={1}>
                        {fullName}
                      </Text>
                      <View style={styles.candidateMetaRow}>
                        {Boolean(item.epicNo) && (
                          <Text style={[styles.candidateMetaText, { color: theme.colors.textSecondary }]}>
                            {item.epicNo}
                          </Text>
                        )}
                        {Boolean(item.houseNo) && (
                          <Text style={[styles.candidateMetaText, { color: theme.colors.textSecondary }]}>
                            • H.No: {item.houseNo}
                          </Text>
                        )}
                        {Boolean(item.age) && (
                          <Text style={[styles.candidateMetaText, { color: theme.colors.textSecondary }]}>
                            • Age {item.age}
                          </Text>
                        )}
                      </View>
                    </View>

                    {Boolean(item.familyInfluencerId && String(item.familyInfluencerId) !== String(influencer?.id)) && (
                      <View style={styles.otherInfluencerBadge}>
                        <Text style={styles.otherInfluencerBadgeText}>
                          {t('linked') || 'Linked'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>

        {/* Footer Actions */}
        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
            onPress={onClose}
            disabled={submitting}
          >
            <Text style={[styles.cancelBtnText, { color: theme.colors.text }]}>
              {t('cancel') || 'Cancel'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: theme.colors.primary },
              (selectedVoterIds.length === 0 || submitting) && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            disabled={selectedVoterIds.length === 0 || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialDesignIcons name="link-variant" size={16} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>
                  {t('linkSelectedMembers') || 'Link Selected'} ({selectedVoterIds.length})
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const modalStyles = (theme: Theme) =>
  StyleSheet.create({
    modalContainer: {
      width: '92%',
      maxHeight: '88%',
      height: 600,
      borderRadius: 16,
      padding: 0,
      overflow: 'hidden',
    },
    content: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 10,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 10,
    },
    titleIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTexts: {
      flex: 1,
    },
    title: {
      fontSize: rfValue(15),
      fontFamily: FontFamily.bodyBold,
    },
    subtitle: {
      fontSize: rfValue(11),
      fontFamily: FontFamily.body,
      marginTop: 1,
    },
    closeBtn: {
      padding: 4,
    },
    influencerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 10,
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      gap: 10,
    },
    influencerAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    influencerDetails: {
      flex: 1,
    },
    influencerName: {
      fontSize: rfValue(12.5),
      fontFamily: FontFamily.bodyBold,
    },
    influencerMeta: {
      fontSize: rfValue(10.5),
      fontFamily: FontFamily.body,
      marginTop: 1,
    },
    memberCountBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    memberCountText: {
      color: '#FFFFFF',
      fontSize: rfValue(10),
      fontFamily: FontFamily.bold,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 8,
      paddingHorizontal: 10,
      height: 40,
      borderRadius: 10,
      borderWidth: 1,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: rfValue(12),
      fontFamily: FontFamily.body,
      paddingVertical: 0,
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
      gap: 6,
      marginBottom: 10,
    },
    filterChip: {
      paddingHorizontal: 10,
      paddingVertical: 4.5,
      borderRadius: 8,
      borderWidth: 1,
    },
    filterChipText: {
      fontSize: rfValue(10.5),
      fontFamily: FontFamily.medium,
    },
    subHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginBottom: 6,
    },
    candidatesCountText: {
      fontSize: rfValue(11),
      fontFamily: FontFamily.medium,
    },
    selectAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    selectAllText: {
      fontSize: rfValue(11),
      fontFamily: FontFamily.bodyBold,
    },
    listContainer: {
      flex: 1,
      paddingHorizontal: 16,
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      gap: 8,
    },
    emptyText: {
      fontSize: rfValue(11.5),
      fontFamily: FontFamily.body,
      textAlign: 'center',
    },
    footerLoader: {
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    candidateItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      marginBottom: 6,
      gap: 10,
    },
    candidateCheckbox: {
      justifyContent: 'center',
    },
    candidateAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    candidateInfo: {
      flex: 1,
    },
    candidateName: {
      fontSize: rfValue(12),
      fontFamily: FontFamily.medium,
    },
    candidateMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    candidateMetaText: {
      fontSize: rfValue(10),
      fontFamily: FontFamily.body,
    },
    otherInfluencerBadge: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    otherInfluencerBadgeText: {
      fontSize: rfValue(9),
      fontFamily: FontFamily.medium,
      color: '#92400E',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      gap: 10,
    },
    cancelBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
    },
    cancelBtnText: {
      fontSize: rfValue(12),
      fontFamily: FontFamily.medium,
    },
    submitBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 6,
    },
    submitBtnText: {
      color: '#FFFFFF',
      fontSize: rfValue(12),
      fontFamily: FontFamily.bodyBold,
    },
  });
