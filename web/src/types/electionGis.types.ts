export type GeoLevel = 'india' | 'state' | 'pc' | 'ac' | 'booth';

export type ElectionType = 'LS' | 'VS'; // Lok Sabha (Parliamentary) or Vidhan Sabha (Assembly)

export type HeatmapMetric =
  | 'winning_party'
  | 'vote_share'
  | 'turnout'
  | 'margin'
  | 'total_votes'
  | 'nota_votes'
  | 'leading_party'
  | 'custom_metric';

export interface PartyInfo {
  name: string;
  abbreviation: string;
  color: string;
  alliance?: string;
  symbolLogo?: string;
}

export interface CandidatePerformance {
  candidateName: string;
  party: string;
  partyColor: string;
  votes: number;
  voteShare: number;
  isWinner: boolean;
}

export interface ElectionRecord {
  id: string;
  stateCode: string;
  stateName: string;
  pcCode: number | string;
  pcName: string;
  acCode?: number | string;
  acName?: string;
  boothCode?: number | string;
  boothName?: string;
  winningParty: string;
  winningCandidate: string;
  runnerUpParty?: string;
  runnerUpCandidate?: string;
  totalVotes: number;
  validVotes: number;
  notaVotes: number;
  notaPercentage: number;
  turnoutPercentage: number;
  marginVotes: number;
  marginPercentage: number;
  voteSharePercentage: number;
  leadingParty?: string;
  customMetric?: number;
  electionYear: number;
  electionType: ElectionType;
  totalElectors?: number;
  totalBooths?: number;
  candidates?: CandidatePerformance[];
}

export interface PollingBoothRecord {
  id: string;
  boothNumber: number;
  boothName: string;
  buildingName: string;
  wardName?: string;
  lat: number;
  lng: number;
  acCode: number;
  acName: string;
  pcName: string;
  stateName: string;
  totalVoters: number;
  maleVoters: number;
  femaleVoters: number;
  turnoutPercentage: number;
  winningParty: string;
  winningCandidate: string;
  marginPercentage: number;
  dominantCaste?: string;
  sentiment?: 'stronghold' | 'leaning' | 'swing' | 'weak';
}

export interface ConstituencyHierarchyState {
  level: GeoLevel;
  selectedState: string | null;
  selectedPc: string | null;
  selectedPcCode: number | null;
  selectedAc: string | null;
  selectedAcCode: number | null;
  selectedBooth: string | null;
  hoveredFeature: {
    level: GeoLevel;
    name: string;
    state?: string;
    code?: number | string;
    properties?: any;
    x: number;
    y: number;
  } | null;
}

export interface ColumnMappingDefinition {
  sourceColumn: string;
  targetField: string;
  confidence: number;
}

export interface UploadValidationResult {
  fileName: string;
  fileSize: number;
  fileType: 'csv' | 'xlsx' | 'xls' | 'geojson';
  totalRows: number;
  validRows: number;
  missingColumns: string[];
  duplicateCount: number;
  matchedConstituencies: number;
  unmatchedRecords: Array<{
    rowNumber: number;
    pcName?: string;
    acName?: string;
    state?: string;
    reason: string;
  }>;
  previewRows: Array<Record<string, any>>;
  detectedMappings: Record<string, string>;
  parsedData: ElectionRecord[];
}

export interface HistoricalYearTrend {
  year: number;
  turnout: number;
  winningParty: string;
  winningCandidate: string;
  marginPercentage: number;
  bjpVoteShare: number;
  incVoteShare: number;
  regionalVoteShare: number;
  totalVotes: number;
}

export interface FilterState {
  electionType: ElectionType;
  electionYear: number;
  state: string;
  pc: string;
  ac: string;
  party: string;
  metric: HeatmapMetric;
  searchQuery: string;
}
