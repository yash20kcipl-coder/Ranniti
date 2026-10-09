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
  fetchTenantBoothOptions,
} from '@/redux/actions/voterTenant';
import { setVoterFilters, setVoterBoothOptions } from '@/redux/actions/voter';
import { useTenantMasterData } from '@/hooks/useTenantMasterData';
import { initialVoterFilters } from '@/redux/reducers/voter';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { useFilterParams, cleanParams } from '@/hooks/useFilterParams';

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
} from '@/components/common/voter/list';

export const VotersPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isInitialMountRef = React.useRef(true);
  const {
    voters,
    loading,
    stats,
    pagination,
    filters: savedFilters,
    initialized,
    boothOptions,
    isBoothOptionsLoading,
  } = useAppSelector((state) => state.voter);
  const masterData = useTenantMasterData(['states', 'districts', 'pcs', 'acs', 'religions', 'castes', 'parties']);
  const {
    filterParams,
    setFilter,
    resetFilters,
    page,
    setPage,
    limit,
    setLimit,
    getApiParams,
    syncPage,
  } = useFilterParams({
    initialFilters: {
      search: savedFilters?.search ?? '',
      stateId: savedFilters?.stateId ?? '',
      districtId: savedFilters?.districtId ?? '',
      pcId: savedFilters?.pcId ?? '',
      acId: savedFilters?.acId ?? '',
      boothId: savedFilters?.boothId ?? '',
      gender: savedFilters?.gender ?? '',
      casteId: savedFilters?.casteId ?? '',
      voterType: savedFilters?.voterType ?? '',
      status: savedFilters?.status ?? '',
      isDead: savedFilters?.isDead ?? '',
      partyId: savedFilters?.partyId ?? '',
      religionId: savedFilters?.religionId ?? '',
      ageGroup: savedFilters?.ageGroup ?? '',
      familyInfluencerId: savedFilters?.familyInfluencerId ?? '',
      socialInfluencerId: savedFilters?.socialInfluencerId ?? '',
      isFamilyInfluencer: savedFilters?.isFamilyInfluencer ?? '',
      isSocialInfluencer: savedFilters?.isSocialInfluencer ?? '',
      influencerStatus: savedFilters?.influencerStatus ?? '',
      influencerRole: savedFilters?.influencerRole ?? '',
    },
    initialPage: savedFilters?.page ?? 1,
    initialLimit: savedFilters?.limit ?? 25,
  });
  // ─── UI Modal State ──────────────────────────────────────────────────────────
  const { boothId } = filterParams;
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [linkTargetVoterIds, setLinkTargetVoterIds] = useState<string[]>([]);
  const [activeRowMenuId, setActiveRowMenuId] = useState<string | null>(null);
  const [linkInfluencerType, setLinkInfluencerType] = useState<'family' | 'social'>('family');
  const [targetFamilyInfluencer, setTargetFamilyInfluencer] = useState<FamilyInfluencerTarget | null>(null);
  const [targetSocialInfluencer, setTargetSocialInfluencer] = useState<SocialInfluencerTarget | null>(null);
  const [familyInfluencers, setFamilyInfluencers] = useState<any[]>([]);
  const [socialInfluencers, setSocialInfluencers] = useState<any[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Direct AC change handler for filter component
  const handleAcChange = (newAcId: string) => {
    setFilter('acId', newAcId);
    setFilter('boothId', '');
    setFamilyInfluencers([]);
    setSocialInfluencers([]);
    if (filterParams.familyInfluencerId) setFilter('familyInfluencerId', '');
    if (filterParams.socialInfluencerId) setFilter('socialInfluencerId', '');
    if (newAcId) {
      dispatch(fetchTenantBoothOptions({ acId: newAcId }));
    } else {
      dispatch(setVoterBoothOptions([]));
    }
  };

  // Immediate draft AC change handler to populate booth dropdown inside filter drawer
  const handleAcDraftChange = (newAcId: string) => {
    setFamilyInfluencers([]);
    setSocialInfluencers([]);
    if (newAcId) {
      dispatch(fetchTenantBoothOptions({ acId: newAcId }));
    } else {
      dispatch(setVoterBoothOptions([]));
    }
  };

  // Direct Booth change handler for filter component
  const handleBoothChange = (newBoothId: string) => {
    setFilter('boothId', newBoothId);
    if (filterParams.familyInfluencerId) setFilter('familyInfluencerId', '');
    if (filterParams.socialInfluencerId) setFilter('socialInfluencerId', '');
    if (newBoothId) {
      dispatch(fetchInfluencerOptions({ boothId: newBoothId, type: 'family' }))
        .then((opts: any[]) => setFamilyInfluencers(opts || []))
        .catch(() => { });
      dispatch(fetchInfluencerOptions({ boothId: newBoothId, type: 'social' }))
        .then((opts: any[]) => setSocialInfluencers(opts || []))
        .catch(() => { });
    } else {
      setFamilyInfluencers([]);
      setSocialInfluencers([]);
    }
  };

  // Immediate draft Booth change handler to populate influencer options inside filter drawer
  const handleBoothDraftChange = (newBoothId: string) => {
    if (newBoothId) {
      dispatch(fetchInfluencerOptions({ boothId: newBoothId, type: 'family' }))
        .then((opts: any[]) => setFamilyInfluencers(opts || []))
        .catch(() => { });
      dispatch(fetchInfluencerOptions({ boothId: newBoothId, type: 'social' }))
        .then((opts: any[]) => setSocialInfluencers(opts || []))
        .catch(() => { });
    } else {
      setFamilyInfluencers([]);
      setSocialInfluencers([]);
    }
  };

  // Recover options on initial mount / back navigation if acId or boothId is saved in Redux
  React.useEffect(() => {
    if (filterParams.acId && (!boothOptions || boothOptions.length === 0)) {
      dispatch(fetchTenantBoothOptions({ acId: filterParams.acId }));
    }
    if (filterParams.boothId) {
      dispatch(fetchInfluencerOptions({ boothId: filterParams.boothId, type: 'family' }))
        .then((opts: any[]) => setFamilyInfluencers(opts || []))
        .catch(() => { });
      dispatch(fetchInfluencerOptions({ boothId: filterParams.boothId, type: 'social' }))
        .then((opts: any[]) => setSocialInfluencers(opts || []))
        .catch(() => { });
    }
  }, []);

  useDebouncedEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      if (initialized && voters && voters.length > 0) return;
    }

    const { activePage } = syncPage();
    const params = { ...getApiParams(), page: activePage };

    dispatch(setVoterFilters(params));
    dispatch(fetchVotersData(params));
    dispatch(fetchVoterStats(params));
  }, 200, [dispatch, page, limit, filterParams]);

  const handleOpenDelete = (voter: any) => {
    setSelectedVoter(voter);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVoter) return;
    try {
      await dispatch(deleteVoterItem(selectedVoter.id, getApiParams()));
      setIsDeleteModalOpen(false);
    } catch (_) { }
  };

  const handleBulkImport = async (fileOrRecords: any, context?: Record<string, any>) => {
    await dispatch(importVotersData(fileOrRecords, getApiParams(), context));
  };

  const handleExportVoters = () => {
    dispatch(exportVotersData(getApiParams()));
  };

  const handleInfluencerSuccess = () => {
    const params = cleanParams({
      boothId,
      page, limit,
      search: filterParams.search,
      influencerStatus: filterParams.influencerStatus,
      isFamilyInfluencer: filterParams.isFamilyInfluencer,
      isSocialInfluencer: filterParams.isSocialInfluencer,
    });
    dispatch(fetchVotersData(params));
    dispatch(fetchVoterStats(params));
  };

  const handleResetFilters = () => {
    resetFilters(initialVoterFilters);
    setFamilyInfluencers([]);
    setSocialInfluencers([]);
    dispatch(setVoterBoothOptions([]));
    dispatch(setVoterFilters(initialVoterFilters));
    dispatch(fetchVotersData({ page: 1, limit }));
    dispatch(fetchVoterStats({}));
  };

  // ─── Filter Config ────────────────────────────────────────────────────────────
  const columns = buildVoterTableColumns();
  const filterPresets = buildVoterFilterPresets({
    filterParams,
    setFilter,
    onAcChange: handleAcChange,
    onBoothChange: handleBoothChange,
  });
  const filterMasterBundle = {
    ...masterData,
    booths: boothOptions,
    isBoothsLoading: isBoothOptionsLoading,
    familyInfluencers,
    socialInfluencers,
  };
  const filterFields = buildVoterFilterFields(
    {
      filterParams,
      setFilter,
      onAcChange: handleAcChange,
      onBoothChange: handleBoothChange,
      onAcDraftChange: handleAcDraftChange,
      onBoothDraftChange: handleBoothDraftChange,
    },
    filterMasterBundle
  );

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
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

      <VoterStatsCards stats={stats} />

      <FilterBar
        searchPlaceholder="Search Name, EPIC No, Mobile, House..."
        searchValue={filterParams.search}
        onSearchChange={(val) => setFilter('search', val)}
        filters={filterFields}
        presets={filterPresets}
        onReset={handleResetFilters}
      />

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
            onLimitChange: (newLimit) => { setLimit(newLimit); setPage(1); },
          }}
          actions={(row: any) => (
            <VoterRowActions
              row={row}
              activeRowMenuId={activeRowMenuId}
              setActiveRowMenuId={setActiveRowMenuId}
              onView={() => navigate(`/dashboard/voters/${row.id}`)}
              onEdit={() => navigate(`/dashboard/voters/${row.id}/edit`)}
              onDelete={() => handleOpenDelete(row)}
              onSetFamilyInfluencer={(target) => { setTargetFamilyInfluencer(target); setFamilyModalOpen(true); }}
              onSetSocialInfluencer={(target) => { setTargetSocialInfluencer(target); setSocialModalOpen(true); }}
              onLinkFamilyHead={(voterId) => { setLinkTargetVoterIds([voterId]); setLinkInfluencerType('family'); setLinkModalOpen(true); }}
              onLinkSocialLeader={(voterId) => { setLinkTargetVoterIds([voterId]); setLinkInfluencerType('social'); setLinkModalOpen(true); }}
            />
          )}
        />
      </div>

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
        sampleParams={{ acId: filterParams.acId, boothId: filterParams.boothId }}
      />
    </div>
  );
};

export default VotersPage;
