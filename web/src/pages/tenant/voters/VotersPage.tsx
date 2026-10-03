import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Vote } from 'lucide-react';
import {
  fetchTenantVotersData as fetchVotersData,
  fetchTenantVoterStats as fetchVoterStats,
  deleteTenantVoterItem as deleteVoterItem,
  importTenantVotersData as importVotersData,
  exportTenantVotersData as exportVotersData,
  fetchTenantInfluencerOptions as fetchInfluencerOptions,
} from '@/redux/actions/voterTenant';
import { setVoterFilters } from '@/redux/actions/voter';
import { useTenantMasterData } from '@/hooks/useTenantMasterData';
import { initialVoterFilters } from '@/redux/reducers/voter';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';

// Shared Standard Components
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import type { FamilyInfluencerTarget, SocialInfluencerTarget } from '@/components/common/influencer';

// Screen Subcomponents & Utilities
import {
  buildVoterFilterFields,
  buildVoterFilterPresets,
  buildVoterTableColumns,
  VoterStatsCards,
  VoterRowActions,
  VoterModals,
} from './components';

export const VotersPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { voters, loading, stats, pagination, filters: savedFilters, initialized } = useAppSelector((state) => state.voter);
  const masterData = useTenantMasterData(['states', 'districts', 'pcs', 'acs', 'booths', 'religions', 'castes', 'parties']);

  // Pagination State - initialized from Redux saved filters if available
  const [page, setPage] = useState<number>(() => savedFilters?.page || 1);
  const [limit, setLimit] = useState<number>(() => savedFilters?.limit || 25);

  // Filters State - initialized from Redux saved filters to survive route changes
  const [search, setSearch] = useState<string>(() => savedFilters?.search || '');
  const [stateId, setStateId] = useState<string>(() => savedFilters?.stateId || '');
  const [districtId, setDistrictId] = useState<string>(() => savedFilters?.districtId || '');
  const [pcId, setPcId] = useState<string>(() => savedFilters?.pcId || '');
  const [acId, setAcId] = useState<string>(() => savedFilters?.acId || '');
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

  // Influencer & Actions Modals State
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [linkTargetVoterIds, setLinkTargetVoterIds] = useState<string[]>([]);
  const [activeRowMenuId, setActiveRowMenuId] = useState<string | null>(null);
  const [linkInfluencerType, setLinkInfluencerType] = useState<'family' | 'social'>('family');
  const [targetFamilyInfluencer, setTargetFamilyInfluencer] = useState<FamilyInfluencerTarget | null>(null);
  const [targetSocialInfluencer, setTargetSocialInfluencer] = useState<SocialInfluencerTarget | null>(null);

  // Influencers list for dropdown filter
  const [familyInfluencers, setFamilyInfluencers] = useState<any[]>([]);
  const [socialInfluencers, setSocialInfluencers] = useState<any[]>([]);

  // Deletion & Import Modal States
  const [selectedVoter, setSelectedVoter] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Load influencer dropdown options debounced (Rule 9 + Rule 13)
  useDebouncedEffect(() => {
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
  }, 200, [dispatch, boothId]);

  // Track previous filters to reset page to 1 when filters change
  const prevFilterDepsRef = React.useRef({
    search, stateId, districtId, pcId, acId, boothId, gender, voterType,
    status, isDead, partyId, religionId, casteId, ageGroup, familyInfluencerId,
    socialInfluencerId, isFamilyInfluencer, isSocialInfluencer, influencerStatus, influencerRole,
  });

  const prevStatsScopeRef = React.useRef({ boothId, acId, pcId, districtId, stateId });

  // Fetch Voters Data & Stats on mount & changes (Rule 13)
  useDebouncedEffect(
    () => {
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
        if (initialized && voters && voters.length > 0) {
          return;
        }
      }

      const currentFilters = {
        search, stateId, districtId, pcId, acId, boothId, gender, voterType,
        status, isDead, partyId, religionId, casteId, ageGroup, familyInfluencerId,
        socialInfluencerId, isFamilyInfluencer, isSocialInfluencer, influencerStatus, influencerRole,
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

      const params: Record<string, any> = { ...currentFilters, page: activePage, limit };
      dispatch(setVoterFilters(params));
      dispatch(fetchVotersData(params));

      const statsScopeChanged =
        !initialized ||
        prevStatsScopeRef.current.boothId !== boothId ||
        prevStatsScopeRef.current.acId !== acId ||
        prevStatsScopeRef.current.pcId !== pcId ||
        prevStatsScopeRef.current.districtId !== districtId ||
        prevStatsScopeRef.current.stateId !== stateId;

      if (statsScopeChanged) {
        prevStatsScopeRef.current = { boothId, acId, pcId, districtId, stateId };
        dispatch(fetchVoterStats({ boothId, acId, pcId, districtId, stateId }));
      }
    },
    200,
    [
      dispatch, page, limit, search, stateId, districtId, pcId, acId, boothId,
      gender, voterType, status, isDead, partyId, religionId, casteId, ageGroup,
      familyInfluencerId, socialInfluencerId, isFamilyInfluencer, isSocialInfluencer,
      influencerStatus, influencerRole,
    ]
  );

  const getCurrentFilterParams = () => ({
    search, stateId, districtId, pcId, acId, boothId, gender, voterType,
    status, isDead, partyId, religionId, casteId, ageGroup, familyInfluencerId,
    socialInfluencerId, isFamilyInfluencer, isSocialInfluencer, influencerStatus, influencerRole,
    page, limit,
  });

  const handleOpenDelete = (voter: any) => {
    setSelectedVoter(voter);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVoter) return;
    try {
      await dispatch(deleteVoterItem(selectedVoter.id, getCurrentFilterParams()));
      setIsDeleteModalOpen(false);
    } catch (err) { }
  };

  const handleBulkImport = async (records: Record<string, any>[]) => {
    await dispatch(importVotersData(records, getCurrentFilterParams()));
  };

  const handleExportVoters = () => {
    dispatch(exportVotersData(getCurrentFilterParams()));
  };

  const handleInfluencerSuccess = () => {
    const params = { page, limit, search, boothId, influencerStatus, isFamilyInfluencer, isSocialInfluencer };
    dispatch(fetchVotersData(params));
    dispatch(fetchVoterStats(params));
  };

  const handleResetFilters = () => {
    isInitialMountRef.current = false;
    setSearch(''); setStateId(''); setDistrictId(''); setPcId(''); setAcId(''); setBoothId('');
    setGender(''); setVoterType(''); setStatus(''); setIsDead(''); setPartyId(''); setReligionId('');
    setCasteId(''); setAgeGroup(''); setFamilyInfluencerId(''); setSocialInfluencerId('');
    setIsFamilyInfluencer(''); setIsSocialInfluencer(''); setInfluencerStatus(''); setInfluencerRole('');
    setPage(1);
    dispatch(setVoterFilters(initialVoterFilters));
  };

  const filterStateBundle = {
    stateId, setStateId, districtId, setDistrictId, pcId, setPcId, acId, setAcId, boothId, setBoothId,
    gender, setGender, ageGroup, setAgeGroup, religionId, setReligionId, casteId, setCasteId,
    status, setStatus, isDead, setIsDead, voterType, setVoterType, partyId, setPartyId,
    familyInfluencerId, setFamilyInfluencerId, socialInfluencerId, setSocialInfluencerId,
    isFamilyInfluencer, setIsFamilyInfluencer, isSocialInfluencer, setIsSocialInfluencer,
    influencerRole, setInfluencerRole, influencerStatus, setInfluencerStatus,
  };

  const filterMasterBundle = {
    ...masterData,
    familyInfluencers,
    socialInfluencers,
  };

  const filterFields = buildVoterFilterFields(filterStateBundle, filterMasterBundle);
  const filterPresets = buildVoterFilterPresets(filterStateBundle);
  const columns = buildVoterTableColumns();

  return (
    <div className="space-y-6">
      {/* Reusable Page Header */}
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
      <VoterStatsCards stats={stats} />

      {/* Filter Bar with Side Drawer */}
      <FilterBar
        searchPlaceholder="Search Name, EPIC No, Mobile, House..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filterFields}
        presets={filterPresets}
        onReset={handleResetFilters}
      />

      {/* Data Table */}
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
          actions={(row: any) => (
            <VoterRowActions
              row={row}
              activeRowMenuId={activeRowMenuId}
              setActiveRowMenuId={setActiveRowMenuId}
              onView={() => navigate(`/dashboard/voters/${row.id}`)}
              onEdit={() => navigate(`/dashboard/voters/${row.id}/edit`)}
              onDelete={() => handleOpenDelete(row)}
              onSetFamilyInfluencer={(target) => {
                setTargetFamilyInfluencer(target);
                setFamilyModalOpen(true);
              }}
              onSetSocialInfluencer={(target) => {
                setTargetSocialInfluencer(target);
                setSocialModalOpen(true);
              }}
              onLinkFamilyHead={(voterId) => {
                setLinkTargetVoterIds([voterId]);
                setLinkInfluencerType('family');
                setLinkModalOpen(true);
              }}
              onLinkSocialLeader={(voterId) => {
                setLinkTargetVoterIds([voterId]);
                setLinkInfluencerType('social');
                setLinkModalOpen(true);
              }}
            />
          )}
        />
      </div>

      {/* Modals & Dialogs */}
      <VoterModals
        isDeleteModalOpen={isDeleteModalOpen}
        setIsDeleteModalOpen={setIsDeleteModalOpen}
        selectedVoter={selectedVoter}
        onDeleteConfirm={handleDeleteConfirm}
        isImportModalOpen={isImportModalOpen}
        setIsImportModalOpen={setIsImportModalOpen}
        onBulkImport={handleBulkImport}
        familyModalOpen={familyModalOpen}
        setFamilyModalOpen={setFamilyModalOpen}
        targetFamilyInfluencer={targetFamilyInfluencer}
        setTargetFamilyInfluencer={setTargetFamilyInfluencer}
        socialModalOpen={socialModalOpen}
        setSocialModalOpen={setSocialModalOpen}
        targetSocialInfluencer={targetSocialInfluencer}
        setTargetSocialInfluencer={setTargetSocialInfluencer}
        linkModalOpen={linkModalOpen}
        setLinkModalOpen={setLinkModalOpen}
        linkTargetVoterIds={linkTargetVoterIds}
        setLinkTargetVoterIds={setLinkTargetVoterIds}
        linkInfluencerType={linkInfluencerType}
        onInfluencerSuccess={handleInfluencerSuccess}
      />
    </div>
  );
};

export default VotersPage;
