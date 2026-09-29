import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../Modal';
import { useAppDispatch } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { fetchInfluencerOptions, bulkAssignInfluencerAction } from '@/redux/actions/voter';
import { Crown, Sparkles, Search, X, UserCheck, Check } from 'lucide-react';
import { SafeImage } from '../SafeImage';

export interface LinkToInfluencerModalProps {
  isOpen: boolean;
  onClose: () => void;
  voterIds: string[];
  type?: 'family' | 'social';
  onSuccess?: () => void;
}

export const LinkToInfluencerModal: React.FC<LinkToInfluencerModalProps> = ({
  isOpen,
  onClose,
  voterIds,
  type = 'family',
  onSuccess,
}) => {
  const dispatch = useAppDispatch();

  // Search & Influencer state
  const [search, setSearch] = useState('');
  const [influencerOptions, setInfluencerOptions] = useState<any[]>([]);
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string>('');

  // Status state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load available influencers matching search and type
  useDebouncedEffect(
    () => {
      if (!isOpen || voterIds.length === 0) return;

      setLoading(true);

      dispatch(
        fetchInfluencerOptions({
          search: search.trim() || undefined,
          type,
          excludeId: voterIds.length === 1 ? voterIds[0] : undefined,
        })
      )
        .then((options: any[]) => {
          setInfluencerOptions(options || []);
        })
        .catch(() => toast.error('Failed to load influencer options'))
        .finally(() => setLoading(false));
    },
    200,
    [isOpen, search, type, voterIds]
  );

  const handleSubmit = async () => {
    if (!selectedInfluencerId) {
      toast.error('Please select an influencer leader to assign.');
      return;
    }

    if (voterIds.includes(selectedInfluencerId)) {
      toast.error('A voter cannot be linked under themselves.');
      return;
    }

    try {
      setSubmitting(true);

      await dispatch(
        bulkAssignInfluencerAction({
          influencerId: selectedInfluencerId,
          influencerType: type,
          voterIds,
        })
      );

      toast.success(`Successfully linked ${voterIds.length} voter(s) to influencer!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to link voters to influencer');
    } finally {
      setSubmitting(false);
    }
  };

  const isFamily = type === 'family';
  const roleName = isFamily ? 'Family Influencer (Head of House)' : 'Social Influencer (Community Leader)';

  return (
    <Modal
      maxWidth="3xl"
      onClose={onClose}
      isOpen={isOpen && voterIds.length > 0}
      title={`Link to ${isFamily ? 'Family Influencer' : 'Social Influencer'}`}
      subtitle={`Assigning ${voterIds.length} voter(s) to a registered ${roleName}`}
    >
      <div className="space-y-4 py-1">

        {/* Search Input Bar */}
        <div className="relative flex items-center">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${isFamily ? 'Family Head' : 'Social Leader'} by name or EPIC...`}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm dark:shadow-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Influencer Cards List */}
        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">Loading influencer leaders...</div>
          ) : influencerOptions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No matching {isFamily ? 'family' : 'social'} influencers found.
            </div>
          ) : (
            influencerOptions.map((inf) => {
              const isSelected = selectedInfluencerId === String(inf.id);
              const engName = [inf.engFirstName, inf.engMiddleName, inf.engSurname].filter(Boolean).join(' ');
              const locName = [inf.firstName, inf.middleName, inf.surname].filter(Boolean).join(' ');
              const displayName = engName || locName || inf.engName || inf.epicNo;
              const count = isFamily ? inf.familyInfluencedCount : inf.socialInfluencedCount;

              return (
                <div
                  key={inf.id}
                  onClick={() => setSelectedInfluencerId(String(inf.id))}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected
                    ? isFamily
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-500/50 shadow-sm dark:shadow-md ring-1 ring-purple-400 dark:ring-purple-500/30'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/50 shadow-sm dark:shadow-md ring-1 ring-amber-400 dark:ring-amber-500/30'
                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm dark:shadow-none'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <SafeImage
                      src={inf.avatar}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      fallbackText={displayName}
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{displayName}</span>
                        {isFamily ? (
                          <Crown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2.5 mt-0.5">
                        <span className="font-mono text-slate-700 dark:text-slate-300">EPIC: {inf.epicNo}</span>
                        {inf.boothName && <span>• Booth: {inf.boothName}</span>}
                        {inf.houseNo && <span>• House #{inf.houseNo}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {count !== undefined && count !== null && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold">
                        {count} linked
                      </span>
                    )}

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${isSelected
                        ? isFamily
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-amber-600 border-amber-500 text-white'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950'
                        }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm dark:shadow-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !selectedInfluencerId}
            className={`py-2 px-5 rounded-xl text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 ${isFamily
              ? 'bg-purple-600 hover:bg-purple-500'
              : 'bg-amber-600 hover:bg-amber-500'
              }`}
          >
            {submitting ? (
              <span>Saving...</span>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Link to Influencer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
