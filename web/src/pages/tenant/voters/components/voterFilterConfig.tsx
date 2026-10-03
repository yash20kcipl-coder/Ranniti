import {
  MapPin,
  Users,
  Vote,
  Crown,
  Sparkles,
  Star,
  UserX,
  AlertTriangle,
  Mars,
  Venus,
  User,
} from 'lucide-react';
import {
  GENDER_OPTIONS,
  AGE_GROUP_OPTIONS,
  STATUS_OPTIONS,
  IS_DEAD_OPTIONS,
  VOTER_TYPE_OPTIONS,
} from '@/constants/dropdownOptions';
import { SafeImage } from '@/components/common/SafeImage';
import type { Column } from '@/components/common/DataTable';
import type { FilterField, FilterPreset, Option } from '@/components/common/FilterBar';

export interface VoterFilterState {
  stateId: string;
  setStateId: (val: string) => void;
  districtId: string;
  setDistrictId: (val: string) => void;
  pcId: string;
  setPcId: (val: string) => void;
  acId: string;
  setAcId: (val: string) => void;
  boothId: string;
  setBoothId: (val: string) => void;
  gender: string;
  setGender: (val: string) => void;
  ageGroup: string;
  setAgeGroup: (val: string) => void;
  religionId: string;
  setReligionId: (val: string) => void;
  casteId: string;
  setCasteId: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
  isDead: string;
  setIsDead: (val: string) => void;
  voterType: string;
  setVoterType: (val: string) => void;
  partyId: string;
  setPartyId: (val: string) => void;
  familyInfluencerId: string;
  setFamilyInfluencerId: (val: string) => void;
  socialInfluencerId: string;
  setSocialInfluencerId: (val: string) => void;
  isFamilyInfluencer: string;
  setIsFamilyInfluencer: (val: string) => void;
  isSocialInfluencer: string;
  setIsSocialInfluencer: (val: string) => void;
  influencerRole: string;
  setInfluencerRole: (val: string) => void;
  influencerStatus: string;
  setInfluencerStatus: (val: string) => void;
}

export interface VoterFilterMasterData {
  states?: any[];
  districts?: any[];
  pcs?: any[];
  acs?: any[];
  booths?: any[];
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

export function buildVoterFilterFields(
  state: VoterFilterState,
  masters: VoterFilterMasterData
): FilterField[] {
  const { stateOptions, religionOptions, casteOptions, partyOptions } = getVoterMasterOptions(masters);
  const {
    states = [],
    districts = [],
    pcs = [],
    acs = [],
    booths = [],
    familyInfluencers = [],
    socialInfluencers = [],
  } = masters;

  const {
    stateId,
    setStateId,
    districtId,
    setDistrictId,
    pcId,
    setPcId,
    acId,
    setAcId,
    boothId,
    setBoothId,
    gender,
    setGender,
    ageGroup,
    setAgeGroup,
    religionId,
    setReligionId,
    casteId,
    setCasteId,
    status,
    setStatus,
    isDead,
    setIsDead,
    voterType,
    setVoterType,
    partyId,
    setPartyId,
    familyInfluencerId,
    setFamilyInfluencerId,
    socialInfluencerId,
    setSocialInfluencerId,
    setIsFamilyInfluencer,
    setIsSocialInfluencer,
    influencerRole,
    setInfluencerRole,
    influencerStatus,
    setInfluencerStatus,
  } = state;

  return [
    // --- Location & Booth Category ---
    {
      key: 'stateId',
      label: 'State',
      category: 'Location & Booth',
      categoryIcon: <MapPin className="w-4 h-4" />,
      gridSpan: 1,
      value: stateId,
      onChange: (val: string) => {
        setStateId(val);
        setDistrictId('');
        setPcId('');
        setAcId('');
        setBoothId('');
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
        setDistrictId(val);
        setPcId('');
        setAcId('');
        setBoothId('');
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
        setPcId(val);
        setAcId('');
        setBoothId('');
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
    },
    {
      key: 'acId',
      label: 'Assembly Constituency (AC)',
      category: 'Location & Booth',
      categoryIcon: <MapPin className="w-4 h-4" />,
      gridSpan: 1,
      value: acId,
      onChange: (val: string) => {
        setAcId(val);
        setBoothId('');
      },
      options: (draft: Record<string, any>) => {
        const curPc = draft.pcId !== undefined ? draft.pcId : pcId;
        const curDistrict = draft.districtId !== undefined ? draft.districtId : districtId;
        return [
          { label: 'All ACs', value: '' },
          ...acs
            .filter(
              (a: any) =>
                (!curPc || String(a.pcId) === curPc) &&
                (!curDistrict || String(a.districtId) === curDistrict)
            )
            .map((a: any) => ({ label: a.name || a.acName, value: String(a.id) })),
        ];
      },
      isPrimary: true,
    },
    {
      key: 'boothId',
      label: 'Polling Booth',
      category: 'Location & Booth',
      categoryIcon: <MapPin className="w-4 h-4" />,
      gridSpan: 2,
      value: boothId,
      onChange: setBoothId,
      options: (draft: Record<string, any>) => {
        const curAc = draft.acId !== undefined ? draft.acId : acId;
        const curPc = draft.pcId !== undefined ? draft.pcId : pcId;
        const filtered = booths.filter(
          (b: any) =>
            (!curAc || String(b.acId) === curAc) &&
            (!curPc || String(b.pcId) === curPc)
        );
        return [
          { label: curAc ? 'All Booths in AC' : curPc ? 'All Booths in PC' : 'All Polling Booths', value: '' },
          ...filtered.map((b: any) => ({
            label: `${b.boothNumber ? `Booth #${b.boothNumber} - ` : ''}${b.name}`,
            value: String(b.id),
          })),
        ];
      },
      isPrimary: true,
    },

    // --- Demographics Category ---
    {
      key: 'gender',
      label: 'Gender',
      category: 'Demographics',
      categoryIcon: <Users className="w-4 h-4" />,
      type: 'pills',
      gridSpan: 2,
      value: gender,
      onChange: setGender,
      options: GENDER_OPTIONS,
      isPrimary: true,
    },
    {
      key: 'ageGroup',
      label: 'Age Group Range',
      category: 'Demographics',
      categoryIcon: <Users className="w-4 h-4" />,
      gridSpan: 1,
      value: ageGroup,
      onChange: setAgeGroup,
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
      onChange: setReligionId,
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
      onChange: setCasteId,
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
      onChange: setStatus,
      options: STATUS_OPTIONS,
      isPrimary: true,
    },
    {
      key: 'isDead',
      label: 'Deceased Filter',
      category: 'Political & Status',
      categoryIcon: <Vote className="w-4 h-4" />,
      type: 'pills',
      gridSpan: 2,
      value: isDead,
      onChange: setIsDead,
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
      onChange: setVoterType,
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
      onChange: setPartyId,
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
      onChange: setFamilyInfluencerId,
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
      onChange: setSocialInfluencerId,
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
        setInfluencerRole(val);
        if (val === 'family') {
          setIsFamilyInfluencer('true');
          setIsSocialInfluencer('');
        } else if (val === 'social') {
          setIsFamilyInfluencer('');
          setIsSocialInfluencer('true');
        } else if (val === 'any') {
          setIsFamilyInfluencer('true');
          setIsSocialInfluencer('true');
        } else {
          setIsFamilyInfluencer('');
          setIsSocialInfluencer('');
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
      onChange: setInfluencerStatus,
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
  const {
    gender,
    setGender,
    influencerRole,
    setInfluencerRole,
    isFamilyInfluencer,
    setIsFamilyInfluencer,
    isSocialInfluencer,
    setIsSocialInfluencer,
    isDead,
    setIsDead,
    ageGroup,
    setAgeGroup,
  } = state;

  return [
    {
      label: 'Male Voters',
      icon: <Users className="w-3.5 h-3.5" />,
      active: gender === 'Male',
      apply: () => setGender(gender === 'Male' ? '' : 'Male'),
      isActiveDraft: (draft) => draft.gender === 'Male',
      applyDraft: (draft) => ({ ...draft, gender: draft.gender === 'Male' ? '' : 'Male' }),
    },
    {
      label: 'Female Voters',
      icon: <Users className="w-3.5 h-3.5" />,
      active: gender === 'Female',
      apply: () => setGender(gender === 'Female' ? '' : 'Female'),
      isActiveDraft: (draft) => draft.gender === 'Female',
      applyDraft: (draft) => ({ ...draft, gender: draft.gender === 'Female' ? '' : 'Female' }),
    },
    {
      label: 'Family Influencers',
      icon: <Crown className="w-3.5 h-3.5 text-purple-400" />,
      active: influencerRole === 'family' || isFamilyInfluencer === 'true',
      apply: () => {
        const next = influencerRole === 'family' || isFamilyInfluencer === 'true' ? '' : 'family';
        setInfluencerRole(next);
        setIsFamilyInfluencer(next ? 'true' : '');
        setIsSocialInfluencer('');
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
        setInfluencerRole(next);
        setIsFamilyInfluencer('');
        setIsSocialInfluencer(next ? 'true' : '');
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
      apply: () => setIsDead(isDead === 'true' ? '' : 'true'),
      isActiveDraft: (draft) => draft.isDead === 'true',
      applyDraft: (draft) => ({ ...draft, isDead: draft.isDead === 'true' ? '' : 'true' }),
    },
    {
      label: 'First-Time (18-25)',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      active: ageGroup === '18-25',
      apply: () => setAgeGroup(ageGroup === '18-25' ? '' : '18-25'),
      isActiveDraft: (draft) => draft.ageGroup === '18-25',
      applyDraft: (draft) => ({ ...draft, ageGroup: draft.ageGroup === '18-25' ? '' : '18-25' }),
    },
  ];
}

export function buildVoterTableColumns(): Column<any>[] {
  return [
    {
      key: 'epicNo',
      header: 'EPIC No.',
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col items-start gap-1">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-mono text-xs font-semibold border border-indigo-200 dark:border-indigo-500/20">
            {row.epicNo}
          </span>
          {row.isDead && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-[10px] border border-rose-200 dark:border-rose-500/30">
              <AlertTriangle size={10} /> DECEASED
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Voter Name & Photo',
      render: (row: any) => {
        const engName = [row.engFirstName, row.engMiddleName, row.engSurname].filter(Boolean).join(' ');
        const locName = [row.firstName, row.middleName, row.surname].filter(Boolean).join(' ');
        const g = (row.gender || '').toLowerCase();
        const isMale = g === 'male' || g === 'm';
        const isFemale = g === 'female' || g === 'f';

        return (
          <div className="flex items-center gap-3">
            <SafeImage
              src={row.avatar}
              alt={engName}
              fallbackText={engName}
              className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shrink-0"
            />
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {engName || locName || 'Unnamed Voter'}
                </span>
                {(row.gender || row.age) && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {isMale ? (
                      <Mars size={13} className="text-blue-500 shrink-0" />
                    ) : isFemale ? (
                      <Venus size={13} className="text-pink-500 shrink-0" />
                    ) : (
                      <User size={13} className="text-slate-400 shrink-0" />
                    )}
                    {row.age && <span>({row.age} yrs)</span>}
                  </span>
                )}
              </div>
              {locName && engName !== locName && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">{locName}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'booth',
      header: 'Booth / Serial / House',
      render: (row: any) => (
        <div className="flex flex-col text-xs space-y-0.5">
          <span className="text-slate-800 dark:text-slate-200 font-medium">{row.boothName || 'Unassigned'}</span>
          <span className="text-slate-500 dark:text-slate-400">
            {row.serialNo ? `Serial: #${row.serialNo}` : ''} {row.houseNo ? `| House: ${row.houseNo}` : ''}
          </span>
          {row.familyId && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                {row.familyId}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'party',
      header: 'Party',
      render: (row: any) => (
        <div className="flex items-center gap-2 text-xs">
          {row.partyName || row.partyAbbreviation ? (
            <span
              className="font-semibold text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              title={row.partyName || ''}
            >
              {row.partyAbbreviation || row.partyName}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 italic">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'influencer',
      header: 'Influencer',
      render: (row: any) => {
        const isFamilyInf = row.isFamilyInfluencer || Number(row.familyInfluencedCount) > 0;
        const isSocialInf = row.isSocialInfluencer || Number(row.socialInfluencedCount) > 0;

        if (!isFamilyInf && !isSocialInf) {
          return <span className="text-slate-400 dark:text-slate-500 italic text-xs">-</span>;
        }

        return (
          <div className="flex flex-col gap-1 items-start">
            {isFamilyInf && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 text-[10px] font-semibold"
                title={
                  Number(row.familyInfluencedCount) > 0
                    ? `Family Influencer for ${row.familyInfluencedCount} voter${row.familyInfluencedCount > 1 ? 's' : ''}`
                    : 'Family Influencer (Head of Household)'
                }
              >
                <Crown size={11} className="shrink-0 text-purple-600 dark:text-purple-400" />
                <span>Family</span>
                {Number(row.familyInfluencedCount) > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-500/25 text-[9px] font-bold ml-0.5">
                    {row.familyInfluencedCount}
                  </span>
                )}
              </span>
            )}
            {isSocialInf && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 text-[10px] font-semibold"
                title={
                  Number(row.socialInfluencedCount) > 0
                    ? `Social Influencer for ${row.socialInfluencedCount} voter${row.socialInfluencedCount > 1 ? 's' : ''}`
                    : 'Social Influencer (Community Leader)'
                }
              >
                <Sparkles size={11} className="shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Social</span>
                {Number(row.socialInfluencedCount) > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-500/25 text-[9px] font-bold ml-0.5">
                    {row.socialInfluencedCount}
                  </span>
                )}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => {
        const st = (row.status || 'ACTIVE').toUpperCase();
        const badgeColor =
          st === 'ACTIVE'
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
            : st === 'SHIFTED'
              ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
              : st === 'UNVERIFIED'
                ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20'
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';

        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold border ${badgeColor}`}>
            {st}
          </span>
        );
      },
    },
  ];
}
