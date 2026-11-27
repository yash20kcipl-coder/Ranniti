import React, { useState } from 'react';
import {
  Upload,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { uploadService } from '../../services/uploadService';
import { electionService } from '../../services/electionService';
import type { UploadValidationResult } from '../../types/electionGis.types';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataImported: (count: number) => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onDataImported,
}) => {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [validationResult, setValidationResult] = useState<UploadValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileDrop = async (selectedFile: File) => {
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const result = await uploadService.parseAndValidateFile(selectedFile);
      setValidationResult(result);
      setStep('preview');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse election dataset');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!validationResult || validationResult.parsedData.length === 0) return;
    const applied = electionService.applyCustomElectionData(validationResult.parsedData);
    onDataImported(applied);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setValidationResult(null);
    setStep('upload');
    setErrorMsg(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="Upload Custom Election Dataset"
      subtitle="Import CSV, XLS, XLSX or GeoJSON to visualize your election results on GIS boundaries"
      maxWidth="3xl"
    >
      <div className="space-y-4 select-none">
        {/* Step indicator */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 'upload'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              1
            </span>
            <span className={step === 'upload' ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-400'}>
              Upload File
            </span>
          </div>
          <ArrowRight size={14} className="text-slate-300" />
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 'preview'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}
            >
              2
            </span>
            <span className={step === 'preview' ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-400'}>
              Validation &amp; Preview
            </span>
          </div>
          <ArrowRight size={14} className="text-slate-300" />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs">
              3
            </span>
            <span className="text-slate-400">Join to Map</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Upload Dropzone */}
        {step === 'upload' && (
          <div className="space-y-4">
            <label
              htmlFor="election-file-upload"
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-800/20"
            >
              <input
                id="election-file-upload"
                type="file"
                accept=".csv, .xlsx, .xls, .geojson, .json"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileDrop(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                {isProcessing ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Click or drag election dataset file here
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Supports CSV, Excel (.xlsx, .xls), or GeoJSON (Max 50MB)
                </div>
              </div>
            </label>

            {/* Expected format help box */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <HelpCircle size={14} className="text-indigo-600" />
                <span>Expected Standard Schema Columns:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                <div>&bull; state_code</div>
                <div>&bull; pc_code / pc_name</div>
                <div>&bull; ac_code / ac_name</div>
                <div>&bull; party</div>
                <div>&bull; candidate</div>
                <div>&bull; votes</div>
                <div>&bull; turnout (%)</div>
                <div>&bull; margin (%)</div>
                <div>&bull; election_year</div>
              </div>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                Sample files available under <code className="font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-1 py-0.5 rounded">xlsx/sample_election_results_2024.xlsx</code>.
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Validation & Preview */}
        {step === 'preview' && validationResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Total Records</div>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {validationResult.totalRows.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900">
                <div className="text-[10px] font-bold text-emerald-600 uppercase">Matched Constituencies</div>
                <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {validationResult.matchedConstituencies.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900">
                <div className="text-[10px] font-bold text-amber-600 uppercase">Duplicates Removed</div>
                <div className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5">
                  {validationResult.duplicateCount}
                </div>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900">
                <div className="text-[10px] font-bold text-indigo-600 uppercase">Ready to Import</div>
                <div className="text-lg font-black text-indigo-700 dark:text-indigo-300 mt-0.5">
                  {validationResult.validRows.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Unmatched Warning if any */}
            {validationResult.unmatchedRecords.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle size={14} />
                  <span>{validationResult.unmatchedRecords.length} records could not be matched:</span>
                </div>
                <div className="max-h-24 overflow-y-auto text-[11px] text-amber-700 dark:text-amber-400 font-mono space-y-0.5">
                  {validationResult.unmatchedRecords.slice(0, 5).map((u, i) => (
                    <div key={i}>
                      Row {u.rowNumber}: {u.pcName || u.acName} ({u.state}) - {u.reason}
                    </div>
                  ))}
                  {validationResult.unmatchedRecords.length > 5 && (
                    <div>...and {validationResult.unmatchedRecords.length - 5} more</div>
                  )}
                </div>
              </div>
            )}

            {/* Data Preview Table */}
            <div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                <span>Preview Uploaded Data (First {validationResult.previewRows.length} rows)</span>
                <span className="text-[11px] text-slate-400 font-normal">File: {validationResult.fileName}</span>
              </div>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto max-h-48">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                    <tr>
                      {Object.keys(validationResult.previewRows[0] || {}).slice(0, 7).map((h) => (
                        <th key={h} className="p-2 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {validationResult.previewRows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {Object.values(row).slice(0, 7).map((val: any, j) => (
                          <td key={j} className="p-2 whitespace-nowrap font-mono text-[10px]">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Choose Different File
              </button>
              <button
                onClick={handleConfirmImport}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <CheckCircle size={15} />
                <span>Confirm &amp; Join to GIS Boundaries</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default FileUploadModal;
