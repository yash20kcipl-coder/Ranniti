import indianStates from './indian_states.json';
import indianDistricts from './indian_districts.json';

export const initialReligions = [
  { name: 'Hinduism' },
  { name: 'Islam' },
  { name: 'Christianity' },
  { name: 'Sikhism' },
  { name: 'Buddhism' },
  { name: 'Jainism' },
  { name: 'Zoroastrianism (Parsi)' },
  { name: 'Other' },
];

export const initialCastes = [
  // Primary Castes
  { name: 'Maratha', category: 'General', religionName: 'Hinduism' },
  { name: 'Brahmin', category: 'General', religionName: 'Hinduism' },
  { name: 'OBC Community', category: 'OBC', religionName: 'Hinduism' },
  { name: 'Scheduled Caste', category: 'SC', religionName: 'Hinduism' },
  { name: 'Neo-Buddhist', category: 'SC', religionName: 'Buddhism' },
  // Subcastes linked to parent castes
  { name: '96 Kuli Maratha', category: 'General', religionName: 'Hinduism', parentCasteName: 'Maratha' },
  { name: 'Kunbi Maratha', category: 'OBC', religionName: 'Hinduism', parentCasteName: 'Maratha' },
  { name: 'Deshastha Brahmin', category: 'General', religionName: 'Hinduism', parentCasteName: 'Brahmin' },
  { name: 'Chitpavan Brahmin', category: 'General', religionName: 'Hinduism', parentCasteName: 'Brahmin' },
  { name: 'Mali', category: 'OBC', religionName: 'Hinduism', parentCasteName: 'OBC Community' },
  { name: 'Teli', category: 'OBC', religionName: 'Hinduism', parentCasteName: 'OBC Community' },
  { name: 'Nav-Buddhist', category: 'SC', religionName: 'Buddhism', parentCasteName: 'Neo-Buddhist' },
];

export const initialParties = [
  {
    name: 'Bharatiya Janata Party',
    abbreviation: 'BJP',
    symbolLogo: '/uploads/parties/bjp.png',
  },
  {
    name: 'Indian National Congress',
    abbreviation: 'INC',
    symbolLogo: '/uploads/parties/inc.png',
  },
  {
    name: 'Aam Aadmi Party',
    abbreviation: 'AAP',
    symbolLogo: '/uploads/parties/aap.png',
  },
  {
    name: 'Nationalist Congress Party',
    abbreviation: 'NCP',
    symbolLogo: '/uploads/parties/ncp.png',
  },
  {
    name: 'Shiv Sena',
    abbreviation: 'SS',
    symbolLogo: '/uploads/parties/ss.png',
  },
  {
    name: 'All India Trinamool Congress',
    abbreviation: 'TMC',
    symbolLogo: '/uploads/parties/tmc.png',
  },
  {
    name: 'Bahujan Samaj Party',
    abbreviation: 'BSP',
    symbolLogo: '/uploads/parties/bsp.png',
  },
  {
    name: 'Samajwadi Party',
    abbreviation: 'SP',
    symbolLogo: '/uploads/parties/sp.png',
  },
  {
    name: 'Dravida Munnetra Kazhagam',
    abbreviation: 'DMK',
    symbolLogo: '/uploads/parties/dmk.png',
  },
  {
    name: 'YSR Congress Party',
    abbreviation: 'YSRCP',
    symbolLogo: '/uploads/parties/ysrcp.jpg',
  },
];

export const initialStates = indianStates;
export const initialDistricts = indianDistricts;

export const initialOrganizations = [
  { name: 'Maharashtra Election Campaign 2026', code: 'mh_campaign_2026', status: 'active' },
  { name: 'Delhi State Election Campaign 2026', code: 'delhi_campaign_2026', status: 'active' },
];

