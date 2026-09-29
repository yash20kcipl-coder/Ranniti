import {
  fetchVotersData,
  fetchVoterStats,
  deleteVoterItem,
  importVotersData,
  exportVotersData,
  fetchInfluencerOptions,
  setVoterFilters,
} from '@/redux/actions/voter';
import {
  GENDER_OPTIONS,
  VOTER_TYPE_OPTIONS,
  STATUS_OPTIONS,
  IS_DEAD_OPTIONS,
  AGE_GROUP_OPTIONS,
} from '@/constants/dropdownOptions';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMasterData } from '@/hooks/useMasterData';
import { SafeImage } from '@/components/common/SafeImage';
import { initialVoterFilters } from '@/redux/reducers/voter';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';

// Shared Standard Components
import {
  FamilyInfluencerAssignModal,
  SocialInfluencerAssignModal,
  LinkToInfluencerModal,
} from '@/components/common/influencer';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import type { Option } from '@/components/common/FormInput';
import type { Column } from '@/components/common/DataTable';
import { ImportModal } from '@/components/common/ImportModal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { TableActions } from '@/components/common/TableActions';
import type { FilterField, FilterPreset } from '@/components/common/FilterBar';
import type { FamilyInfluencerTarget, SocialInfluencerTarget } from '@/components/common/influencer';

// Icons
import {
  Users,
  UserCheck,
  Vote,
  AlertTriangle,
  MapPin,
  Star,
  UserX,
  Sparkles,
  Crown,
  MoreVertical,
} from 'lucide-react';

export const VotersPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { voters, loading, stats, pagination, filters: savedFilters, initialized } = useAppSelector((state) => state.voter);
  const { booths, religions, castes, parties, states, districts } = useMasterData([
    'states',
    'districts',
    'pcs',
    'acs',
    'booths',
    'religions',
    'castes',
    'parties',
  ]);

  // Pagination State - initialized from Redux saved filters if available
  const [page, setPage] = useState<number>(() => savedFilters?.page || 1);
  const [limit, setLimit] = useState<number>(() => savedFilters?.limit || 25);

  // Filters State - initialized from Redux saved filters to survive route changes
  const [search, setSearch] = useState<string>(() => savedFilters?.search || '');
  const [stateId, setStateId] = useState<string>(() => savedFilters?.stateId || '');
  const [districtId, setDistrictId] = useState<string>(() => savedFilters?.districtId || '');
  const [boothId, setBoothId] = useState<string>(() => savedFilters?.boothId || '');
  const [gender, setGender] = useState<string>(() => savedFilters?.gender || '');
  const [casteId, setCasteId] = useState<string>(() => savedFilters?.casteId || '');
  const [voterType, setVoterType] = useState<string>(() => savedFilters?.voterType || '');
  const [status, setStatus] = useState<string>(() => savedFilters?.status || '');
  const [isDead, setIsDead] = useState<string>(() => savedFilters?.isDead || '');
  const [partyId, setPartyId] = useState<string>(() => savedFilters?.partyId || '');
  const [religionId, setReligionId] = useState<string>(() => savedFilters?.religionId || '');
  const [ageGroup, setAgeGroup] = useState<string>(() => savedFilters?.ageGroup || '');
  const [familyInfluencerId, setFamilyInfluencerId] = useState<string>(() => savedFilters?.familyInfluencerId || '');
  const [socialInfluencerId, setSocialInfluencerId] = useState<string>(() => savedFilters?.socialInfluencerId || '');
  const [isFamilyInfluencer, setIsFamilyInfluencer] = useState<string>(() => savedFilters?.isFamilyInfluencer || '');
  const [isSocialInfluencer, setIsSocialInfluencer] = useState<string>(() => savedFilters?.isSocialInfluencer || '');
  const [influencerStatus, setInfluencerStatus] = useState<string>(() => savedFilters?.influencerStatus || '');
  const [influencerRole, setInfluencerRole] = useState<string>(() => savedFilters?.influencerRole || '');

  // Track initial mount to prevent refetching already cached data
  const isInitialMountRef = React.useRef(true);

  // Dedicated Influencer Modals state
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [targetFamilyInfluencer, setTargetFamilyInfluencer] = useState<FamilyInfluencerTarget | null>(null);
  const [targetSocialInfluencer, setTargetSocialInfluencer] = useState<SocialInfluencerTarget | null>(null);
  const [linkTargetVoterIds, setLinkTargetVoterIds] = useState<string[]>([]);
  const [linkInfluencerType, setLinkInfluencerType] = useState<'family' | 'social'>('family');
  const [activeRowMenuId, setActiveRowMenuId] = useState<string | null>(null);

  // Influencers list for dropdown filter
  const [familyInfluencers, setFamilyInfluencers] = useState<any[]>([]);
  const [socialInfluencers, setSocialInfluencers] = useState<any[]>([]);

  // Load influencer dropdown options debounced (Rule 9 + Rule 13)
  // Only query when a specific booth is selected to avoid scanning lakhs of rows across the constituency
  useDebouncedEffect(
    () => {
      if (!boothId) {
        setFamilyInfluencers([]);
        setSocialInfluencers([]);
        if (familyInfluencerId) setFamilyInfluencerId('');
        if (socialInfluencerId) setSocialInfluencerId('');
        return;
      }

      dispatch(fetchInfluencerOptions({ boothId, type: 'family' }))
        .then((options: any[]) => setFamilyInfluencers(options || []))
        .catch(() => { });

      dispatch(fetchInfluencerOptions({ boothId, type: 'social' }))
        .then((options: any[]) => setSocialInfluencers(options || []))
        .catch(() => { });
    },
    200,
    [dispatch, boothId]
  );

  // Track previous filters to reset page to 1 when filters change
  const prevFilterDepsRef = React.useRef({
    search,
    stateId,
    districtId,
    boothId,
    gender,
    voterType,
    status,
    isDead,
    partyId,
    religionId,
    casteId,
    ageGroup,
    familyInfluencerId,
    socialInfluencerId,
    isFamilyInfluencer,
    isSocialInfluencer,
    influencerStatus,
    influencerRole,
  });

  // Fetch Voters Data & Stats on mount, filter changes and pagination changes (Debounced 200ms per Rule 13)
  useDebouncedEffect(
    () => {
      // If component is mounting and data was already fetched previously in Redux, skip redundant network fetch
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
        if (initialized && voters && voters.length > 0) {
          return;
        }
      }

      const currentFilters = {
        search,
        stateId,
        districtId,
        boothId,
        gender,
        voterType,
        status,
        isDead,
        partyId,
        religionId,
        casteId,
        ageGroup,
        familyInfluencerId,
        socialInfluencerId,
        isFamilyInfluencer,
        isSocialInfluencer,
        influencerStatus,
        influencerRole,
      };

      let activePage = page;
      const filtersChanged = Object.keys(currentFilters).some(
        (k) => (currentFilters as any)[k] !== (prevFilterDepsRef.current as any)[k]
      );
      if (filtersChanged) {
        prevFilterDepsRef.current = currentFilters;
        activePage = 1;
        setPage(1);
      }

      const params: Record<string, any> = {
        ...currentFilters,
        page: activePage,
        limit,
      };
      dispatch(setVoterFilters(params));
      dispatch(fetchVotersData(params));
      dispatch(fetchVoterStats(currentFilters));
    },
    200,
    [
      dispatch,
      page,
      limit,
      search,
      stateId,
      districtId,
      boothId,
      gender,
      voterType,
      status,
      isDead,
      partyId,
      religionId,
      casteId,
      ageGroup,
      familyInfluencerId,
      socialInfluencerId,
      isFamilyInfluencer,
      isSocialInfluencer,
      influencerStatus,
      influencerRole,
    ]
  );

  // Open Delete Modal
  const handleOpenDelete = (voter: any) => {
    setSelectedVoter(voter);
    setIsDeleteModalOpen(true);
  };

  // Modal States
  const [selectedVoter, setSelectedVoter] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const getCurrentFilterParams = () => ({
    search,
    stateId,
    districtId,
    boothId,
    gender,
    voterType,
    status,
    isDead,
    partyId,
    religionId,
    casteId,
    ageGroup,
    familyInfluencerId,
    socialInfluencerId,
    isFamilyInfluencer,
    isSocialInfluencer,
    influencerStatus,
    influencerRole,
    page,
    limit,
  });

  // Submit Delete Voter
  const handleDeleteConfirm = async () => {
    if (!selectedVoter) return;
    try {
      await dispatch(deleteVoterItem(selectedVoter.id, getCurrentFilterParams()));
      setIsDeleteModalOpen(false);
    } catch (err) {
      // Handled in thunk
    }
  };

  // Handle Excel Bulk Import (Dispatched via Redux per Rule 9)
  const handleBulkImport = async (records: Record<string, any>[]) => {
    await dispatch(importVotersData(records, getCurrentFilterParams()));
  };

  // Handle Export CSV/Excel (Dispatched via Redux per Rule 9)
  const handleExportVoters = () => {
    dispatch(exportVotersData(getCurrentFilterParams()));
  };

  // Reset Filters
  const handleResetFilters = () => {
    isInitialMountRef.current = false;
    setSearch('');
    setStateId('');
    setDistrictId('');
    setBoothId('');
    setGender('');
    setVoterType('');
    setStatus('');
    setIsDead('');
    setPartyId('');
    setReligionId('');
    setCasteId('');
    setAgeGroup('');
    setFamilyInfluencerId('');
    setSocialInfluencerId('');
    setIsFamilyInfluencer('');
    setIsSocialInfluencer('');
    setInfluencerStatus('');
    setInfluencerRole('');
    setPage(1);
    dispatch(setVoterFilters(initialVoterFilters));
  };

  // Dynamic Master Options
  const stateOptions: Option[] = [
    { label: 'All States', value: '' },
    ...(states || []).map((s: any) => ({ label: s.name || s.stateName, value: String(s.id) })),
  ];

  const districtOptions: Option[] = [
    { label: 'All Districts', value: '' },
    ...(districts || [])
      .filter((d: any) => !stateId || String(d.stateId) === stateId)
      .map((d: any) => ({ label: d.name || d.districtName, value: String(d.id) })),
  ];

  const boothOptions: Option[] = [
    { label: 'All Polling Booths', value: '' },
    ...booths.map((b: any) => ({
      label: `${b.boothNumber ? `Booth #${b.boothNumber} - ` : ''}${b.name}`,
      value: String(b.id),
    })),
  ];

  const religionOptions: Option[] = [
    { label: 'All Religions', value: '' },
    ...religions.map((r: any) => ({ label: r.name, value: String(r.id) })),
  ];

  const casteOptions: Option[] = [
    { label: 'All Castes', value: '' },
    ...castes.map((c: any) => ({ label: `${c.name} (${c.category})`, value: String(c.id) })),
  ];

  const partyOptions: Option[] = [
    { label: 'All Political Parties', value: '' },
    ...parties.map((p: any) => ({ label: `${p.abbreviation || p.name}`, value: String(p.id) })),
  ];

  const familyInfluencerFilterOptions: Option[] = [
    { label: boothId ? 'All Family Heads in Booth' : 'Select a Booth first', value: '' },
    ...familyInfluencers.map((inf: any) => {
      const fullName =
        [inf.engFirstName, inf.engMiddleName, inf.engSurname].filter(Boolean).join(' ') ||
        inf.engName ||
        inf.name;
      return {
        label: `${fullName} (${inf.epicNo})`,
        value: String(inf.id),
      };
    }),
  ];

  const socialInfluencerFilterOptions: Option[] = [
    { label: boothId ? 'All Social Leaders in Booth' : 'Select a Booth first', value: '' },
    ...socialInfluencers.map((inf: any) => {
      const fullName =
        [inf.engFirstName, inf.engMiddleName, inf.engSurname].filter(Boolean).join(' ') ||
        inf.engName ||
        inf.name;
      return {
        label: `${fullName} (${inf.epicNo})`,
        value: String(inf.id),
      };
    }),
  ];

  // Filter Configuration for FilterBar & Side Popup Drawer
  const filterFields: FilterField[] = [
    // --- Location & Booth Category ---
    {
      key: 'stateId',
      label: 'State',
      category: 'Location & Booth',
      categoryIcon: <MapPin className="w-4 h-4" />,
      gridSpan: 1,
      value: stateId,
      onChange: setStateId,
      options: stateOptions,
      isPrimary: false,
    },
    {
      key: 'districtId',
      label: 'District',
      category: 'Location & Booth',
      categoryIcon: <MapPin className="w-4 h-4" />,
      gridSpan: 1,
      value: districtId,
      onChange: setDistrictId,
      options: districtOptions,
      isPrimary: false,
    },
    {
      key: 'boothId',
      label: 'Polling Booth',
      category: 'Location & Booth',
      categoryIcon: <MapPin className="w-4 h-4" />,
      gridSpan: 2,
      value: boothId,
      onChange: setBoothId,
      options: boothOptions,
      isPrimary: true,
    },

    // --- Demographics Category ---
    {
      key: 'gender',
      label: 'Gender',
      category: 'Demographics',
      categoryIcon: <Users className="w-4 h-4" />,
      type: 'pills',
      gridSpan: 2,
      value: gender,
      onChange: setGender,
      options: GENDER_OPTIONS,
      isPrimary: true,
    },
    {
      key: 'ageGroup',
      label: 'Age Group Range',
      category: 'Demographics',
      categoryIcon: <Users className="w-4 h-4" />,
      gridSpan: 1,
      value: ageGroup,
      onChange: setAgeGroup,
      options: AGE_GROUP_OPTIONS,
      isPrimary: false,
    },
    {
      key: 'religionId',
      label: 'Religion',
      category: 'Demographics',
      categoryIcon: <Users className="w-4 h-4" />,
      gridSpan: 1,
      value: religionId,
      onChange: setReligionId,
      options: religionOptions,
      isPrimary: false,
    },
    {
      key: 'casteId',
      label: 'Caste & Category',
      category: 'Demographics',
      categoryIcon: <Users className="w-4 h-4" />,
      gridSpan: 2,
      value: casteId,
      onChange: setCasteId,
      options: casteOptions,
      isPrimary: false,
    },

    // --- Political & Status Category ---
    {
      key: 'status',
      label: 'Voter Status',
      category: 'Political & Status',
      categoryIcon: <Vote className="w-4 h-4" />,
      type: 'pills',
      gridSpan: 2,
      value: status,
      onChange: setStatus,
      options: STATUS_OPTIONS,
      isPrimary: true,
    },
    {
      key: 'isDead',
      label: 'Deceased Filter',
      category: 'Political & Status',
      categoryIcon: <Vote className="w-4 h-4" />,
      type: 'pills',
      gridSpan: 2,
      value: isDead,
      onChange: setIsDead,
      options: IS_DEAD_OPTIONS,
      isPrimary: false,
    },
    {
      key: 'voterType',
      label: 'Voter Category',
      category: 'Political & Status',
      categoryIcon: <Vote className="w-4 h-4" />,
      gridSpan: 1,
      value: voterType,
      onChange: setVoterType,
      options: VOTER_TYPE_OPTIONS,
      isPrimary: false,
    },
    {
      key: 'partyId',
      label: 'Party Affiliation',
      category: 'Political & Status',
      categoryIcon: <Vote className="w-4 h-4" />,
      gridSpan: 1,
      value: partyId,
      onChange: setPartyId,
      options: partyOptions,
      isPrimary: false,
    },

    // --- Influencer Network Category ---
    ...(boothId
      ? []
      : [
        {
          key: 'influencerNotice',
          label: 'Polling Booth Required: Select a Polling Booth in "Location & Booth" above to enable specific leader selection.',
          type: 'notice' as const,
          category: 'Influencer Network',
          categoryIcon: <Crown className="w-4 h-4 text-purple-400" />,
          value: '',
          onChange: () => { },
        },
      ]),
    {
      key: 'familyInfluencerId',
      label: 'Linked Family Head',
      category: 'Influencer Network',
      categoryIcon: <Crown className="w-4 h-4 text-purple-400" />,
      gridSpan: 1,
      value: familyInfluencerId,
      onChange: setFamilyInfluencerId,
      options: familyInfluencerFilterOptions,
      placeholder: boothId ? 'All Family Heads in Booth' : 'Select booth first...',
      disabled: !boothId,
      helperText: !boothId ? 'Select Polling Booth to enable' : undefined,
      isPrimary: false,
    },
    {
      key: 'socialInfluencerId',
      label: 'Linked Social Leader',
      category: 'Influencer Network',
      categoryIcon: <Sparkles className="w-4 h-4 text-amber-400" />,
      gridSpan: 1,
      value: socialInfluencerId,
      onChange: setSocialInfluencerId,
      options: socialInfluencerFilterOptions,
      placeholder: boothId ? 'All Social Leaders in Booth' : 'Select booth first...',
      disabled: !boothId,
      helperText: !boothId ? 'Select Polling Booth to enable' : undefined,
      isPrimary: false,
    },
    {
      key: 'influencerRole',
      label: 'Voter Leadership Role',
      category: 'Influencer Network',
      categoryIcon: <Crown className="w-4 h-4 text-purple-400" />,
      type: 'pills',
      gridSpan: 2,
      value: influencerRole,
      onChange: (val: string) => {
        setInfluencerRole(val);
        if (val === 'family') {
          setIsFamilyInfluencer('true');
          setIsSocialInfluencer('');
        } else if (val === 'social') {
          setIsFamilyInfluencer('');
          setIsSocialInfluencer('true');
        } else if (val === 'any') {
          setIsFamilyInfluencer('true');
          setIsSocialInfluencer('true');
        } else {
          setIsFamilyInfluencer('');
          setIsSocialInfluencer('');
        }
      },
      options: [
        { label: 'All Voters', value: '' },
        { label: '👑 Family Heads', value: 'family' },
        { label: '✨ Social Leaders', value: 'social' },
        { label: '🌟 Any Influencer', value: 'any' },
      ],
      isPrimary: false,
    },
    {
      key: 'influencerStatus',
      label: 'Network Connection Status',
      category: 'Influencer Network',
      categoryIcon: <Star className="w-4 h-4 text-indigo-400" />,
      type: 'pills',
      gridSpan: 2,
      value: influencerStatus,
      onChange: setInfluencerStatus,
      options: [
        { label: 'All Voters', value: '' },
        { label: '🔗 Linked to Leader', value: 'assigned' },
        { label: '⚪ Unassigned / Standalone', value: 'unassigned' },
      ],
      isPrimary: false,
    },
  ];

  // Quick Presets Definition
  const filterPresets: FilterPreset[] = [
    {
      label: 'Male Voters',
      icon: <Users className="w-3.5 h-3.5" />,
      active: gender === 'Male',
      apply: () => setGender(gender === 'Male' ? '' : 'Male'),
    },
    {
      label: 'Female Voters',
      icon: <Users className="w-3.5 h-3.5" />,
      active: gender === 'Female',
      apply: () => setGender(gender === 'Female' ? '' : 'Female'),
    },
    {
      label: 'Family Influencers',
      icon: <Crown className="w-3.5 h-3.5 text-purple-400" />,
      active: influencerRole === 'family' || isFamilyInfluencer === 'true',
      apply: () => {
        const next = influencerRole === 'family' || isFamilyInfluencer === 'true' ? '' : 'family';
        setInfluencerRole(next);
        setIsFamilyInfluencer(next ? 'true' : '');
        setIsSocialInfluencer('');
      },
    },
    {
      label: 'Social Influencers',
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
      active: influencerRole === 'social' || isSocialInfluencer === 'true',
      apply: () => {
        const next = influencerRole === 'social' || isSocialInfluencer === 'true' ? '' : 'social';
        setInfluencerRole(next);
        setIsFamilyInfluencer('');
        setIsSocialInfluencer(next ? 'true' : '');
      },
    },
    {
      label: 'Deceased Only',
      icon: <UserX className="w-3.5 h-3.5" />,
      active: isDead === 'true',
      apply: () => setIsDead(isDead === 'true' ? '' : 'true'),
    },
    {
      label: 'First-Time (18-25)',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      active: ageGroup === '18-25',
      apply: () => setAgeGroup(ageGroup === '18-25' ? '' : '18-25'),
    },
  ];

  // Table Columns Definition
  const columns: Column<any>[] = [
    {
      key: 'epicNo',
      header: 'EPIC No.',
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col items-start gap-1">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-mono text-xs font-semibold border border-indigo-200 dark:border-indigo-500/20">
            {row.epicNo}
          </span>
          {row.isDead && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-[10px] border border-rose-200 dark:border-rose-500/30">
              <AlertTriangle size={10} /> DECEASED
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Voter Name & Photo',
      render: (row: any) => {
        const engName = [row.engFirstName, row.engMiddleName, row.engSurname].filter(Boolean).join(' ');
        const locName = [row.firstName, row.middleName, row.surname].filter(Boolean).join(' ');
        const isFamilyInf = row.isFamilyInfluencer || Number(row.familyInfluencedCount) > 0;
        const isSocialInf = row.isSocialInfluencer || Number(row.socialInfluencedCount) > 0;

        return (
          <div className="flex items-center gap-3">
            <SafeImage
              src={row.avatar}
              alt={engName}
              fallbackText={engName}
              className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shrink-0"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{engName || locName || 'Unnamed Voter'}</span>
              {locName && engName !== locName && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">{locName}</span>
              )}
              {(isFamilyInf || isSocialInf) && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {isFamilyInf && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 text-[10px] font-semibold"
                      title={Number(row.familyInfluencedCount) > 0 ? `Family Influencer for ${row.familyInfluencedCount} voter${row.familyInfluencedCount > 1 ? 's' : ''}` : 'Family Influencer (Head of Household)'}
                    >
                      <Crown size={11} className="shrink-0 text-purple-600 dark:text-purple-400" />
                      <span>Family Influencer</span>
                      {Number(row.familyInfluencedCount) > 0 && (
                        <span className="px-1 py-0.2 rounded-full bg-purple-100 dark:bg-purple-500/25 text-[9px] font-bold">
                          {row.familyInfluencedCount}
                        </span>
                      )}
                    </span>
                  )}
                  {isSocialInf && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 text-[10px] font-semibold"
                      title={Number(row.socialInfluencedCount) > 0 ? `Social Influencer for ${row.socialInfluencedCount} voter${row.socialInfluencedCount > 1 ? 's' : ''}` : 'Social Influencer (Community Leader)'}
                    >
                      <Sparkles size={11} className="shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>Social Influencer</span>
                      {Number(row.socialInfluencedCount) > 0 && (
                        <span className="px-1 py-0.2 rounded-full bg-amber-100 dark:bg-amber-500/25 text-[9px] font-bold">
                          {row.socialInfluencedCount}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'booth',
      header: 'Booth / Serial / House',
      render: (row: any) => (
        <div className="flex flex-col text-xs">
          <span className="text-slate-800 dark:text-slate-200 font-medium">{row.boothName || 'Unassigned'}</span>
          <span className="text-slate-500 dark:text-slate-400">
            {row.serialNo ? `Serial: #${row.serialNo}` : ''} {row.houseNo ? `| House: ${row.houseNo}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'genderAge',
      header: 'Gender / Age',
      render: (row: any) => (
        <div className="text-xs text-slate-700 dark:text-slate-300">
          <span>{row.gender || '-'}</span>
          {row.age && <span className="text-slate-500 dark:text-slate-400"> ({row.age} yrs)</span>}
        </div>
      ),
    },
    {
      key: 'party',
      header: 'Party',
      render: (row: any) => (
        <div className="flex items-center gap-2 text-xs">
          {row.partyName ? (
            <span className="font-semibold text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {row.partyName}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 italic">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => {
        const st = (row.status || 'ACTIVE').toUpperCase();
        const badgeColor =
          st === 'ACTIVE'
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
            : st === 'SHIFTED'
              ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
              : st === 'UNVERIFIED'
                ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20'
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';

        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold border ${badgeColor}`}>
            {st}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Reusable Common Page Header */}
      <PageHeader
        title="Voter Directory"
        icon={<Vote className="w-6 h-6" />}
        subtitle="Electoral directory, booth assignment, extended fields, and campaign overlays"
        onImportClick={() => setIsImportModalOpen(true)}
        importLabel="Import Voters (Excel)"
        onExportClick={handleExportVoters}
        exportLabel="Export Excel"
        onAddClick={() => navigate('/dashboard/voters/new')}
        addLabel="Add Voter"
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Voters</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalVoters.toLocaleString()}</h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Male Voters</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.maleVoters.toLocaleString()}</h3>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Female Voters</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.femaleVoters.toLocaleString()}</h3>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Neutral Voters</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {(stats.voterTypeCounts['Neutral Voter'] || 0).toLocaleString()}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <Vote className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar with Side Popup Drawer (Rule 14 & Component standard) */}
      <FilterBar
        searchPlaceholder="Search Name, EPIC No, Mobile, House..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filterFields}
        presets={filterPresets}
        onReset={handleResetFilters}
      />

      {/* Main Data Table */}
      <div className="rounded-2xl dark:bg-slate-900/60 dark:border dark:border-slate-800 dark:p-1">
        <DataTable
          columns={columns}
          data={voters}
          loading={loading}
          showHeader={false}
          serverPagination={{
            page: pagination?.page || page,
            limit: pagination?.limit || limit,
            total: pagination?.total || 0,
            totalPages: pagination?.totalPages || 1,
            onPageChange: (newPage) => setPage(newPage),
            onLimitChange: (newLimit) => {
              setLimit(newLimit);
              setPage(1);
            },
          }}
          actions={(row: any) => {
            const engName = [row.engFirstName, row.engMiddleName, row.engSurname].filter(Boolean).join(' ');
            const locName = [row.firstName, row.middleName, row.surname].filter(Boolean).join(' ');
            const voterName = engName || locName || 'Voter';
            const isMenuOpen = activeRowMenuId === row.id;

            return (
              <TableActions
                onView={() => navigate(`/dashboard/voters/${row.id}`)}
                onEdit={() => navigate(`/dashboard/voters/${row.id}/edit`)}
                onDelete={() => handleOpenDelete(row)}
                extra={
                  <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveRowMenuId(isMenuOpen ? null : row.id);
                    }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer ${isMenuOpen ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100' : ''
                      }`}
                    title="Influencer Options"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveRowMenuId(null);
                        }}
                      />

                      <div
                        className="absolute right-0 top-full mt-1 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-30 divide-y divide-slate-100 dark:divide-slate-800/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveRowMenuId(null);
                              setTargetFamilyInfluencer({
                                id: row.id,
                                name: voterName,
                                epicNo: row.epicNo,
                                boothId: row.boothId,
                                boothName: row.boothName,
                                sectionNo: row.sectionNo,
                                houseNo: row.houseNo,
                              });
                              setFamilyModalOpen(true);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2.5 transition-colors"
                          >
                            <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                            <span>Set Family Influencer</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveRowMenuId(null);
                              setTargetSocialInfluencer({
                                id: row.id,
                                name: voterName,
                                epicNo: row.epicNo,
                                boothId: row.boothId,
                                boothName: row.boothName,
                                sectionNo: row.sectionNo,
                                houseNo: row.houseNo,
                              });
                              setSocialModalOpen(true);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2.5 transition-colors"
                          >
                            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>Set Social Influencer</span>
                          </button>

                          {!row.isFamilyInfluencer && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveRowMenuId(null);
                                setLinkTargetVoterIds([row.id]);
                                setLinkInfluencerType('family');
                                setLinkModalOpen(true);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-2.5 transition-colors"
                            >
                              <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              <span>Link to Family Head</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setActiveRowMenuId(null);
                              setLinkTargetVoterIds([row.id]);
                              setLinkInfluencerType('social');
                              setLinkModalOpen(true);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2.5 transition-colors"
                          >
                            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>Link to Social Leader</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              }
              />
            );
          }}
        />
      </div>

      {/* DELETE CONFIRM MODAL (Rule 10 ConfirmModal) */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Voter Record"
        description={`Are you sure you want to delete voter record with EPIC '${selectedVoter?.epicNo}'? This action cannot be undone.`}
        confirmText="Delete Record"
        variant="danger"
      />

      {/* EXCEL IMPORT MODAL */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Bulk Import Voters from Excel"
        categoryKey="voters"
        fields={[]}
        onImport={handleBulkImport}
      />

      {/* DEDICATED INFLUENCER MODALS (Rule 10 Modal Standard) */}
      <FamilyInfluencerAssignModal
        isOpen={familyModalOpen}
        onClose={() => {
          setFamilyModalOpen(false);
          setTargetFamilyInfluencer(null);
        }}
        influencer={targetFamilyInfluencer}
        onSuccess={() => {
          setFamilyModalOpen(false);
          setTargetFamilyInfluencer(null);
          dispatch(
            fetchVotersData({
              page,
              limit,
              search,
              boothId,
              influencerStatus,
              isFamilyInfluencer,
              isSocialInfluencer,
            })
          );
          dispatch(
            fetchVoterStats({
              search,
              boothId,
              influencerStatus,
              isFamilyInfluencer,
              isSocialInfluencer,
            })
          );
        }}
      />

      <SocialInfluencerAssignModal
        isOpen={socialModalOpen}
        onClose={() => {
          setSocialModalOpen(false);
          setTargetSocialInfluencer(null);
        }}
        influencer={targetSocialInfluencer}
        onSuccess={() => {
          setSocialModalOpen(false);
          setTargetSocialInfluencer(null);
          dispatch(
            fetchVotersData({
              page,
              limit,
              search,
              boothId,
              influencerStatus,
              isFamilyInfluencer,
              isSocialInfluencer,
            })
          );
          dispatch(
            fetchVoterStats({
              search,
              boothId,
              influencerStatus,
              isFamilyInfluencer,
              isSocialInfluencer,
            })
          );
        }}
      />

      <LinkToInfluencerModal
        isOpen={linkModalOpen}
        onClose={() => {
          setLinkModalOpen(false);
          setLinkTargetVoterIds([]);
        }}
        voterIds={linkTargetVoterIds}
        type={linkInfluencerType}
        onSuccess={() => {
          setLinkModalOpen(false);
          setLinkTargetVoterIds([]);
          dispatch(
            fetchVotersData({
              page,
              limit,
              search,
              boothId,
              influencerStatus,
              isFamilyInfluencer,
              isSocialInfluencer,
            })
          );
          dispatch(
            fetchVoterStats({
              search,
              boothId,
              influencerStatus,
              isFamilyInfluencer,
              isSocialInfluencer,
            })
          );
        }}
      />
    </div>
  );
};

export default VotersPage;
