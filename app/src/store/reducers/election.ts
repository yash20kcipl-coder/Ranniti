import {
  MobilePollingVoter,
  MobileTurnoutSummary,
  MobilePollingVotersResponse,
} from '../actions/mobileElection';

export const SET_ELECTION_LOADING = 'SET_ELECTION_LOADING';
export const SET_ELECTION_LOADING_MORE = 'SET_ELECTION_LOADING_MORE';
export const SET_ELECTION_DATA = 'SET_ELECTION_DATA';
export const APPEND_ELECTION_VOTERS = 'APPEND_ELECTION_VOTERS';
export const UPDATE_POLLING_VOTER_STATUS = 'UPDATE_POLLING_VOTER_STATUS';
export const SET_ELECTION_FILTERS = 'SET_ELECTION_FILTERS';
export const RESET_ELECTION_FILTERS = 'RESET_ELECTION_FILTERS';
export const ENQUEUE_OFFLINE_VOTE = 'ENQUEUE_OFFLINE_VOTE';
export const REMOVE_OFFLINE_VOTES = 'REMOVE_OFFLINE_VOTES';
export const SET_HOURLY_TURNOUT_DATA = 'SET_HOURLY_TURNOUT_DATA';

export interface OfflineVoteQueueItem {
  voterId: string;
  boothId?: string;
  hasVoted: boolean;
  votedAt?: string;
}

export interface ElectionFilters {
  search: string;
  serialNo: number | null;
  hasVoted: 'all' | 'voted' | 'not_voted';
  page: number;
  limit: number;
}

export interface ElectionState {
  election: MobilePollingVotersResponse['election'];
  booth: MobilePollingVotersResponse['booth'];
  turnoutSummary: MobileTurnoutSummary;
  voters: MobilePollingVoter[];
  pagination: MobilePollingVotersResponse['pagination'];
  loading: boolean;
  loadingMore: boolean;
  filters: ElectionFilters;
  offlineQueue: OfflineVoteQueueItem[];
  hourlyTurnout: {
    hourlySurge?: Array<{ hour: string; count: number; percentage: number }>;
    summary?: Record<string, any>;
  } | null;
}

const initialFilters: ElectionFilters = {
  search: '',
  serialNo: null,
  hasVoted: 'all',
  page: 1,
  limit: 50,
};

const initialSummary: MobileTurnoutSummary = {
  totalVoters: 0,
  votedCount: 0,
  pendingCount: 0,
  turnoutPercentage: 0,
  votedMale: 0,
  votedFemale: 0,
  votedOther: 0,
};

const initialState: ElectionState = {
  election: null,
  booth: null,
  turnoutSummary: initialSummary,
  voters: [],
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  },
  loading: false,
  loadingMore: false,
  filters: initialFilters,
  offlineQueue: [],
  hourlyTurnout: null,
};

export const electionReducer = (state = initialState, action: any): ElectionState => {
  switch (action.type) {
    case SET_ELECTION_LOADING:
      return { ...state, loading: action.payload };

    case SET_ELECTION_LOADING_MORE:
      return { ...state, loadingMore: action.payload };

    case SET_ELECTION_DATA:
      return {
        ...state,
        election: action.payload.election || state.election,
        booth: action.payload.booth || state.booth,
        turnoutSummary: action.payload.turnoutSummary || state.turnoutSummary,
        voters: action.payload.voters || [],
        pagination: action.payload.pagination || state.pagination,
        loading: false,
      };

    case APPEND_ELECTION_VOTERS:
      return {
        ...state,
        voters: [...state.voters, ...(action.payload.voters || [])],
        pagination: action.payload.pagination || state.pagination,
        loadingMore: false,
      };

    case UPDATE_POLLING_VOTER_STATUS: {
      const { voterId, hasVoted, votedAt } = action.payload;
      let prevHasVoted = false;

      const updatedVoters = state.voters.map((v) => {
        if (v.id === voterId) {
          prevHasVoted = v.hasVoted;
          return {
            ...v,
            hasVoted: hasVoted !== undefined ? hasVoted : v.hasVoted,
            votedAt: hasVoted ? (votedAt || new Date().toISOString()) : null,
          };
        }
        return v;
      });

      // Optimistically update turnoutSummary numbers
      const deltaVoted = hasVoted !== undefined ? (hasVoted ? (prevHasVoted ? 0 : 1) : (prevHasVoted ? -1 : 0)) : 0;

      const newVotedCount = Math.max(0, state.turnoutSummary.votedCount + deltaVoted);
      const newPendingCount = Math.max(0, state.turnoutSummary.totalVoters - newVotedCount);
      const newPct = state.turnoutSummary.totalVoters > 0
        ? Math.round((newVotedCount / state.turnoutSummary.totalVoters) * 1000) / 10
        : 0;

      return {
        ...state,
        voters: updatedVoters,
        turnoutSummary: {
          ...state.turnoutSummary,
          votedCount: newVotedCount,
          pendingCount: newPendingCount,
          turnoutPercentage: newPct,
        },
      };
    }

    case SET_ELECTION_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case RESET_ELECTION_FILTERS:
      return {
        ...state,
        filters: { ...initialFilters },
      };

    case ENQUEUE_OFFLINE_VOTE:
      return {
        ...state,
        offlineQueue: [...state.offlineQueue, action.payload],
      };

    case REMOVE_OFFLINE_VOTES: {
      const syncedIds = new Set((action.payload as OfflineVoteQueueItem[]).map((i) => i.voterId));
      return {
        ...state,
        offlineQueue: state.offlineQueue.filter((item) => !syncedIds.has(item.voterId)),
      };
    }

    case SET_HOURLY_TURNOUT_DATA:
      return {
        ...state,
        hourlyTurnout: action.payload,
      };

    default:
      return state;
  }
};

export default electionReducer;
