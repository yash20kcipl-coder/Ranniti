import React from 'react';
import { FormInput } from '@/components/common/FormInput';
import { FileUploadInput } from '@/components/common/FileUploadInput';
import type { CampaignSettings } from '../types/settings.types';
import { Award, User, Flag, Calendar, Vote } from 'lucide-react';

interface CampaignProfileSectionProps {
  settings: CampaignSettings;
  onChange: (updated: Partial<CampaignSettings>) => void;
}

const ELECTION_TYPE_OPTIONS = [
  { label: 'Legislative Assembly (Vidhan Sabha)', value: 'Assembly' },
  { label: 'Parliamentary (Lok Sabha)', value: 'Parliamentary' },
  { label: 'Municipal Corporation / Council', value: 'Municipal' },
  { label: 'Zilla Parishad / Panchayat', value: 'Panchayat' },
];

export const CampaignProfileSection: React.FC<CampaignProfileSectionProps> = ({
  settings,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Campaign & Candidate Master Identity
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Official candidate details, election symbol, and scheduled poll date displayed across voter slips & broadcasts
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            name="candidate_name"
            label="Official Candidate Full Name"
            placeholder="e.g. Adv. Rajesh Kadam"
            value={settings.candidateName || ''}
            onChange={(e) => onChange({ candidateName: (e.target as any)?.value ?? e })}
            required
            icon={<User className="w-4 h-4 text-slate-400" />}
          />

          <FormInput
            name="party_name"
            label="Political Party Affiliation"
            placeholder="e.g. National Democratic Alliance"
            value={settings.partyName || ''}
            onChange={(e) => onChange({ partyName: (e.target as any)?.value ?? e })}
            required
            icon={<Flag className="w-4 h-4 text-slate-400" />}
          />

          <FormInput
            name="election_type"
            type="select"
            label="Election Type"
            value={settings.electionType || 'Assembly'}
            onChange={(e) => onChange({ electionType: (e.target as any)?.value ?? e })}
            options={ELECTION_TYPE_OPTIONS}
            required
            icon={<Vote className="w-4 h-4 text-slate-400" />}
          />

          <FormInput
            name="polling_date"
            type="date"
            label="Scheduled Polling Day"
            value={settings.pollingDate ? settings.pollingDate.split('T')[0] : ''}
            onChange={(e) => onChange({ pollingDate: (e.target as any)?.value ?? e })}
            required
            icon={<Calendar className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Media Uploads using FileUploadInput Standard (Rule 16) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <FileUploadInput
              name="candidate_photo"
              label="Candidate Official Portrait Photo"
              value={settings.candidatePhotoUrl}
              onChange={(fileOrUrl) => {
                if (typeof fileOrUrl === 'string' || fileOrUrl === null) {
                  onChange({ candidatePhotoUrl: fileOrUrl });
                }
              }}
              variant="avatar"
              fallbackText={settings.candidateName ? settings.candidateName.slice(0, 2).toUpperCase() : 'CD'}
              category="candidates"
              placeholder="Upload Candidate Portrait Photo"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Used in WhatsApp header media and voter information slips.
            </p>
          </div>

          <div>
            <FileUploadInput
              name="party_symbol"
              label="Party Election Symbol Logo"
              value={settings.partySymbolUrl}
              onChange={(fileOrUrl) => {
                if (typeof fileOrUrl === 'string' || fileOrUrl === null) {
                  onChange({ partySymbolUrl: fileOrUrl });
                }
              }}
              variant="avatar"
              fallbackText={settings.partyName ? settings.partyName.slice(0, 2).toUpperCase() : 'SY'}
              category="symbols"
              placeholder="Upload Election Symbol"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Transparent PNG or SVG symbol logo verified by ECI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignProfileSection;
