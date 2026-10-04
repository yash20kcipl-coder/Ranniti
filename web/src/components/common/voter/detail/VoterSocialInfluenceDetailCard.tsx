import React from 'react';
import { Sparkles, UserPlus, Unlink } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface VoterSocialInfluenceDetailCardProps {
  voter: any;
  isSocialLeader?: boolean;
  setModalInitialType?: (t: 'family' | 'social') => void;
  setAssignModalOpen?: (b: boolean) => void;
  setLinkInfluencerType?: (t: 'family' | 'social') => void;
  setLinkModalOpen?: (b: boolean) => void;
  handleToggleSocialRole?: () => void;
  handleUnlinkSocialLeader?: () => void;
}

export const VoterSocialInfluenceDetailCard: React.FC<VoterSocialInfluenceDetailCardProps> = ({
  voter,
  isSocialLeader: isSocialLeaderProp,
  setModalInitialType,
  setAssignModalOpen,
  setLinkInfluencerType,
  setLinkModalOpen,
  handleToggleSocialRole,
  handleUnlinkSocialLeader,
}) => {
  const isSocialLeader = isSocialLeaderProp ?? Boolean(voter?.isSocialInfluencer || Number(voter?.socialInfluencedCount) > 0);
  return (
    <div
      className={`p-4 sm:p-4.5 rounded-2xl border shadow-sm dark:shadow-none transition-all space-y-3 ${
        isSocialLeader
          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30'
          : voter.socialInfluencerId
          ? 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800'
          : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-1.5 rounded-lg shrink-0 ${
              isSocialLeader
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-none">
              Social & Community Influence
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none mt-1">
              Social, caste & local leadership
            </p>
          </div>
        </div>

        {isSocialLeader ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3" />
            Social Leader
          </span>
        ) : voter.socialInfluencerId ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 shrink-0">
            Connected
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 shrink-0">
            Unconnected
          </span>
        )}
      </div>

      {/* Content Body Based on Role */}
      {isSocialLeader ? (
        /* State 1: Voter is a Social Leader */
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-amber-100/60 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                Designated Social Leader
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200/80 text-amber-900 dark:bg-amber-500/25 dark:text-amber-200">
                {voter.socialInfluencedCount || 0} Voters
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              {Number(voter.socialInfluencedCount) > 0
                ? `Mobilizes and influences ${voter.socialInfluencedCount} community voter(s).`
                : 'Recognized as community leader. No community voters linked yet.'}
            </p>
          </div>

          <div className="space-y-2">
            {setModalInitialType && setAssignModalOpen && (
              <button
                type="button"
                onClick={() => {
                  setModalInitialType('social');
                  setAssignModalOpen(true);
                }}
                className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Manage Community Network ({voter.socialInfluencedCount || 0})</span>
              </button>
            )}

            {handleToggleSocialRole && (
              <button
                type="button"
                onClick={handleToggleSocialRole}
                className="w-full py-1 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                Remove Social Leader Role
              </button>
            )}
          </div>
        </div>
      ) : voter.socialInfluencerId ? (
        /* State 2: Voter is linked under a Social Leader */
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Connected to Community Leader:
            </span>
            <div className="flex items-center justify-between gap-3">
              <Link
                to={`/dashboard/voters/${voter.socialInfluencerId}`}
                className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
              >
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block truncate hover:underline">
                    {voter.socialInfluencerName || `Voter #${voter.socialInfluencerId}`}
                  </span>
                  {voter.socialInfluencerEpic && (
                    <span className="text-[11px] font-mono text-amber-800 dark:text-amber-300">
                      EPIC: {voter.socialInfluencerEpic}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>

          {(setLinkInfluencerType || handleUnlinkSocialLeader) && (
            <div className="grid grid-cols-2 gap-2">
              {setLinkInfluencerType && setLinkModalOpen && (
                <button
                  type="button"
                  onClick={() => {
                    setLinkInfluencerType('social');
                    setLinkModalOpen(true);
                  }}
                  className="py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none rounded-xl text-xs font-semibold transition-colors text-center cursor-pointer"
                >
                  Change Leader
                </button>
              )}
              {handleUnlinkSocialLeader && (
                <button
                  type="button"
                  onClick={handleUnlinkSocialLeader}
                  className="py-2 px-3 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm dark:shadow-none"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Unlink</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* State 3: Voter has no social leader */
        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No community or caste influencer currently associated with this voter.
          </p>

          {(setModalInitialType || setLinkInfluencerType) && (
            <div className="space-y-2">
              {setModalInitialType && setAssignModalOpen && (
                <button
                  type="button"
                  onClick={() => {
                    setModalInitialType('social');
                    setAssignModalOpen(true);
                  }}
                  className="w-full py-2.5 px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 dark:bg-amber-600/30 dark:hover:bg-amber-600/40 dark:text-amber-200 dark:border-amber-500/40 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Set Social Influencer</span>
                </button>
              )}

              {setLinkInfluencerType && setLinkModalOpen && (
                <button
                  type="button"
                  onClick={() => {
                    setLinkInfluencerType('social');
                    setLinkModalOpen(true);
                  }}
                  className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium transition-colors text-center cursor-pointer"
                >
                  + Link to a Community Leader
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoterSocialInfluenceDetailCard;
