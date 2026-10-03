import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { SafeImage } from '@/components/common/SafeImage';
import type { Column } from '@/components/common/DataTable';
import { FORM_CASTE_CATEGORY_OPTIONS } from '@/constants/dropdownOptions';

export interface MasterField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'switch' | 'file';
  required?: boolean;
  fullWidth?: boolean;
  rows?: number;
  options?: { label: string; value: string | number }[];
  optionsSource?: 'religions' | 'states' | 'districts' | 'talukas' | 'villages' | 'pcs' | 'acs' | 'wards' | 'castes';
  placeholder?: string;
}

export interface MasterCategoryConfig {
  key: string;
  label: string;
  singularLabel: string;
  addLabel: string;
  apiEndpoint: string;
  description: string;
  columns: Column<any>[];
  fields: MasterField[];
}

export const masterConfig: Record<string, MasterCategoryConfig> = {
  states: {
    key: 'states',
    label: 'States & UTs',
    singularLabel: 'State',
    addLabel: 'Add State',
    apiEndpoint: '/masters/states',
    description: 'Manage Indian States and Union Territories reference list.',
    columns: [
      { key: 'name', header: 'State Name', sortable: true },
      { key: 'code', header: 'State Code', sortable: true, render: (row) => row.code || '-' },
    ],
    fields: [
      { name: 'name', label: 'State Name', type: 'text', required: true, placeholder: 'e.g. Maharashtra' },
      { name: 'code', label: 'State Code / Abbreviation', type: 'text', placeholder: 'e.g. MH' },
    ],
  },
  religions: {
    key: 'religions',
    label: 'Religions',
    singularLabel: 'Religion',
    addLabel: 'Add Religion',
    apiEndpoint: '/masters/religions',
    description: 'Manage religious demographic classification categories.',
    columns: [
      { key: 'name', header: 'Religion Name', sortable: true },
    ],
    fields: [
      { name: 'name', label: 'Religion Name', type: 'text', required: true, placeholder: 'e.g. Hinduism, Islam, Sikhism' },
    ],
  },
  castes: {
    key: 'castes',
    label: 'Castes & Subcastes',
    singularLabel: 'Caste',
    addLabel: 'Add Caste',
    apiEndpoint: '/masters/castes',
    description: 'Manage caste categories and social classifications.',
    columns: [
      { key: 'name', header: 'Caste / Subcaste Name', sortable: true },
      { key: 'category', header: 'Category', sortable: true },
      {
        key: 'religionName',
        header: 'Religion',
        sortable: true,
        render: (row) => row.religionName || '-'
      },
      {
        key: 'parentCasteName',
        header: 'Parent Caste',
        sortable: true,
        render: (row) => row.parentCasteName || '-'
      },
    ],
    fields: [
      { name: 'name', label: 'Caste / Subcaste Name', type: 'text', required: true, placeholder: 'e.g. Kunbi Maratha, Chitpavan Brahmin' },
      {
        name: 'category',
        label: 'Category',
        type: 'select',
        required: true,
        options: FORM_CASTE_CATEGORY_OPTIONS,
      },
      {
        name: 'religionId',
        label: 'Religion',
        type: 'select',
        optionsSource: 'religions',
        placeholder: 'Select Religion',
      },
      {
        name: 'parentCasteId',
        label: 'Parent Caste (If Subcaste)',
        type: 'select',
        optionsSource: 'castes',
        placeholder: 'Select Parent Caste (Optional)',
      },
    ],
  },
  districts: {
    key: 'districts',
    label: 'Districts',
    singularLabel: 'District',
    addLabel: 'Add District',
    apiEndpoint: '/masters/districts',
    description: 'Manage administrative district divisions.',
    columns: [
      { key: 'name', header: 'District Name', sortable: true },
      {
        key: 'stateName',
        header: 'State',
        sortable: true,
        render: (row) => row.stateName || '-'
      },
    ],
    fields: [
      { name: 'name', label: 'District Name', type: 'text', required: true, placeholder: 'e.g. Pune' },
      {
        name: 'stateId',
        label: 'State',
        type: 'select',
        required: true,
        optionsSource: 'states',
        placeholder: 'Select State',
      },
    ],
  },
  talukas: {
    key: 'talukas',
    label: 'Talukas (Tehsils)',
    singularLabel: 'Taluka',
    addLabel: 'Add Taluka',
    apiEndpoint: '/masters/talukas',
    description: 'Manage administrative taluka / tehsil divisions within districts.',
    columns: [
      { key: 'name', header: 'Taluka Name', sortable: true },
      {
        key: 'districtName',
        header: 'District',
        sortable: true,
        render: (row) => row.districtName || '-'
      },
      {
        key: 'stateName',
        header: 'State',
        sortable: true,
        render: (row) => row.stateName || '-'
      },
    ],
    fields: [
      { name: 'name', label: 'Taluka Name', type: 'text', required: true, placeholder: 'e.g. Haveli, Pune City' },
      {
        name: 'stateId',
        label: 'State',
        type: 'select',
        optionsSource: 'states',
        placeholder: 'Select State',
      },
      {
        name: 'districtId',
        label: 'District',
        type: 'select',
        required: true,
        optionsSource: 'districts',
        placeholder: 'Select District',
      },
    ],
  },
  villages: {
    key: 'villages',
    label: 'Villages',
    singularLabel: 'Village',
    addLabel: 'Add Village',
    apiEndpoint: '/masters/villages',
    description: 'Manage revenue villages for voter demographic and residential address tracking.',
    columns: [
      { key: 'name', header: 'Village Name', sortable: true },
      {
        key: 'talukaName',
        header: 'Taluka (Tehsil)',
        sortable: true,
        render: (row) => row.talukaName || '-'
      },
      {
        key: 'districtName',
        header: 'District',
        sortable: true,
        render: (row) => row.districtName || '-'
      },
      {
        key: 'stateName',
        header: 'State',
        sortable: true,
        render: (row) => row.stateName || '-'
      },
    ],
    fields: [
      { name: 'name', label: 'Village Name', type: 'text', required: true, placeholder: 'e.g. Wagholi, Bavdhan, Hinjewadi' },
      {
        name: 'stateId',
        label: 'State',
        type: 'select',
        optionsSource: 'states',
        placeholder: 'Select State',
      },
      {
        name: 'districtId',
        label: 'District',
        type: 'select',
        optionsSource: 'districts',
        placeholder: 'Select District',
      },
      {
        name: 'talukaId',
        label: 'Taluka',
        type: 'select',
        required: true,
        optionsSource: 'talukas',
        placeholder: 'Select Taluka',
      },
    ],
  },
  pcs: {
    key: 'pcs',
    label: 'Parliamentary Constituencies (PC)',
    singularLabel: 'Parliamentary Constituency (PC)',
    addLabel: 'Add PC',
    apiEndpoint: '/masters/pcs',
    description: 'Manage Lok Sabha parliamentary constituencies.',
    columns: [
      { key: 'name', header: 'Constituency Name', sortable: true },
      { key: 'pcNumber', header: 'PC No.', sortable: true },
      {
        key: 'stateName',
        header: 'State',
        sortable: true,
        render: (row) => row.stateName || '-'
      },
    ],
    fields: [
      { name: 'name', label: 'Constituency Name', type: 'text', required: true, placeholder: 'e.g. Pune Parliamentary' },
      { name: 'pcNumber', label: 'PC Number', type: 'number', required: true, placeholder: 'e.g. 33' },
      {
        name: 'stateId',
        label: 'State',
        type: 'select',
        required: true,
        optionsSource: 'states',
        placeholder: 'Select State',
      },
    ],
  },
  acs: {
    key: 'acs',
    label: 'Assembly Constituencies (AC)',
    singularLabel: 'Assembly Constituency (AC)',
    addLabel: 'Add AC',
    apiEndpoint: '/masters/acs',
    description: 'Manage Vidhan Sabha assembly constituencies.',
    columns: [
      { key: 'acNumber', header: 'AC No.', sortable: true },
      { key: 'name', header: 'Assembly Name', sortable: true },
      {
        key: 'stateName',
        header: 'State',
        sortable: true,
        render: (row) => row.stateName || '-'
      },
      {
        key: 'districtName',
        header: 'District',
        sortable: true,
        render: (row) => row.districtName || '-'
      },
      {
        key: 'pcName',
        header: 'PC',
        sortable: true,
        render: (row) => row.pcName || '-'
      },
    ],
    fields: [
      {
        name: 'stateId',
        label: 'State',
        type: 'select',
        optionsSource: 'states',
        placeholder: 'Select State',
      },
      {
        name: 'districtId',
        label: 'District',
        type: 'select',
        optionsSource: 'districts',
        placeholder: 'Select District',
      },
      {
        name: 'pcId',
        label: 'Parliamentary Constituency (PC)',
        type: 'select',
        required: true,
        optionsSource: 'pcs',
        placeholder: 'Select PC',
      },
      { name: 'acNumber', label: 'AC Number', type: 'number', required: true, placeholder: 'e.g. 210' },
      { name: 'name', label: 'Assembly Name', type: 'text', required: true, fullWidth: true, placeholder: 'e.g. Kothrud Assembly' },
    ],
  },
  parties: {
    key: 'parties',
    label: 'Political Parties',
    singularLabel: 'Political Party',
    addLabel: 'Add Party',
    apiEndpoint: '/masters/parties',
    description: 'Manage recognized political party references & symbols.',
    columns: [
      {
        key: 'symbolLogo',
        header: 'Symbol / Logo',
        render: (row) => (
          <SafeImage
            alt={row.name}
            src={row.symbolLogo}
            fallbackText={row.abbreviation || row.name}
            className="w-8 h-8 object-contain rounded-md border border-slate-200 dark:border-slate-700 bg-white p-1 shadow-xs"
          />
        ),
      },
      { key: 'name', header: 'Party Name', sortable: true },
      { key: 'abbreviation', header: 'Abbreviation / Code', sortable: true },
      { key: 'alliance', header: 'Alliance', render: (row) => row.alliance || '-' },
    ],
    fields: [
      { name: 'name', label: 'Party Name', type: 'text', required: true, fullWidth: true, placeholder: 'e.g. Bharatiya Janata Party' },
      { name: 'abbreviation', label: 'Abbreviation', type: 'text', required: true, placeholder: 'e.g. BJP' },
      { name: 'alliance', label: 'Alliance Name', type: 'text', placeholder: 'e.g. NDA / INDIA' },
      { name: 'symbolLogo', label: 'Symbol / Party Logo', type: 'file', fullWidth: true },
    ],
  },
  wards: {
    key: 'wards',
    label: 'Wards (Prabhags)',
    singularLabel: 'Ward',
    addLabel: 'Add Ward',
    apiEndpoint: '/masters/wards',
    description: 'Manage electoral wards / prabhags under Assembly Constituencies.',
    columns: [
      { key: 'wardNumber', header: 'Ward No.', sortable: true },
      { key: 'name', header: 'Ward / Prabhag Name', sortable: true },
      {
        key: 'acName',
        header: 'Assembly Constituency (AC)',
        sortable: true,
        render: (row) => row.acName || '-'
      },
    ],
    fields: [
      {
        name: 'stateId',
        label: 'State',
        type: 'select',
        optionsSource: 'states',
        placeholder: 'Select State',
      },
      {
        name: 'districtId',
        label: 'District',
        type: 'select',
        optionsSource: 'districts',
        placeholder: 'Select District',
      },
      {
        name: 'pcId',
        label: 'Parliamentary Constituency (PC)',
        type: 'select',
        optionsSource: 'pcs',
        placeholder: 'Select PC',
      },
      {
        name: 'acId',
        label: 'Assembly Constituency (AC)',
        type: 'select',
        required: true,
        optionsSource: 'acs',
        placeholder: 'Select AC',
      },
      { name: 'wardNumber', label: 'Ward / Prabhag Number', type: 'number', required: true, placeholder: 'e.g. 12' },
      { name: 'name', label: 'Ward / Prabhag Name', type: 'text', required: true, fullWidth: true, placeholder: 'e.g. Ward No. 12 - Shivajinagar' },
    ],
  },
  booths: {
    key: 'booths',
    label: 'Polling Booths',
    singularLabel: 'Polling Booth',
    addLabel: 'Add Booth',
    apiEndpoint: '/masters/booths',
    description: 'Manage individual polling booth locations under Wards and Assembly Constituencies.',
    columns: [
      { key: 'boothNumber', header: 'Booth No.', sortable: true },
      { key: 'name', header: 'Polling Station Name', sortable: true },
      {
        key: 'acName',
        header: 'Assembly (AC)',
        sortable: true,
        render: (row) => row.acName || '-'
      },
      {
        key: 'wardName',
        header: 'Ward / Prabhag',
        sortable: true,
        render: (row) => row.wardName || '-'
      },
      { key: 'totalVoters', header: 'Total Voters', sortable: true, render: (row) => row.totalVoters ?? 0 },
    ],
    fields: [
      {
        name: 'stateId',
        label: 'State',
        type: 'select',
        optionsSource: 'states',
        placeholder: 'Select State',
      },
      {
        name: 'districtId',
        label: 'District',
        type: 'select',
        optionsSource: 'districts',
        placeholder: 'Select District',
      },
      {
        name: 'pcId',
        label: 'Parliamentary Constituency (PC)',
        type: 'select',
        optionsSource: 'pcs',
        placeholder: 'Select PC',
      },
      {
        name: 'acId',
        label: 'Assembly Constituency (AC)',
        type: 'select',
        required: true,
        optionsSource: 'acs',
        placeholder: 'Select AC',
      },
      {
        name: 'wardId',
        label: 'Ward / Prabhag',
        type: 'select',
        optionsSource: 'wards',
        placeholder: 'Select Ward (Optional)',
      },
      { name: 'boothNumber', label: 'Booth Number', type: 'number', required: true, placeholder: 'e.g. 102' },
      { name: 'name', label: 'Polling Station Name', type: 'text', required: true, fullWidth: true, placeholder: 'e.g. National High School Hall' },
      { name: 'locationBuilding', label: 'Location Building / Address', type: 'textarea', rows: 2, fullWidth: true, placeholder: 'e.g. Room No. 4, Ground Floor, Main Wing' },
      { name: 'totalVoters', label: 'Total Allocated Voters', type: 'number', placeholder: 'e.g. 1200' },
    ],
  },
};

/**
 * Tenant Master Config — same UI definitions as masterConfig but using
 * /tenant-api/* endpoints (tenant DB, role-scoped data).
 * Only 'acs', 'wards', 'booths' are allowed for tenants.
 */
export const tenantMasterConfig: Record<string, MasterCategoryConfig> = {
  acs: {
    ...masterConfig.acs,
    apiEndpoint: API_ENDPOINTS.TENANT.MASTERS.ACS,
  },
  wards: {
    ...masterConfig.wards,
    apiEndpoint: API_ENDPOINTS.TENANT.MASTERS.WARDS,
  },
  booths: {
    ...masterConfig.booths,
    apiEndpoint: API_ENDPOINTS.TENANT.MASTERS.BOOTHS,
  },
};
