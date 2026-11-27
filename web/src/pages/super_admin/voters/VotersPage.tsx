import { Vote } from 'lucide-react';
import {
  fetchSuperAdminVotersData,
  fetchSuperAdminVoterStats,
  deleteSuperAdminVoterItem,
  exportSuperAdminVotersData,
  exportSuperAdminVotersPdfData,
  fetchSuperAdminInfluencerOptions,
} from '@/redux/actions/voterSuperAdmin';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMasterData } from '@/hooks/useMasterData';
import { setVoterFilters } from '@/redux/actions/voter';
import { initialVoterFilters } from '@/redux/reducers/voter';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';

// Shared Standard Components
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { fetchSuperAdminBoothOptions } from '@/redux/actions/voter';
import type { FamilyInfluencerTarget, SocialInfluencerTarget } from '@/components/common/influencer';

// Screen Subcomponents & Utilities
import {
  buildVoterFilterFields,
  buildVoterFilterPresets,
  buildVoterTableColumns,
  formatBoothOption,
  VoterStatsCards,
  VoterRowActions,
  VoterModals,
  ExportVotersModal,
} from '@/components/common/voter/list';

export const SuperAdminVotersPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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
  const masterData = useMasterData(['states', 'districts', 'pcs', 'acs', 'religions', 'castes', 'parties']);

  // Pagination State
  const [page, setPage] = useState<number>(() => savedFilters?.page || 1);
  const [limit, setLimit] = useState<number>(() => savedFilters?.limit || 25);

  // Filters State
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

  const isInitialMountRef = React.useRef(true);

  // Modals State
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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Direct AC change handler for filter component
  const handleAcChange = (newAcId: string) => {
    setAcId(newAcId);
    setBoothId('');
    setFamilyInfluencers([]);
    setSocialInfluencers([]);
    if (familyInfluencerId) setFamilyInfluencerId('');
    if (socialInfluencerId) setSocialInfluencerId('');
    dispatch(fetchSuperAdminBoothOptions({ acId: newAcId || undefined, limit: newAcId ? 500 : 50 }));
  };

  // Immediate draft AC change handler to populate booth dropdown inside filter drawer
  const handleAcDraftChange = (newAcId: string) => {
    setFamilyInfluencers([]);
    setSocialInfluencers([]);
    dispatch(fetchSuperAdminBoothOptions({ acId: newAcId || undefined, limit: newAcId ? 500 : 50 }));
  };

  // Remote search handler for booth dropdown
  const handleBoothSearch = async (query: string, acFilter?: string) => {
    const results = await dispatch(
      fetchSuperAdminBoothOptions({
        acId: acFilter || undefined,
        search: query,
        limit: 50,
        saveToStore: false,
      })
    );
    return (results || []).map(formatBoothOption);
  };

  // Direct Booth change handler for filter component
  const handleBoothChange = (newBoothId: string) => {
    setBoothId(newBoothId);
    if (familyInfluencerId) setFamilyInfluencerId('');
    if (socialInfluencerId) setSocialInfluencerId('');
    if (newBoothId) {
      dispatch(fetchSuperAdminInfluencerOptions({ boothId: newBoothId, type: 'family' }))
        .then((options: any[]) => setFamilyInfluencers(options || []))
        .catch(() => { });

      dispatch(fetchSuperAdminInfluencerOptions({ boothId: newBoothId, type: 'social' }))
        .then((options: any[]) => setSocialInfluencers(options || []))
        .catch(() => { });
    } else {
      setFamilyInfluencers([]);
      setSocialInfluencers([]);
    }
  };

  // Immediate draft Booth change handler to populate influencer options inside filter drawer
  const handleBoothDraftChange = (newBoothId: string) => {
    if (newBoothId) {
      dispatch(fetchSuperAdminInfluencerOptions({ boothId: newBoothId, type: 'family' }))
        .then((options: any[]) => setFamilyInfluencers(options || []))
        .catch(() => { });

      dispatch(fetchSuperAdminInfluencerOptions({ boothId: newBoothId, type: 'social' }))
        .then((options: any[]) => setSocialInfluencers(options || []))
        .catch(() => { });
    } else {
      setFamilyInfluencers([]);
      setSocialInfluencers([]);
    }
  };

  // Recover options on initial mount / back navigation
  React.useEffect(() => {
    if (!boothOptions || boothOptions.length === 0) {
      dispatch(fetchSuperAdminBoothOptions({ acId: acId || undefined, limit: acId ? 500 : 50 }));
    }
    if (boothId) {
      dispatch(fetchSuperAdminInfluencerOptions({ boothId, type: 'family' }))
        .then((options: any[]) => setFamilyInfluencers(options || []))
        .catch(() => { });
      dispatch(fetchSuperAdminInfluencerOptions({ boothId, type: 'social' }))
        .then((options: any[]) => setSocialInfluencers(options || []))
        .catch(() => { });
    }
  }, []);

  const prevFilterDepsRef = React.useRef({
    search, stateId, districtId, pcId, acId, boothId, gender, voterType,
    status, isDead, partyId, religionId, casteId, ageGroup, familyInfluencerId,
    socialInfluencerId, isFamilyInfluencer, isSocialInfluencer, influencerStatus, influencerRole,
  });

  // Fetch Voters Data & Stats
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
      dispatch(fetchSuperAdminVotersData(params));
      dispatch(fetchSuperAdminVoterStats(params));
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
      await dispatch(deleteSuperAdminVoterItem(selectedVoter.id, getCurrentFilterParams()));
      setIsDeleteModalOpen(false);
    } catch (err) { }
  };

  const handleExportExcel = async (extraParams: Record<string, any> = {}) => {
    setIsExporting(true);
    try {
      await dispatch(exportSuperAdminVotersData({ ...getCurrentFilterParams(), ...extraParams }));
    } finally {
      setIsExporting(false);
    }
  };

    const handleExportPdf = async ({ boothId: exportBoothId, language, includePhotos, boothLabel }: { boothId: string; language: 'gu' | 'en'; includePhotos: boolean; boothLabel?: string }) => {
      setIsExporting(true);
      try {
        await dispatch(exportSuperAdminVotersPdfData({ boothId: exportBoothId, language, includePhotos, boothLabel }));
      } finally {
        setIsExporting(false);
      }
    };

    const handleInfluencerSuccess = () => {
      const params = { page, limit, search, boothId, influencerStatus, isFamilyInfluencer, isSocialInfluencer };
      dispatch(fetchSuperAdminVotersData(params));
      dispatch(fetchSuperAdminVoterStats(params));
    };

    const handleResetFilters = () => {
      setSearch(''); setStateId(''); setDistrictId(''); setPcId(''); setAcId(''); setBoothId('');
      setGender(''); setVoterType(''); setStatus(''); setIsDead(''); setPartyId(''); setReligionId('');
      setCasteId(''); setAgeGroup(''); setFamilyInfluencerId(''); setSocialInfluencerId('');
      setIsFamilyInfluencer(''); setIsSocialInfluencer(''); setInfluencerStatus(''); setInfluencerRole('');
      setFamilyInfluencers([]);
      setSocialInfluencers([]);
      dispatch(fetchSuperAdminBoothOptions({ limit: 50 }));
      setPage(1);
      dispatch(setVoterFilters(initialVoterFilters));
      dispatch(fetchSuperAdminVotersData({ page: 1, limit }));
      dispatch(fetchSuperAdminVoterStats({}));
    };

    const filterParams: Record<string, string> = {
      stateId, districtId, pcId, acId, boothId,
      gender, ageGroup, religionId, casteId,
      status, isDead, voterType, partyId,
      familyInfluencerId, socialInfluencerId,
      isFamilyInfluencer, isSocialInfluencer,
      influencerRole, influencerStatus,
    };

    const filterSetters: Record<string, React.Dispatch<React.SetStateAction<string>>> = {
      stateId: setStateId, districtId: setDistrictId, pcId: setPcId, acId: setAcId, boothId: setBoothId,
      gender: setGender, ageGroup: setAgeGroup, religionId: setReligionId, casteId: setCasteId,
      status: setStatus, isDead: setIsDead, voterType: setVoterType, partyId: setPartyId,
      familyInfluencerId: setFamilyInfluencerId, socialInfluencerId: setSocialInfluencerId,
      isFamilyInfluencer: setIsFamilyInfluencer, isSocialInfluencer: setIsSocialInfluencer,
      influencerRole: setInfluencerRole, influencerStatus: setInfluencerStatus,
    };

    const setFilter = (key: string, val: string) => filterSetters[key]?.(val);

    const filterStateBundle = {
      filterParams,
      setFilter,
      onAcChange: handleAcChange,
      onBoothChange: handleBoothChange,
      onAcDraftChange: handleAcDraftChange,
      onBoothDraftChange: handleBoothDraftChange,
      onBoothSearch: handleBoothSearch,
    };

    const filterMasterBundle = {
      ...masterData,
      booths: boothOptions,
      isBoothsLoading: isBoothOptionsLoading,
      familyInfluencers,
      socialInfluencers,
    };

    const filterFields = buildVoterFilterFields(filterStateBundle, filterMasterBundle);
    const filterPresets = buildVoterFilterPresets(filterStateBundle);
    const columns = buildVoterTableColumns();



    return (
      <div className="space-y-4">
        <PageHeader
          addLabel="Add Voter"
          title="Voter Directory"
          exportLabel="Export"
          onExportClick={() => setIsExportModalOpen(true)}
          icon={<Vote className="w-5 h-5" />}
          onAddClick={() => navigate('/dashboard/voters/new')}
          subtitle="Global electoral directory, booth assignments, master data management, and tactical campaign overlays"
        />

        <VoterStatsCards
          stats={stats}
          activeGender={gender}
          activeVoterType={voterType}
          onToggleGender={(g) => setGender((prev) => (prev.toLowerCase() === g.toLowerCase() ? '' : g))}
          onToggleVoterType={(vt) => setVoterType((prev) => (prev === vt ? '' : vt))}
          onResetQuickFilters={() => {
            setGender('');
            setVoterType('');
          }}
        />

        {/* Unified Voter Table & FilterBar Card */}
        <DataTable
          data={voters}
          columns={columns}
          loading={loading}
          showHeader={false}
          selectable={false}
          filterBar={
            <FilterBar
              embedded
              searchValue={search}
              filters={filterFields}
              presets={filterPresets}
              onSearchChange={setSearch}
              onReset={handleResetFilters}
              searchPlaceholder="Search Name, EPIC No, Mobile, House..."
            />
          }
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

        <VoterModals
          isDeleteModalOpen={isDeleteModalOpen}
          setIsDeleteModalOpen={setIsDeleteModalOpen}
          selectedVoter={selectedVoter}
          onDeleteConfirm={handleDeleteConfirm}
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
          isSuperAdmin={true}
        />

        <ExportVotersModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          acOptions={masterData.acs || []}
          currentAcId={acId}
          onFetchBooths={(fetchAcId) =>
            dispatch(
              fetchSuperAdminBoothOptions({
                acId: fetchAcId || undefined,
                limit: 500,
                saveToStore: false,
              })
            )
          }
          currentBoothId={boothId}
          onExportExcel={handleExportExcel}
          onExportPdf={handleExportPdf}
          isLoading={isExporting}
        />
      </div>
    );
  };

  export default SuperAdminVotersPage;
