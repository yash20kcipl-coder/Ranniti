import React, { useState } from 'react';
import { Modal } from './Modal';
import { useAppDispatch } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { fetchVotersData, fetchInfluencerOptions, bulkAssignInfluencerAction } from '@/redux/actions/voter';
import { Crown, Sparkles, Search, X, AlertCircle } from 'lucide-react';

export interface InfluencerAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Mode 1: Link multiple voters TO this specific influencer
  targetInfluencer?: {
    id: string;
    name: string;
    epicNo?: string;
    boothId?: string;
    boothName?: string;
    sectionNo?: string | number;
    houseNo?: string;
  };
  // Mode 2: Link an influencer TO these selected voter IDs
  targetVoterIds?: string[];
  initialType?: 'family' | 'social';
  onSuccess?: () => void;
}

export const InfluencerAssignModal: React.FC<InfluencerAssignModalProps> = ({
  isOpen,
  onClose,
  targetInfluencer,
  targetVoterIds,
  initialType = 'family',
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const [influencerType, setInfluencerType] = useState<'family' | 'social'>(initialType);

  // Search state
  const [search, setSearch] = useState('');

  // Pagination state inside modal
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Loading & Selection state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Candidate Voters & Selected IDs
  const [voterCandidates, setVoterCandidates] = useState<any[]>([]);
  const [selectedVoterIds, setSelectedVoterIds] = useState<string[]>([]);

  // Mode 2 Influencer dropdown options
  const [influencerOptions, setInfluencerOptions] = useState<any[]>([]);
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string>('');

  const isMode1 = Boolean(targetInfluencer); // Assigning voters to a known influencer
  const isMode2 = Boolean(targetVoterIds && targetVoterIds.length > 0 && !targetInfluencer);

  // Load candidates/options when modal opens, search changes, or page changes
  useDebouncedEffect(
    () => {
      if (!isOpen) return;

      setError(null);
      setLoading(true);

      if (isMode1 && targetInfluencer) {
        dispatch(
          fetchVotersData({
            page,
            limit,
            search: search.trim() || undefined,
            boothId: targetInfluencer.boothId || undefined,
          })
        )
          .then((res: any) => {
            const list = res?.voters || res?.data?.voters || res?.payload?.voters || [];
            const total = res?.pagination?.total || res?.total || list.length;
            const pages = res?.pagination?.totalPages || res?.totalPages || Math.ceil(total / limit) || 1;

            // Exclude the influencer from the candidates list
            const filteredCandidates = list.filter((v: any) => v.id !== targetInfluencer.id);
            setVoterCandidates(filteredCandidates);
            setTotalCount(total);
            setTotalPages(pages);
          })
          .catch(() => setError('Failed to load voter list'))
          .finally(() => setLoading(false));
      } else if (isMode2) {
        dispatch(
          fetchInfluencerOptions({
            search: search.trim() || undefined,
            type: influencerType,
          })
        )
          .then((options: any[]) => {
            setInfluencerOptions(options || []);
          })
          .catch(() => setError('Failed to load influencers list'))
          .finally(() => setLoading(false));
      }
    },
    200,
    [isOpen, search, page, influencerType, isMode1, isMode2, targetInfluencer?.id]
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
    try {
      setSubmitting(true);
      setError(null);

      if (isMode1 && targetInfluencer) {
        if (selectedVoterIds.length === 0) {
          setError('Please select at least one voter to link.');
          setSubmitting(false);
          return;
        }

        await dispatch(
          bulkAssignInfluencerAction({
            influencerId: targetInfluencer.id,
            influencerType,
            voterIds: selectedVoterIds,
          })
        );
      } else if (isMode2 && targetVoterIds) {
        if (!selectedInfluencerId) {
          setError('Please select an influencer to assign.');
          setSubmitting(false);
          return;
        }

        await dispatch(
          bulkAssignInfluencerAction({
            influencerId: selectedInfluencerId,
            influencerType,
            voterIds: targetVoterIds,
          })
        );
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update influencer assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const isAllPageSelected =
    voterCandidates.length > 0 &&
    voterCandidates.every((v) => selectedVoterIds.includes(v.id));

  // Subtitle header matching the reference image format:
  // "Influencer: rupsang gohil | Booth 253, Section 101"
  const subtitleText =
    isMode1 && targetInfluencer
      ? `Influencer: ${targetInfluencer.name}${targetInfluencer.boothName ? ` | Booth ${targetInfluencer.boothName}` : targetInfluencer.boothId ? ` | Booth ${targetInfluencer.boothId}` : ''}${targetInfluencer.sectionNo ? `, Section ${targetInfluencer.sectionNo}` : ''}`
      : `Assign an influencer to ${targetVoterIds?.length || 0} selected voter(s)`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isMode1
          ? `Set ${influencerType === 'family' ? 'Family' : 'Social'} Influencer`
          : `Assign ${influencerType === 'family' ? 'Family' : 'Social'} Influencer`
      }
      subtitle={subtitleText}
      maxWidth="xl"
    >
      <div className="space-y-4 py-1">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Influencer Role Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setInfluencerType('family')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              influencerType === 'family'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-purple-400" />
            <span>Family Influencer</span>
          </button>
          <button
            type="button"
            onClick={() => setInfluencerType('social')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              influencerType === 'social'
                ? 'bg-amber-600/30 text-amber-200 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Social Influencer</span>
          </button>
        </div>

        {/* Search Bar matching reference layout */}
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, mobile, serial no or house no (type to filter)"
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-3 text-slate-400 hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mode 1: Table with Section No | Serial No | Name | HouseNo | Mobile */}
        {isMode1 && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="overflow-x-auto max-h-80 custom-scrollbar">
              <table className="w-full text-left text-xs text-slate-200 border-collapse">
                <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800 sticky top-0 backdrop-blur">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllPageSelected}
                        onChange={handleToggleSelectAllOnPage}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 accent-indigo-600 dark:accent-indigo-500 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-white dark:focus:ring-offset-slate-900 bg-white dark:bg-slate-900 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3">Section No</th>
                    <th className="py-2.5 px-3">Serial No</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">HouseNo</th>
                    <th className="py-2.5 px-3">Mobile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Loading voters list...
                      </td>
                    </tr>
                  ) : voterCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No matching voters found.
                      </td>
                    </tr>
                  ) : (
                    voterCandidates.map((voter) => {
                      const isSelected = selectedVoterIds.includes(voter.id);
                      const locName = [voter.firstName, voter.middleName, voter.surname].filter(Boolean).join(' ');
                      const engName = [voter.engFirstName, voter.engMiddleName, voter.engSurname].filter(Boolean).join(' ');
                      const displayName = locName || engName || voter.epicNo;

                      return (
                        <tr
                          key={voter.id}
                          onClick={() => toggleSelectVoter(voter.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-950/40 text-indigo-100' : 'hover:bg-slate-900/50'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectVoter(voter.id)}
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 accent-indigo-600 dark:accent-indigo-500 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-white dark:focus:ring-offset-slate-900 bg-white dark:bg-slate-900 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 font-mono">
                            {voter.sectionNo || voter.sectionId || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 font-mono">
                            {voter.serialNo || '-'}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-100">
                            {displayName}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {voter.houseNo || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 font-mono">
                            {voter.mobileNo || voter.mobile || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination & Entry Counter Bar */}
            <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <div>
                Showing {totalCount > 0 ? (page - 1) * limit + 1 : 0} to{' '}
                {Math.min(page * limit, totalCount)} of {totalCount} entries
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                      className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                        page === pNum
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
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
                  className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mode 2: Select Influencer Dropdown */}
        {isMode2 && (
          <div className="space-y-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <label className="block text-xs font-medium text-slate-300">
              Select {influencerType === 'family' ? 'Family' : 'Social'} Influencer Leader
            </label>
            <select
              value={selectedInfluencerId}
              onChange={(e) => setSelectedInfluencerId(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Select Influencer --</option>
              {influencerOptions.map((inf) => (
                <option key={inf.id} value={inf.id}>
                  {[inf.engFirstName, inf.engMiddleName, inf.engSurname].filter(Boolean).join(' ') || inf.engName} ({inf.epicNo})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Footer Actions: Close | Save */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || (isMode1 && selectedVoterIds.length === 0) || (isMode2 && !selectedInfluencerId)}
            className="py-2 px-5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
