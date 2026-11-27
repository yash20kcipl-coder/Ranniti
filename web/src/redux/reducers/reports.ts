export interface VoterSyncReportItem {
  id: string;
  voterId: string;
  epicNo: string;
  voterName: string;
  voterEngName: string;
  voterMobile: string | null;
  voterAvatar: string | null;
  gender: string | null;
  age: number | null;
  boothNo: string | null;
  boothName: string | null;
  wardName: string | null;
  acName: string | null;
  volunteerId: string;
  volunteerName: string;
  volunteerMobile: string | null;
  volunteerRole: string;
  volunteerRoleName: string;
  volunteerAvatar: string | null;
  contactName: string | null;
  contactPhone: string | null;
  syncedAt: string;
}

export interface VoterSyncReportState {
  items: VoterSyncReportItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalSyncedPairs: number;
    uniqueVotersSynced: number;
    activeSyncingVolunteers: number;
  };
  loading: boolean;
  error: string | null;
}

export interface VotingReportElection {
  id: string;
  name: string;
  electionCode: string | null;
  electionType: string;
  electionDate: string;
  status: string;
  isDefault: boolean;
  totalVotersSnapshot: number;
  targetVotes: number;
}

export interface VotingReportSummary {
  totalVoters: number;
  votedCount: number;
  notVotedCount: number;
  turnoutPercentage: number;
  maleVotedCount: number;
  femaleVotedCount: number;
  otherVotedCount: number;
  totalBooths: number;
  boothsWithVotes: number;
}

export interface VotingReportBoothItem {
  boothId: string;
  boothNo: string;
  boothName: string;
  wardName: string | null;
  totalVoters: number;
  votedCount: number;
  notVotedCount: number;
  turnoutPercentage: number;
  maleVotedCount: number;
  femaleVotedCount: number;
  otherVotedCount: number;
  lastVotedAt: string | null;
}

export interface VotingReportVoterItem {
  voterId: string;
  epicNo: string;
  voterName: string;
  voterEngName: string;
  voterMobile: string | null;
  voterAvatar: string | null;
  gender: string | null;
  age: number | null;
  boothNo: string | null;
  boothName: string | null;
  wardName: string | null;
  hasVoted: boolean;
  votedAt: string | null;
  markedByName: string | null;
  markedByMobile: string | null;
}

export interface VotingReportState {
  election: VotingReportElection | null;
  summary: VotingReportSummary;
  view: 'booth' | 'voter';
  items: (VotingReportBoothItem | VotingReportVoterItem)[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

export interface VolunteerOutreachVoterItem {
  id: string;
  voterId: string | null;
  epicNo: string | null;
  voterName: string | null;
  voterEngName: string | null;
  voterMobile: string | null;
  voterAvatar: string | null;
  gender: string | null;
  age: number | null;
  boothNo: string | null;
  boothName: string | null;
  wardName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  activityAt: string;
}

export interface VolunteerOutreachVotersState {
  items: VolunteerOutreachVoterItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

export interface VotingBoothVotersState {
  items: VotingReportVoterItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

export interface ReportsState {
  voterSync: VoterSyncReportState;
  voting: VotingReportState;
  outreachVoters: VolunteerOutreachVotersState;
  votingBoothVoters: VotingBoothVotersState;
}

const initialState: ReportsState = {
  voterSync: {
    items: [],
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
    summary: {
      totalSyncedPairs: 0,
      uniqueVotersSynced: 0,
      activeSyncingVolunteers: 0,
    },
    loading: false,
    error: null,
  },
  voting: {
    election: null,
    summary: {
      totalVoters: 0,
      votedCount: 0,
      notVotedCount: 0,
      turnoutPercentage: 0,
      maleVotedCount: 0,
      femaleVotedCount: 0,
      otherVotedCount: 0,
      totalBooths: 0,
      boothsWithVotes: 0,
    },
    view: 'booth',
    items: [],
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
    loading: false,
    error: null,
  },
  outreachVoters: {
    items: [],
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
    loading: false,
    error: null,
  },
  votingBoothVoters: {
    items: [],
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
    loading: false,
    error: null,
  },
};

export const SET_VOTER_SYNC_REPORT_LOADING = 'SET_VOTER_SYNC_REPORT_LOADING';
export const SET_VOTER_SYNC_REPORT_DATA = 'SET_VOTER_SYNC_REPORT_DATA';
export const SET_VOTER_SYNC_REPORT_ERROR = 'SET_VOTER_SYNC_REPORT_ERROR';

export const SET_VOTING_REPORT_LOADING = 'SET_VOTING_REPORT_LOADING';
export const SET_VOTING_REPORT_DATA = 'SET_VOTING_REPORT_DATA';
export const SET_VOTING_REPORT_ERROR = 'SET_VOTING_REPORT_ERROR';

export const SET_OUTREACH_VOTERS_LOADING = 'SET_OUTREACH_VOTERS_LOADING';
export const SET_OUTREACH_VOTERS_DATA = 'SET_OUTREACH_VOTERS_DATA';
export const SET_OUTREACH_VOTERS_ERROR = 'SET_OUTREACH_VOTERS_ERROR';

export const SET_VOTING_BOOTH_VOTERS_LOADING = 'SET_VOTING_BOOTH_VOTERS_LOADING';
export const SET_VOTING_BOOTH_VOTERS_DATA = 'SET_VOTING_BOOTH_VOTERS_DATA';
export const SET_VOTING_BOOTH_VOTERS_ERROR = 'SET_VOTING_BOOTH_VOTERS_ERROR';

export default function reportsReducer(state = initialState, action: any): ReportsState {
  switch (action.type) {
    case SET_VOTER_SYNC_REPORT_LOADING:
      return {
        ...state,
        voterSync: { ...state.voterSync, loading: action.payload },
      };
    case SET_VOTER_SYNC_REPORT_DATA:
      return {
        ...state,
        voterSync: {
          ...state.voterSync,
          ...action.payload,
          loading: false,
          error: null,
        },
      };
    case SET_VOTER_SYNC_REPORT_ERROR:
      return {
        ...state,
        voterSync: { ...state.voterSync, loading: false, error: action.payload },
      };
    case SET_VOTING_REPORT_LOADING:
      return {
        ...state,
        voting: { ...state.voting, loading: action.payload },
      };
    case SET_VOTING_REPORT_DATA:
      return {
        ...state,
        voting: {
          ...state.voting,
          ...action.payload,
          loading: false,
          error: null,
        },
      };
    case SET_VOTING_REPORT_ERROR:
      return {
        ...state,
        voting: { ...state.voting, loading: false, error: action.payload },
      };
    case SET_OUTREACH_VOTERS_LOADING:
      return {
        ...state,
        outreachVoters: { ...state.outreachVoters, loading: action.payload },
      };
    case SET_OUTREACH_VOTERS_DATA:
      return {
        ...state,
        outreachVoters: {
          ...state.outreachVoters,
          ...action.payload,
          loading: false,
          error: null,
        },
      };
    case SET_OUTREACH_VOTERS_ERROR:
      return {
        ...state,
        outreachVoters: { ...state.outreachVoters, loading: false, error: action.payload },
      };
    case SET_VOTING_BOOTH_VOTERS_LOADING:
      return {
        ...state,
        votingBoothVoters: { ...state.votingBoothVoters, loading: action.payload },
      };
    case SET_VOTING_BOOTH_VOTERS_DATA:
      return {
        ...state,
        votingBoothVoters: {
          ...state.votingBoothVoters,
          ...action.payload,
          loading: false,
          error: null,
        },
      };
    case SET_VOTING_BOOTH_VOTERS_ERROR:
      return {
        ...state,
        votingBoothVoters: { ...state.votingBoothVoters, loading: false, error: action.payload },
      };
    default:
      return state;
  }
}
