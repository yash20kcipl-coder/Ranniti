export const SET_SYNC_LOADING = 'SET_SYNC_LOADING';
export const SET_SYNCED_VOTERS = 'SET_SYNCED_VOTERS';
export const SET_SYNCING_DEVICE = 'SET_SYNCING_DEVICE';
export const REMOVE_SYNCED_VOTER = 'REMOVE_SYNCED_VOTER';
export const SET_DEVICE_CONTACTS = 'SET_DEVICE_CONTACTS';
export const RESET_SYNCED_VOTERS = 'RESET_SYNCED_VOTERS';
export const APPEND_SYNCED_VOTERS = 'APPEND_SYNCED_VOTERS';
export const SET_SYNCED_PAGINATION = 'SET_SYNCED_PAGINATION';

export interface SyncedContactVoter {
  syncId?: string;
  voterId: string;
  epicNo: string;
  name: string;
  englishName?: string;
  hindiName?: string;
  mobileNo: string | null;
  deviceContactName: string;
  devicePhone: string;
  email?: string | null;
  boothName?: string | null;
  boothNo?: string | null;
  houseNo?: string | null;
  village?: string | null;
  voterType?: string | null;
  status?: string | null;
  avatar?: string | null;
  syncedAt?: string;
  isVoted?: boolean;
}

export interface DeviceContactItem {
  id: string;
  name: string;
  phone: string;
  isMatched?: boolean;
  voterId?: string;
}

export interface SyncedPagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface ContactSyncState {
  deviceContacts: DeviceContactItem[];
  syncedVoters: SyncedContactVoter[];
  loading: boolean;
  syncing: boolean;
  totalSyncedCount: number;
  pagination: SyncedPagination;
}

const initialState: ContactSyncState = {
  deviceContacts: [],
  syncedVoters: [],
  loading: false,
  syncing: false,
  totalSyncedCount: 0,
  pagination: {
    page: 1,
    limit: 25,
    totalRecords: 0,
    totalPages: 1,
  },
};

const contactSyncReducer = (state = initialState, action: any): ContactSyncState => {
  switch (action.type) {
    case SET_DEVICE_CONTACTS:
      return { ...state, deviceContacts: action.payload };

    case SET_SYNC_LOADING:
      return { ...state, loading: action.payload };

    case SET_SYNCING_DEVICE:
      return { ...state, syncing: action.payload };

    case SET_SYNCED_VOTERS: {
      const items: SyncedContactVoter[] = action.payload.items || [];
      const matchedPhones = new Set(items.map((i) => i.devicePhone?.slice(-10)));
      const updatedDevice = state.deviceContacts.map((c) => ({
        ...c,
        isMatched: matchedPhones.has(c.phone.replace(/\D/g, '').slice(-10)) || c.isMatched,
      }));

      return {
        ...state,
        deviceContacts: updatedDevice,
        syncedVoters: items,
        totalSyncedCount: action.payload.pagination?.totalRecords ?? items.length,
        pagination: action.payload.pagination || state.pagination,
        loading: false,
      };
    }

    case APPEND_SYNCED_VOTERS: {
      const existingIds = new Set(state.syncedVoters.map((v) => v.voterId));
      const newItems = (action.payload.items || []).filter(
        (v: SyncedContactVoter) => !existingIds.has(v.voterId)
      );
      return {
        ...state,
        syncedVoters: [...state.syncedVoters, ...newItems],
        totalSyncedCount: action.payload.pagination?.totalRecords ?? state.totalSyncedCount,
        pagination: action.payload.pagination || state.pagination,
        loading: false,
      };
    }

    case REMOVE_SYNCED_VOTER: {
      const filtered = state.syncedVoters.filter((v) => v.voterId !== action.payload);
      return {
        ...state,
        syncedVoters: filtered,
        totalSyncedCount: Math.max(0, state.totalSyncedCount - 1),
      };
    }

    case SET_SYNCED_PAGINATION:
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload },
      };

    case RESET_SYNCED_VOTERS:
      return initialState;

    default:
      return state;
  }
};

export default contactSyncReducer;
