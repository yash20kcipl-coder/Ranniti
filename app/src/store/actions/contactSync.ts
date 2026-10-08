import {
  SET_SYNC_LOADING,
  SET_SYNCING_DEVICE,
  SET_SYNCED_VOTERS,
  APPEND_SYNCED_VOTERS,
  REMOVE_SYNCED_VOTER,
  SET_DEVICE_CONTACTS,
  DeviceContactItem,
} from '../reducers/contactSync';
import { Dispatch } from 'redux';
import { RootState } from '../store';
import toast from '../../utils/toast';
import apiClient from '../../api/apiClient';

export const setDeviceContactsAction = (contacts: DeviceContactItem[]) => ({
  type: SET_DEVICE_CONTACTS,
  payload: contacts,
});

export const fetchSyncedContactsAction = (
  page: number = 1,
  isLoadMore: boolean = false,
  search: string = '',
  voterType: string = ''
) => {
  return async (dispatch: Dispatch) => {
    if (!isLoadMore) {
      dispatch({ type: SET_SYNC_LOADING, payload: true });
    }
    try {
      const params: any = {
        page,
        limit: 25,
      };
      if (search && search.trim()) {
        params.search = search.trim();
      }
      if (voterType && voterType !== 'all') {
        params.voterType = voterType.trim();
      }

      const response = await apiClient.get('/mobile/voters/synced-contacts', { params });
      const data = response?.data?.data || response?.data || {};
      const items = data.items || [];
      const pagination = data.pagination || {
        page,
        limit: 25,
        totalRecords: items.length,
        totalPages: 1,
      };

      if (isLoadMore) {
        dispatch({
          type: APPEND_SYNCED_VOTERS,
          payload: { items, pagination },
        });
      } else {
        dispatch({
          type: SET_SYNCED_VOTERS,
          payload: { items, pagination },
        });
      }
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message || 'Failed to fetch synced contacts';
      toast.error(errorMsg);
      if (!isLoadMore) {
        dispatch({
          type: SET_SYNCED_VOTERS,
          payload: {
            items: [],
            pagination: { page: 1, limit: 25, totalRecords: 0, totalPages: 1 },
          },
        });
      }
    } finally {
      if (!isLoadMore) {
        dispatch({ type: SET_SYNC_LOADING, payload: false });
      }
    }
  };
};

export const syncDeviceContactsAction = (
  contactsPayload?: Array<{ name: string; phone: string }>
) => {
  return async (dispatch: any, getState: () => RootState) => {
    dispatch({ type: SET_SYNCING_DEVICE, payload: true });
    try {
      const deviceContacts = getState().contactSync.deviceContacts;
      const payloadToSend =
        contactsPayload && contactsPayload.length > 0
          ? contactsPayload
          : deviceContacts.map((c) => ({ name: c.name, phone: c.phone }));

      const response = await apiClient.post('/mobile/voters/sync-contacts', {
        contacts: payloadToSend,
      });

      const resData = response?.data?.data || response?.data || {};
      const totalMatched = resData.totalMatched ?? 0;

      toast.success(`${totalMatched} voters matched with phone contacts!`);

      // Refresh matched list from server
      await dispatch(fetchSyncedContactsAction(1, false));
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message || 'Contact sync failed';
      toast.error(errorMsg);
    } finally {
      dispatch({ type: SET_SYNCING_DEVICE, payload: false });
    }
  };
};

export const removeSyncedContactAction = (voterId: string) => {
  return async (dispatch: Dispatch) => {
    try {
      await apiClient.delete(`/mobile/voters/synced-contacts/${voterId}`);
      dispatch({ type: REMOVE_SYNCED_VOTER, payload: voterId });
      toast.success('Contact unlinked successfully');
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message || 'Failed to remove synced contact';
      toast.error(errorMsg);
    }
  };
};
