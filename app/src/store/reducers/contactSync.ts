export const SET_SYNCED_VOTERS = "SET_SYNCED_VOTERS";
export const SET_SYNC_LOADING = "SET_SYNC_LOADING";

export interface SyncedContactVoter {
  contactName: string; // Saved name in user's phone contacts
  voterId: string;
  voterName: string;
  mobile: string;
  epicNo: string;
  boothNo: string;
  supportingParty: string;
  isVoted: boolean;
}

export const DEMO_SYNCED_VOTERS: SyncedContactVoter[] = [
  {
    contactName: 'Ramesh Sharma Bapu Bazar',
    voterId: 'voter-101',
    voterName: 'Ramesh Kumar Sharma',
    mobile: '+919829012345',
    epicNo: 'RJ14829102',
    boothNo: 'Booth #12',
    supportingParty: 'Party A',
    isVoted: true,
  },
  {
    contactName: 'Imran Khan Merchant',
    voterId: 'voter-104',
    voterName: 'Mohammad Imran Khan',
    mobile: '+919829055443',
    epicNo: 'RJ14930219',
    boothNo: 'Booth #14',
    supportingParty: 'Party B',
    isVoted: false,
  },
  {
    contactName: 'Vikram Gurjar Dairy',
    voterId: 'voter-106',
    voterName: 'Vikram Gurjar',
    mobile: '+919782012999',
    epicNo: 'RJ14778821',
    boothNo: 'Booth #18',
    supportingParty: 'Undecided',
    isVoted: false,
  },
];

interface ContactSyncState {
  syncedVoters: SyncedContactVoter[];
  loading: boolean;
  totalSyncedCount: number;
}

const initialState: ContactSyncState = {
  syncedVoters: DEMO_SYNCED_VOTERS,
  loading: false,
  totalSyncedCount: DEMO_SYNCED_VOTERS.length,
};

const contactSyncReducer = (state = initialState, action: any): ContactSyncState => {
  switch (action.type) {
    case SET_SYNC_LOADING:
      return { ...state, loading: action.payload };
    case SET_SYNCED_VOTERS:
      return {
        ...state,
        syncedVoters: action.payload,
        totalSyncedCount: action.payload.length,
        loading: false,
      };
    default:
      return state;
  }
};

export default contactSyncReducer;
