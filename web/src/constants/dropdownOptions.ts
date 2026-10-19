import type { Option } from '@/components/common/FormInput';

export const GENDER_OPTIONS: Option[] = [
  { label: 'All Genders', value: '' },
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
];

export const FORM_GENDER_OPTIONS: Option[] = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
];

export const VOTER_TYPE_OPTIONS: Option[] = [
  { label: 'All Voter Types', value: '' },
  { label: 'Standard Voter', value: 'Voter' },
  { label: 'Neutral Voter', value: 'Neutral Voter' },
  { label: 'Non Voter', value: 'Non Voter' },
  { label: 'Student', value: 'Student' },
  { label: 'Senior Citizen', value: 'Senior' },
  { label: 'NRI Voter', value: 'NRI' },
  { label: 'VIP / Key Person', value: 'VIP' },
];

export const FORM_VOTER_TYPE_OPTIONS: Option[] = [
  { label: 'Standard Voter', value: 'Voter' },
  { label: 'Neutral Voter', value: 'Neutral Voter' },
  { label: 'Non Voter', value: 'Non Voter' },
  { label: 'Student', value: 'Student' },
  { label: 'Senior Citizen', value: 'Senior' },
  { label: 'NRI Voter', value: 'NRI' },
  { label: 'VIP / Key Person', value: 'VIP' },
];

export const STATUS_OPTIONS: Option[] = [
  { label: 'All Statuses', value: '' },
  { label: 'Active Voter', value: 'ACTIVE' },
  { label: 'Shifted / Transferred', value: 'SHIFTED' },
  { label: 'Unverified', value: 'UNVERIFIED' },
  { label: 'Inactive / Suspended', value: 'INACTIVE' },
  { label: 'Pending Verification', value: 'PENDING' },
];

export const IS_DEAD_OPTIONS: Option[] = [
  { label: 'All Living & Deceased', value: '' },
  { label: 'Living Only', value: 'false' },
  { label: 'Deceased Only', value: 'true' },
];

export const AGE_GROUP_OPTIONS: Option[] = [
  { label: 'All Age Groups', value: '' },
  { label: '18 - 25 Years (Youth / First Time Voters)', value: '18-25' },
  { label: '26 - 35 Years (Young Adults)', value: '26-35' },
  { label: '36 - 50 Years (Middle Aged)', value: '36-50' },
  { label: '51 - 65 Years (Seniors)', value: '51-65' },
  { label: '65+ Years (Elderly)', value: '65-200' },
];

export const BLOOD_GROUP_OPTIONS: Option[] = [
  { label: 'Select Blood Group', value: '' },
  { label: 'A positive (A+)', value: 'A+' },
  { label: 'A negative (A-)', value: 'A-' },
  { label: 'B positive (B+)', value: 'B+' },
  { label: 'B negative (B-)', value: 'B-' },
  { label: 'O positive (O+)', value: 'O+' },
  { label: 'O negative (O-)', value: 'O-' },
  { label: 'AB positive (AB+)', value: 'AB+' },
  { label: 'AB negative (AB-)', value: 'AB-' },
];

export const CASTE_CATEGORY_OPTIONS: Option[] = [
  { label: 'All Categories', value: '' },
  { label: 'General', value: 'General' },
  { label: 'OBC', value: 'OBC' },
  { label: 'SC', value: 'SC' },
  { label: 'ST', value: 'ST' },
  { label: 'Other', value: 'Other' },
];

export const FORM_CASTE_CATEGORY_OPTIONS: Option[] = [
  { label: 'General', value: 'General' },
  { label: 'OBC', value: 'OBC' },
  { label: 'SC', value: 'SC' },
  { label: 'ST', value: 'ST' },
  { label: 'Other', value: 'Other' },
];

export const USER_ROLE_OPTIONS: Option[] = [
  { label: 'All Roles', value: '' },
  { label: 'Super Admin', value: 'super_admin' },
  { label: 'Tenant', value: 'tenant' },
];

export const LEADER_CREATABLE_ROLE_OPTIONS: Option[] = [
  { label: 'Assembly / Sub-Sector Leader', value: 'leader' },
  { label: 'Booth Coordinator (Sub-Leader)', value: 'sub_leader' },
];

export const SUB_LEADER_CREATABLE_ROLE_OPTIONS: Option[] = [
  { label: 'Field Supporter', value: 'supporter' },
];

export const VOLUNTEER_ROLE_OPTIONS: Option[] = [
  { label: 'All Roles', value: '' },
  { label: 'PC Leader', value: 'pc_leader' },
  { label: 'AC Leader', value: 'ac_leader' },
  { label: 'Sub-Leader / Ward Coordinator', value: 'sub_leader' },
  { label: 'Campaign Supporter / Volunteer', value: 'supporter' },
];

export const FORM_VOLUNTEER_ROLE_OPTIONS: Option[] = [
  { label: 'PC Leader', value: 'pc_leader' },
  { label: 'AC Leader', value: 'ac_leader' },
  { label: 'Sub-Leader / Ward Coordinator', value: 'sub_leader' },
  { label: 'Campaign Supporter / Volunteer', value: 'supporter' },
];

export const SUBORDINATE_ROLE_DELEGATION_OPTIONS = [
  { key: 'ac_leader', label: 'AC Leader (Assembly Coordinator)', desc: 'Can manage assembly operations and subordinates' },
  { key: 'sub_leader', label: 'Sub-Leader / Ward Coordinator', desc: 'Can manage ward clusters and booth volunteers' },
  { key: 'supporter', label: 'Campaign Supporter / Volunteer', desc: 'Can perform ground surveys and booth voter lookups' },
];

export const RELATION_OPTIONS: Option[] = [
  { label: 'All Relations', value: '' },
  { label: 'Father', value: 'Father' },
  { label: 'Husband', value: 'Husband' },
  { label: 'Mother', value: 'Mother' },
  { label: 'Other', value: 'Other' },
];

export const FORM_RELATION_OPTIONS: Option[] = [
  { label: 'Select Relation', value: '' },
  { label: 'Father', value: 'Father' },
  { label: 'Husband', value: 'Husband' },
  { label: 'Mother', value: 'Mother' },
  { label: 'Other', value: 'Other' },
];

export const ELECTION_TYPE_OPTIONS: Option[] = [
  { label: 'All Election Types', value: '' },
  { label: 'Assembly (Vidhan Sabha)', value: 'ASSEMBLY' },
  { label: 'Parliamentary (Lok Sabha)', value: 'PARLIAMENTARY' },
  { label: 'Municipal Corporation (Nagar Nigam / BMC)', value: 'MUNICIPAL_CORP' },
  { label: 'Zilla Parishad', value: 'ZILLA_PARISHAD' },
  { label: 'Panchayat Samiti', value: 'PANCHAYAT_SAMITI' },
  { label: 'Gram Panchayat', value: 'GRAM_PANCHAYAT' },
  { label: 'Other Election', value: 'OTHER' },
];

export const FORM_ELECTION_TYPE_OPTIONS: Option[] = [
  { label: 'Assembly (Vidhan Sabha)', value: 'ASSEMBLY' },
  { label: 'Parliamentary (Lok Sabha)', value: 'PARLIAMENTARY' },
  { label: 'Municipal Corporation (Nagar Nigam / BMC)', value: 'MUNICIPAL_CORP' },
  { label: 'Zilla Parishad', value: 'ZILLA_PARISHAD' },
  { label: 'Panchayat Samiti', value: 'PANCHAYAT_SAMITI' },
  { label: 'Gram Panchayat', value: 'GRAM_PANCHAYAT' },
  { label: 'Other Election', value: 'OTHER' },
];

export const ELECTION_STATUS_OPTIONS: Option[] = [
  { label: 'All Statuses', value: '' },
  { label: 'Upcoming', value: 'UPCOMING' },
  { label: 'Active Campaign', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

export const FORM_ELECTION_STATUS_OPTIONS: Option[] = [
  { label: 'Upcoming', value: 'UPCOMING' },
  { label: 'Active Campaign', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

export const VOTED_FILTER_OPTIONS: Option[] = [
  { label: 'All Voters (Turnout)', value: '' },
  { label: 'Voted', value: 'true' },
  { label: 'Not Voted', value: 'false' },
];



