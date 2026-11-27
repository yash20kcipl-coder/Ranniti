import {
  MapPin,
  Users,
  Vote,
  Crown,
  Sparkles,
  Star,
  UserX,
  AlertTriangle,
  Phone,
} from 'lucide-react';
import {
  GENDER_OPTIONS,
  AGE_GROUP_OPTIONS,
  STATUS_OPTIONS,
  IS_DEAD_OPTIONS,
  VOTER_TYPE_OPTIONS,
} from '@/constants/dropdownOptions';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { SafeImage } from '@/components/common/SafeImage';
import type { Column } from '@/components/common/DataTable';
import type { FilterField, FilterPreset, Option } from '@/components/common/FilterBar';

export interface VoterFilterState {
  filterParams: Record<string, string>;
  setFilter: (key: any, val: any) => void;
  onAcChange?: (newAcId: string) => void;
  onBoothChange?: (newBoothId: string) => void;
  onAcDraftChange?: (newAcId: string) => void;
  onBoothDraftChange?: (newBoothId: string) => void;
  onBoothSearch?: (query: string, acId?: string) => Promise<Option[]>;
}

export function formatBoothOption(b: any): Option {
  const label = `${b.boothNumber ? `Booth #${b.boothNumber} - ` : ''}${b.name}`;
  const subtitleParts = [b.acName, b.pcName].filter(Boolean);
  return {
    label,
    value: String(b.id),
    ...(subtitleParts.length > 0 ? { subtitle: subtitleParts.join(' • ') } : {}),
  };
}

export interface VoterFilterMasterData {
  states?: any[];
  districts?: any[];
  pcs?: any[];
  acs?: any[];
  booths?: any[];
  isBoothsLoading?: boolean;
  religions?: any[];
  castes?: any[];
  parties?: any[];
  familyInfluencers?: any[];
  socialInfluencers?: any[];
}

export function getVoterMasterOptions(masters: VoterFilterMasterData) {
  const { states = [], religions = [], castes = [], parties = [] } = masters;

  const stateOptions: Option[] = [
    { label: 'All States', value: '' },
    ...states.map((s: any) => ({ label: s.name || s.stateName, value: String(s.id) })),
  ];

  const religionOptions: Option[] = [
    { label: 'All Religions', value: '' },
    ...religions.map((r: any) => ({ label: r.name, value: String(r.id) })),
  ];

  const casteOptions: Option[] = [
    { label: 'All Castes', value: '' },
    ...castes.map((c: any) => ({ label: `${c.name} (${c.category})`, value: String(c.id) })),
  ];

  const partyOptions: Option[] = [
    { label: 'All Political Parties', value: '' },
    ...parties.map((p: any) => ({ label: `${p.abbreviation || p.name}`, value: String(p.id) })),
  ];

  return { stateOptions, religionOptions, casteOptions, partyOptions };
}

export interface VoterFilterFieldsOptions {
  isTenant?: boolean;
}

export function buildVoterFilterFields(
  state: VoterFilterState,
  masters: VoterFilterMasterData,
  options?: VoterFilterFieldsOptions
): FilterField[] {
  const isTenant = !!options?.isTenant;
  const { stateOptions, religionOptions, casteOptions, partyOptions } = getVoterMasterOptions(masters);
  const {
    districts = [],
    pcs = [],
    acs = [],
    booths = [],
    isBoothsLoading = false,
    familyInfluencers = [],
    socialInfluencers = [],
  } = masters;

  const { filterParams, setFilter } = state;
  const {
    stateId, districtId, pcId, acId, boothId,
    gender, ageGroup, religionId, casteId,
    status, isDead, voterType, partyId,
    familyInfluencerId, socialInfluencerId,
    influencerRole, influencerStatus,
  } = filterParams;

  // --- Location & Booth Category Fields ---
  const locationFields: FilterField[] = [];

  if (!isTenant) {
    locationFields.push(
      {
        key: 'stateId',
        label: 'State',
        category: 'Location & Booth',
        categoryIcon: <MapPin className="w-4 h-4" />,
        gridSpan: 1,
        value: stateId,
        onChange: (val: string) => {
          setFilter('stateId', val);
          setFilter('districtId', '');
          setFilter('pcId', '');
          if (state.onAcChange) {
            state.onAcChange('');
          } else {
            setFilter('acId', '');
            setFilter('boothId', '');
          }
        },
        onDraftChange: (val: string, setDraftValues: any) => {
          setDraftValues((prev: any) => ({
            ...prev,
            stateId: val,
            districtId: '',
            pcId: '',
            acId: '',
            boothId: '',
            familyInfluencerId: '',
            socialInfluencerId: '',
          }));
          if (state.onAcDraftChange) {
            state.onAcDraftChange('');
          }
        },
        options: stateOptions,
        isPrimary: false,
      },
      {
        key: 'districtId',
        label: 'District',
        category: 'Location & Booth',
        categoryIcon: <MapPin className="w-4 h-4" />,
        gridSpan: 1,
        value: districtId,
        onChange: (val: string) => {
          setFilter('districtId', val);
          setFilter('pcId', '');
          if (state.onAcChange) {
            state.onAcChange('');
          } else {
            setFilter('acId', '');
            setFilter('boothId', '');
          }
        },
        onDraftChange: (val: string, setDraftValues: any) => {
          setDraftValues((prev: any) => ({
            ...prev,
            districtId: val,
            pcId: '',
            acId: '',
            boothId: '',
            familyInfluencerId: '',
            socialInfluencerId: '',
          }));
          if (state.onAcDraftChange) {
            state.onAcDraftChange('');
          }
        },
        options: (draft: Record<string, any>) => {
          const curState = draft.stateId !== undefined ? draft.stateId : stateId;
          return [
            { label: 'All Districts', value: '' },
            ...districts
              .filter((d: any) => !curState || String(d.stateId) === curState)
              .map((d: any) => ({ label: d.name || d.districtName, value: String(d.id) })),
          ];
        },
        isPrimary: false,
      },
      {
        key: 'pcId',
        label: 'Parliamentary Constituency (PC)',
        category: 'Location & Booth',
        categoryIcon: <MapPin className="w-4 h-4" />,
        gridSpan: 1,
        value: pcId,
        onChange: (val: string) => {
          setFilter('pcId', val);
          if (state.onAcChange) {
            state.onAcChange('');
          } else {
            setFilter('acId', '');
            setFilter('boothId', '');
          }
        },
        onDraftChange: (val: string, setDraftValues: any) => {
          setDraftValues((prev: any) => ({
            ...prev,
            pcId: val,
            acId: '',
            boothId: '',
            familyInfluencerId: '',
            socialInfluencerId: '',
          }));
          if (state.onAcDraftChange) {
            state.onAcDraftChange('');
          }
        },
        options: (draft: Record<string, any>) => {
          const curDistrict = draft.districtId !== undefined ? draft.districtId : districtId;
          const curState = draft.stateId !== undefined ? draft.stateId : stateId;
          return [
            { label: 'All PCs', value: '' },
            ...pcs
              .filter(
                (p: any) =>
                  (!curState || String(p.stateId) === curState) &&
                  (!curDistrict || String(p.districtId) === curDistrict)
              )
              .map((p: any) => ({ label: p.name || p.pcName, value: String(p.id) })),
          ];
        },
        isPrimary: false,
      }
    );
  }

  // Assembly Constituency (AC)
  locationFields.push({
    key: 'acId',
    label: 'Assembly Constituency (AC)',
    category: 'Location & Booth',
    categoryIcon: <MapPin className="w-4 h-4" />,
    gridSpan: 1,
    value: acId || (acs.length === 1 ? String(acs[0].id) : ''),
    excludeFromCount: isTenant && acs.length === 1,
    onChange: (val: string) => {
      if (state.onAcChange) {
        state.onAcChange(val);
      } else {
        setFilter('acId', val);
        setFilter('boothId', '');
      }
    },
    onDraftChange: (val: string, setDraftValues: any) => {
      setDraftValues((prev: any) => ({
        ...prev,
        acId: val,
        boothId: '',
        familyInfluencerId: '',
        socialInfluencerId: '',
      }));
      if (state.onAcDraftChange) {
        state.onAcDraftChange(val);
      }
    },
    onDraftRevert: () => {
      if (state.onAcDraftChange) {
        state.onAcDraftChange(acId || (acs.length === 1 ? String(acs[0].id) : ''));
      }
    },
    options: (draft: Record<string, any>) => {
      if (isTenant) {
        if (acs.length === 1) {
          return acs.map((a: any) => ({ label: a.name || a.acName, value: String(a.id) }));
        }
        return [
          { label: 'All ACs', value: '' },
          ...acs.map((a: any) => ({ label: a.name || a.acName, value: String(a.id) })),
        ];
      }
      const curPc = draft.pcId !== undefined ? draft.pcId : pcId;
      const curDistrict = draft.districtId !== undefined ? draft.districtId : districtId;
      const filteredAcs = acs
        .filter(
          (a: any) =>
            (!curPc || String(a.pcId) === curPc) &&
            (!curDistrict || String(a.districtId) === curDistrict)
        )
        .map((a: any) => ({ label: a.name || a.acName, value: String(a.id) }));

      if (filteredAcs.length === 1) {
        return filteredAcs;
      }
      return [
        { label: 'All ACs', value: '' },
        ...filteredAcs,
      ];
    },
    // Kept inside filter drawer; only Polling Booth is shown inline on the bar
    isPrimary: false,
  });

  // Polling Booth
  locationFields.push({
    key: 'boothId',
    label: 'Polling Booth',
    category: 'Location & Booth',
    categoryIcon: <MapPin className="w-4 h-4" />,
    gridSpan: isTenant ? 1 : 2,
    value: boothId,
    disabled: () => isBoothsLoading && booths.length === 0,
    placeholder: (draft: Record<string, any>) => {
      if (isBoothsLoading && booths.length === 0) return 'Loading booths...';
      const curAc = draft.acId !== undefined ? draft.acId : acId;
      return curAc ? 'All Booths in AC' : 'All Polling Booths';
    },
    helperText: () => {
      if (isBoothsLoading && booths.length === 0) return 'Loading booths...';
      return undefined;
    },
    onChange: (val: string) => {
      if (state.onBoothChange) {
        state.onBoothChange(val);
      } else {
        setFilter('boothId', val);
      }
    },
    onDraftChange: (val: string, setDraftValues: any) => {
      setDraftValues((prev: any) => ({
        ...prev,
        boothId: val,
        familyInfluencerId: '',
        socialInfluencerId: '',
      }));
      if (state.onBoothDraftChange) {
        state.onBoothDraftChange(val);
      }
    },
    onDraftRevert: () => {
      if (state.onBoothDraftChange) {
        state.onBoothDraftChange(boothId || '');
      }
    },
    onOptionSearch: state.onBoothSearch
      ? async (query: string, currentValues: Record<string, any>) => {
          const curAc = currentValues.acId !== undefined ? currentValues.acId : acId;
          return state.onBoothSearch!(query, curAc || undefined);
        }
      : undefined,
    options: (draft: Record<string, any>) => {
      const curAc = draft.acId !== undefined ? draft.acId : acId;
      if (isBoothsLoading && booths.length === 0) {
        return [{ label: 'Loading booths...', value: '' }];
      }
      const filteredBooths = curAc
        ? booths.filter((b: any) => !b.acId || String(b.acId) === curAc)
        : booths;
      return [
        { label: curAc ? 'All Booths in AC' : 'All Polling Booths', value: '' },
        ...filteredBooths.map(formatBoothOption),
      ];
    },
    isPrimary: true,
  });

  return [
    ...locationFields,

    // --- Demographics Category ---
    {
      key: 'gender',
      label: 'Gender',
      category: 'Demographics',
      categoryIcon: <Users className="w-4 h-4" />,
      type: 'pills',
      gridSpan: 2,
      value: gender,
      onChange: (val: string) => setFilter('gender', val),
      options: GENDER_OPTIONS,
      isPrimary: false,
    },
    {
      key: 'ageGroup',
      label: 'Age Group Range',
      category: 'Demographics',
      categoryIcon: <Users className="w-4 h-4" />,
      gridSpan: 1,
      value: ageGroup,
      onChange: (val: string) => setFilter('ageGroup', val),
      options: AGE_GROUP_OPTIONS,
      isPrimary: false,
    },
    {
      key: 'religionId',
      label: 'Religion',
      category: 'Demographics',
      categoryIcon: <Users className="w-4 h-4" />,
      gridSpan: 1,
      value: religionId,
      onChange: (val: string) => setFilter('religionId', val),
      options: religionOptions,
      isPrimary: false,
    },
    {
      key: 'casteId',
      label: 'Caste & Category',
      category: 'Demographics',
      categoryIcon: <Users className="w-4 h-4" />,
      gridSpan: 2,
      value: casteId,
      onChange: (val: string) => setFilter('casteId', val),
      options: casteOptions,
      isPrimary: false,
    },

    // --- Political & Status Category ---
    {
      key: 'status',
      label: 'Voter Status',
      category: 'Political & Status',
      categoryIcon: <Vote className="w-4 h-4" />,
      type: 'pills',
      gridSpan: 2,
      value: status,
      onChange: (val: string) => setFilter('status', val),
      options: STATUS_OPTIONS,
      isPrimary: false,
    },
    {
      key: 'isDead',
      label: 'Deceased Filter',
      category: 'Political & Status',
      categoryIcon: <Vote className="w-4 h-4" />,
      type: 'pills',
      gridSpan: 2,
      value: isDead,
      onChange: (val: string) => setFilter('isDead', val),
      options: IS_DEAD_OPTIONS,
      isPrimary: false,
    },
    {
      key: 'voterType',
      label: 'Voter Category',
      category: 'Political & Status',
      categoryIcon: <Vote className="w-4 h-4" />,
      gridSpan: 1,
      value: voterType,
      onChange: (val: string) => setFilter('voterType', val),
      options: VOTER_TYPE_OPTIONS,
      isPrimary: false,
    },
    {
      key: 'partyId',
      label: 'Party Affiliation',
      category: 'Political & Status',
      categoryIcon: <Vote className="w-4 h-4" />,
      gridSpan: 1,
      value: partyId,
      onChange: (val: string) => setFilter('partyId', val),
      options: partyOptions,
      isPrimary: false,
    },

    // --- Influencer Network Category ---
    {
      key: 'influencerNotice',
      label:
        'Polling Booth Required: Select a Polling Booth in "Location & Booth" above to enable specific leader selection.',
      type: 'notice' as const,
      category: 'Influencer Network',
      categoryIcon: <Crown className="w-4 h-4 text-purple-400" />,
      value: '',
      onChange: () => { },
      hidden: (draft: Record<string, any>) => !!(draft.boothId !== undefined ? draft.boothId : boothId),
    },
    {
      key: 'familyInfluencerId',
      label: 'Linked Family Head',
      category: 'Influencer Network',
      categoryIcon: <Crown className="w-4 h-4 text-purple-400" />,
      gridSpan: 1,
      value: familyInfluencerId,
      onChange: (val: string) => setFilter('familyInfluencerId', val),
      options: (draft: Record<string, any>) => {
        const curBooth = draft.boothId !== undefined ? draft.boothId : boothId;
        return [
          { label: curBooth ? 'All Family Heads in Booth' : 'Select booth first...', value: '' },
          ...familyInfluencers.map((inf: any) => {
            const fullName =
              [inf.engFirstName, inf.engMiddleName, inf.engSurname].filter(Boolean).join(' ') ||
              inf.engName ||
              inf.name;
            return {
              label: `${fullName} (${inf.epicNo})`,
              value: String(inf.id),
            };
          }),
        ];
      },
      placeholder: boothId ? 'All Family Heads in Booth' : 'Select booth first...',
      disabled: (draft: Record<string, any>) => !(draft.boothId !== undefined ? draft.boothId : boothId),
      helperText: (draft: Record<string, any>) =>
        !(draft.boothId !== undefined ? draft.boothId : boothId) ? 'Select Polling Booth to enable' : undefined,
      isPrimary: false,
    },
    {
      key: 'socialInfluencerId',
      label: 'Linked Social Leader',
      category: 'Influencer Network',
      categoryIcon: <Sparkles className="w-4 h-4 text-amber-400" />,
      gridSpan: 1,
      value: socialInfluencerId,
      onChange: (val: string) => setFilter('socialInfluencerId', val),
      options: (draft: Record<string, any>) => {
        const curBooth = draft.boothId !== undefined ? draft.boothId : boothId;
        return [
          { label: curBooth ? 'All Social Leaders in Booth' : 'Select booth first...', value: '' },
          ...socialInfluencers.map((inf: any) => {
            const fullName =
              [inf.engFirstName, inf.engMiddleName, inf.engSurname].filter(Boolean).join(' ') ||
              inf.engName ||
              inf.name;
            return {
              label: `${fullName} (${inf.epicNo})`,
              value: String(inf.id),
            };
          }),
        ];
      },
      placeholder: boothId ? 'All Social Leaders in Booth' : 'Select booth first...',
      disabled: (draft: Record<string, any>) => !(draft.boothId !== undefined ? draft.boothId : boothId),
      helperText: (draft: Record<string, any>) =>
        !(draft.boothId !== undefined ? draft.boothId : boothId) ? 'Select Polling Booth to enable' : undefined,
      isPrimary: false,
    },
    {
      key: 'influencerRole',
      label: 'Voter Leadership Role',
      category: 'Influencer Network',
      categoryIcon: <Crown className="w-4 h-4 text-purple-400" />,
      type: 'pills',
      gridSpan: 2,
      value: influencerRole,
      onChange: (val: string) => {
        setFilter('influencerRole', val);
        if (val === 'family') {
          setFilter('isFamilyInfluencer', 'true');
          setFilter('isSocialInfluencer', '');
        } else if (val === 'social') {
          setFilter('isFamilyInfluencer', '');
          setFilter('isSocialInfluencer', 'true');
        } else {
          setFilter('isFamilyInfluencer', '');
          setFilter('isSocialInfluencer', '');
        }
      },
      options: [
        { label: 'All Voters', value: '' },
        { label: '👑 Family Heads', value: 'family' },
        { label: '✨ Social Leaders', value: 'social' },
        { label: '🌟 Any Influencer', value: 'any' },
      ],
      isPrimary: false,
    },
    {
      key: 'influencerStatus',
      label: 'Network Connection Status',
      category: 'Influencer Network',
      categoryIcon: <Star className="w-4 h-4 text-indigo-400" />,
      type: 'pills',
      gridSpan: 2,
      value: influencerStatus,
      onChange: (val: string) => setFilter('influencerStatus', val),
      options: [
        { label: 'All Voters', value: '' },
        { label: '🔗 Linked to Leader', value: 'assigned' },
        { label: '⚪ Unassigned / Standalone', value: 'unassigned' },
      ],
      isPrimary: false,
    },
  ];
}

export function buildVoterFilterPresets(state: VoterFilterState): FilterPreset[] {
  const { filterParams, setFilter } = state;
  const { gender, influencerRole, isFamilyInfluencer, isSocialInfluencer, isDead, ageGroup } = filterParams;

  return [
    {
      label: 'Male Voters',
      icon: <Users className="w-3.5 h-3.5" />,
      active: gender === 'Male',
      apply: () => setFilter('gender', gender === 'Male' ? '' : 'Male'),
      isActiveDraft: (draft) => draft.gender === 'Male',
      applyDraft: (draft) => ({ ...draft, gender: draft.gender === 'Male' ? '' : 'Male' }),
    },
    {
      label: 'Female Voters',
      icon: <Users className="w-3.5 h-3.5" />,
      active: gender === 'Female',
      apply: () => setFilter('gender', gender === 'Female' ? '' : 'Female'),
      isActiveDraft: (draft) => draft.gender === 'Female',
      applyDraft: (draft) => ({ ...draft, gender: draft.gender === 'Female' ? '' : 'Female' }),
    },
    {
      label: 'Family Influencers',
      icon: <Crown className="w-3.5 h-3.5 text-purple-400" />,
      active: influencerRole === 'family' || isFamilyInfluencer === 'true',
      apply: () => {
        const next = influencerRole === 'family' || isFamilyInfluencer === 'true' ? '' : 'family';
        setFilter('influencerRole', next);
        setFilter('isFamilyInfluencer', next ? 'true' : '');
        setFilter('isSocialInfluencer', '');
      },
      isActiveDraft: (draft) => draft.influencerRole === 'family' || draft.isFamilyInfluencer === 'true',
      applyDraft: (draft) => {
        const isAct = draft.influencerRole === 'family' || draft.isFamilyInfluencer === 'true';
        return {
          ...draft,
          influencerRole: isAct ? '' : 'family',
          isFamilyInfluencer: isAct ? '' : 'true',
          isSocialInfluencer: '',
        };
      },
    },
    {
      label: 'Social Influencers',
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
      active: influencerRole === 'social' || isSocialInfluencer === 'true',
      apply: () => {
        const next = influencerRole === 'social' || isSocialInfluencer === 'true' ? '' : 'social';
        setFilter('influencerRole', next);
        setFilter('isFamilyInfluencer', '');
        setFilter('isSocialInfluencer', next ? 'true' : '');
      },
      isActiveDraft: (draft) => draft.influencerRole === 'social' || draft.isSocialInfluencer === 'true',
      applyDraft: (draft) => {
        const isAct = draft.influencerRole === 'social' || draft.isSocialInfluencer === 'true';
        return {
          ...draft,
          influencerRole: isAct ? '' : 'social',
          isFamilyInfluencer: '',
          isSocialInfluencer: isAct ? '' : 'true',
        };
      },
    },
    {
      label: 'Deceased Only',
      icon: <UserX className="w-3.5 h-3.5" />,
      active: isDead === 'true',
      apply: () => setFilter('isDead', isDead === 'true' ? '' : 'true'),
      isActiveDraft: (draft) => draft.isDead === 'true',
      applyDraft: (draft) => ({ ...draft, isDead: draft.isDead === 'true' ? '' : 'true' }),
    },
    {
      label: 'First-Time (18-25)',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      active: ageGroup === '18-25',
      apply: () => setFilter('ageGroup', ageGroup === '18-25' ? '' : '18-25'),
      isActiveDraft: (draft) => draft.ageGroup === '18-25',
      applyDraft: (draft) => ({ ...draft, ageGroup: draft.ageGroup === '18-25' ? '' : '18-25' }),
    },
  ];
}

// ─── Epic Cell Component with Instant Copy ──────────────────────────────────
const EpicCell: React.FC<{ epicNo?: string; isDead?: boolean }> = ({ epicNo, isDead }) => {

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!epicNo) return;
    try {
      navigator.clipboard?.writeText(epicNo);
    } catch {
      // Ignore clipboard write failures
    }
  };

  if (!epicNo) {
    return <span className="text-slate-400 dark:text-slate-600 font-mono text-xs">—</span>;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div
        onClick={handleCopy}
        className="group/epic inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50/90 hover:bg-indigo-50/80 dark:bg-slate-800/80 dark:hover:bg-indigo-950/50 text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 font-mono text-[10px] font-semibold border border-slate-200/70 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700/80 transition-all cursor-pointer select-all shadow-2xs"
        title="Click to copy EPIC"
      >
        <span className="tracking-wide">{epicNo}</span>
      </div>
      {isDead && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold text-[8.5px] border border-rose-300/80 dark:border-rose-800 uppercase tracking-wider font-mono">
          <AlertTriangle size={8} /> DECEASED
        </span>
      )}
    </div>
  );
};

export function buildVoterTableColumns(): Column<any>[] {
  return [
    {
      key: 'epicNo',
      sortable: true,
      header: 'EPIC No.',
      render: (row: any) => <EpicCell epicNo={row.epicNo} isDead={row.isDead} />,
    },
    {
      key: 'name',
      header: 'Voter Name',
      render: (row: any) => {
        const engName = [row.engFirstName, row.engMiddleName, row.engSurname].filter(Boolean).join(' ') || row.nameEn || '';
        const locName = [row.firstName, row.middleName, row.surname].filter(Boolean).join(' ') || row.fullName || row.name || '';

        return (
          <div className="flex items-center gap-2.5">
            <SafeImage
              src={row.avatar}
              alt={engName || locName}
              fallbackText={engName || locName}
              className="w-8 h-8 rounded-full object-cover border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/80 to-slate-100 dark:from-slate-800 dark:to-indigo-950/40 text-indigo-700 dark:text-indigo-300 shrink-0 text-[10px] font-bold shadow-2xs"
            />
            <div className="flex flex-col min-w-0 justify-center gap-0.5">
              {/* Line 1: English Voter Name at Top */}
              <div
                className="font-semibold text-slate-900 dark:text-slate-100 text-[10.5px] leading-tight truncate max-w-[220px]"
                title={engName || locName || 'Unnamed Voter'}
              >
                {engName || locName || 'Unnamed Voter'}
              </div>

              {/* Line 2: Regional/Local Name below English Name */}
              {locName && locName !== engName && (
                <div
                  className="text-[10px] text-slate-600 dark:text-slate-300 font-medium leading-tight truncate max-w-[220px]"
                  title={locName}
                >
                  {locName}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'relation',
      header: 'Relation',
      render: (row: any) => {
        const guardian = row.guardianName || row.relativeName;
        const relationType = row.relation || row.relationType;

        if (!guardian && !relationType) {
          return <div className="text-slate-400 dark:text-slate-600 font-mono text-[11px]">—</div>;
        }

        const primaryText = guardian || relationType;
        const subText = guardian && relationType ? relationType : null;

        return (
          <div className="flex flex-col min-w-0 justify-center gap-0.5">
            {subText && (
              <div className="text-[10.5px] text-slate-600 dark:text-slate-300 font-medium leading-tight capitalize">
                {subText.toLowerCase()}
              </div>
            )}
            <div
              className="font-medium text-slate-800 dark:text-slate-200 text-[10px] leading-tight truncate max-w-[180px]"
              title={primaryText || ''}
            >
              {primaryText}
            </div>
          </div>
        );
      },
    },
    {
      key: 'mobileNo',
      header: 'Phone No.',
      render: (row: any) => {
        const phone = row.mobileNo || row.mobile || row.mobileNumber;
        if (!phone) {
          return <span className="text-slate-400 dark:text-slate-600 font-mono text-[11px]">—</span>;
        }
        const formatted = formatPhoneNumber(phone);
        return (
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-1.5 font-mono text-[10px] text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium whitespace-nowrap"
          >
            <Phone size={10} className="text-indigo-500/80 shrink-0" />
            <span>{formatted}</span>
          </a>
        );
      },
    },
    {
      key: 'booth',
      sortable: true,
      header: 'Booth / Serial',
      render: (row: any) => {
        const metadataItems = [
          row.serialNo ? `Serial #${row.serialNo}` : null,
          row.sectionNo ? `Sec: ${row.sectionNo}` : null,
        ].filter(Boolean);

        return (
          <div className="flex flex-col text-[10px] space-y-0.5">
            {/* Line 1: Booth Title */}
            <div className="text-slate-900 text-[10.5px] dark:text-slate-100 font-semibold truncate max-w-[200px]" title={row.boothName}>
              {row.boothName || (row.boothNumber ? `Booth #${row.boothNumber}` : 'Unassigned Booth')}
            </div>

            {/* Line 2: Serial · Sec (Clean Monospace Metadata) */}
            {metadataItems.length > 0 && (
              <div className="text-[9.5px] text-slate-600 dark:text-slate-300 font-mono font-medium">
                {metadataItems.join(' · ')}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'party',
      header: 'Party Leaning',
      render: (row: any) => {
        const hasParty = Boolean(row.partyName || row.partyAbbreviation);
        const voterType = row.voterType;

        // Flags if the voterType signifies neutrality/undecided
        const isNeutralOrUndecided =
          voterType === 'Independent / Undecided' ||
          voterType === 'Neutral Voter' ||
          voterType === 'Undecided' ||
          voterType === 'Independent';

        // Do not display conflicting undecided/neutral tag if a specific party is already affiliated
        const showVoterType =
          Boolean(voterType) &&
          voterType !== 'Voter' &&
          (!hasParty || !isNeutralOrUndecided);

        if (!hasParty && !showVoterType) {
          return <span className="text-slate-400 dark:text-slate-600 font-mono text-[11px]">—</span>;
        }

        return (
          <div className="flex flex-col gap-1 items-start text-[10px]">
            {hasParty ? (
              <span
                className="font-semibold text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 text-[9.5px] shadow-2xs"
                title={row.partyName || ''}
              >
                {row.partyAbbreviation || row.partyName}
              </span>
            ) : null}
            {showVoterType && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 shadow-2xs">
                {voterType}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'influencer',
      header: 'Influencer',
      render: (row: any) => {
        const isFamilyInf = row.isFamilyInfluencer || Number(row.familyInfluencedCount) > 0;
        const isSocialInf = row.isSocialInfluencer || Number(row.socialInfluencedCount) > 0;

        if (!isFamilyInf && !isSocialInf) {
          return <span className="text-slate-400 dark:text-slate-600 font-mono text-[11px]">—</span>;
        }

        return (
          <div className="flex flex-col gap-1 items-start text-[10px]">
            {isFamilyInf && (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/70 dark:border-purple-700/60 text-[9.5px] font-semibold shadow-2xs"
                title={
                  Number(row.familyInfluencedCount) > 0
                    ? `Family Influencer for ${row.familyInfluencedCount} voter${row.familyInfluencedCount > 1 ? 's' : ''}`
                    : 'Family Influencer (Head of Household)'
                }
              >
                <Crown size={11} className="shrink-0 text-purple-600 dark:text-purple-400" />
                <span>Family Head</span>
                {Number(row.familyInfluencedCount) > 0 && (
                  <span className="px-1 py-0.2 rounded-xs bg-purple-200/90 dark:bg-purple-900 text-[8.5px] font-bold font-mono text-purple-800 dark:text-purple-200 ml-0.5">
                    {row.familyInfluencedCount}
                  </span>
                )}
              </span>
            )}
            {isSocialInf && (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-700/60 text-[9.5px] font-semibold shadow-2xs"
                title={
                  Number(row.socialInfluencedCount) > 0
                    ? `Social Influencer for ${row.socialInfluencedCount} voter${row.socialInfluencedCount > 1 ? 's' : ''}`
                    : 'Social Influencer (Community Leader)'
                }
              >
                <Sparkles size={11} className="shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Social Leader</span>
                {Number(row.socialInfluencedCount) > 0 && (
                  <span className="px-1 py-0.2 rounded-xs bg-amber-200/90 dark:bg-amber-900 text-[8.5px] font-bold font-mono text-amber-800 dark:text-amber-200 ml-0.5">
                    {row.socialInfluencedCount}
                  </span>
                )}
              </span>
            )}
          </div>
        );
      },
    },
  ];
}
