import React from 'react';
import { Tag, Sparkles } from 'lucide-react';

export interface VariableChipDef {
  key: string;
  metaIndex?: string; // e.g. '1', '2', '3', '4', '5'
  label: string;
  hindiLabel: string;
  description: string;
  sampleValue: string;
  dbField: string;
}

export const AVAILABLE_VARIABLES: VariableChipDef[] = [
  {
    key: 'voter_name',
    metaIndex: '1',
    label: 'Voter Name',
    hindiLabel: 'मतदाता का नाम',
    description: "Voter's full name",
    sampleValue: 'रमेश कुमार शर्मा',
    dbField: 'voters.name',
  },
  {
    key: 'booth_name',
    metaIndex: '2',
    label: 'Booth Name',
    hindiLabel: 'मतदान केंद्र',
    description: 'Assigned polling booth / station name',
    sampleValue: 'प्राथमिक विद्यालय, कक्ष क्र. 2',
    dbField: 'booths.name',
  },
  {
    key: 'serial_no',
    metaIndex: '4',
    label: 'Serial Number',
    hindiLabel: 'मतदाता क्रमांक',
    description: 'Voter serial number on electoral roll',
    sampleValue: '348',
    dbField: 'voters.serial_no',
  },
  {
    key: 'section_no',
    metaIndex: '3',
    label: 'Part / Ward No',
    hindiLabel: 'भाग / वार्ड संख्या',
    description: 'Electoral part or ward section number',
    sampleValue: 'वार्ड क्र. 12',
    dbField: 'voters.section_no / booths.ward_number',
  },
  {
    key: 'polling_date',
    metaIndex: '5',
    label: 'Polling Date',
    hindiLabel: 'मतदान तिथि',
    description: 'Scheduled election polling date',
    sampleValue: '15 नवंबर 2026',
    dbField: 'elections.election_date',
  },
  {
    key: 'voter_name',
    metaIndex: '1',
    label: 'Voter Name',
    hindiLabel: 'मतदाता का नाम',
    description: "Voter's full name",
    sampleValue: 'रमेश कुमार शर्मा',
    dbField: 'voters.name',
  },
  {
    key: 'epic_no',
    label: 'EPIC Voter ID',
    hindiLabel: 'पहचान पत्र क्रमांक',
    description: 'Voter photo identity card number',
    sampleValue: 'ABC1234567',
    dbField: 'voters.epic_no',
  },
  {
    key: 'booth_name',
    metaIndex: '2',
    label: 'Booth Name',
    hindiLabel: 'मतदान केंद्र',
    description: 'Polling station name',
    sampleValue: 'प्राथमिक विद्यालय, कक्ष 2',
    dbField: 'booths.name',
  },
  {
    key: 'serial_no',
    metaIndex: '4',
    label: 'Serial Number',
    hindiLabel: 'मतदाता क्रमांक',
    description: 'Serial in electoral roll',
    sampleValue: '348',
    dbField: 'voters.serial_no',
  },
  {
    key: 'polling_date',
    metaIndex: '5',
    label: 'Polling Date',
    hindiLabel: 'मतदान तिथि',
    description: 'Election polling date',
    sampleValue: '15 Nov 2026',
    dbField: 'elections.election_date',
  },
  {
    key: 'booth_address',
    label: 'Booth Address',
    hindiLabel: 'मतदान केंद्र का पता',
    description: 'Complete polling room location & address',
    sampleValue: 'स्टेशन रोड, वार्ड 12',
    dbField: 'booths.location_building',
  },
  {
    key: 'candidate_name',
    label: 'Candidate Name',
    hindiLabel: 'उम्मीदवार का नाम',
    description: 'Official candidate name',
    sampleValue: 'आदित्य सिंह',
    dbField: 'campaign_settings.candidate_name',
  },
  {
    key: 'party_name',
    label: 'Party Name',
    hindiLabel: 'पार्टी / दल',
    description: 'Political party or alliance name',
    sampleValue: 'रणनीति दल',
    dbField: 'campaign_settings.party_name',
  },
  {
    key: 'worker_name',
    label: 'Worker Name',
    hindiLabel: 'कार्यकर्ता का नाम',
    description: 'Karyakarta or volunteer name',
    sampleValue: 'प्रकाश पाटिल',
    dbField: 'tenant_users.name',
  },
  {
    key: 'pending_count',
    label: 'Pending Count',
    hindiLabel: 'शेष मतदाता',
    description: 'Pending unvoted voters count in booth',
    sampleValue: '64',
    dbField: 'election_booth_turnout.pending_count',
  },
];

/**
 * Resolves any variable key (e.g. '1', '2', '4', 'voter_name', etc.)
 * into human-readable label, Hindi label, database mapping, and sample value.
 */
export function resolveVariableInfo(key: string): VariableChipDef {
  const clean = key.replace(/[{}]/g, '').trim();

  // Direct match in AVAILABLE_VARIABLES
  const directMatch = AVAILABLE_VARIABLES.find((item) => item.key === clean);
  if (directMatch) return directMatch;

  // Numbered fallback
  if (clean === '1') {
    return {
      key: '1',
      metaIndex: '1',
      label: 'Voter Name',
      hindiLabel: 'मतदाता का नाम',
      description: "Full name of the voter",
      sampleValue: 'रमेश कुमार',
      dbField: 'voters.name',
    };
  }
  if (clean === '2') {
    return {
      key: '2',
      metaIndex: '2',
      label: 'Booth / Polling Station',
      hindiLabel: 'मतदान केंद्र',
      description: 'Assigned polling booth name & room',
      sampleValue: 'प्राथमिक विद्यालय, कक्ष 2',
      dbField: 'booths.name',
    };
  }
  if (clean === '3') {
    return {
      key: '3',
      metaIndex: '3',
      label: 'Part / Ward Number',
      hindiLabel: 'भाग / वार्ड संख्या',
      description: 'Electoral roll part or ward section #',
      sampleValue: 'वार्ड 12',
      dbField: 'voters.section_no',
    };
  }
  if (clean === '4') {
    return {
      key: '4',
      metaIndex: '4',
      label: 'Voter Serial Number',
      hindiLabel: 'मतदाता क्रमांक',
      description: 'Voter serial number on electoral roll',
      sampleValue: '348',
      dbField: 'voters.serial_no',
    };
  }
  if (clean === '5') {
    return {
      key: '5',
      metaIndex: '5',
      label: 'Polling Date',
      hindiLabel: 'मतदान तिथि',
      description: 'Official polling date',
      sampleValue: '15 नवंबर 2026',
      dbField: 'elections.election_date',
    };
  }

  // Generic fallback
  return {
    key: clean,
    label: clean.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    hindiLabel: clean,
    description: `Dynamic value for ${clean}`,
    sampleValue: `[Sample ${clean}]`,
    dbField: 'custom',
  };
}

/**
 * Normalizes legacy numbered or camelCase tokens (e.g. {{1}}, {{2}}, {{4}}, {{candidateName}})
 * to canonical human-readable tokens ({{voter_name}}, {{booth_name}}, {{serial_no}}, {{candidate_name}}).
 */
export function normalizeTemplateTextToLabels(text: string): string {
  if (!text) return '';
  let normalized = text;

  // Numbered tokens
  normalized = normalized.replace(/\{\{1\}\}/g, '{{voter_name}}');
  normalized = normalized.replace(/\{\{2\}\}/g, '{{booth_name}}');
  normalized = normalized.replace(/\{\{3\}\}/g, '{{section_no}}');
  normalized = normalized.replace(/\{\{4\}\}/g, '{{serial_no}}');
  normalized = normalized.replace(/\{\{5\}\}/g, '{{polling_date}}');

  // CamelCase variants
  normalized = normalized.replace(/\{\{voterName\}\}/gi, '{{voter_name}}');
  normalized = normalized.replace(/\{\{boothName\}\}/gi, '{{booth_name}}');
  normalized = normalized.replace(/\{\{serialNo\}\}/gi, '{{serial_no}}');
  normalized = normalized.replace(/\{\{sectionNo\}\}/gi, '{{section_no}}');
  normalized = normalized.replace(/\{\{partNo\}\}/gi, '{{section_no}}');
  normalized = normalized.replace(/\{\{pollingDate\}\}/gi, '{{polling_date}}');
  normalized = normalized.replace(/\{\{candidateName\}\}/gi, '{{candidate_name}}');
  normalized = normalized.replace(/\{\{partyName\}\}/gi, '{{party_name}}');
  normalized = normalized.replace(/\{\{workerName\}\}/gi, '{{worker_name}}');
  normalized = normalized.replace(/\{\{pendingCount\}\}/gi, '{{pending_count}}');
  normalized = normalized.replace(/\{\{epicNo\}\}/gi, '{{epic_no}}');

  return normalized;
}

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
