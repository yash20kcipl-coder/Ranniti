import React, { useState } from 'react';
import { Home, Sparkles, CheckCircle2, Users, Loader2, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';
import { useAppDispatch } from '@/redux/hooks';
import { autoMapFamiliesAction } from '@/redux/actions/familyMapping';
import toast from 'react-hot-toast';

export interface AutoMapFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  booths: Array<{ id: string; name: string; boothNumber?: number }>;
  selectedBoothId?: string;
  onSuccess?: () => void;
}

export const AutoMapFamilyModal: React.FC<AutoMapFamilyModalProps> = ({
  isOpen,
  onClose,
  booths,
  selectedBoothId = '',
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const [activeBoothId, setActiveBoothId] = useState(selectedBoothId);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setActiveBoothId(selectedBoothId || (booths[0]?.id ?? ''));
      setPreviewData(null);
    }
  }, [isOpen, selectedBoothId, booths]);

  const boothOptions = [
    { label: 'Select a Polling Booth...', value: '' },
    ...booths.map((b) => ({
      label: `Booth #${b.boothNumber ?? ''} - ${b.name}`,
      value: b.id,
    })),
  ];

  const handleRunPreview = async () => {
    if (!activeBoothId) {
      toast.error('Please select a polling booth');
      return;
    }
    setLoadingPreview(true);
    try {
      const res = await dispatch(autoMapFamiliesAction({ boothId: activeBoothId, dryRun: true }));
      setPreviewData(res);
      toast.success(`Detected ${res.familiesCreated} families across ${res.totalVoters} voters!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to calculate family preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecuteMapping = async () => {
    if (!activeBoothId) return;
    setExecuting(true);
    try {
      const res = await dispatch(autoMapFamiliesAction({ boothId: activeBoothId, dryRun: false }));
      toast.success(`Successfully mapped ${res.votersMapped} voters into ${res.familiesCreated} families!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to execute family mapping');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Automated Family & Household Mapping"
      subtitle="Cluster voters into families using House Number, Address, Surnames, and Mobile data"
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Booth Selector */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Select Target Polling Booth
            </h4>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1">
              <FormInput
                name="targetBoothId"
                type="select"
                options={boothOptions}
                value={activeBoothId}
                onChange={(e) => {
                  setActiveBoothId(e.target.value);
                  setPreviewData(null);
                }}
                disabled={loadingPreview || executing}
              />
            </div>
            <button
              type="button"
              onClick={handleRunPreview}
              disabled={!activeBoothId || loadingPreview || executing}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              {loadingPreview ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Booth...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Scan & Preview Families
                </>
              )}
            </button>
          </div>
        </div>

        {/* Algorithm Highlights */}
        {!previewData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-1">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold">1. Primary Match</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Matches normalized House Number and Address in the same booth.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-1">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold">2. Head of Family</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Auto-elects the senior head & designates <code className="text-[10px]">is_family_influencer</code>.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-1">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Users className="w-4 h-4" />
                <span className="text-xs font-bold">3. 3-Tier Relations</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Infers Spouse, Son, Daughter, Parent & Sibling from naming patterns.
              </p>
            </div>
          </div>
        )}

        {/* Preview Results Summary */}
        {previewData && (
          <div className="space-y-4 animate-fadeIn">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-500/20 text-center">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Total Voters</span>
                <p className="text-lg font-black text-indigo-700 dark:text-indigo-300">{previewData.totalVoters}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-500/20 text-center">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Families Found</span>
                <p className="text-lg font-black text-purple-700 dark:text-purple-300">{previewData.familiesCreated}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-500/20 text-center">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Voters Mapped</span>
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{previewData.votersMapped}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Avg Household</span>
                <p className="text-lg font-black text-slate-700 dark:text-slate-300">
                  {previewData.familiesCreated > 0
                    ? (previewData.votersMapped / previewData.familiesCreated).toFixed(1)
                    : 0}
                </p>
              </div>
            </div>

            {/* Sample Households Preview */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Sample Detected Households ({previewData.previewFamilies?.length || 0} shown)
              </h5>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {previewData.previewFamilies?.map((fam: any, idx: number) => (
                  <div
                    key={fam.familyId ? `${fam.familyId}-${idx}` : idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                          {fam.familyId}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          👑 {fam.headName}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          (EPIC: {fam.headEpicNo})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          House: <strong className="text-slate-700 dark:text-slate-300">{fam.houseNo}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                          {fam.memberCount} Members
                        </span>
                      </div>
                    </div>

                    {/* Member chips with relations */}
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      {fam.members?.map((m: any, mIdx: number) => (
                        <span
                          key={m.id ? `${m.id}-${mIdx}` : m.epicNo ? `${m.epicNo}-${mIdx}` : mIdx}
                          className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1"
                        >
                          <span className="font-medium">{m.name}</span>
                          <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                            {m.relation}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={executing}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteMapping}
                disabled={executing}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                {executing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Applying Family Mapping...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Apply & Save Household Mapping
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
