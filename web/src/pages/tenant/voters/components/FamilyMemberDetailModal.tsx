import {
  Crown,
  Users,
  Phone,
  CreditCard,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  setNewFamilyHeadAction,
  fetchFamilyMembersAction,
} from '@/redux/actions/familyMapping';
import React, { useState } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import { Modal } from '@/components/common/Modal';
import { SafeImage } from '@/components/common/SafeImage';

export interface FamilyMemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  headId: string | null;
  onSuccess?: () => void;
}

export const FamilyMemberDetailModal: React.FC<FamilyMemberDetailModalProps> = ({
  isOpen,
  onClose,
  headId,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [familyData, setFamilyData] = useState<any | null>(null);
  const [promotingHeadId, setPromotingHeadId] = useState<string | null>(null);

  const loadFamilyDetails = async (id: string) => {
    setLoading(true);
    try {
      const data = await dispatch(fetchFamilyMembersAction(id));
      setFamilyData(data);
    } catch (err: any) {
      toast.error('Failed to load family members');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && headId) {
      loadFamilyDetails(headId);
    } else {
      setFamilyData(null);
    }
  }, [isOpen, headId]);

  const handlePromoteToHead = async (newHeadId: string, memberName: string) => {
    if (!headId) return;
    if (!window.confirm(`Are you sure you want to promote ${memberName} to become the new Head of Family?`)) {
      return;
    }

    setPromotingHeadId(newHeadId);
    try {
      await dispatch(
        setNewFamilyHeadAction({
          currentHeadId: headId,
          newHeadId,
        })
      );
      toast.success(`${memberName} is now the Head of Family!`);
      if (onSuccess) onSuccess();
      // Reload using the new head
      await loadFamilyDetails(newHeadId);
    } catch (err: any) {
      toast.error('Failed to transfer Head of Family role');
    } finally {
      setPromotingHeadId(null);
    }
  };

  const head = familyData?.head;
  const members = familyData?.members || [];
  const summary = familyData?.summary;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={head ? `Family Household: ${summary?.familyId || 'FAM'}` : 'Family Details'}
      subtitle={
        head
          ? `House #${head.houseNo || 'N/A'} • ${head.boothName || `Booth #${head.boothNumber}`}`
          : 'Household details'
      }
      maxWidth="xl"
    >
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Loading household network...</span>
        </div>
      ) : !head ? (
        <div className="py-12 text-center text-slate-500 text-xs">No family data found.</div>
      ) : (
        <div className="space-y-6">
          {/* Head of Family Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200/80 dark:border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <SafeImage
                  src={head.avatar}
                  alt={head.engName || head.name}
                  fallbackText={head.engName || head.name}
                  className="w-14 h-14 rounded-2xl border-2 border-purple-300 dark:border-purple-500 shadow-sm"
                />
                <div className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-amber-400 text-slate-900 shadow">
                  <Crown className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {head.engName || head.name}
                  </span>
                  {head.name && head.engName && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">({head.name})</span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                    Head of Family
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-mono font-medium">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    {head.epicNo}
                  </span>
                  <span>•</span>
                  <span>{head.gender || 'Unknown'}, {head.age ? `${head.age} yrs` : 'Age N/A'}</span>
                  {head.mobileNo && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {head.mobileNo}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics Badge */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Members</span>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">{summary?.totalMembers || 1}</p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] text-indigo-500 uppercase font-bold tracking-wider">Influence</span>
                <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  {summary?.influenceScore || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Support Summary Breakdown */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Household Political Sentiment Summary
              </span>
              <div className="flex items-center gap-3 text-[11px] font-medium">
                <span className="text-emerald-700 dark:text-emerald-400">
                  ● {summary?.supporters || 0} Supporters
                </span>
                <span className="text-slate-500 dark:text-slate-400">● {summary?.neutral || 0} Neutral</span>
                <span className="text-rose-600 dark:text-rose-400">● {summary?.opposition || 0} Opposition</span>
              </div>
            </div>

            {/* Tri-color progress bar */}
            {summary && summary.totalMembers > 0 && (
              <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(summary.supporters / summary.totalMembers) * 100}%` }}
                  title={`${summary.supporters} Supporters`}
                />
                <div
                  className="bg-slate-300 dark:bg-slate-600 transition-all duration-500"
                  style={{ width: `${(summary.neutral / summary.totalMembers) * 100}%` }}
                  title={`${summary.neutral} Neutral`}
                />
                <div
                  className="bg-rose-500 transition-all duration-500"
                  style={{ width: `${(summary.opposition / summary.totalMembers) * 100}%` }}
                  title={`${summary.opposition} Opposition`}
                />
              </div>
            )}
          </div>

          {/* Household Members List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Household Family Members ({members.length})
                </h4>
              </div>
              <span className="text-[11px] text-slate-500">
                Linked to Head: <strong className="text-slate-700 dark:text-slate-300">{head.engName || head.name}</strong>
              </span>
            </div>

            {members.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <p className="text-xs text-slate-500">No other family members linked to this head yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                {members.map((member: any) => (
                  <div
                    key={member.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <SafeImage
                        src={member.avatar}
                        alt={member.engName || member.name}
                        fallbackText={member.engName || member.name}
                        className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                      />

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {member.engName || member.name}
                          </span>
                          {member.partyName && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              {member.partyName}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-mono">{member.epicNo}</span>
                          <span>•</span>
                          <span>{member.gender || 'N/A'}, {member.age ? `${member.age} yrs` : 'Age N/A'}</span>
                          {member.mobileNo && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{member.mobileNo}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handlePromoteToHead(member.id, member.engName || member.name)}
                        disabled={promotingHeadId === member.id}
                        title="Promote this member to Head of Family"
                        className="p-2 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all border border-slate-200 dark:border-slate-800 cursor-pointer"
                      >
                        {promotingHeadId === member.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                        ) : (
                          <Crown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
