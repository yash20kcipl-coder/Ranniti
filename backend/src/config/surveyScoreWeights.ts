export interface SurveyFieldPointRule {
  label: string;
  points: number;
  category: 'contact' | 'political' | 'demographic' | 'status' | 'address' | 'profile' | 'identification';
  enabled: boolean;
  requirePreviouslyEmpty?: boolean;
}

export type SurveyFieldPointsConfig = Record<string, SurveyFieldPointRule>;

export const DEFAULT_SURVEY_FIELD_POINTS: SurveyFieldPointsConfig = {
  mobile_no: {
    label: 'Mobile Number',
    points: 15,
    category: 'contact',
    enabled: true,
    requirePreviouslyEmpty: true,
  },
  party_id: {
    label: 'Party Leaning / Preference',
    points: 20,
    category: 'political',
    enabled: true,
    requirePreviouslyEmpty: false,
  },
  is_family_influencer: {
    label: 'Family Influencer Tag',
    points: 15,
    category: 'political',
    enabled: true,
    requirePreviouslyEmpty: false,
  },
  is_social_influencer: {
    label: 'Social Influencer Tag',
    points: 15,
    category: 'political',
    enabled: true,
    requirePreviouslyEmpty: false,
  },
  caste_id: {
    label: 'Caste',
    points: 10,
    category: 'demographic',
    enabled: true,
    requirePreviouslyEmpty: false,
  },
  subcaste_name: {
    label: 'Sub-Caste',
    points: 5,
    category: 'demographic',
    enabled: true,
    requirePreviouslyEmpty: false,
  },
  religion_id: {
    label: 'Religion',
    points: 5,
    category: 'demographic',
    enabled: true,
    requirePreviouslyEmpty: false,
  },
  profession: {
    label: 'Profession / Occupation',
    points: 5,
    category: 'demographic',
    enabled: true,
    requirePreviouslyEmpty: false,
  },
  status: {
    label: 'Voter Shifted / Active Status',
    points: 10,
    category: 'status',
    enabled: true,
    requirePreviouslyEmpty: false,
  },
  is_dead: {
    label: 'Deceased Marking (is_dead)',
    points: 10,
    category: 'status',
    enabled: true,
    requirePreviouslyEmpty: false,
  },
  dob: {
    label: 'Date of Birth / Age Correction',
    points: 5,
    category: 'demographic',
    enabled: true,
    requirePreviouslyEmpty: false,
  },
  full_address: {
    label: 'Full Residential Address',
    points: 5,
    category: 'address',
    enabled: true,
    requirePreviouslyEmpty: false,
  },
  email: {
    label: 'Email Address',
    points: 5,
    category: 'contact',
    enabled: true,
    requirePreviouslyEmpty: true,
  },
  blood_group: {
    label: 'Blood Group',
    points: 3,
    category: 'profile',
    enabled: true,
    requirePreviouslyEmpty: false,
  },
  aadhaar_no: {
    label: 'Aadhaar Card Number',
    points: 10,
    category: 'identification',
    enabled: true,
    requirePreviouslyEmpty: true,
  },
  pan_no: {
    label: 'PAN Card Number',
    points: 10,
    category: 'identification',
    enabled: true,
    requirePreviouslyEmpty: true,
  },
};
