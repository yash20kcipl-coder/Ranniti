import React from 'react';
import SectionContainer from './SectionContainer';
import FormInput from '@/components/common/FormInput';
import type { Option } from '@/components/common/FormInput';
import { Users, Flag, Crown, Sparkles, UserPlus, Unlink } from 'lucide-react';

export interface VoterInfluencerFormSectionProps {
  formData: any;
  voterMeta: any;
  isEditMode: boolean;
  partyOptions: Option[];
  showFamilyPicker: boolean;
  showSocialPicker: boolean;
  handleChange: (e: any) => void;
  familyInfluencerOptions: Option[];
  socialInfluencerOptions: Option[];
  setLinkModalOpen: (open: boolean) => void;
  setAssignModalOpen: (open: boolean) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  setAssignModalType: (type: 'family' | 'social') => void;
  setLinkInfluencerType: (type: 'family' | 'social') => void;
  linkedFamilyHead: { name?: string; epicNo?: string } | null;
  linkedSocialLeader: { name?: string; epicNo?: string } | null;
  setShowFamilyPicker: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSocialPicker: React.Dispatch<React.SetStateAction<boolean>>;
}

export const VoterInfluencerFormSection: React.FC<VoterInfluencerFormSectionProps> = ({
  formData,
  handleChange,
  setFormData,
  partyOptions,
  isEditMode,
  voterMeta,
  familyInfluencerOptions,
  socialInfluencerOptions,
  linkedFamilyHead,
  linkedSocialLeader,
  showFamilyPicker,
  setShowFamilyPicker,
  showSocialPicker,
  setShowSocialPicker,
  setAssignModalType,
  setAssignModalOpen,
  setLinkInfluencerType,
  setLinkModalOpen,
}) => {
  return (
    <SectionContainer
      icon={<Users size={18} />}
      iconBg="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
      title="Party Affiliation & Influencer Networks"
      subtitle="Political party alignment, household leadership & community influencer mapping"
    >
      <div className="space-y-6">
        {/* Political Party Card */}
        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <Flag className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
              Political & Campaign Affiliation
            </h4>
          </div>
          <FormInput
            label="Political Party Affiliation"
            type="select"
            name="partyId"
            value={formData.partyId}
            onChange={handleChange}
            options={[{ label: 'None / Independent / Undecided', value: '' }, ...partyOptions]}
          />
        </div>

        {/* Two-Column Grid: Family Network & Community Influence */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CARD 1: Household & Family Network */}
          <div
            className={`p-5 rounded-2xl border shadow-xs transition-all space-y-4 ${formData.isFamilyInfluencer
              ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-200 dark:border-purple-500/30'
              : formData.familyInfluencerId
                ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80'
              }`}
          >
            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${formData.isFamilyInfluencer
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                >
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                    Family Network
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Household mapping & leadership
                  </span>
                </div>
              </div>

              {formData.isFamilyInfluencer ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Family Head
                </span>
              ) : formData.familyInfluencerId ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30">
                  Member
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                  Unlinked
                </span>
              )}
            </div>

            {/* State 1: Voter is the Family Head */}
            {formData.isFamilyInfluencer ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-purple-100/60 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wider">
                      Designated Head of Household
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-200/80 text-purple-900 dark:bg-purple-500/25 dark:text-purple-200">
                      {voterMeta?.familyInfluencedCount || 0} Linked
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {Number(voterMeta?.familyInfluencedCount) > 0
                      ? `Influences and represents a household of ${voterMeta.familyInfluencedCount} voter(s).`
                      : 'Head of household. No other family members linked yet.'}
                  </p>
                </div>

                <div className="space-y-2">
                  {isEditMode ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAssignModalType('family');
                        setAssignModalOpen(true);
                      }}
                      className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Manage Family Members ({voterMeta?.familyInfluencedCount || 0})</span>
                    </button>
                  ) : (
                    <p className="text-[11px] text-purple-700/90 dark:text-purple-300/80 italic text-center py-1">
                      Save this voter first to start linking family members via the candidate assignment modal.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev: any) => ({ ...prev, isFamilyInfluencer: false }));
                    }}
                    className="w-full py-1 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Resign from Family Head Role
                  </button>
                </div>
              </div>
            ) : formData.familyInfluencerId ? (
              /* State 2: Voter is linked under another Family Head */
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                    Linked under Head of Household:
                  </span>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 shrink-0">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block truncate">
                        {linkedFamilyHead?.name || `Voter #${formData.familyInfluencerId}`}
                      </span>
                      {linkedFamilyHead?.epicNo && (
                        <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300">
                          EPIC: {linkedFamilyHead.epicNo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {showFamilyPicker ? (
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
                    <FormInput
                      label="Select Family Head"
                      type="select"
                      name="familyInfluencerId"
                      value={formData.familyInfluencerId}
                      onChange={(e: any) => {
                        handleChange(e);
                        if (e.target.value) setShowFamilyPicker(false);
                      }}
                      options={[{ label: 'Choose Head of Household', value: '' }, ...familyInfluencerOptions]}
                    />
                    <button
                      type="button"
                      onClick={() => setShowFamilyPicker(false)}
                      className="w-full py-1 text-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditMode) {
                          setLinkInfluencerType('family');
                          setLinkModalOpen(true);
                        } else {
                          setShowFamilyPicker(true);
                        }
                      }}
                      className="py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs rounded-xl text-xs font-semibold transition-colors text-center cursor-pointer"
                    >
                      Change Head
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev: any) => ({ ...prev, familyInfluencerId: '' }))}
                      className="py-2 px-3 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Unlink</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* State 3: Voter is unassigned (Independent) */
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This voter is not currently assigned to any family household network.
                </p>

                {showFamilyPicker ? (
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
                    <FormInput
                      label="Select Family Head"
                      type="select"
                      name="familyInfluencerId"
                      value={formData.familyInfluencerId}
                      onChange={(e: any) => {
                        handleChange(e);
                        if (e.target.value) setShowFamilyPicker(false);
                      }}
                      options={[{ label: 'Choose Head of Household', value: '' }, ...familyInfluencerOptions]}
                    />
                    <button
                      type="button"
                      onClick={() => setShowFamilyPicker(false)}
                      className="w-full py-1 text-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditMode) {
                          setAssignModalType('family');
                          setAssignModalOpen(true);
                        } else {
                          setFormData((prev: any) => ({
                            ...prev,
                            isFamilyInfluencer: true,
                            familyInfluencerId: '',
                          }));
                        }
                      }}
                      className="w-full py-2.5 px-3 bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300 dark:bg-purple-600/30 dark:hover:bg-purple-600/40 dark:text-purple-200 dark:border-purple-500/40 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Set Family Influencer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isEditMode) {
                          setLinkInfluencerType('family');
                          setLinkModalOpen(true);
                        } else {
                          setShowFamilyPicker(true);
                        }
                      }}
                      className="w-full py-2 px-3 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium transition-colors text-center cursor-pointer"
                    >
                      + Link to an Existing Family Head
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CARD 2: Community & Social Influence */}
          <div
            className={`p-5 rounded-2xl border shadow-xs transition-all space-y-4 ${formData.isSocialInfluencer
              ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30'
              : formData.socialInfluencerId
                ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80'
              }`}
          >
            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${formData.isSocialInfluencer
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                    Community & Social Influence
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Social, caste & local leadership
                  </span>
                </div>
              </div>

              {formData.isSocialInfluencer ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Social Leader
                </span>
              ) : formData.socialInfluencerId ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
                  Connected
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                  Unconnected
                </span>
              )}
            </div>

            {/* State 1: Voter is a Social Leader */}
            {formData.isSocialInfluencer ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-amber-100/60 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                      Designated Social Leader
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200/80 text-amber-900 dark:bg-amber-500/25 dark:text-amber-200">
                      {voterMeta?.socialInfluencedCount || 0} Followers
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {Number(voterMeta?.socialInfluencedCount) > 0
                      ? `Mobilizes and influences ${voterMeta.socialInfluencedCount} community voter(s).`
                      : 'Recognized as community leader. No community voters linked yet.'}
                  </p>
                </div>

                <div className="space-y-2">
                  {isEditMode ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAssignModalType('social');
                        setAssignModalOpen(true);
                      }}
                      className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Manage Community Network ({voterMeta?.socialInfluencedCount || 0})</span>
                    </button>
                  ) : (
                    <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 italic text-center py-1">
                      Save this voter first to start linking community voters via the assignment modal.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev: any) => ({ ...prev, isSocialInfluencer: false }));
                    }}
                    className="w-full py-1 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Remove Social Leader Role
                  </button>
                </div>
              </div>
            ) : formData.socialInfluencerId ? (
              /* State 2: Voter is linked under a Social Leader */
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                    Connected to Community Leader:
                  </span>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block truncate">
                        {linkedSocialLeader?.name || `Voter #${formData.socialInfluencerId}`}
                      </span>
                      {linkedSocialLeader?.epicNo && (
                        <span className="text-[11px] font-mono text-amber-800 dark:text-amber-300">
                          EPIC: {linkedSocialLeader.epicNo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {showSocialPicker ? (
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
                    <FormInput
                      label="Select Community Leader"
                      type="select"
                      name="socialInfluencerId"
                      value={formData.socialInfluencerId}
                      onChange={(e: any) => {
                        handleChange(e);
                        if (e.target.value) setShowSocialPicker(false);
                      }}
                      options={[{ label: 'Choose Community Leader', value: '' }, ...socialInfluencerOptions]}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSocialPicker(false)}
                      className="w-full py-1 text-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditMode) {
                          setLinkInfluencerType('social');
                          setLinkModalOpen(true);
                        } else {
                          setShowSocialPicker(true);
                        }
                      }}
                      className="py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs rounded-xl text-xs font-semibold transition-colors text-center cursor-pointer"
                    >
                      Change Leader
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev: any) => ({ ...prev, socialInfluencerId: '' }))}
                      className="py-2 px-3 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Unlink</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* State 3: Voter has no social leader */
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No community or caste influencer currently associated with this voter.
                </p>

                {showSocialPicker ? (
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
                    <FormInput
                      label="Select Community Leader"
                      type="select"
                      name="socialInfluencerId"
                      value={formData.socialInfluencerId}
                      onChange={(e: any) => {
                        handleChange(e);
                        if (e.target.value) setShowSocialPicker(false);
                      }}
                      options={[{ label: 'Choose Community Leader', value: '' }, ...socialInfluencerOptions]}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSocialPicker(false)}
                      className="w-full py-1 text-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditMode) {
                          setAssignModalType('social');
                          setAssignModalOpen(true);
                        } else {
                          setFormData((prev: any) => ({
                            ...prev,
                            isSocialInfluencer: true,
                          }));
                        }
                      }}
                      className="w-full py-2.5 px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 dark:bg-amber-600/30 dark:hover:bg-amber-600/40 dark:text-amber-200 dark:border-amber-500/40 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Set Social Influencer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isEditMode) {
                          setLinkInfluencerType('social');
                          setLinkModalOpen(true);
                        } else {
                          setShowSocialPicker(true);
                        }
                      }}
                      className="w-full py-2 px-3 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium transition-colors text-center cursor-pointer"
                    >
                      + Link to a Community Leader
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionContainer>
  );
};

export default VoterInfluencerFormSection;
