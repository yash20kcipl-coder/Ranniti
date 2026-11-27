import api from '@/services/api';
import { errorHandler } from '../apiUtils';
import type { AppDispatch } from '../store';
import {
  SET_VOTER_SYNC_REPORT_LOADING,
  SET_VOTER_SYNC_REPORT_DATA,
  SET_VOTER_SYNC_REPORT_ERROR,
  SET_VOTING_REPORT_LOADING,
  SET_VOTING_REPORT_DATA,
  SET_VOTING_REPORT_ERROR,
  SET_OUTREACH_VOTERS_LOADING,
  SET_OUTREACH_VOTERS_DATA,
  SET_OUTREACH_VOTERS_ERROR,
  SET_VOTING_BOOTH_VOTERS_LOADING,
  SET_VOTING_BOOTH_VOTERS_DATA,
  SET_VOTING_BOOTH_VOTERS_ERROR,
} from '../reducers/reports';

export interface VoterSyncReportFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  boothId?: string;
  startDate?: string;
  endDate?: string;
}

export interface VotingReportFilters {
  electionId?: string;
  view?: 'booth' | 'voter';
  boothId?: string;
  hasVoted?: 'all' | 'true' | 'false';
  search?: string;
  page?: number;
  limit?: number;
}

export const fetchVoterSyncReport = (filters: VoterSyncReportFilters = {}) => {
  return async (dispatch: AppDispatch) => {
    dispatch({ type: SET_VOTER_SYNC_REPORT_LOADING, payload: true });
    try {
      const res = await api.get('/tenant/reports/voter-sync', { params: filters });
      const payload = res.data?.data || res.data;
      dispatch({ type: SET_VOTER_SYNC_REPORT_DATA, payload });
      return payload;
    } catch (err: any) {
      dispatch(errorHandler(err));
      dispatch({
        type: SET_VOTER_SYNC_REPORT_ERROR,
        payload: err?.message || 'Failed to fetch voter sync report',
      });
    }
  };
};

export const fetchVotingReport = (filters: VotingReportFilters = {}) => {
  return async (dispatch: AppDispatch) => {
    dispatch({ type: SET_VOTING_REPORT_LOADING, payload: true });
    try {
      const res = await api.get('/tenant/reports/voting', { params: filters });
      const payload = res.data?.data || res.data;
      dispatch({ type: SET_VOTING_REPORT_DATA, payload });
      return payload;
    } catch (err: any) {
      dispatch(errorHandler(err));
      dispatch({
        type: SET_VOTING_REPORT_ERROR,
        payload: err?.message || 'Failed to fetch voting report',
      });
    }
  };
};

export const fetchVolunteerOutreachVoters = (filters: {
  volunteerId: string;
  type: 'sync' | 'call' | 'whatsapp';
  timeRange?: '7d' | '30d' | 'all';
  page?: number;
  limit?: number;
}) => {
  return async (dispatch: AppDispatch) => {
    dispatch({ type: SET_OUTREACH_VOTERS_LOADING, payload: true });
    try {
      const res = await api.get('/tenant/reports/volunteer-outreach-voters', { params: filters });
      const payload = res.data?.data || res.data;
      dispatch({ type: SET_OUTREACH_VOTERS_DATA, payload });
      return payload;
    } catch (err: any) {
      dispatch(errorHandler(err));
      dispatch({
        type: SET_OUTREACH_VOTERS_ERROR,
        payload: err?.message || 'Failed to fetch volunteer outreach voter details',
      });
    }
  };
};

export const fetchBoothVotingVoters = (filters: {
  electionId?: string;
  boothId: string;
  hasVoted?: 'all' | 'true' | 'false';
  page?: number;
  limit?: number;
}) => {
  return async (dispatch: AppDispatch) => {
    dispatch({ type: SET_VOTING_BOOTH_VOTERS_LOADING, payload: true });
    try {
      const res = await api.get('/tenant/reports/voting', {
        params: { ...filters, view: 'voter' },
      });
      const payload = res.data?.data || res.data;
      dispatch({ type: SET_VOTING_BOOTH_VOTERS_DATA, payload });
      return payload;
    } catch (err: any) {
      dispatch(errorHandler(err));
      dispatch({
        type: SET_VOTING_BOOTH_VOTERS_ERROR,
        payload: err?.message || 'Failed to fetch booth voter details',
      });
    }
  };
};

export const exportReportExcel = (
  endpoint: string,
  params: Record<string, any> = {},
  filename: string
) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await api.get(endpoint, {
        params,
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      dispatch(errorHandler(err));
      throw err;
    }
  };
};
