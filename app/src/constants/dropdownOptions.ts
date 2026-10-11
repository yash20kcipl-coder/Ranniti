import { DropdownOption } from '../components/AppDropdown';

export type { DropdownOption };

// ─── GENDER OPTIONS ─────────────────────────────────────────────────────────
export const GENDER_OPTIONS: DropdownOption[] = [
  { id: '', label: 'All Genders' },
  { id: 'Male', label: 'Male', icon: 'gender-male' },
  { id: 'Female', label: 'Female', icon: 'gender-female' },
  { id: 'Other', label: 'Other', icon: 'gender-transgender' },
];

export const FORM_GENDER_OPTIONS: DropdownOption[] = [
  { id: 'Male', label: 'Male', icon: 'gender-male' },
  { id: 'Female', label: 'Female', icon: 'gender-female' },
  { id: 'Other', label: 'Other', icon: 'gender-transgender' },
];

export const getGenderOptions = (t?: (key: any) => string, includeAll: boolean = false): DropdownOption[] => {
  const options: DropdownOption[] = [
    { id: 'Male', label: t ? t('male') || 'Male' : 'Male', icon: 'gender-male' },
    { id: 'Female', label: t ? t('female') || 'Female' : 'Female', icon: 'gender-female' },
    { id: 'Other', label: t ? t('other') || 'Other' : 'Other', icon: 'gender-transgender' },
  ];
  if (includeAll) {
    return [{ id: '', label: t ? t('allGenders') || 'All Genders' : 'All Genders' }, ...options];
  }
  return options;
};

// ─── VOTER TYPE OPTIONS ──────────────────────────────────────────────────────
export const VOTER_TYPE_OPTIONS: DropdownOption[] = [
  { id: '', label: 'All Voter Types', icon: 'account-multiple-outline' },
  { id: 'Voter', label: 'Standard Voter', icon: 'account-check-outline' },
  { id: 'Non Voter', label: 'Non Voter', icon: 'account-cancel-outline' },
  { id: 'Student', label: 'Student', icon: 'school-outline' },
  { id: 'Senior', label: 'Senior Citizen', icon: 'human-cane' },
  { id: 'NRI', label: 'NRI Voter', icon: 'airplane' },
  { id: 'VIP', label: 'VIP / Key Person', icon: 'star-outline' },
];

export const FORM_VOTER_TYPE_OPTIONS: DropdownOption[] = [
  { id: 'Voter', label: 'Standard Voter', icon: 'account-check-outline' },
  { id: 'Non Voter', label: 'Non Voter', icon: 'account-cancel-outline' },
  { id: 'Student', label: 'Student', icon: 'school-outline' },
  { id: 'Senior', label: 'Senior Citizen', icon: 'human-cane' },
  { id: 'NRI', label: 'NRI Voter', icon: 'airplane' },
  { id: 'VIP', label: 'VIP / Key Person', icon: 'star-outline' },
];

export const getVoterTypeOptions = (t?: (key: any) => string, includeAll: boolean = false): DropdownOption[] => {
  const options: DropdownOption[] = [
    { id: 'Voter', label: t ? t('voterTypeStandard') || 'Standard Voter' : 'Standard Voter', icon: 'account-check-outline' },
    { id: 'Non Voter', label: t ? t('voterTypeNonVoter') || 'Non Voter' : 'Non Voter', icon: 'account-cancel-outline' },
    { id: 'Student', label: t ? t('voterTypeStudent') || 'Student' : 'Student', icon: 'school-outline' },
    { id: 'Senior', label: t ? t('voterTypeSenior') || 'Senior Citizen' : 'Senior Citizen', icon: 'human-cane' },
    { id: 'NRI', label: t ? t('voterTypeNri') || 'NRI Voter' : 'NRI Voter', icon: 'airplane' },
    { id: 'VIP', label: t ? t('voterTypeVip') || 'VIP / Key Person' : 'VIP / Key Person', icon: 'star-outline' },
  ];
  if (includeAll) {
    return [{ id: '', label: t ? t('allTypes') || 'All Voter Types' : 'All Voter Types', icon: 'account-multiple-outline' }, ...options];
  }
  return options;
};

// ─── STATUS OPTIONS ──────────────────────────────────────────────────────────
export const STATUS_OPTIONS: DropdownOption[] = [
  { id: '', label: 'All Statuses' },
  { id: 'ACTIVE', label: 'Active Voter' },
  { id: 'SHIFTED', label: 'Shifted / Transferred' },
  { id: 'UNVERIFIED', label: 'Unverified' },
  { id: 'INACTIVE', label: 'Inactive / Suspended' },
  { id: 'PENDING', label: 'Pending Verification' },
];

export const FORM_STATUS_OPTIONS: DropdownOption[] = [
  { id: 'ACTIVE', label: 'Active Voter' },
  { id: 'SHIFTED', label: 'Shifted / Transferred' },
  { id: 'UNVERIFIED', label: 'Unverified' },
  { id: 'INACTIVE', label: 'Inactive / Suspended' },
  { id: 'PENDING', label: 'Pending Verification' },
];

export const getStatusOptions = (t?: (key: any) => string, includeAll: boolean = false): DropdownOption[] => {
  const options: DropdownOption[] = [
    { id: 'ACTIVE', label: t ? t('statusActive') || 'Active Voter' : 'Active Voter' },
    { id: 'SHIFTED', label: t ? t('statusShifted') || 'Shifted / Transferred' : 'Shifted / Transferred' },
    { id: 'UNVERIFIED', label: t ? t('statusUnverified') || 'Unverified' : 'Unverified' },
    { id: 'INACTIVE', label: t ? t('statusInactive') || 'Inactive / Suspended' : 'Inactive / Suspended' },
    { id: 'PENDING', label: t ? t('statusPending') || 'Pending Verification' : 'Pending Verification' },
  ];
  if (includeAll) {
    return [{ id: '', label: t ? t('allStatus') || 'All Statuses' : 'All Statuses' }, ...options];
  }
  return options;
};

// ─── BLOOD GROUP OPTIONS ────────────────────────────────────────────────────
export const BLOOD_GROUP_OPTIONS: DropdownOption[] = [
  { id: '', label: 'Select Blood Group' },
  { id: 'A+', label: 'A positive (A+)' },
  { id: 'A-', label: 'A negative (A-)' },
  { id: 'B+', label: 'B positive (B+)' },
  { id: 'B-', label: 'B negative (B-)' },
  { id: 'O+', label: 'O positive (O+)' },
  { id: 'O-', label: 'O negative (O-)' },
  { id: 'AB+', label: 'AB positive (AB+)' },
  { id: 'AB-', label: 'AB negative (AB-)' },
];

export const FORM_BLOOD_GROUP_OPTIONS: DropdownOption[] = [
  { id: 'A+', label: 'A+' },
  { id: 'A-', label: 'A-' },
  { id: 'B+', label: 'B+' },
  { id: 'B-', label: 'B-' },
  { id: 'O+', label: 'O+' },
  { id: 'O-', label: 'O-' },
  { id: 'AB+', label: 'AB+' },
  { id: 'AB-', label: 'AB-' },
];

export const getBloodGroupOptions = (includeAll: boolean = false): DropdownOption[] => {
  if (includeAll) return BLOOD_GROUP_OPTIONS;
  return FORM_BLOOD_GROUP_OPTIONS;
};

// ─── RELATION OPTIONS ───────────────────────────────────────────────────────
export const RELATION_OPTIONS: DropdownOption[] = [
  { id: '', label: 'All Relations' },
  { id: 'Father', label: 'Father' },
  { id: 'Husband', label: 'Husband' },
  { id: 'Mother', label: 'Mother' },
  { id: 'Other', label: 'Other' },
];

export const FORM_RELATION_OPTIONS: DropdownOption[] = [
  { id: 'Father', label: 'Father' },
  { id: 'Husband', label: 'Husband' },
  { id: 'Mother', label: 'Mother' },
  { id: 'Other', label: 'Other' },
];

export const getRelationOptions = (t?: (key: any) => string, includeAll: boolean = false): DropdownOption[] => {
  const options: DropdownOption[] = [
    { id: 'Father', label: t ? t('relationFather') || 'Father' : 'Father' },
    { id: 'Husband', label: t ? t('relationHusband') || 'Husband' : 'Husband' },
    { id: 'Mother', label: t ? t('relationMother') || 'Mother' : 'Mother' },
    { id: 'Other', label: t ? t('relationOther') || 'Other' : 'Other' },
  ];
  if (includeAll) {
    return [{ id: '', label: t ? t('allRelations') || 'All Relations' : 'All Relations' }, ...options];
  }
  return options;
};

// ─── LIVING / DECEASED (IS_DEAD) OPTIONS ────────────────────────────────────
export const IS_DEAD_OPTIONS: DropdownOption[] = [
  { id: '', label: 'All Living & Deceased' },
  { id: 'false', label: 'Living Only' },
  { id: 'true', label: 'Deceased Only' },
];

export const getIsDeadOptions = (t?: (key: any) => string): DropdownOption[] => [
  { id: '', label: t ? t('allVoters') || 'All Living & Deceased' : 'All Living & Deceased' },
  { id: 'false', label: t ? t('living') || 'Living Only' : 'Living Only' },
  { id: 'true', label: t ? t('deceased') || 'Deceased Only' : 'Deceased Only' },
];

// ─── AGE GROUP OPTIONS ──────────────────────────────────────────────────────
export const AGE_GROUP_OPTIONS: DropdownOption[] = [
  { id: '', label: 'All Age Groups' },
  { id: '18-25', label: '18 - 25 Years (Youth / First Time Voters)' },
  { id: '26-35', label: '26 - 35 Years (Young Adults)' },
  { id: '36-50', label: '36 - 50 Years (Middle Aged)' },
  { id: '51-65', label: '51 - 65 Years (Seniors)' },
  { id: '65-200', label: '65+ Years (Elderly)' },
];

export const getAgeGroupOptions = (t?: (key: any) => string): DropdownOption[] => [
  { id: '', label: t ? t('allAges') || 'All Ages' : 'All Age Groups' },
  { id: '18-25', label: '18 - 25' },
  { id: '26-35', label: '26 - 35' },
  { id: '36-50', label: '36 - 50' },
  { id: '51-65', label: '51 - 65' },
  { id: '65-200', label: '65+' },
];

// ─── CASTE CATEGORY OPTIONS ────────────────────────────────────────────────
export const CASTE_CATEGORY_OPTIONS: DropdownOption[] = [
  { id: '', label: 'All Categories' },
  { id: 'General', label: 'General' },
  { id: 'OBC', label: 'OBC' },
  { id: 'SC', label: 'SC' },
  { id: 'ST', label: 'ST' },
  { id: 'Other', label: 'Other' },
];

export const FORM_CASTE_CATEGORY_OPTIONS: DropdownOption[] = [
  { id: 'General', label: 'General' },
  { id: 'OBC', label: 'OBC' },
  { id: 'SC', label: 'SC' },
  { id: 'ST', label: 'ST' },
  { id: 'Other', label: 'Other' },
];

// ─── VOLUNTEER ROLE OPTIONS ────────────────────────────────────────────────
export const VOLUNTEER_ROLE_OPTIONS: DropdownOption[] = [
  { id: '', label: 'All Roles' },
  { id: 'pc_leader', label: 'PC Leader' },
  { id: 'ac_leader', label: 'AC Leader' },
  { id: 'sub_leader', label: 'Sub-Leader / Ward Coordinator' },
  { id: 'supporter', label: 'Campaign Supporter / Volunteer' },
];

export const FORM_VOLUNTEER_ROLE_OPTIONS: DropdownOption[] = [
  { id: 'pc_leader', label: 'PC Leader' },
  { id: 'ac_leader', label: 'AC Leader' },
  { id: 'sub_leader', label: 'Sub-Leader / Ward Coordinator' },
  { id: 'supporter', label: 'Campaign Supporter / Volunteer' },
];
