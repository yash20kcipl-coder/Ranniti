export interface PlatformSubItem {
  key: string;
  label: string;
  description?: string;
}

export interface PlatformSubGroup {
  group: string;
  items: PlatformSubItem[];
}

export interface PlatformTabStructure {
  key: string;
  label: string;
  description: string;
  isDefault?: boolean;
  subGroups?: PlatformSubGroup[];
}

export interface PlatformFeatureToggle {
  key: string;
  label: string;
  badge?: string;
  description: string;
  defaultValue?: boolean;
}

export interface AvailableTabsResponse {
  featureToggles: PlatformFeatureToggle[];
  tabs: PlatformTabStructure[];
  allMainTabKeys: string[];
  allMasterSubTabKeys: string[];
}

export interface VolunteerPermissionItem {
  key: string;
  label: string;
}

export interface AvailableVolunteerPermissionsResponse {
  mobileScreens: VolunteerPermissionItem[];
  voterPermissions: VolunteerPermissionItem[];
  subordinateRoles: VolunteerPermissionItem[];
}

export const PLATFORM_AVAILABLE_VOLUNTEER_PERMISSIONS: AvailableVolunteerPermissionsResponse = {
  // Mobile app screens matching app/src/navigation/constants.ts DRAWER_MENU 1:1
  mobileScreens: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'assignedbooths', label: 'Assigned Booths' },
    { key: 'voterlist', label: 'Voters Directory' },
    { key: 'electionpolling', label: 'Election Polling' },
    { key: 'familymapping', label: 'Family Mapping' },
    { key: 'influencermapping', label: 'Social Influencers' },
    { key: 'contactsync', label: 'Contact Sync Voters' },
    { key: 'teammanagement', label: 'Team Management' },
  ],
  voterPermissions: [
    { key: 'canViewVoter', label: 'View Voter Records' },
    { key: 'canEditContact', label: 'Edit Contact Details' },
    { key: 'canEditDemographics', label: 'Edit Demographics' },
    { key: 'canEditInclination', label: 'Edit Political Inclination' },
    { key: 'canEditVoterStatus', label: 'Edit Voter Status' },
    { key: 'canManageFamily', label: 'Manage Family Tree' },
    { key: 'canExportData', label: 'Export Voter Lists' },
  ],
  subordinateRoles: [
    { key: 'ac_leader', label: 'AC Leader' },
    { key: 'sub_leader', label: 'Sub-Leader' },
    { key: 'supporter', label: 'Volunteer' },
  ],
};

const PLATFORM_TABS: PlatformTabStructure[] = [
  {
    key: 'dashboard',
    label: 'Dashboard overview',
    description: 'Key campaign numbers, voter stats and analytics',
    isDefault: true,
  },
  {
    key: 'voter_directory',
    label: 'Voter directory',
    description: 'Search voters, map households and view voter details',
    isDefault: true,
  },
  {
    key: 'master_data',
    label: 'Master data',
    description: 'Areas, communities, professions and election records',
    isDefault: true,
    subGroups: [
      {
        group: 'GEOGRAPHY & ADMINISTRATIVE DIVISIONS',
        items: [
          { key: 'acs', label: 'Assembly constituencies (AC)' },
          { key: 'wards', label: 'Wards (Prabhags)' },
          { key: 'booths', label: 'Polling booths' },
          { key: 'talukas', label: 'Talukas (Tehsils)' },
          { key: 'villages', label: 'Villages (Gaon)' },
        ],
      },
      {
        group: 'DEMOGRAPHICS & OCCUPATIONS',
        items: [
          { key: 'castes', label: 'Castes & subcastes' },
          { key: 'profession-categories', label: 'Profession categories' },
          { key: 'professions', label: 'Specific professions' },
        ],
      },
      {
        group: 'ELECTIONS & POLITICAL',
        items: [
          { key: 'elections', label: 'Elections management' },
        ],
      },
    ],
  },
  {
    key: 'imports',
    label: 'Data Imports',
    description: 'Monitor bulk imports, upload files, inspect errors, and download templates',
    isDefault: true,
  },
  {
    key: 'settings',
    label: 'Campaign settings & integrations',
    description: 'WhatsApp, push notifications and system settings',
    isDefault: true,
  },
];

const masterDataTab = PLATFORM_TABS.find((t) => t.key === 'master_data');

export const PLATFORM_AVAILABLE_TABS: AvailableTabsResponse = {
  featureToggles: [
    {
      key: 'canCreateWebUsers',
      label: 'Allow Tenant to Create Users for Tenant Web Login',
      badge: 'Web Access',
      description:
        'When enabled, the tenant organization can create and manage dedicated web user accounts with login access to this campaign portal.',
      defaultValue: false,
    },
  ],
  tabs: PLATFORM_TABS,
  allMainTabKeys: PLATFORM_TABS.map((t) => t.key),
  allMasterSubTabKeys: masterDataTab?.subGroups
    ? masterDataTab.subGroups.flatMap((g) => g.items.map((i) => i.key))
    : [],
};
