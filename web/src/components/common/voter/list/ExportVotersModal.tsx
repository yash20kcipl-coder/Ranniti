import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';
import { FileText, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export interface ExportVotersModalProps {
  isOpen: boolean;
  onClose: () => void;
  acOptions?: { id: string; name?: string; acName?: string; acNumber?: string | number; ac_number?: string | number }[];
  currentAcId?: string;
  onAcChange?: (acId: string) => Promise<any> | void;
  onFetchBooths?: (acId: string) => Promise<any[]> | any[];
  boothOptions?: { id: string; name?: string; boothName?: string; label?: string; boothNumber?: string | number; booth_number?: string | number }[];
  isBoothsLoading?: boolean;
  currentBoothId?: string;
  onExportExcel: (params: Record<string, any>) => Promise<void> | void;
  onExportPdf: (params: { boothId: string; language: 'gu' | 'en'; includePhotos: boolean; boothLabel?: string }) => Promise<void> | void;
  isLoading?: boolean;
}

export const ExportVotersModal: React.FC<ExportVotersModalProps> = ({
  isOpen,
  onClose,
  acOptions = [],
  currentAcId = '',
  onAcChange,
  onFetchBooths,
  boothOptions = [],
  isBoothsLoading = false,
  currentBoothId,
  onExportExcel,
  onExportPdf,
  isLoading = false,
}) => {
  const [exportType, setExportType] = useState<'pdf' | 'excel'>('pdf');
  const [selectedAcId, setSelectedAcId] = useState<string>(currentAcId || '');
  const [selectedBoothId, setSelectedBoothId] = useState<string>('');
  const [language, setLanguage] = useState<'gu' | 'en'>('gu');
  const [includePhotos, setIncludePhotos] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Local booths state dedicated to the export modal so main page filter is not modified
  const [localBooths, setLocalBooths] = useState<any[]>(boothOptions || []);
  const [isLocalBoothsLoading, setIsLocalBoothsLoading] = useState<boolean>(false);

  const effectiveBooths = onFetchBooths ? localBooths : boothOptions;
  const effectiveIsBoothsLoading = onFetchBooths ? isLocalBoothsLoading : isBoothsLoading;

  const formattedAcOptions = useMemo(() => {
    return acOptions.map((a: any) => {
      const acNum = a.acNumber || a.ac_number;
      const acName = a.name || a.acName || '';
      return {
        label: acNum ? `${acNum} - ${acName}` : acName,
        value: String(a.id),
      };
    });
  }, [acOptions]);

  const formattedBoothOptions = useMemo(() => {
    return effectiveBooths.map((b: any) => {
      const boothNum = b.boothNumber ?? b.booth_number;
      const boothName = b.name ?? b.boothName ?? b.label ?? '';
      const val = String(b.id ?? b.value ?? '');
      return {
        label: boothNum !== undefined && boothNum !== null && String(boothNum).trim() !== ''
          ? `${boothNum} - ${boothName}`
          : boothName || val,
        value: val,
      };
    });
  }, [effectiveBooths]);

  // Sync selected AC & booth when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialAc = currentAcId || (acOptions.length === 1 ? String(acOptions[0].id) : '');
      setSelectedAcId(initialAc);

      if (onFetchBooths) {
        if (initialAc) {
          setIsLocalBoothsLoading(true);
          Promise.resolve(onFetchBooths(initialAc))
            .then((booths) => {
              const list = Array.isArray(booths) ? booths : [];
              setLocalBooths(list);
              if (currentBoothId && list.some((b: any) => String(b.id ?? b.value) === String(currentBoothId))) {
                setSelectedBoothId(String(currentBoothId));
              } else {
                setSelectedBoothId('');
              }
            })
            .catch(() => {
              setLocalBooths([]);
              setSelectedBoothId('');
            })
            .finally(() => {
              setIsLocalBoothsLoading(false);
            });
        } else {
          setLocalBooths([]);
          setSelectedBoothId('');
        }
      } else {
        // Fallback if onFetchBooths is not provided
        if (currentBoothId && boothOptions.length > 0) {
          const matches = boothOptions.some((b: any) => String(b.id ?? b.value) === String(currentBoothId));
          if (matches) {
            setSelectedBoothId(String(currentBoothId));
          } else {
            setSelectedBoothId('');
          }
        } else {
          setSelectedBoothId('');
        }

        if (initialAc && onAcChange) {
          onAcChange(initialAc);
        }
      }
      setError('');
    }
  }, [isOpen]);

  // When booth options change, ensure selectedBoothId is still valid in the new options list
  useEffect(() => {
    if (selectedBoothId) {
      const exists = formattedBoothOptions.some((opt) => opt.value === selectedBoothId);
      if (!exists) {
        setSelectedBoothId('');
      }
    }
  }, [formattedBoothOptions, selectedBoothId]);

  const handleAcSelect = (newAcId: string) => {
    setSelectedAcId(newAcId);
    setSelectedBoothId('');
    setError('');

    if (onFetchBooths) {
      if (newAcId) {
        setIsLocalBoothsLoading(true);
        Promise.resolve(onFetchBooths(newAcId))
          .then((booths) => {
            setLocalBooths(Array.isArray(booths) ? booths : []);
          })
          .catch(() => {
            setLocalBooths([]);
          })
          .finally(() => {
            setIsLocalBoothsLoading(false);
          });
      } else {
        setLocalBooths([]);
      }
    } else if (onAcChange) {
      onAcChange(newAcId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (exportType === 'pdf') {
      if (!selectedBoothId) {
        setError('Please select a Polling Booth to export the PDF voter roll.');
        return;
      }
      try {
        const selectedBooth = effectiveBooths.find((b: any) => String(b.id ?? b.value) === String(selectedBoothId));
        const boothNum = selectedBooth?.boothNumber ?? (selectedBooth as any)?.booth_number;
        const boothName = selectedBooth?.name ?? (selectedBooth as any)?.boothName ?? '';
        const boothLabel = selectedBooth
          ? `${boothNum ? `Booth_${boothNum}_` : ''}${boothName}`
          : '';

        await onExportPdf({
          boothId: selectedBoothId,
          language,
          includePhotos,
          boothLabel,
        });
        onClose();
      } catch (err: any) {
        setError(err?.message || 'Failed to generate PDF. Please try again.');
      }
    } else {
      try {
        const extraParams: Record<string, any> = {};
        if (selectedAcId) extraParams.acId = selectedAcId;
        if (selectedBoothId) extraParams.boothId = selectedBoothId;
        await onExportExcel(extraParams);
        onClose();
      } catch (err: any) {
        setError(err?.message || 'Failed to export Excel. Please try again.');
      }
    }
  };

  const isBoothSelectDisabled = !selectedAcId || effectiveIsBoothsLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Voter Directory"
      subtitle="Select the export format and polling booth configuration"
      onSubmit={handleSubmit}
      submitText={exportType === 'pdf' ? 'Download PDF Roll' : 'Download Excel'}
      cancelText="Cancel"
      isLoading={isLoading}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Format Selection Cards */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
            Choose Export Format
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* PDF Option Card */}
            <div
              onClick={() => setExportType('pdf')}
              className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${exportType === 'pdf'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-500 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">PDF (ECI Format)</span>
                </div>
                {exportType === 'pdf' && <CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400" />}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Official 30-voters-per-page (3×10 grid) printable electoral roll matching government format.
              </p>
            </div>

            {/* Excel Option Card */}
            <div
              onClick={() => setExportType('excel')}
              className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${exportType === 'excel'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-500 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center">
                    <FileSpreadsheet size={18} />
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Excel (.xlsx)</span>
                </div>
                {exportType === 'excel' && <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Complete raw spreadsheet data with contact details, influencers, and campaign tags.
              </p>
            </div>
          </div>
        </div>

        {/* Assembly Constituency Selector */}
        {acOptions.length > 0 && (
          <div>
            <FormInput
              type="select"
              label="Assembly Constituency"
              name="selectedAcId"
              value={selectedAcId}
              onChange={(e) => handleAcSelect(e.target.value)}
              options={[
                { label: '-- Select Assembly Constituency --', value: '' },
                ...formattedAcOptions,
              ]}
              required={exportType === 'pdf'}
              helperText="Select the Assembly Constituency to load its assigned polling booths."
            />
          </div>
        )}

        {/* Polling Booth Selector */}
        <div>
          <div className="relative">
            <FormInput
              type="select"
              label="Polling Booth"
              name="selectedBoothId"
              value={selectedBoothId}
              disabled={isBoothSelectDisabled}
              onChange={(e) => {
                setSelectedBoothId(e.target.value);
                setError('');
              }}
              options={[
                {
                  label: effectiveIsBoothsLoading
                    ? '-- Loading Polling Booths... --'
                    : !selectedAcId
                      ? '-- Select AC First --'
                      : effectiveBooths.length === 0
                        ? '-- No Booths Found for this AC --'
                        : '-- Select Polling Booth --',
                  value: '',
                },
                ...formattedBoothOptions,
              ]}
              required={exportType === 'pdf'}
              helperText={
                effectiveIsBoothsLoading
                  ? 'Fetching polling booths for selected AC...'
                  : !selectedAcId
                    ? 'Please select an Assembly Constituency above to load polling booths.'
                    : effectiveBooths.length === 0
                      ? 'No polling booths registered under this Assembly Constituency.'
                      : exportType === 'pdf'
                        ? `Select a booth to generate its official roll (${formattedBoothOptions.length} booths available).`
                        : 'Leave blank to export all voters in the selected constituency.'
              }
            />
            {effectiveIsBoothsLoading && (
              <div className="absolute right-3 top-9 flex items-center pointer-events-none">
                <Loader2 size={16} className="animate-spin text-indigo-600 dark:text-indigo-400" />
              </div>
            )}
          </div>
        </div>

        {/* PDF Specific Configurations */}
        {exportType === 'pdf' && (
          <div className="space-y-4 pt-1 border-t border-slate-100 dark:border-slate-800">
            {/* Language Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Roll Language
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setLanguage('gu')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${language === 'gu'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-500 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                  <span>🇮🇳</span>
                  <span>ગુજરાતી (ECI Standard)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${language === 'en'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-500 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                  <span>🌐</span>
                  <span>English</span>
                </button>
              </div>
            </div>

            {/* Photo Avatar Toggle */}
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <input
                id="includePhotos"
                type="checkbox"
                checked={includePhotos}
                onChange={(e) => setIncludePhotos(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="includePhotos" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <span className="font-semibold block">Include voter photo avatars</span>
                <span className="text-slate-500 dark:text-slate-400">
                  Displays uploaded avatar or standard "ફોટો ઉપલબ્ધ" box if no photo is available.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Validation / Error banner */}
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
