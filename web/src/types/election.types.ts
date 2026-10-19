export interface Election {
  id: string;
  name: string;
  electionCode: string | null;
  electionType: string;
  electionDate: string;
  countingDate: string | null;
  stateId: string | null;
  stateName?: string | null;
  pcId: string | null;
  pcName?: string | null;
  acId: string | null;
  acName?: string | null;
  isActive: boolean;
  isDefault: boolean;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  totalVotersSnapshot: number;
  targetVotes: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ElectionFilters {
  search?: string;
  status?: string;
  electionType?: string;
  page?: number;
  limit?: number;
}

export interface CreateElectionPayload {
  name: string;
  electionCode?: string;
  electionType: string;
  electionDate: string;
  countingDate?: string;
  stateId?: string;
  pcId?: string;
  acId?: string;
  isActive?: boolean;
  isDefault?: boolean;
  status?: string;
  totalVotersSnapshot?: number;
  targetVotes?: number;
  description?: string;
}

export interface UpdateElectionPayload extends Partial<CreateElectionPayload> {}

export interface BoothTurnoutItem {
  electionId: string;
  boothId: string;
  boothNumber: number;
  boothName: string;
  totalVoters: number;
  votedCount: number;
  maleVotedCount: number;
  femaleVotedCount: number;
  turnoutPercentage: number;
  lastVotedAt: string | null;
  updatedAt: string;
}

export interface HourlyTurnoutItem {
  timeSlot: string;
  votesCast: number;
}

export interface ElectionState {
  elections: Election[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  selectedElection: Election | null;
  defaultElection: Election | null;
  boothTurnout: BoothTurnoutItem[];
  hourlyTurnout: HourlyTurnoutItem[];
  loading: boolean;
  turnoutLoading: boolean;
  error: string | null;
}
