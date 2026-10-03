import React from 'react';
import { Tag, Sparkles } from 'lucide-react';

export interface VariableChipDef {
  key: string;
  label: string;
  description: string;
  sampleValue: string;
}

export const AVAILABLE_VARIABLES: VariableChipDef[] = [
  { key: 'voter_name', label: 'Voter Name', description: 'Full voter name', sampleValue: 'Ramesh Kumar Sharma' },
  { key: 'epic_no', label: 'EPIC No', description: 'Voter ID Card Number', sampleValue: 'ABC1234567' },
  { key: 'booth_name', label: 'Booth Name', description: 'Polling station name', sampleValue: 'Primary School, Room 2' },
  { key: 'serial_no', label: 'Serial No', description: 'Serial in electoral roll', sampleValue: '482' },
  { key: 'polling_date', label: 'Polling Date', description: 'Scheduled election date', sampleValue: '15 Nov 2026' },
  { key: 'booth_address', label: 'Booth Address', description: 'Complete polling room location', sampleValue: 'Station Road, Ward 12' },
  { key: 'candidate_name', label: 'Candidate Name', description: 'Official party candidate', sampleValue: 'Aditya Singh' },
  { key: 'worker_name', label: 'Worker Name', description: 'Karyakarta full name', sampleValue: 'Prakash Patil' },
  { key: 'pending_count', label: 'Pending Count', description: 'Pending survey count', sampleValue: '64' },
];

interface VariableChipsProps {
  onInsert: (variableKey: string) => void;
  className?: string;
}

export const VariableChips: React.FC<VariableChipsProps> = ({ onInsert, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          Click to Insert Dynamic Variable:
        </span>
        <span className="text-[11px] text-slate-400">Auto-interpolates per voter</span>
      </div>

      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
        {AVAILABLE_VARIABLES.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => onInsert(`{{${v.key}}}`)}
            title={`${v.description} (e.g. "${v.sampleValue}")`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 hover:border-indigo-300 transition-all cursor-pointer"
          >
            <Tag className="w-2.5 h-2.5 opacity-70" />
            <span>{`{{${v.key}}}`}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default VariableChips;
