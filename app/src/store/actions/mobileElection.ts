import { Dispatch } from 'redux';
import toast from '../../utils/toast';
import apiClient from '../../api/apiClient';

export interface MobilePollingVoter {
  id: string;
  serialNo: number | null;
  epicNo: string;
  name: string;
  engName: string;
  age: number | null;
  gender: string | null;
  houseNo: string | null;
  sectionNo: number | null;
  mobileNo: string | null;
  hasVoted: boolean;
  votedAt: string | null;
}

export interface MobileTurnoutSummary {
  totalVoters: number;
  votedCount: number;
  pendingCount: number;
  turnoutPercentage: number;
  votedMale: number;
  votedFemale: number;
  votedOther: number;
}

export interface MobilePollingVotersResponse {
  election: {
    id: string;
    name: string;
    electionDate: string;
    status: string;
  } | null;
  booth: {
    id: string;
    boothNumber: number | null;
    name: string;
    wardNumber?: number | null;
    wardName?: string | null;
    acName?: string | null;
  } | null;
  turnoutSummary: MobileTurnoutSummary;
  voters: MobilePollingVoter[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

import {
  SET_ELECTION_LOADING,
  SET_ELECTION_LOADING_MORE,
  SET_ELECTION_DATA,
  APPEND_ELECTION_VOTERS,
  UPDATE_POLLING_VOTER_STATUS,
  SET_ELECTION_FILTERS,
  RESET_ELECTION_FILTERS,
  ENQUEUE_OFFLINE_VOTE,
  REMOVE_OFFLINE_VOTES,
  SET_HOURLY_TURNOUT_DATA,
  ElectionFilters,
} from '../reducers/election';
import { INCREMENT_DASHBOARD_VOTE, DECREMENT_DASHBOARD_VOTE } from '../reducers/dashboard';

/**
 * Fetch booth-scoped polling voters with turnout summary
 */
export const fetchMobilePollingVotersAction = (
  params: {
    boothId?: string;
    electionId?: string;
    search?: string;
    serialNo?: number | null;
    hasVoted?: 'all' | 'voted' | 'not_voted';
    page?: number;
    limit?: number;
  },
  isAppend = false
) => {
  return async (dispatch: Dispatch): Promise<MobilePollingVotersResponse | null> => {
    try {
      if (!isAppend) {
        dispatch({ type: SET_ELECTION_LOADING, payload: true });
      } else {
        dispatch({ type: SET_ELECTION_LOADING_MORE, payload: true });
      }

      // Clean undefined and null query params
      const cleanParams: Record<string, any> = {};
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          cleanParams[k] = v;
        }
      });

      const res = await apiClient.get('/mobile/election/voters', { params: cleanParams });
      const data: MobilePollingVotersResponse = res.data?.data || null;

      if (data) {
        if (isAppend) {
          dispatch({ type: APPEND_ELECTION_VOTERS, payload: data });
        } else {
          dispatch({ type: SET_ELECTION_DATA, payload: data });
        }
      } else {
        if (!isAppend) dispatch({ type: SET_ELECTION_LOADING, payload: false });
        else dispatch({ type: SET_ELECTION_LOADING_MORE, payload: false });
      }

      return data;
    } catch (err: any) {
      console.error('Fetch polling voters error:', err);
      dispatch({ type: SET_ELECTION_LOADING, payload: false });
      dispatch({ type: SET_ELECTION_LOADING_MORE, payload: false });
      toast.error(err?.response?.data?.message || 'Failed to load polling voters');
      return null;
    }
  };
};

/**
 * Single-tap mark voter voted/unvoted with optimistic update & offline fallback
 */
export const markMobileVoterVotedAction = (payload: {
  voterId: string;
  hasVoted: boolean;
  boothId?: string;
  electionId?: string;
}) => {
  return async (dispatch: Dispatch) => {
    // 1. Optimistic dispatch immediately to UI
    dispatch({
      type: UPDATE_POLLING_VOTER_STATUS,
      payload: {
        voterId: payload.voterId,
        hasVoted: payload.hasVoted,
        votedAt: payload.hasVoted ? new Date().toISOString() : null,
      },
    });
    dispatch({
      type: payload.hasVoted ? INCREMENT_DASHBOARD_VOTE : DECREMENT_DASHBOARD_VOTE,
    });

    try {
      const res = await apiClient.post('/mobile/election/mark-voted', payload);
      // Removed from offline queue if present
      dispatch({
        type: REMOVE_OFFLINE_VOTES,
        payload: [{ voterId: payload.voterId }],
      });
      return res.data?.data || null;
    } catch (err: any) {
      console.warn('Network offline or error marking vote, enqueuing for batch sync:', err?.message);
      // 2. Enqueue offline for automatic background sync
      dispatch({
        type: ENQUEUE_OFFLINE_VOTE,
        payload: {
          voterId: payload.voterId,
          boothId: payload.boothId,
          hasVoted: payload.hasVoted,
          votedAt: new Date().toISOString(),
        },
      });
      toast.info('Saved locally. Will sync when online.');
      return null;
    }
  };
};

/**
 * Batch sync offline queued turnouts
 */
export const syncOfflineVotesAction = (electionId?: string) => {
  return async (dispatch: Dispatch, getState: () => any) => {
    const state = getState();
    const offlineQueue = state?.election?.offlineQueue || [];

    if (!offlineQueue.length) {
      return { syncedCount: 0 };
    }

    try {
      const payload = {
        electionId,
        items: offlineQueue,
      };
      const res = await apiClient.post('/mobile/election/batch-sync', payload);
      const data = res.data?.data;
      dispatch({
        type: REMOVE_OFFLINE_VOTES,
        payload: offlineQueue,
      });
      toast.success(`${data?.syncedCount || offlineQueue.length} offline votes synced!`);
      return data;
    } catch (err: any) {
      console.error('Batch sync votes error:', err);
      toast.error('Failed to sync offline votes. Will retry later.');
      throw err;
    }
  };
};

/**
 * Set election filters
 */
export const setElectionFiltersAction = (filters: Partial<ElectionFilters>) => {
  return {
    type: SET_ELECTION_FILTERS,
    payload: filters,
  };
};

export const resetElectionFiltersAction = () => {
  return {
    type: RESET_ELECTION_FILTERS,
  };
};

/**
 * Batch sync offline queued turnouts
 */
export const batchSyncMobileVotesAction = (payload: {
  electionId?: string;
  items: Array<{
    voterId: string;
    boothId?: string;
    hasVoted: boolean;
    votedAt?: string;
  }>;
}) => {
  return async (dispatch: Dispatch) => {
    try {
      const res = await apiClient.post('/mobile/election/batch-sync', payload);
      toast.success('Offline voter turnout synced successfully');
      dispatch({
        type: REMOVE_OFFLINE_VOTES,
        payload: payload.items,
      });
      return res.data?.data || null;
    } catch (err: any) {
      console.error('Batch sync votes error:', err);
      toast.error(err?.response?.data?.message || 'Failed to sync offline turnout');
      throw err;
    }
  };
};

/**
 * Fetch booth turnout and hourly surge for mobile war room analytics
 */
export const fetchMobileBoothTurnoutAction = (electionId: string, boothId: string) => {
  return async (dispatch: Dispatch) => {
    try {
      const res = await apiClient.get('/mobile/election/booth-turnout', {
        params: { electionId, boothId },
      });
      const data = res.data?.data || null;
      if (data) {
        dispatch({ type: SET_HOURLY_TURNOUT_DATA, payload: data });
      }
      return data;
    } catch (err: any) {
      console.error('Fetch booth turnout error:', err);
      return null;
    }
  };
};

export interface WhatsAppButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | string;
  text: string;
  url?: string;
  phoneNumber?: string;
}

export interface MobileWhatsAppTemplate {
  id: string;
  metaTemplateId: string | null;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION' | string;
  language: 'hi' | 'en' | string;
  headerType: 'NONE' | 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO' | string;
  headerContent: string | null;
  bodyText: string;
  footerText: string | null;
  buttons?: WhatsAppButton[];
  variables?: string[];
  metaStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DRAFT' | string;
}

export interface MobileWhatsAppTemplatesData {
  templates: MobileWhatsAppTemplate[];
  election: { id: string | null; name: string | null; electionDate: string | null };
  campaign: { candidateName: string | null; partyName: string | null };
}

/**
 * Fetch approved WhatsApp message templates with election and campaign context
 */
export const fetchMobileWhatsAppTemplatesAction = () => {
  return async (_dispatch: Dispatch): Promise<MobileWhatsAppTemplatesData | null> => {
    try {
      const res = await apiClient.get('/mobile/election/whatsapp-templates');
      return res.data?.data || null;
    } catch (err: any) {
      console.error('Fetch mobile whatsapp templates error:', err);
      return null;
    }
  };
};

