import React from 'react';
import { Crown, Sparkles, UserCheck, MoreVertical } from 'lucide-react';
import { TableActions } from '@/components/common/TableActions';
import type { FamilyInfluencerTarget, SocialInfluencerTarget } from '@/components/common/influencer';

interface VoterRowActionsProps {
  row: any;
  activeRowMenuId: string | null;
  setActiveRowMenuId: (id: string | null) => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetFamilyInfluencer: (target: FamilyInfluencerTarget) => void;
  onSetSocialInfluencer: (target: SocialInfluencerTarget) => void;
  onLinkFamilyHead: (voterId: string) => void;
  onLinkSocialLeader: (voterId: string) => void;
}

export const VoterRowActions: React.FC<VoterRowActionsProps> = ({
  row,
  activeRowMenuId,
  setActiveRowMenuId,
  onView,
  onEdit,
  onDelete,
  onSetFamilyInfluencer,
  onSetSocialInfluencer,
  onLinkFamilyHead,
  onLinkSocialLeader,
}) => {
  const engName = [row.engFirstName, row.engMiddleName, row.engSurname].filter(Boolean).join(' ');
  const locName = [row.firstName, row.middleName, row.surname].filter(Boolean).join(' ');
  const voterName = engName || locName || 'Voter';
  const isMenuOpen = activeRowMenuId === row.id;

  return (
    <TableActions
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      extra={
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveRowMenuId(isMenuOpen ? null : row.id);
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer ${
              isMenuOpen ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100' : ''
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
                      onSetFamilyInfluencer({
                        id: row.id,
                        name: voterName,
                        epicNo: row.epicNo,
                        boothId: row.boothId,
                        boothName: row.boothName,
                        sectionNo: row.sectionNo,
                        houseNo: row.houseNo,
                      });
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
                      onSetSocialInfluencer({
                        id: row.id,
                        name: voterName,
                        epicNo: row.epicNo,
                        boothId: row.boothId,
                        boothName: row.boothName,
                        sectionNo: row.sectionNo,
                        houseNo: row.houseNo,
                      });
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
                        onLinkFamilyHead(row.id);
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
                      onLinkSocialLeader(row.id);
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
};
