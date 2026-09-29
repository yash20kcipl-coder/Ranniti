import React from 'react';
import { Crown, UserPlus, Unlink } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface VoterFamilyNetworkDetailCardProps {
  voter: any;
  isFamilyHead: boolean;
  setModalInitialType: (t: 'family' | 'social') => void;
  setAssignModalOpen: (b: boolean) => void;
  setLinkInfluencerType: (t: 'family' | 'social') => void;
  setLinkModalOpen: (b: boolean) => void;
  handleToggleFamilyRole: () => void;
  handleUnlinkFamilyHead: () => void;
}

export const VoterFamilyNetworkDetailCard: React.FC<VoterFamilyNetworkDetailCardProps> = ({
  voter,
  isFamilyHead,
  setModalInitialType,
  setAssignModalOpen,
  setLinkInfluencerType,
  setLinkModalOpen,
  handleToggleFamilyRole,
  handleUnlinkFamilyHead,
}) => {
  return (
    <div
      className={`p-5 rounded-2xl border shadow-sm dark:shadow-none transition-all space-y-4 ${
        isFamilyHead
          ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-200 dark:border-purple-500/30'
          : voter.familyInfluencerId
          ? 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800'
          : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${
              isFamilyHead
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
              Family Network
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Household mapping & leadership
            </span>
          </div>
        </div>

        {isFamilyHead ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30 flex items-center gap-1">
            <Crown className="w-3 h-3" />
            Family Head
          </span>
        ) : voter.familyInfluencerId ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30">
            Member
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            Unlinked
          </span>
        )}
      </div>

      {/* Mutually Exclusive State Rendering */}
      {isFamilyHead ? (
        /* State 1: Voter is the Family Head */
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-purple-100/60 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wider">
                Designated Head of Household
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-200/80 text-purple-900 dark:bg-purple-500/25 dark:text-purple-200">
                {voter.familyInfluencedCount || 0} Linked
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              {Number(voter.familyInfluencedCount) > 0
                ? `Influences and represents a household of ${voter.familyInfluencedCount} voter(s).`
                : 'Head of household. No other family members linked yet.'}
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setModalInitialType('family');
                setAssignModalOpen(true);
              }}
              className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Manage Family Members ({voter.familyInfluencedCount || 0})</span>
            </button>

            <button
              type="button"
              onClick={handleToggleFamilyRole}
              className="w-full py-1 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              Resign from Family Head Role
            </button>
          </div>
        </div>
      ) : voter.familyInfluencerId ? (
        /* State 2: Voter is linked under another Family Head */
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Linked under Head of Household:
            </span>
            <div className="flex items-center justify-between gap-3">
              <Link
                to={`/dashboard/voters/${voter.familyInfluencerId}`}
                className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
              >
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 shrink-0">
                  <Crown className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block truncate hover:underline">
                    {voter.familyInfluencerName || `Voter #${voter.familyInfluencerId}`}
                  </span>
                  {voter.familyInfluencerEpic && (
                    <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300">
                      EPIC: {voter.familyInfluencerEpic}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setLinkInfluencerType('family');
                setLinkModalOpen(true);
              }}
              className="py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none rounded-xl text-xs font-semibold transition-colors text-center cursor-pointer"
            >
              Change Head
            </button>
            <button
              type="button"
              onClick={handleUnlinkFamilyHead}
              className="py-2 px-3 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm dark:shadow-none"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Unlink</span>
            </button>
          </div>
        </div>
      ) : (
        /* State 3: Voter is unassigned (Independent) */
        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This voter is not currently assigned to any family household network.
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setModalInitialType('family');
                setAssignModalOpen(true);
              }}
              className="w-full py-2.5 px-3 bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300 dark:bg-purple-600/30 dark:hover:bg-purple-600/40 dark:text-purple-200 dark:border-purple-500/40 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Set Family Influencer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLinkInfluencerType('family');
                setLinkModalOpen(true);
              }}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium transition-colors text-center cursor-pointer"
            >
              + Link to an Existing Family Head
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoterFamilyNetworkDetailCard;
