import { Modal } from './Modal';
import toast from 'react-hot-toast';
import React, { useState } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import type { MasterField } from '@/config/masterConfig';
import { downloadSampleTemplate } from '@/redux/actions/importJobs';
import { parseExcelFile, downloadSampleExcelTemplate } from '@/utils/exportImport';
import { Upload, Download, FileSpreadsheet, AlertCircle, Trash2, Loader2 } from 'lucide-react';

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  categoryKey?: string;
  fields: MasterField[];
  onImport: (records: Record<string, any>[]) => Promise<void>;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  title,
  categoryKey,
  fields,
  onImport,
}) => {
  const dispatch = useAppDispatch();
  const [isParsing, setIsParsing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, any>[]>([]);

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
        await dispatch(downloadSampleTemplate(categoryKey));
      } else {
        const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
        downloadSampleExcelTemplate(fields, `${cleanTitle}_template.xlsx`);
      }
      toast.success('Sample Excel template downloaded!');
    } catch (err: any) {
      toast.error('Failed to download sample template.');
    }
  };

  const handleSubmitImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedData.length === 0) {
      toast.error('No records available to import.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onImport(parsedData);
      toast.success(`Successfully imported ${parsedData.length} records!`);
      handleModalClose();
    } catch (err: any) {
      toast.error(err.message || 'Import failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={title}
      maxWidth="xl"
      isOpen={isOpen}
      onClose={handleModalClose}
      onSubmit={handleSubmitImport}
      submitText={isSubmitting ? 'Importing...' : `Import ${parsedData.length} Records`}
    >
      <div className="space-y-4 text-left">
        {/* Top helper bar with download sample template */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Supported format: <strong>Excel (.XLSX / .XLS)</strong></span>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-600/20 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-semibold text-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sample Excel Template</span>
          </button>
        </div>

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
