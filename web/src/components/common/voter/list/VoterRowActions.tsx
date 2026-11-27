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
      compact
      extra={
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveRowMenuId(isMenuOpen ? null : row.id);
            }}
            className={`w-7 h-7 rounded-md flex items-center justify-center bg-slate-50/80 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200/70 dark:border-slate-700/60 transition-all cursor-pointer shadow-2xs active:scale-95 ${
              isMenuOpen ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100' : ''
            }`}
            title="Influencer Options"
          >
            <MoreVertical size={13} />
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
                className="absolute right-0 top-full mt-1.5 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-xl p-1 z-30 divide-y divide-slate-100 dark:divide-slate-800/80"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-0.5 space-y-0.5">
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
                    className="w-full text-left px-2.5 py-1.5 text-[11px] font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Crown size={13} className="text-purple-600 dark:text-purple-400 shrink-0" />
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
                    className="w-full text-left px-2.5 py-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Sparkles size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Set Social Influencer</span>
                  </button>

                  {!row.isFamilyInfluencer && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRowMenuId(null);
                        onLinkFamilyHead(row.id);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <UserCheck size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Link to Family Head</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setActiveRowMenuId(null);
                      onLinkSocialLeader(row.id);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-[11px] font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Sparkles size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
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
