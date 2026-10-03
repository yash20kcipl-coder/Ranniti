import {
  Crown,
  Search,
  X,
  Home,
  Users,
  CheckCircle2,
  MapPin,
  Building2,
  UserCheck,
} from 'lucide-react';
import { Modal } from '../Modal';
import toast from 'react-hot-toast';
import React, { useState } from 'react';
import { SafeImage } from '../SafeImage';
import { useAppDispatch } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { fetchFamilyCandidatesAction, bulkAssignInfluencerAction } from '@/redux/actions/voter';

export interface FamilyInfluencerTarget {
  id: string;
  name: string;
  engName?: string;
  epicNo?: string;
  boothId?: string;
  boothName?: string;
  sectionNo?: string | number;
  houseNo?: string;
  avatar?: string;
  familyInfluencedCount?: number;
}

export interface FamilyInfluencerAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  influencer: FamilyInfluencerTarget | null;
  onSuccess?: () => void;
}

export const FamilyInfluencerAssignModal: React.FC<FamilyInfluencerAssignModalProps> = ({
  isOpen,
  onClose,
  influencer,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();

  // Search & Filter State (Defaulting Unassigned and Same Surname to true per requirements)
  const [search, setSearch] = useState('');
  const [sameHouseOnly, setSameHouseOnly] = useState(false);
  const [sameSurnameOnly, setSameSurnameOnly] = useState(true);
  const [sameSectionOnly, setSameSectionOnly] = useState(false);
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [genderFilter, setGenderFilter] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Status & Data State
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [voterCandidates, setVoterCandidates] = useState<any[]>([]);
  const [selectedVoterIds, setSelectedVoterIds] = useState<string[]>([]);
  const [liveInfluencerMeta, setLiveInfluencerMeta] = useState<any>(null);

  // Reset defaults on modal open
  React.useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSameHouseOnly(false);
      setSameSurnameOnly(true);
      setSameSectionOnly(false);
      setUnassignedOnly(false);
      setGenderFilter('');
      setPage(1);
      setSelectedVoterIds([]);
    }
  }, [isOpen, influencer?.id]);

  // Reset and fetch candidates using dedicated API
  useDebouncedEffect(
    () => {
      if (!isOpen || !influencer) return;

      setLoading(true);

      dispatch(
        fetchFamilyCandidatesAction({
          influencerId: influencer.id,
          boothId: influencer.boothId || undefined,
          search: search.trim() || undefined,
          sameHouseOnly: sameHouseOnly ? 'true' : undefined,
          sameSurnameOnly: sameSurnameOnly ? 'true' : undefined,
          sectionNo: sameSectionOnly ? (influencer.sectionNo || liveInfluencerMeta?.sectionNo || undefined) : undefined,
          unassignedOnly: unassignedOnly ? 'true' : undefined,
          gender: genderFilter || undefined,
          page,
          limit,
        })
      )
        .then((res: any) => {
          const list = res?.voters || res?.data?.voters || [];
          const total = res?.pagination?.total || 0;
          const pages = res?.pagination?.totalPages || 1;

          setVoterCandidates(list);
          setTotalCount(total);
          setTotalPages(pages);

          if (res?.influencer) {
            setLiveInfluencerMeta(res.influencer);
          }
        })
        .catch(() => toast.error('Failed to load family candidates'))
        .finally(() => setLoading(false));
    },
    200,
    [
      isOpen,
      influencer?.id,
      search,
      sameHouseOnly,
      sameSurnameOnly,
      sameSectionOnly,
      unassignedOnly,
      genderFilter,
      page,
    ]
  );

  const toggleSelectVoter = (id: string) => {
    setSelectedVoterIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllOnPage = () => {
    const pageIds = voterCandidates.map((v) => v.id);
    const allSelected = pageIds.every((id) => selectedVoterIds.includes(id));

    if (allSelected) {
      setSelectedVoterIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedVoterIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleSubmit = async () => {
    if (!influencer) return;
    if (selectedVoterIds.length === 0) {
      toast.error('Please select at least one family member to link.');
      return;
    }

    try {
      setSubmitting(true);

      await dispatch(
        bulkAssignInfluencerAction({
          influencerId: influencer.id,
          influencerType: 'family',
          voterIds: selectedVoterIds,
        })
      );

      toast.success(`Successfully linked ${selectedVoterIds.length} family member(s)!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update family influencer assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const isAllPageSelected =
    voterCandidates.length > 0 &&
    voterCandidates.every((v) => selectedVoterIds.includes(v.id));

  const infMeta = liveInfluencerMeta || influencer;
  const influencerHouseNo = infMeta?.houseNo || influencer?.houseNo;
  const influencerBoothName = infMeta?.boothName || influencer?.boothName;
  const influencerSectionNo = infMeta?.sectionNo || influencer?.sectionNo;
  const linkedCount = infMeta?.familyInfluencedCount ?? influencer?.familyInfluencedCount ?? 0;

  return (
    <Modal
      maxWidth="5xl"
      onClose={onClose}
      title="Set Family Influencer"
      isOpen={isOpen && Boolean(influencer)}
    >
      <div className="space-y-4 py-1">

        {/* 1. PREMIUM INFLUENCER PROFILE HEADER CARD */}
        {infMeta && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/50 to-purple-50/40 dark:from-purple-950/60 dark:via-slate-900/80 dark:to-indigo-950/50 border border-purple-200 dark:border-purple-500/30 shadow-sm dark:shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <SafeImage
                    src={infMeta.avatar}
                    alt={infMeta.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-purple-300 dark:border-purple-500/50 bg-slate-100 dark:bg-slate-950 shadow-inner"
                    fallbackText={infMeta.name}
                  />
                  <span className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-sm">
                    <Crown className="w-3 h-3 stroke-[2.5]" />
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                      {infMeta.engName || infMeta.name}
                    </h3>
                    {infMeta.name && infMeta.engName && infMeta.name !== infMeta.engName && (
                      <span className="text-xs text-purple-700 dark:text-purple-200">
                        ({infMeta.name})
                      </span>
                    )}
                    {infMeta.epicNo && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-semibold border border-purple-200 dark:border-purple-500/30">
                        {infMeta.epicNo}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                    {influencerBoothName && (
                      <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <Building2 className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        <span>Booth: {influencerBoothName}</span>
                      </span>
                    )}
                    {influencerSectionNo && (
                      <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <MapPin className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        <span>Section {influencerSectionNo}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Chips */}
              <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center">
                {influencerHouseNo && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-semibold shadow-sm">
                    <Home className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>House #{influencerHouseNo}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-xs font-semibold shadow-sm">
                  <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>{linkedCount} linked member(s)</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. SEARCH & MULTI-FILTER CONTROLS BAR */}
        <div className="space-y-2">
          <div className="relative flex items-center">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, relative, mobile, serial no or house no (type to filter)..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {influencerHouseNo && (
              <button
                type="button"
                onClick={() => {
                  setSameHouseOnly(!sameHouseOnly);
                  setPage(1);
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${sameHouseOnly
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 border border-emerald-500'
                  : 'bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none'
                  }`}
              >
                <Home className={`w-3.5 h-3.5 ${sameHouseOnly ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                <span>Same House (#{influencerHouseNo})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setSameSurnameOnly(!sameSurnameOnly);
                setPage(1);
              }}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${sameSurnameOnly
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30 border border-purple-500'
                : 'bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none'
                }`}
            >
              <Users className={`w-3.5 h-3.5 ${sameSurnameOnly ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`} />
              <span>Same Surname Only</span>
            </button>

            {influencerSectionNo && (
              <button
                type="button"
                onClick={() => {
                  setSameSectionOnly(!sameSectionOnly);
                  setPage(1);
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${sameSectionOnly
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30 border border-amber-500'
                  : 'bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none'
                  }`}
              >
                <MapPin className={`w-3.5 h-3.5 ${sameSectionOnly ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
                <span>Same Section (#{influencerSectionNo})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setUnassignedOnly(!unassignedOnly);
                setPage(1);
              }}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${unassignedOnly
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30 border border-indigo-500'
                : 'bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none'
                }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${unassignedOnly ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
              <span>Unassigned Only</span>
            </button>

            {/* Gender Quick Switcher */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-0.5 text-xs ml-auto">
              <button
                type="button"
                onClick={() => {
                  setGenderFilter('');
                  setPage(1);
                }}
                className={`py-1 px-2.5 rounded-lg font-medium transition-colors ${!genderFilter ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setGenderFilter(genderFilter === 'Male' ? '' : 'Male');
                  setPage(1);
                }}
                className={`py-1 px-2.5 rounded-lg font-medium transition-colors ${genderFilter === 'Male' ? 'bg-indigo-100 dark:bg-indigo-600/40 text-indigo-700 dark:text-indigo-200 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => {
                  setGenderFilter(genderFilter === 'Female' ? '' : 'Female');
                  setPage(1);
                }}
                className={`py-1 px-2.5 rounded-lg font-medium transition-colors ${genderFilter === 'Female' ? 'bg-purple-100 dark:bg-purple-600/40 text-purple-700 dark:text-purple-200 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                Female
              </button>
            </div>
          </div>
        </div>

        {/* 3. ENRICHED VOTER CANDIDATES TABLE */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950/40 shadow-sm">
          <div className="overflow-x-auto max-h-80 custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 border-collapse">
              <thead className="bg-slate-100/90 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0 backdrop-blur z-10">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={handleToggleSelectAllOnPage}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 accent-purple-600 dark:accent-purple-500 focus:ring-purple-500 focus:ring-offset-white dark:focus:ring-offset-slate-900 bg-white dark:bg-slate-900 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Serial</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Section</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Voter Name (English & Local)</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">EPIC No</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">House No</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Gender / Age</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Mobile</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-right">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
                {loading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={`skeleton-${idx}`} className="animate-pulse border-b border-slate-200/60 dark:border-slate-800/40">
                      <td className="py-3 px-3 text-center">
                        <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800/80 mx-auto" />
                      </td>
                      <td className="py-3 px-3">
                        <div className="w-8 h-3.5 rounded bg-slate-200 dark:bg-slate-800/80" />
                      </td>
                      <td className="py-3 px-3">
                        <div className="w-6 h-3.5 rounded bg-slate-200 dark:bg-slate-800/80" />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="w-36 h-3.5 rounded bg-slate-200 dark:bg-slate-800/90" />
                          <div className="w-20 h-2.5 rounded bg-slate-200 dark:bg-slate-800/60" />
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-800/70" />
                      </td>
                      <td className="py-3 px-3">
                        <div className="w-14 h-3.5 rounded bg-slate-200 dark:bg-slate-800/80" />
                      </td>
                      <td className="py-3 px-3">
                        <div className="w-16 h-3.5 rounded bg-slate-200 dark:bg-slate-800/70" />
                      </td>
                      <td className="py-3 px-3">
                        <div className="w-20 h-3.5 rounded bg-slate-200 dark:bg-slate-800/80" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="w-20 h-5 rounded-full bg-slate-200 dark:bg-slate-800/80 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : voterCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No matching voters found in this polling booth.
                    </td>
                  </tr>
                ) : (
                  voterCandidates.map((voter) => {
                    const isSelected = selectedVoterIds.includes(voter.id);
                    const locName = [voter.firstName, voter.middleName, voter.surname].filter(Boolean).join(' ');
                    const engName = [voter.engFirstName, voter.engMiddleName, voter.engSurname].filter(Boolean).join(' ');

                    return (
                      <tr
                        key={voter.id}
                        onClick={() => toggleSelectVoter(voter.id)}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100' : 'hover:bg-purple-50/40 dark:hover:bg-slate-900/50'
                          }`}
                      >
                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectVoter(voter.id)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 accent-purple-600 dark:accent-purple-500 focus:ring-purple-500 focus:ring-offset-white dark:focus:ring-offset-slate-900 bg-white dark:bg-slate-900 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-mono">
                          {voter.serialNo ? `#${voter.serialNo}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-mono">
                          {voter.sectionNo || '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col leading-tight">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                              {engName || locName || voter.epicNo}
                            </span>
                            {locName && engName && locName !== engName && (
                              <span className="text-[11px] text-purple-700 dark:text-purple-300 font-medium mt-0.5">
                                {locName}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                            {voter.epicNo}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-800 dark:text-slate-200 font-medium">{voter.houseNo || '-'}</span>
                            {voter.isSameHouse && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                                Same House 🏠
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {voter.gender || '-'}
                          {voter.age ? ` • ${voter.age} yrs` : ''}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                          {voter.mobileNo || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {voter.isAlreadyLinked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                              <span>Linked: {voter.familyInfluencerName || 'Another Head'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              Unassigned
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 4. ENTRY STATS & PAGINATION BAR */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
            <div>
              Showing {totalCount > 0 ? (page - 1) * limit + 1 : 0} to{' '}
              {Math.min(page * limit, totalCount)} of {totalCount} entries
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm dark:shadow-none"
              >
                Previous
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pNum = i + 1;
                if (totalPages > 5 && page > 3) {
                  pNum = page - 2 + i;
                  if (pNum > totalPages) pNum = totalPages - (4 - i);
                }
                return (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => setPage(pNum)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${page === pNum
                      ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm dark:shadow-none'
                      }`}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm dark:shadow-none"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* 5. FOOTER CONTROLS */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-purple-700 dark:text-purple-300 font-semibold">
            {selectedVoterIds.length} family member(s) selected
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm dark:shadow-none"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || selectedVoterIds.length === 0}
              className="py-2 px-5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Save ({selectedVoterIds.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
