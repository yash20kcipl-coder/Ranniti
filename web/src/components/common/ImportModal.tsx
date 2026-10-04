import { Modal } from './Modal';
import toast from 'react-hot-toast';
import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import type { MasterField } from '@/config/masterConfig';
import { downloadSampleTemplate } from '@/redux/actions/importJobs';
import { parseExcelFile, downloadSampleExcelTemplate } from '@/utils/exportImport';
import { Upload, Download, FileSpreadsheet, AlertCircle, Trash2, Loader2, SlidersHorizontal } from 'lucide-react';
import { FormInput } from './FormInput';
import { useMasterData, type MasterCategoryKey } from '@/hooks/useMasterData';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { fetchSuperAdminBoothOptions } from '@/redux/actions/voterSuperAdmin';
import { fetchTenantBoothOptions } from '@/redux/actions/voterTenant';

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  categoryKey?: string;
  sampleParams?: Record<string, any>;
  fields?: MasterField[];
  onImport?: (records: Record<string, any>[], context?: Record<string, any>) => Promise<void>;
  onSubmit?: (file: File, records?: Record<string, any>[], context?: Record<string, any>) => Promise<void>;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  title,
  categoryKey,
  sampleParams,
  fields = [],
  onImport,
  onSubmit,
}) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'super_admin';

  const [isParsing, setIsParsing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, any>[]>([]);

  // Hierarchy Selection State for Dual-Mode (Scoped vs Generic)
  const [stateId, setStateId] = useState<string>('');
  const [districtId, setDistrictId] = useState<string>('');
  const [talukaId, setTalukaId] = useState<string>('');
  const [pcId, setPcId] = useState<string>('');
  const [acId, setAcId] = useState<string>('');
  const [boothId, setBoothId] = useState<string>('');
  const [boothOptions, setBoothOptions] = useState<{ value: string; label: string }[]>([]);
  const [religionId, setReligionId] = useState<string>('');

  // Sync initial scope from sampleParams when modal opens
  useEffect(() => {
    if (isOpen) {
      setStateId(sampleParams?.stateId ? String(sampleParams.stateId) : '');
      setDistrictId(sampleParams?.districtId ? String(sampleParams.districtId) : '');
      setTalukaId(sampleParams?.talukaId ? String(sampleParams.talukaId) : '');
      setPcId(sampleParams?.pcId ? String(sampleParams.pcId) : '');
      setAcId(sampleParams?.acId ? String(sampleParams.acId) : '');
      setBoothId(sampleParams?.boothId ? String(sampleParams.boothId) : '');
      setReligionId(sampleParams?.religionId ? String(sampleParams.religionId) : '');
    }
  }, [isOpen, sampleParams]);

  // Load only required master data categories for the current modal's category
  const requiredCategories = useMemo<MasterCategoryKey[]>(() => {
    if (!isOpen) return [];
    switch (categoryKey) {
      case 'villages':
        return ['states', 'districts', 'talukas'];
      case 'talukas':
        return ['states', 'districts'];
      case 'districts':
      case 'pcs':
        return ['states'];
      case 'acs':
        return ['states', 'districts', 'pcs'];
      case 'wards':
      case 'booths':
        return ['pcs', 'acs'];
      case 'castes':
        return ['religions'];
      case 'voters':
        return ['states', 'districts', 'pcs', 'acs'];
      default:
        return [];
    }
  }, [isOpen, categoryKey]);

  const {
    states: statesData = [],
    districts: districtsData = [],
    talukas: talukasData = [],
    pcs: pcsData = [],
    acs: acsData = [],
    religions: religionsData = [],
  } = useMasterData(requiredCategories);

  // Dynamic on-demand booth options when AC is selected for voters
  useDebouncedEffect(
    () => {
      if (categoryKey !== 'voters' || !acId) {
        setBoothOptions([{ value: '', label: 'All Booths (Generic)' }]);
        return;
      }
      const fetchAction = isSuperAdmin ? fetchSuperAdminBoothOptions : fetchTenantBoothOptions;
      dispatch(fetchAction({ acId, saveToStore: false }))
        .then((options: any[]) => {
          setBoothOptions([
            { value: '', label: 'All Booths (Generic)' },
            ...(options || []).map((b: any) => ({
              label: `Booth #${b.boothNumber || b.boothNo || b.id} - ${b.name || b.boothName || 'Station'}`,
              value: String(b.id),
            })),
          ]);
        })
        .catch(() => {
          setBoothOptions([{ value: '', label: 'All Booths (Generic)' }]);
        });
    },
    150,
    [categoryKey, acId, isSuperAdmin, dispatch]
  );

  // Dropdown options
  const stateOptions = useMemo(() => [
    { value: '', label: 'All States (Generic)' },
    ...statesData.map((s: any) => ({ value: String(s.id), label: s.name })),
  ], [statesData]);

  const filteredDistricts = useMemo(() => {
    if (!stateId) return districtsData;
    return districtsData.filter((d: any) => String(d.stateId) === String(stateId));
  }, [districtsData, stateId]);

  const districtOptions = useMemo(() => [
    { value: '', label: 'All Districts (Generic)' },
    ...filteredDistricts.map((d: any) => ({ value: String(d.id), label: d.name })),
  ], [filteredDistricts]);

  const filteredTalukas = useMemo(() => {
    if (!districtId) {
      if (!stateId) return talukasData;
      return talukasData.filter((t: any) => String(t.stateId) === String(stateId));
    }
    return talukasData.filter((t: any) => String(t.districtId) === String(districtId));
  }, [talukasData, districtId, stateId]);

  const talukaOptions = useMemo(() => [
    { value: '', label: 'All Talukas (Generic)' },
    ...filteredTalukas.map((t: any) => ({ value: String(t.id), label: t.name })),
  ], [filteredTalukas]);

  const filteredPcs = useMemo(() => {
    if (!stateId) return pcsData;
    return pcsData.filter((p: any) => String(p.stateId) === String(stateId));
  }, [pcsData, stateId]);

  const pcOptions = useMemo(() => [
    { value: '', label: 'All PCs (Generic)' },
    ...filteredPcs.map((p: any) => ({ value: String(p.id), label: p.name })),
  ], [filteredPcs]);

  const filteredAcs = useMemo(() => {
    return acsData.filter((a: any) => {
      if (pcId && String(a.pcId) !== String(pcId)) return false;
      if (districtId && String(a.districtId) !== String(districtId)) return false;
      if (stateId && String(a.stateId) !== String(stateId)) return false;
      return true;
    });
  }, [acsData, pcId, districtId, stateId]);

  const acOptions = useMemo(() => [
    { value: '', label: 'All ACs (Generic)' },
    ...filteredAcs.map((a: any) => ({ value: String(a.id), label: a.name })),
  ], [filteredAcs]);

  const religionOptions = useMemo(() => [
    { value: '', label: 'All Religions (Generic)' },
    ...religionsData.map((r: any) => ({ value: String(r.id), label: r.name })),
  ], [religionsData]);

  // Scope change handlers
  const handleStateChange = (val: string) => {
    setStateId(val);
    setDistrictId('');
    setTalukaId('');
    setPcId('');
    setAcId('');
    setBoothId('');
  };

  const handleDistrictChange = (val: string) => {
    setDistrictId(val);
    setTalukaId('');
    setAcId('');
    setBoothId('');
    if (!stateId && val) {
      const dist = districtsData.find((d: any) => String(d.id) === String(val));
      if (dist?.stateId) setStateId(String(dist.stateId));
    }
  };

  const handleTalukaChange = (val: string) => {
    setTalukaId(val);
    if (!districtId && val) {
      const tal = talukasData.find((t: any) => String(t.id) === String(val));
      if (tal?.districtId) {
        setDistrictId(String(tal.districtId));
        if (!stateId && tal?.stateId) setStateId(String(tal.stateId));
      }
    }
  };

  const handlePcChange = (val: string) => {
    setPcId(val);
    setAcId('');
    setBoothId('');
    if (!stateId && val) {
      const pc = pcsData.find((p: any) => String(p.id) === String(val));
      if (pc?.stateId) setStateId(String(pc.stateId));
    }
  };

  const handleAcChange = (val: string) => {
    setAcId(val);
    setBoothId('');
    if (val) {
      const ac = acsData.find((a: any) => String(a.id) === String(val));
      if (ac) {
        if (!pcId && ac.pcId) setPcId(String(ac.pcId));
        if (!districtId && ac.districtId) setDistrictId(String(ac.districtId));
        if (!stateId && ac.stateId) setStateId(String(ac.stateId));
      }
    }
  };

  const handleReligionChange = (val: string) => {
    setReligionId(val);
  };

  const handleClearScope = () => {
    setStateId('');
    setDistrictId('');
    setTalukaId('');
    setPcId('');
    setAcId('');
    setBoothId('');
    setReligionId('');
  };

  const hasSelectedScope = Boolean(
    stateId || districtId || talukaId || pcId || acId || boothId || religionId
  );

  const activeContext = useMemo(() => {
    const ctx: Record<string, string> = {};
    if (stateId) ctx.stateId = stateId;
    if (districtId) ctx.districtId = districtId;
    if (talukaId) ctx.talukaId = talukaId;
    if (pcId) ctx.pcId = pcId;
    if (acId) ctx.acId = acId;
    if (boothId) ctx.boothId = boothId;
    if (religionId) ctx.religionId = religionId;
    return ctx;
  }, [stateId, districtId, talukaId, pcId, acId, boothId, religionId]);

  const hasScopeSelectors = Boolean(
    categoryKey &&
    ['villages', 'talukas', 'districts', 'pcs', 'acs', 'wards', 'booths', 'castes', 'voters'].includes(categoryKey)
  );

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setErrorMsg(null);
    setIsParsing(false);
    setIsSubmitting(false);
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = async (selectedFile: File | null) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrorMsg(null);
    setIsParsing(true);

    try {
      const fileNameLower = selectedFile.name.toLowerCase();
      if (!fileNameLower.endsWith('.xlsx') && !fileNameLower.endsWith('.xls')) {
        throw new Error('Invalid file format. Only Excel spreadsheets (.xlsx / .xls) are allowed.');
      }

      const records = await parseExcelFile(selectedFile);

      if (records.length === 0) {
        setErrorMsg('The selected Excel file contains no valid data rows.');
        setParsedData([]);
      } else {
        setParsedData(records);
        toast.success(`Successfully parsed ${records.length} records from ${selectedFile.name}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse Excel file.');
      setParsedData([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      if (categoryKey) {
        const queryParams = { ...sampleParams, ...activeContext };
        await dispatch(downloadSampleTemplate(categoryKey, queryParams));
        toast.success(
          hasSelectedScope
            ? 'Pre-filled sample template downloaded successfully.'
            : 'Generic sample template downloaded successfully.'
        );
      } else if (fields && fields.length > 0) {
        const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
        downloadSampleExcelTemplate(fields, `${cleanTitle}_template.xlsx`);
      } else {
        toast.error('Sample template unavailable.');
      }
    } catch (err: any) {
      toast.error('Failed to download sample template.');
    }
  };

  const handleSubmitImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select an Excel file first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const mergedContext = { ...sampleParams, ...activeContext };
      if (onSubmit) {
        await onSubmit(file, parsedData, mergedContext);
      } else if (onImport) {
        if (parsedData.length === 0) {
          toast.error('No records available to import.');
          setIsSubmitting(false);
          return;
        }
        await onImport(parsedData, mergedContext);
      }
      toast.success('Import completed successfully!');
      handleModalClose();
    } catch (err: any) {
      toast.error(err.message || 'Import failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const gridColsClass = useMemo(() => {
    switch (categoryKey) {
      case 'voters':
      case 'villages':
      case 'acs':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
      case 'talukas':
      case 'wards':
      case 'booths':
        return 'grid-cols-1 sm:grid-cols-2';
      default:
        return 'grid-cols-1 sm:grid-cols-2';
    }
  }, [categoryKey]);

  return (
    <Modal
      title={title}
      maxWidth="3xl"
      isOpen={isOpen}
      onClose={handleModalClose}
      onSubmit={handleSubmitImport}
      submitText={isSubmitting ? 'Importing...' : `Import ${parsedData.length} Records`}
    >
      <div className="space-y-4 text-left">
        {/* Top helper bar with download sample template */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Supported format: <strong>Excel (.XLSX / .XLS)</strong></span>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-600/20 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-semibold text-xs transition-colors cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{hasSelectedScope ? 'Pre-filled Sample Template' : 'Sample Excel Template'}</span>
          </button>
        </div>

        {/* Optional Scope Hierarchy Selector */}
        {hasScopeSelectors && (
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Target Hierarchy
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Optional
                </span>
              </div>
              {hasSelectedScope && (
                <button
                  type="button"
                  onClick={handleClearScope}
                  className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Select a parent location to download a contextualized template and auto-link rows, or leave unselected to download/import generically.
            </p>

            <div className={`grid ${gridColsClass} gap-3 pt-1 items-end`}>
              {['villages', 'talukas', 'districts', 'pcs', 'acs', 'voters'].includes(categoryKey!) && (
                <FormInput
                  label="State"
                  type="select"
                  searchable
                  value={stateId}
                  onChange={(e) => handleStateChange(String(e.target.value))}
                  options={stateOptions}
                  placeholder="All States (Generic)"
                />
              )}

              {['villages', 'talukas', 'acs', 'voters'].includes(categoryKey!) && (
                <FormInput
                  label="District"
                  type="select"
                  searchable
                  value={districtId}
                  onChange={(e) => handleDistrictChange(String(e.target.value))}
                  options={districtOptions}
                  placeholder="All Districts (Generic)"
                />
              )}

              {['acs', 'wards', 'booths', 'voters'].includes(categoryKey!) && (
                <FormInput
                  label="Parliamentary Constituency (PC)"
                  type="select"
                  searchable
                  value={pcId}
                  onChange={(e) => handlePcChange(String(e.target.value))}
                  options={pcOptions}
                  placeholder="All PCs (Generic)"
                />
              )}

              {['wards', 'booths', 'voters'].includes(categoryKey!) && (
                <FormInput
                  label="Assembly Constituency (AC)"
                  type="select"
                  searchable
                  value={acId}
                  onChange={(e) => handleAcChange(String(e.target.value))}
                  options={acOptions}
                  placeholder="All ACs (Generic)"
                />
              )}

              {categoryKey === 'voters' && (
                <FormInput
                  label="Polling Booth"
                  type="select"
                  searchable
                  value={boothId}
                  onChange={(e) => setBoothId(String(e.target.value))}
                  options={boothOptions}
                  placeholder={acId ? 'All Booths (Generic)' : 'Select AC First'}
                  disabled={!acId}
                />
              )}

              {categoryKey === 'villages' && (
                <FormInput
                  label="Taluka"
                  type="select"
                  searchable
                  value={talukaId}
                  onChange={(e) => handleTalukaChange(String(e.target.value))}
                  options={talukaOptions}
                  placeholder="All Talukas (Generic)"
                />
              )}

              {categoryKey === 'castes' && (
                <FormInput
                  label="Religion"
                  type="select"
                  searchable
                  value={religionId}
                  onChange={(e) => handleReligionChange(String(e.target.value))}
                  options={religionOptions}
                  placeholder="All Religions (Generic)"
                />
              )}
            </div>
          </div>
        )}

        {/* File Dropzone */}
        {isParsing ? (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-emerald-500/50 rounded-2xl bg-emerald-50/40 dark:bg-slate-950/60">
            <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
            <p className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-200">Parsing Excel spreadsheet...</p>
          </div>
        ) : !file ? (
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100/70 dark:hover:bg-slate-900/60 transition-all cursor-pointer group">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-800 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
              Click to select or drag and drop Excel file (.XLSX) here
            </p>
            <p className="text-[11px] text-slate-500 mt-1">.XLSX or .XLS up to 10MB</p>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
          </label>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{file.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB • {parsedData.length} records parsed
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Remove file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
