import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import React, { useState } from 'react';
import { Theme } from '../../../constants/theme';
import { RootState } from '../../../store/store';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { useSelector, useDispatch } from 'react-redux';
import { AppModal } from '../../../components/AppModal';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { fetchMasterBoothsAction } from '../../../store/actions/master';
import { AppDropdown, DropdownOption } from '../../../components/AppDropdown';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

export interface VoterFilterParams {
  acId?: string;
  search?: string;
  gender?: string;
  isDead?: string;
  boothNo?: string;
  isVoted?: string;
  ageGroup?: string;
  voterType?: string;
  politicalView?: string;
  influencerRole?: string;
  supportingParty?: string;
}

interface VoterFilterModalProps {
  visible: boolean;
  onDismiss: () => void;
  t: (key: any) => string;
  onResetFilters: () => void;
  filters: VoterFilterParams;
  onApplyFilters: (newFilters: VoterFilterParams) => void;
}

export const VoterFilterModal: React.FC<VoterFilterModalProps> = ({
  visible,
  onDismiss,
  filters,
  onApplyFilters,
  onResetFilters,
  t,
}) => {
  const dispatch = useDispatch<any>();
  const { theme, styles } = useAppTheme(getStyles);

  const genderOptions = React.useMemo(
    () => [
      { id: 'all', label: t('all') || 'All', icon: 'account-group-outline' },
      { id: 'Male', label: t('male') || 'Male', icon: 'gender-male' },
      { id: 'Female', label: t('female') || 'Female', icon: 'gender-female' },
      { id: 'Other', label: t('other') || 'Other', icon: 'account-outline' },
    ],
    [t]
  );

  const votedOptions = React.useMemo(
    () => [
      { id: 'all', label: t('allStatus') || 'All Status', icon: 'circle-outline' },
      { id: 'voted', label: t('voted') || 'Voted', icon: 'check-circle' },
      { id: 'not_voted', label: t('notVoted') || 'Not Voted', icon: 'close-circle' },
    ],
    [t]
  );

  const ageGroupOptions = React.useMemo(
    () => [
      { id: '', label: t('allAges') || 'All Ages' },
      { id: '18-25', label: '18 - 25' },
      { id: '26-35', label: '26 - 35' },
      { id: '36-50', label: '36 - 50' },
      { id: '51-65', label: '51 - 65' },
      { id: '65-200', label: '65+' },
    ],
    [t]
  );

  const voterTypeTiles = React.useMemo(
    () => [
      { id: '', label: t('allTypes') || 'All Types', icon: 'account-multiple-outline' },
      { id: 'Voter', label: t('standard') || 'Standard', icon: 'account-check-outline' },
      { id: 'Neutral Voter', label: t('voterTypeNeutral') || 'Neutral', icon: 'scale-balance' },
      { id: 'Student', label: t('voterTypeStudent') || 'Student', icon: 'school-outline' },
      { id: 'Senior', label: t('senior') || 'Senior', icon: 'human-cane' },
      { id: 'VIP', label: t('vipKey') || 'VIP / Key', icon: 'star-outline' },
    ],
    [t]
  );

  const influencerCards = React.useMemo(
    () => [
      {
        id: '',
        title: t('allVoters') || 'All Voters',
        desc: t('browseEntireConstituency') || 'Browse entire constituency',
        icon: 'account-group-outline',
      },
      {
        id: 'family',
        title: `👑 ${t('familyHeads') || 'Family Heads'}`,
        desc: t('householdDecisionLeaders') || 'Household decision leaders',
        icon: 'home-account',
      },
      {
        id: 'social',
        title: `✨ ${t('socialLeaders') || 'Social Leaders'}`,
        desc: t('localCommunityInfluencers') || 'Local community influencers',
        icon: 'bullhorn-outline',
      },
      {
        id: 'any',
        title: `🌟 ${t('anyInfluencer') || 'Any Influencer'}`,
        desc: t('allRegisteredFieldLeaders') || 'All registered field leaders',
        icon: 'star-circle-outline',
      },
    ],
    [t]
  );

  // Redux auth & master slices
  const auth = useSelector((state: RootState) => state.auth);
  const master = useSelector((state: RootState) => state.master);
  const userRole = auth.role || auth.user?.role || 'pc_leader';
  const user = auth.user;

  const { acs, booths, parties, loading, boothsLoading } = master;

  // Local filter states
  const [selectedVoted, setSelectedVoted] = useState(filters.isVoted || 'all');
  const [selectedGender, setSelectedGender] = useState(filters.gender || 'all');
  const [selectedParty, setSelectedParty] = useState(filters.supportingParty || 'All');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(filters.ageGroup || '');
  const [selectedVoterType, setSelectedVoterType] = useState(filters.voterType || '');
  const [selectedIsDead, setSelectedIsDead] = useState(filters.isDead || '');
  const [selectedInfluencerRole, setSelectedInfluencerRole] = useState(filters.influencerRole || '');
  const [selectedBooth, setSelectedBooth] = useState(filters.boothNo || 'All');
  const [selectedAc, setSelectedAc] = useState(filters.acId || '');

  // Dropdown open states
  const [acDropdownOpen, setAcDropdownOpen] = useState(false);
  const [boothDropdownOpen, setBoothDropdownOpen] = useState(false);
  const [partyDropdownOpen, setPartyDropdownOpen] = useState(false);



  // Sync incoming filters when modal opens
  React.useEffect(() => {
    if (visible) {
      setSelectedVoted(filters.isVoted || 'all');
      setSelectedGender(filters.gender || 'all');
      setSelectedParty(filters.supportingParty || 'All');
      setSelectedAgeGroup(filters.ageGroup || '');
      setSelectedVoterType(filters.voterType || '');
      setSelectedIsDead(filters.isDead || '');
      setSelectedInfluencerRole(filters.influencerRole || '');
      setSelectedBooth(filters.boothNo || 'All');
      setSelectedAc(filters.acId || '');
    }
  }, [visible, filters]);

  const handleSelectAc = (acId: string) => {
    setSelectedAc(acId);
    setSelectedBooth('All');
    setAcDropdownOpen(false);
    dispatch(fetchMasterBoothsAction(acId || undefined));
  };

  // Active filters count
  const activeCount = [
    selectedVoted !== 'all',
    selectedGender !== 'all',
    selectedParty !== 'All',
    Boolean(selectedAgeGroup),
    Boolean(selectedVoterType),
    Boolean(selectedIsDead),
    Boolean(selectedInfluencerRole),
    selectedBooth !== 'All',
    Boolean(selectedAc),
  ].filter(Boolean).length;

  const handleApply = () => {
    onApplyFilters({
      gender: selectedGender,
      supportingParty: selectedParty,
      isVoted: selectedVoted,
      ageGroup: selectedAgeGroup,
      voterType: selectedVoterType,
      isDead: selectedIsDead,
      influencerRole: selectedInfluencerRole,
      boothNo: selectedBooth,
      acId: selectedAc,
    });
    onDismiss();
  };

  const handleReset = () => {
    onResetFilters();
    onDismiss();
  };

  // Memoized dropdown options for AppDropdown
  const acOptions: DropdownOption[] = React.useMemo(() => [
    { id: '', label: 'All ACs in Parliamentary Constituency' },
    ...acs.map((a) => ({
      id: a.id,
      label: `${a.name}${a.acNumber ? ` (#${a.acNumber})` : ''}`,
    })),
  ], [acs]);

  const boothOptions: DropdownOption[] = React.useMemo(() => [
    { id: 'All', label: 'All Polling Booths' },
    ...booths.map((b) => ({
      id: b.id || b.name,
      label: `${b.boothNumber ? `Booth #${b.boothNumber} - ` : ''}${b.name}`,
    })),
  ], [booths]);

  const acBoothOptions: DropdownOption[] = React.useMemo(() => [
    { id: 'All', label: 'All Booths in Constituency' },
    ...booths.map((b) => ({
      id: b.id || b.name,
      label: `${b.boothNumber ? `Booth #${b.boothNumber} - ` : ''}${b.name}`,
    })),
  ], [booths]);

  const partyOptions: DropdownOption[] = React.useMemo(() => [
    { id: 'All', label: 'All Political Parties' },
    ...parties.map((p) => ({
      id: p.id || p.name,
      label: p.name,
      sublabel: p.abbreviation,
      image: p.symbolLogo,
    })),
  ], [parties]);

  return (
    <AppModal
      visible={visible}
      onDismiss={onDismiss}
      position="right"
      title={`${t('filters') || 'Filter Voters'} ${activeCount > 0 ? `(${activeCount})` : ''}`}
      message={activeCount > 0 ? `${activeCount} filter${activeCount > 1 ? 's' : ''} applied` : 'Filter directory from live server'}
      icon="filter-variant"
      primaryAction={{
        label: t('apply') || 'Apply Filters',
        onPress: handleApply,
      }}
      secondaryAction={{
        label: t('reset') || 'Reset',
        onPress: handleReset,
      }}
    >
      <View style={styles.modalBody}>
        {/* User Role Card */}
        <View style={styles.roleCard}>
          <View style={styles.roleIconBox}>
            <MaterialDesignIcons name="shield-account-outline" size={18} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.roleTitle}>{user?.roleName || userRole.toUpperCase()}</Text>
            <Text style={styles.roleSubtitle} numberOfLines={1}>
              {user?.assignedArea || user?.assignedAc || user?.assignedBooth || 'Constituency Scope'}
            </Text>
          </View>
          {loading && <ActivityIndicator size="small" color={theme.colors.primary} />}
        </View>

        {/* ─── 1. Voting Status (Segmented Control) ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('votingStatus') || 'Voting Status'}</Text>
          {selectedVoted !== 'all' && (
            <TouchableOpacity onPress={() => setSelectedVoted('all')}>
              <Text style={styles.clearText}>{t('clear') || 'Clear'}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.segmentedContainer}>
          {votedOptions.map((opt) => {
            const isActive = selectedVoted === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                onPress={() => setSelectedVoted(opt.id)}
                activeOpacity={0.7}
              >
                <MaterialDesignIcons
                  name={opt.icon as any}
                  size={15}
                  color={isActive ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── 2. Gender (Iconic Segmented Bar) ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('gender') || 'Gender'}</Text>
          {selectedGender !== 'all' && (
            <TouchableOpacity onPress={() => setSelectedGender('all')}>
              <Text style={styles.clearText}>{t('clear') || 'Clear'}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.segmentedContainer}>
          {genderOptions.map((opt) => {
            const isActive = selectedGender === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                onPress={() => setSelectedGender(opt.id)}
                activeOpacity={0.7}
              >
                <MaterialDesignIcons
                  name={opt.icon as any}
                  size={15}
                  color={isActive ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.divider} />

        {/* ─── 3. Geographic Scope (From Database API) ─── */}
        {userRole === 'pc_leader' && (
          <>
            <AppDropdown
              label={t('selectAc') || 'Assembly Constituency (AC)'}
              icon="map-marker-outline"
              value={selectedAc}
              options={acOptions}
              onSelect={(val) => handleSelectAc(val)}
              isOpen={acDropdownOpen}
              onToggle={(open) => {
                setAcDropdownOpen(open);
                if (open) {
                  setBoothDropdownOpen(false);
                  setPartyDropdownOpen(false);
                }
              }}
              searchable
              searchPlaceholder={t('searchBoothNameOrNo') || 'Search AC name or number...'}
              clearable
              onClear={() => handleSelectAc('')}
            />

            <AppDropdown
              label={t('selectBooth') || 'Polling Booth'}
              icon="home-analytics"
              value={selectedBooth}
              options={boothOptions}
              onSelect={(val) => setSelectedBooth(val)}
              isOpen={boothDropdownOpen}
              onToggle={(open) => {
                setBoothDropdownOpen(open);
                if (open) {
                  setAcDropdownOpen(false);
                  setPartyDropdownOpen(false);
                }
              }}
              searchable
              searchPlaceholder={t('searchBoothNameOrNo') || 'Search booth name or number...'}
              clearable
              onClear={() => setSelectedBooth('All')}
              loading={boothsLoading}
              containerStyle={{ marginTop: 12 }}
            />
          </>
        )}

        {userRole === 'ac_leader' && (
          <>
            <View style={styles.lockedScopeCard}>
              <MaterialDesignIcons name="lock-outline" size={16} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.lockedScopeLabel}>{t('assignedAc') || 'Assigned Assembly Constituency'}</Text>
                <Text style={styles.lockedScopeValue}>{user?.assignedAc || 'Hawa Mahal'}</Text>
              </View>
            </View>

            <AppDropdown
              searchable
              icon="home-analytics"
              value={selectedBooth}
              options={acBoothOptions}
              isOpen={boothDropdownOpen}
              label={t('pollingBoothInAc') || 'Polling Booth in AC'}
              onSelect={(val) => setSelectedBooth(val)}
              onToggle={(open) => {
                setBoothDropdownOpen(open);
                if (open) setPartyDropdownOpen(false);
              }}
              searchPlaceholder={t('searchBoothNameOrNo') || 'Search booth name or number...'}
              clearable
              onClear={() => setSelectedBooth('All')}
              loading={boothsLoading}
              containerStyle={{ marginTop: 12 }}
            />
          </>
        )}

        {userRole === 'sub_leader' && (
          <View style={styles.lockedScopeCard}>
            <MaterialDesignIcons name="map-marker-radius" size={16} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.lockedScopeLabel}>{t('assignedWard') || 'Assigned Ward / Cluster'}</Text>
              <Text style={styles.lockedScopeValue}>{user?.assignedArea || 'Ward 14 (8 Booths)'}</Text>
            </View>
          </View>
        )}

        {userRole === 'supporter' && (
          <View style={styles.lockedScopeCard}>
            <MaterialDesignIcons name="home-map-marker" size={16} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.lockedScopeLabel}>{t('assignedBooth') || 'Assigned Polling Booth'}</Text>
              <Text style={styles.lockedScopeValue}>{user?.assignedBooth || 'Booth #14 - Govt Sec School'}</Text>
            </View>
          </View>
        )}

        <View style={styles.divider} />

        <AppDropdown
          label={t('selectParty') || 'Political Party Affiliation'}
          icon="flag-variant-outline"
          value={selectedParty}
          options={partyOptions}
          onSelect={(val) => setSelectedParty(val)}
          isOpen={partyDropdownOpen}
          onToggle={(open) => {
            setPartyDropdownOpen(open);
            if (open) {
              setAcDropdownOpen(false);
              setBoothDropdownOpen(false);
            }
          }}
          searchable
          searchPlaceholder={t('searchPartyAbbrev') || 'Search party abbreviation or name...'}
          clearable
          onClear={() => setSelectedParty('All')}
        />

        <View style={styles.divider} />

        {/* ─── 5. Voter Category / Inclination (2-Column Grid Tiles) ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('voterCategoryInclination') || 'Voter Category / Inclination'}</Text>
          {selectedVoterType ? (
            <TouchableOpacity onPress={() => setSelectedVoterType('')}>
              <Text style={styles.clearText}>{t('clear') || 'Clear'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.tileGrid}>
          {voterTypeTiles.map((tile) => {
            const isSelected = selectedVoterType === tile.id;
            return (
              <TouchableOpacity
                key={tile.id || 'all-tile'}
                style={[styles.tileCard, isSelected && styles.tileCardActive]}
                onPress={() => setSelectedVoterType(tile.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.tileIconBox, isSelected && styles.tileIconBoxActive]}>
                  <MaterialDesignIcons
                    name={tile.icon as any}
                    size={16}
                    color={isSelected ? theme.colors.primary : '#64748B'}
                  />
                </View>
                <Text style={[styles.tileLabel, isSelected && styles.tileLabelActive]} numberOfLines={1}>
                  {tile.label}
                </Text>
                {isSelected && (
                  <View style={styles.tileCheckDot}>
                    <MaterialDesignIcons name="check" size={12} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.divider} />

        {/* ─── 6. Age Group Range (Range Badges) ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('ageGroupYears') || 'Age Group (Years)'}</Text>
          {selectedAgeGroup ? (
            <TouchableOpacity onPress={() => setSelectedAgeGroup('')}>
              <Text style={styles.clearText}>{t('clear') || 'Clear'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.ageRow}>
          {ageGroupOptions.map((opt) => {
            const isActive = selectedAgeGroup === opt.id;
            return (
              <TouchableOpacity
                key={opt.id || 'all-age'}
                style={[styles.ageChip, isActive && styles.ageChipActive]}
                onPress={() => setSelectedAgeGroup(opt.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.ageChipText, isActive && styles.ageChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── 7. Living vs Deceased Dual Cards ─── */}
        {userRole !== 'supporter' && (
          <>
            <View style={styles.divider} />
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('livingDeceasedStatus') || 'Living & Deceased Status'}</Text>
              {selectedIsDead ? (
                <TouchableOpacity onPress={() => setSelectedIsDead('')}>
                  <Text style={styles.clearText}>{t('clear') || 'Clear'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.dualCardRow}>
              <TouchableOpacity
                style={[styles.dualCard, selectedIsDead === 'false' && styles.dualCardActiveGreen]}
                onPress={() => setSelectedIsDead(selectedIsDead === 'false' ? '' : 'false')}
                activeOpacity={0.7}
              >
                <MaterialDesignIcons
                  name="heart-pulse"
                  size={18}
                  color={selectedIsDead === 'false' ? '#059669' : '#64748B'}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dualCardTitle, selectedIsDead === 'false' && { color: '#059669' }]}>
                    {t('livingOnly') || 'Living Only'}
                  </Text>
                  <Text style={styles.dualCardDesc}>{t('activeVoters') || 'Active voters'}</Text>
                </View>
                {selectedIsDead === 'false' && <MaterialDesignIcons name="check-circle" size={16} color="#059669" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dualCard, selectedIsDead === 'true' && styles.dualCardActiveAmber]}
                onPress={() => setSelectedIsDead(selectedIsDead === 'true' ? '' : 'true')}
                activeOpacity={0.7}
              >
                <MaterialDesignIcons
                  name="coffin"
                  size={18}
                  color={selectedIsDead === 'true' ? '#D97706' : '#64748B'}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dualCardTitle, selectedIsDead === 'true' && { color: '#D97706' }]}>
                    {t('deceasedOnly') || 'Deceased Only'}
                  </Text>
                  <Text style={styles.dualCardDesc}>{t('deceasedRecords') || 'Deceased records'}</Text>
                </View>
                {selectedIsDead === 'true' && <MaterialDesignIcons name="check-circle" size={16} color="#D97706" />}
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.divider} />

        {/* ─── 8. Influencer Network Roles (Feature Cards) ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('influencerLeadershipTags') || 'Influencer Leadership Tags'}</Text>
          {selectedInfluencerRole ? (
            <TouchableOpacity onPress={() => setSelectedInfluencerRole('')}>
              <Text style={styles.clearText}>{t('clear') || 'Clear'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.influencerStack}>
          {(userRole === 'supporter'
            ? influencerCards.filter((c) => c.id === '' || c.id === 'family')
            : influencerCards
          ).map((card) => {
            const isSelected = selectedInfluencerRole === card.id;
            return (
              <TouchableOpacity
                key={card.id || 'all-card'}
                style={[styles.influencerCard, isSelected && styles.influencerCardActive]}
                onPress={() => setSelectedInfluencerRole(card.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.influencerIconBox, isSelected && styles.influencerIconBoxActive]}>
                  <MaterialDesignIcons
                    name={card.icon as any}
                    size={20}
                    color={isSelected ? theme.colors.primary : '#64748B'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.influencerTitle, isSelected && styles.influencerTitleActive]}>
                    {card.title}
                  </Text>
                  <Text style={styles.influencerDesc}>{card.desc}</Text>
                </View>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </AppModal>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    modalBody: {
      width: '100%',
      gap: 8,
    },
    // Role Card
    roleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.colors.primary + '10',
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.primary + '20',
    },
    roleIconBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    roleTitle: {
      fontFamily: FontFamily.black,
      fontSize: rfValue(13),
      color: theme.colors.primary,
    },
    roleSubtitle: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    // Section Header
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    sectionTitle: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(13),
      color: theme.colors.text,
    },
    clearText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11),
      color: theme.colors.primary,
    },
    divider: {
      height: 1,
      backgroundColor: '#F1F5F9',
      marginVertical: 4,
    },
    // Segmented Control
    segmentedContainer: {
      flexDirection: 'row',
      backgroundColor: '#F1F5F9',
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 9,
      borderRadius: 9,
    },
    segmentBtnActive: {
      backgroundColor: '#FFFFFF',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    segmentText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12),
      color: '#64748B',
    },
    segmentTextActive: {
      fontFamily: FontFamily.black,
      color: theme.colors.primary,
    },

    // Locked Scope Card
    lockedScopeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: '#F8FAFC',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    lockedScopeLabel: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: '#64748B',
    },
    lockedScopeValue: {
      fontFamily: FontFamily.black,
      fontSize: rfValue(13),
      color: theme.colors.text,
      marginTop: 2,
    },
    // 2-Column Tile Grid
    tileGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tileCard: {
      width: '48.5%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 10,
      position: 'relative',
    },
    tileCardActive: {
      backgroundColor: theme.colors.primary + '10',
      borderColor: theme.colors.primary,
    },
    tileIconBox: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#EEF2F6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileIconBoxActive: {
      backgroundColor: theme.colors.primary + '20',
    },
    tileLabel: {
      flex: 1,
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12),
      color: '#475569',
    },
    tileLabelActive: {
      fontFamily: FontFamily.black,
      color: theme.colors.primary,
    },
    tileCheckDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Age Row
    ageRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    ageChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: '#F1F5F9',
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    ageChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    ageChipText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12),
      color: '#475569',
    },
    ageChipTextActive: {
      fontFamily: FontFamily.black,
      color: '#FFFFFF',
    },
    // Dual Cards
    dualCardRow: {
      flexDirection: 'row',
      gap: 10,
    },
    dualCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 12,
      padding: 10,
    },
    dualCardActiveGreen: {
      backgroundColor: '#ECFDF5',
      borderColor: '#10B981',
    },
    dualCardActiveAmber: {
      backgroundColor: '#FFFBEB',
      borderColor: '#F59E0B',
    },
    dualCardTitle: {
      fontFamily: FontFamily.black,
      fontSize: rfValue(12),
      color: theme.colors.text,
    },
    dualCardDesc: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(10),
      color: '#64748B',
      marginTop: 1,
    },
    // Influencer Stack
    influencerStack: {
      gap: 8,
    },
    influencerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 12,
      padding: 12,
    },
    influencerCardActive: {
      backgroundColor: theme.colors.primary + '08',
      borderColor: theme.colors.primary,
    },
    influencerIconBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#EEF2F6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    influencerIconBoxActive: {
      backgroundColor: theme.colors.primary + '20',
    },
    influencerTitle: {
      fontFamily: FontFamily.black,
      fontSize: rfValue(13),
      color: theme.colors.text,
    },
    influencerTitleActive: {
      color: theme.colors.primary,
    },
    influencerDesc: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: '#64748B',
      marginTop: 2,
    },
    radioCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#CBD5E1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioCircleActive: {
      borderColor: theme.colors.primary,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
  });

export default VoterFilterModal;
