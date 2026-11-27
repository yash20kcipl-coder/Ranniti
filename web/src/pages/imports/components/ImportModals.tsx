import React from 'react';
import { Download } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { FailedRecordsModal } from '@/components/common/FailedRecordsModal';
import { ImportModal } from '@/components/common/ImportModal';
import type { ImportJob } from '@/redux/actions/importJobs';
import { ALL_IMPORT_CATEGORIES, type CategoryMeta } from './importFilterConfig';

export interface ImportModalsProps {
  isCategoryPickerOpen: boolean;
  setIsCategoryPickerOpen: (open: boolean) => void;
  authorizedCategories: CategoryMeta[];
  activeImportCategory: string | null;
  setActiveImportCategory: (cat: string | null) => void;
  isTemplateModalOpen: boolean;
  setIsTemplateModalOpen: (open: boolean) => void;
  onDownloadSample: (categoryKey: string) => void;
  selectedFailedJob: ImportJob | null;
  setSelectedFailedJob: (job: ImportJob | null) => void;
  isClearConfirmOpen: boolean;
  setIsClearConfirmOpen: (open: boolean) => void;
  onClearCompleted: () => void;
}

export const ImportModals: React.FC<ImportModalsProps> = ({
  isCategoryPickerOpen,
  setIsCategoryPickerOpen,
  authorizedCategories,
  activeImportCategory,
  setActiveImportCategory,
  isTemplateModalOpen,
  setIsTemplateModalOpen,
  onDownloadSample,
  selectedFailedJob,
  setSelectedFailedJob,
  isClearConfirmOpen,
  setIsClearConfirmOpen,
  onClearCompleted,
}) => {
  return (
    <>
      {/* MODAL 1: CATEGORY SELECTION LAUNCHER */}
      <Modal
        maxWidth="5xl"
        title="Select Entity to Import"
        isOpen={isCategoryPickerOpen}
        onClose={() => setIsCategoryPickerOpen(false)}
      >
        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Choose the master category or voter directory entity you wish to import via `.xlsx` spreadsheet:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[95vh] overflow-y-auto pr-1">
            {authorizedCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setIsCategoryPickerOpen(false);
                    setActiveImportCategory(cat.key);
                  }}
                  className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white hover:bg-indigo-50/40 dark:bg-slate-900 dark:hover:bg-indigo-950/20 text-left transition-all cursor-pointer group"
                >
                  <div className={`p-2.5 rounded-xl border shrink-0 ${cat.badgeBg} group-hover:scale-105 transition-transform`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {cat.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {cat.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* MODAL 2: IMPORT MODAL WRAPPER */}
      {activeImportCategory && (
        <ImportModal
          isOpen={Boolean(activeImportCategory)}
          onClose={() => setActiveImportCategory(null)}
          title={`Import ${ALL_IMPORT_CATEGORIES.find((c) => c.key === activeImportCategory)?.label || activeImportCategory} (.xlsx)`}
          categoryKey={activeImportCategory}
        />
      )}

      {/* MODAL 3: DOWNLOAD SAMPLE TEMPLATES */}
      <Modal
        maxWidth="5xl"
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Download Sample Spreadsheets (.xlsx)"
      >
        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Download pre-formatted Excel template files with exact column headers and sample data for offline data preparation:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[95vh] overflow-y-auto pr-1">
            {authorizedCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.key}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl border shrink-0 ${cat.badgeBg}`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {cat.label}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {cat.key}_template.xlsx
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDownloadSample(cat.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* MODAL 4: FAILED RECORDS INSPECTION */}
      <FailedRecordsModal
        isOpen={Boolean(selectedFailedJob)}
        onClose={() => setSelectedFailedJob(null)}
        job={selectedFailedJob}
      />

      {/* MODAL 5: CONFIRM CLEAR COMPLETED JOBS */}
      <ConfirmModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={onClearCompleted}
        title="Clear Completed Import Jobs"
        message="Are you sure you want to clear finished and failed import jobs from the monitor list? Active in-progress jobs will continue running."
        variant="warning"
        confirmText="Clear Jobs"
      />
    </>
  );
};

export default ImportModals;
