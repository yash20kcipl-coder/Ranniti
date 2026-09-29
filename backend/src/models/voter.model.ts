export interface Voter {
  id: string;
  epicNo: string;
  stateId?: string | null;
  stateName?: string | null;
  districtId?: string | null;
  districtName?: string | null;
  pcId?: string | null;
  pcName?: string | null;
  acId?: string | null;
  acName?: string | null;
  boothId?: string | null;
  boothName?: string | null;
  boothNumber?: number | null;
  serialNo?: number | null;
  sectionNo?: number | null;
  houseNo?: string | null;

  firstName?: string | null;
  engFirstName?: string | null;
  middleName?: string | null;
  engMiddleName?: string | null;
  surname?: string | null;
  engSurname?: string | null;

  gender?: string | null;
  dob?: string | null;
  age?: number | null;
  mobileNo?: string | null;
  email?: string | null;
  aadhaarNo?: string | null;
  panNo?: string | null;

  professionType?: string | null;
  profession?: string | null;
  religionId?: string | null;
  religionName?: string | null;
  casteId?: string | null;
  casteName?: string | null;
  subcasteName?: string | null;
  voterType?: string | null;

  status?: string | null;
  isDead?: boolean;
  bloodGroup?: string | null;
  avatar?: string | null;
  taluka?: string | null;
  village?: string | null;
  fullAddress?: string | null;
  voterAddress?: string | null;

  partyId?: string | null;
  partyName?: string | null;
  partySymbol?: string | null;

  familyInfluencerId?: string | null;
  familyInfluencerName?: string | null;
  familyInfluencerEpic?: string | null;
  familyInfluencedCount?: number;
  isFamilyInfluencer?: boolean;

  socialInfluencerId?: string | null;
  socialInfluencerName?: string | null;
  socialInfluencerEpic?: string | null;
  socialInfluencedCount?: number;
  isSocialInfluencer?: boolean;

  organizationId?: string | null;
  organizationName?: string | null;

  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface VoterFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  stateId?: string;
  districtId?: string;
  boothId?: string;
  acId?: string;
  sectionNo?: number | string;
  gender?: string;
  voterType?: string;
  status?: string;
  isDead?: boolean | string;
  religionId?: string;
  casteId?: string;
  partyId?: string;
  ageGroup?: string;
  familyInfluencerId?: string;
  socialInfluencerId?: string;
  isFamilyInfluencer?: boolean | string;
  isSocialInfluencer?: boolean | string;
  influencerStatus?: string;
  influencerRole?: string;
  organizationId?: string;
}

export interface InfluencerOption {
  id: string;
  epicNo: string;
  name: string;
  engName: string;
  firstName?: string | null;
  engFirstName?: string | null;
  middleName?: string | null;
  engMiddleName?: string | null;
  surname?: string | null;
  engSurname?: string | null;
  houseNo?: string | null;
  boothName?: string | null;
}

export interface VoterStats {
  totalVoters: number;
  maleVoters: number;
  femaleVoters: number;
  otherVoters: number;
  voterTypeCounts: Record<string, number>;
}

export interface FamilyCandidateParams {
  influencerId: string;
  boothId?: string;
  search?: string;
  houseNo?: string;
  sameHouseOnly?: boolean | string;
  sameSurnameOnly?: boolean | string;
  unassignedOnly?: boolean | string;
  sectionNo?: number | string;
  gender?: string;
  page?: number;
  limit?: number;
}

export interface SocialCandidateParams {
  influencerId: string;
  boothId?: string;
  search?: string;
  sectionNo?: number | string;
  gender?: string;
  voterType?: string;
  casteId?: string;
  unassignedOnly?: boolean | string;
  page?: number;
  limit?: number;
}
