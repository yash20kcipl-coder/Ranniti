export interface SeedProfessionCategory {
  name: string;
  professions: string[];
}

export const initialProfessionCategories: SeedProfessionCategory[] = [
  {
    name: 'Government & Public Sector',
    professions: [
      'Civil Servant / Administrative Officer',
      'Police Officer / Personnel',
      'Panchayat Worker / Gram Sevak',
      'Public Sector Undertaking (PSU) Employee',
      'Municipal Corporation Worker',
      'Railway Employee',
      'Postal Service Worker',
      'Government Clerk / Assistant',
    ],
  },
  {
    name: 'Agriculture & Allied Activities',
    professions: [
      'Farmer / Cultivator',
      'Agricultural Labourer',
      'Dairy Farmer / Cattle Rearer',
      'Poultry / Fishery Farmer',
      'Horticulturist / Florist',
      'Tractor / Farm Equipment Operator',
    ],
  },
  {
    name: 'Healthcare & Medical',
    professions: [
      'Doctor / Physician / Surgeon',
      'Nurse / Healthcare Assistant',
      'Pharmacist / Chemist',
      'Laboratory Technician',
      'Dentist',
      'Ayush / Homeopathy Practitioner',
      'ASHA / Anganwadi Worker',
    ],
  },
  {
    name: 'Education & Academia',
    professions: [
      'School Teacher',
      'College Professor / Lecturer',
      'Coaching Class Instructor / Tutor',
      'School Principal / Headmaster',
      'Research Scholar / Academician',
    ],
  },
  {
    name: 'Business, Retail & Trade',
    professions: [
      'Retail Shopkeeper / Store Owner',
      'Wholesaler / Distributor',
      'Trader / Commission Agent',
      'Civil / Building Contractor',
      'Restaurant / Hotel / Dhaba Owner',
      'Small Business Owner / Self-Employed',
    ],
  },
  {
    name: 'Legal & Financial Services',
    professions: [
      'Advocate / Lawyer',
      'Chartered Accountant / Tax Consultant',
      'Banking & Insurance Professional',
      'Notary / Legal Advisor',
    ],
  },
  {
    name: 'Engineering, Technology & Media',
    professions: [
      'Software Engineer / IT Professional',
      'Civil / Mechanical / Electrical Engineer',
      'Architect / Interior Designer',
      'Journalist / Media Reporter',
      'Graphic Designer / Digital Creator',
    ],
  },
  {
    name: 'Skilled Trades & Transportation',
    professions: [
      'Driver (Auto / Taxi / Bus / Truck)',
      'Electrician',
      'Plumber',
      'Carpenter',
      'Mechanic / Automobile Technician',
      'Tailor / Garment Worker',
      'Mason / Construction Worker',
    ],
  },
  {
    name: 'Daily Wage, Household & Others',
    professions: [
      'Daily Wage Labourer',
      'Domestic Worker / Helper',
      'Security Guard',
      'Sanitation Worker',
      'Student',
      'Homemaker',
      'Retired Person',
      'Looking for Work / Unemployed',
    ],
  },
];
