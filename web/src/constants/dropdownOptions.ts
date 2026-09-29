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

export const ORGANIZATION_STATUS_OPTIONS: Option[] = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
];

export const FORM_ORGANIZATION_STATUS_OPTIONS: Option[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
];

