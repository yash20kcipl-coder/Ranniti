import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { query, closeDbPool } from '../queries/dbPool';

const firstNamesMale = [
  { eng: 'Rajesh', loc: 'राजेश' },
  { eng: 'Amit', loc: 'अमित' },
  { eng: 'Rahul', loc: 'राहुल' },
  { eng: 'Suresh', loc: 'सुरेश' },
  { eng: 'Vikas', loc: 'विकास' },
  { eng: 'Sunil', loc: 'सुनील' },
  { eng: 'Anil', loc: 'अनिल' },
  { eng: 'Vijay', loc: 'विजय' },
  { eng: 'Sanjay', loc: 'संजय' },
  { eng: 'Manoj', loc: 'मनोज' },
  { eng: 'Deepak', loc: 'दीपक' },
  { eng: 'Ajay', loc: 'अजय' },
  { eng: 'Prakash', loc: 'प्रकाश' },
  { eng: 'Ramesh', loc: 'रमेश' },
  { eng: 'Dinesh', loc: 'दिनेश' },
  { eng: 'Sachin', loc: 'सचिन' },
  { eng: 'Nitin', loc: 'नितिन' },
  { eng: 'Ganesh', loc: 'गणेश' },
  { eng: 'Prashant', loc: 'प्रशांत' },
  { eng: 'Mahesh', loc: 'महेश' },
  { eng: 'Kiran', loc: 'किरण' },
  { eng: 'Tushar', loc: 'तुषार' },
  { eng: 'Swapnil', loc: 'स्वप्निल' },
  { eng: 'Amol', loc: 'अमोल' },
  { eng: 'Pradeep', loc: 'प्रदीप' },
];

const firstNamesFemale = [
  { eng: 'Sunita', loc: 'सुनिता' },
  { eng: 'Priya', loc: 'प्रिया' },
  { eng: 'Anjali', loc: 'अंजली' },
  { eng: 'Pooja', loc: 'पूजा' },
  { eng: 'Kavita', loc: 'कविता' },
  { eng: 'Anita', loc: 'अनीता' },
  { eng: 'Sangeeta', loc: 'संगीता' },
  { eng: 'Rekha', loc: 'रेखा' },
  { eng: 'Meena', loc: 'मीना' },
  { eng: 'Savita', loc: 'सविता' },
  { eng: 'Lata', loc: 'लता' },
  { eng: 'Aarti', loc: 'आरती' },
  { eng: 'Shilpa', loc: 'शिल्पा' },
  { eng: 'Neha', loc: 'नेहा' },
  { eng: 'Swati', loc: 'स्वाती' },
  { eng: 'Varsha', loc: 'वर्षा' },
  { eng: 'Sushma', loc: 'सुषमा' },
  { eng: 'Seema', loc: 'सीमा' },
  { eng: 'Rashmi', loc: 'रश्मी' },
  { eng: 'Archana', loc: 'अर्चना' },
  { eng: 'Deepali', loc: 'दीपाली' },
  { eng: 'Pallavi', loc: 'पल्लवी' },
  { eng: 'Snehal', loc: 'स्नेहल' },
  { eng: 'Pranita', loc: 'प्रणिता' },
  { eng: 'Vaishali', loc: 'वैशाली' },
];

const middleNamesMale = [
  { eng: 'Kumar', loc: 'कुमार' },
  { eng: 'Ramesh', loc: 'रमेश' },
  { eng: 'Prakash', loc: 'प्रकाश' },
  { eng: 'Vijay', loc: 'विजय' },
  { eng: 'Dattatray', loc: 'दत्तात्रेय' },
  { eng: 'Chandrakant', loc: 'चंद्रकांत' },
  { eng: 'Shantaram', loc: 'शांताराम' },
  { eng: 'Baban', loc: 'बबन' },
  { eng: 'Anandrao', loc: 'आनंदराव' },
  { eng: 'Ganpat', loc: 'गणपत' },
];

const middleNamesFemale = [
  { eng: 'Devi', loc: 'देवी' },
  { eng: 'Rani', loc: 'राणी' },
  { eng: 'Kumari', loc: 'कुमारी' },
  { eng: 'Rajesh', loc: 'राजेश' },
  { eng: 'Suresh', loc: 'सुरेश' },
  { eng: 'Ramesh', loc: 'रमेश' },
  { eng: 'Vijay', loc: 'विजय' },
  { eng: 'Prakash', loc: 'प्रकाश' },
];

const surnames = [
  { eng: 'Sharma', loc: 'शर्मा' },
  { eng: 'Patel', loc: 'पटेल' },
  { eng: 'Verma', loc: 'वर्मा' },
  { eng: 'Yadav', loc: 'यादव' },
  { eng: 'Joshi', loc: 'जोषी' },
  { eng: 'Kulkarni', loc: 'कुलकर्णी' },
  { eng: 'Gupta', loc: 'गुप्ता' },
  { eng: 'Deshmukh', loc: 'देशमुख' },
  { eng: 'Patil', loc: 'पाटील' },
  { eng: 'Pawar', loc: 'पवार' },
  { eng: 'Shinde', loc: 'शिंदे' },
  { eng: 'Jadhav', loc: 'जाधव' },
  { eng: 'Kadam', loc: 'कदम' },
  { eng: 'Gaikwad', loc: 'गायकवाड' },
  { eng: 'Chavan', loc: 'चव्हाण' },
  { eng: 'More', loc: 'मोरे' },
  { eng: 'Bhosale', loc: 'भोसले' },
  { eng: 'Tambe', loc: 'तांबे' },
  { eng: 'Shedge', loc: 'शेडगे' },
  { eng: 'Sawant', loc: 'सावंत' },
];

// Fallback Master Data matching Ranniti Indian Electoral Master Schema
const defaultBooths = [
  {
    boothName: 'Abhasaheb Garware College, Main Building Room 1',
    boothNo: 101,
    acName: 'Kothrud',
    pcName: 'Pune',
    districtName: 'Pune',
    stateName: 'Maharashtra',
    taluka: 'Haveli',
    village: 'Erandwane',
  },
  {
    boothName: 'MES Sou Vimlabai Garware High School, Room 3',
    boothNo: 102,
    acName: 'Kothrud',
    pcName: 'Pune',
    districtName: 'Pune',
    stateName: 'Maharashtra',
    taluka: 'Haveli',
    village: 'Kothrud',
  },
  {
    boothName: 'MIT World Peace University, Central Library Block',
    boothNo: 103,
    acName: 'Kothrud',
    pcName: 'Pune',
    districtName: 'Pune',
    stateName: 'Maharashtra',
    taluka: 'Haveli',
    village: 'Paud Road',
  },
  {
    boothName: 'Zilla Parishad Primary School, Room 2',
    boothNo: 104,
    acName: 'Kothrud',
    pcName: 'Pune',
    districtName: 'Pune',
    stateName: 'Maharashtra',
    taluka: 'Haveli',
    village: 'Dahanukar Colony',
  },
  {
    boothName: 'Modern High School, Main Hall',
    boothNo: 15,
    acName: 'Shivajinagar',
    pcName: 'Pune',
    districtName: 'Pune',
    stateName: 'Maharashtra',
    taluka: 'Pune City',
    village: 'Shivajinagar',
  },
  {
    boothName: 'COEP Technological University, Mechanical Dept Room 4',
    boothNo: 16,
    acName: 'Shivajinagar',
    pcName: 'Pune',
    districtName: 'Pune',
    stateName: 'Maharashtra',
    taluka: 'Pune City',
    village: 'Wellesley Road',
  },
  {
    boothName: 'Nutan Marathi Vidyalaya (NMV), Primary Section',
    boothNo: 42,
    acName: 'Vadgaon Sheri',
    pcName: 'Pune',
    districtName: 'Pune',
    stateName: 'Maharashtra',
    taluka: 'Haveli',
    village: 'Kalyani Nagar',
  },
];

const defaultParties = [
  'Bharatiya Janata Party',
  'Indian National Congress',
  'Nationalist Congress Party',
  'Shiv Sena',
  'Aam Aadmi Party',
];

const defaultReligions = [
  'Hinduism',
  'Islam',
  'Christianity',
  'Buddhism',
  'Jainism',
  'Sikhism',
];

const defaultCastesWithSubcastes = [
  { caste: 'Maratha', subcaste: 'Kunbi Maratha' },
  { caste: 'Maratha', subcaste: '96 Kuli Maratha' },
  { caste: 'Brahmin', subcaste: 'Deshastha Brahmin' },
  { caste: 'Brahmin', subcaste: 'Chitpavan Brahmin' },
  { caste: 'OBC Community', subcaste: 'Teli' },
  { caste: 'OBC Community', subcaste: 'Mali' },
  { caste: 'Scheduled Caste', subcaste: 'Nav-Buddhist' },
  { caste: 'General', subcaste: 'General' },
];

const professionMap: { type: string; professions: string[] }[] = [
  { type: 'Business', professions: ['Shopkeeper', 'Retail Merchant', 'Contractor', 'Hotelier', 'Trader'] },
  { type: 'Service', professions: ['Software Engineer', 'Bank Officer', 'Govt Employee', 'Teacher', 'Accountant'] },
  { type: 'Agriculture', professions: ['Farmer', 'Dairy Farmer', 'Horticulturist', 'Farm Manager'] },
  { type: 'Professional', professions: ['Doctor', 'Advocate', 'Architect', 'Chartered Accountant'] },
  { type: 'Self-Employed', professions: ['Electrician', 'Plumber', 'Driver', 'Mechanic', 'Tailor'] },
  { type: 'Student', professions: ['College Student', 'Postgraduate Scholar'] },
  { type: 'Housewife', professions: ['Homemaker'] },
  { type: 'Other', professions: ['Social Worker', 'Freelance Consultant', 'Retired Personnel'] },
];

const voterTypes = ['Voter', 'Voter', 'Voter', 'Student', 'Senior', 'Neutral Voter', 'VIP', 'NRI', 'Non Voter'];
const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'SHIFTED', 'UNVERIFIED', 'INACTIVE'];
const bloodGroups = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'];

/**
 * Generates sample Excel file (.xlsx) with all 39 database fields
 */
export const generateSampleVotersExcel = async (count: number, filePath: string): Promise<void> => {
  const outputDir = path.dirname(filePath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Attempt to fetch dynamic master values from DB if pool is available
  let boothsToUse = defaultBooths;
  let partiesToUse = defaultParties;
  let religionsToUse = defaultReligions;
  let castesToUse = defaultCastesWithSubcastes;

  try {
    const dbBooths = await query(`
      SELECT 
        b.name as "boothName", 
        b.booth_number as "boothNo", 
        ac.name as "acName", 
        pc.name as "pcName", 
        d.name as "districtName", 
        s.name as "stateName",
        COALESCE(t.name, d.name || ' Division') as "talukaName",
        COALESCE(v.name, ac.name) as "villageName"
      FROM booths b
      JOIN assembly_constituencies ac ON b.ac_id = ac.id
      JOIN parliamentary_constituencies pc ON ac.pc_id = pc.id
      JOIN districts d ON ac.district_id = d.id
      JOIN states s ON d.state_id = s.id
      LEFT JOIN LATERAL (
        SELECT name FROM talukas WHERE district_id = d.id LIMIT 1
      ) t ON true
      LEFT JOIN LATERAL (
        SELECT v.name FROM villages v JOIN talukas t2 ON v.taluka_id = t2.id WHERE t2.district_id = d.id LIMIT 1
      ) v ON true
      ORDER BY b.booth_number ASC, b.name ASC
    `);

    if (dbBooths.rows.length > 0) {
      boothsToUse = dbBooths.rows.map((r) => ({
        boothName: r.boothName,
        boothNo: r.boothNo,
        acName: r.acName,
        pcName: r.pcName,
        districtName: r.districtName,
        stateName: r.stateName,
        taluka: r.talukaName,
        village: r.villageName,
      }));
    }

    const dbParties = await query(`SELECT name FROM parties ORDER BY name ASC`);
    if (dbParties.rows.length > 0) {
      partiesToUse = dbParties.rows.map((p) => p.name);
    }

    const dbReligions = await query(`SELECT name FROM religions ORDER BY name ASC`);
    if (dbReligions.rows.length > 0) {
      religionsToUse = dbReligions.rows.map((r) => r.name);
    }

    const dbCastesWithReligion = await query(`
      SELECT 
        COALESCE(p.name, c.name) as caste,
        CASE WHEN p.name IS NOT NULL THEN c.name ELSE '' END as subcaste,
        r.name as religion
      FROM castes c
      LEFT JOIN castes p ON c.parent_caste_id = p.id
      JOIN religions r ON COALESCE(c.religion_id, p.religion_id) = r.id
      ORDER BY r.name, c.name
    `);
    if (dbCastesWithReligion.rows.length > 0) {
      castesToUse = dbCastesWithReligion.rows.map((c) => ({
        caste: c.caste,
        subcaste: c.subcaste,
        religion: c.religion,
      }));
    }
  } catch (err: any) {
    // Graceful fallback to seeded default dataset if DB is unreachable
    console.log(`[generateSampleVotersExcel] Using default Indian master dataset: ${err.message}`);
  }

  // 39 Canonical Headers aligned with Ranniti Database Schema & Extended Voter Profile
  const headers = [
    'EPIC No',
    'First Name (Eng)',
    'Middle Name (Eng)',
    'Surname (Eng)',
    'First Name (Local)',
    'Middle Name (Local)',
    'Surname (Local)',
    'Gender',
    'Age',
    'DOB',
    'Mobile No',
    'Email',
    'Aadhaar No',
    'PAN No',
    'House No',
    'Serial No',
    'Section No',
    'Booth Name',
    'Booth No',
    'AC Name',
    'PC Name',
    'District Name',
    'State Name',
    'Religion',
    'Caste',
    'Subcaste',
    'Profession Type',
    'Profession',
    'Voter Type',
    'Status',
    'Is Dead',
    'Blood Group',
    'Party',
    'Is Family Influencer',
    'Is Social Influencer',
    'Taluka',
    'Village',
    'Full Address',
    'Voter Address',
  ];

  const rows: (string | number)[][] = [headers];

  // Number of voters per booth to create realistic polling stations (~100-200 voters per booth)
  const votersPerBooth = 150;

  for (let i = 0; i < count; i++) {
    // Group into natural households (2-4 voters per household)
    const householdIndex = Math.floor(i / 3);
    const memberInHousehold = i % 3;

    // Household-shared attributes
    const boothIdx = Math.floor(i / votersPerBooth) % boothsToUse.length;
    const booth = boothsToUse[boothIdx];
    const snObj = surnames[householdIndex % surnames.length];
    const casteItem = castesToUse[householdIndex % castesToUse.length];
    const religion = (casteItem as any).religion || religionsToUse[householdIndex % religionsToUse.length];
    const houseNo = `${(householdIndex % 250) + 1}/${String.fromCharCode(65 + (householdIndex % 4))}`;
    const sectionNo = ((householdIndex % 8) + 1);

    // Individual attributes within the household
    const isMale = memberInHousehold === 0 || (memberInHousehold === 2 && i % 2 === 0);
    const fnObj = isMale
      ? firstNamesMale[(i * 7 + memberInHousehold) % firstNamesMale.length]
      : firstNamesFemale[(i * 7 + memberInHousehold) % firstNamesFemale.length];
    const mnObj = isMale
      ? middleNamesMale[(householdIndex * 3 + memberInHousehold) % middleNamesMale.length]
      : middleNamesFemale[(householdIndex * 3 + memberInHousehold) % middleNamesFemale.length];

    const party = partiesToUse[(i * 5) % partiesToUse.length];
    const profCategory = professionMap[(i * 3) % professionMap.length];
    const profession = profCategory.professions[i % profCategory.professions.length];

    // Unique EPIC format: EX000001, EX000002...
    const epicNo = `EX${String(1000001 + i).slice(1)}`;
    const gender = isMale ? 'Male' : 'Female';

    // Age distribution: Head (~45-75), Spouse (~40-70), Child/Young adult (~18-35)
    let age: number;
    if (memberInHousehold === 0) {
      age = 45 + (householdIndex % 30);
    } else if (memberInHousehold === 1) {
      age = 40 + (householdIndex % 28);
    } else {
      age = 18 + ((householdIndex * 7) % 20);
    }

    const birthYear = 2026 - age;
    const month = String((i % 12) + 1).padStart(2, '0');
    const day = String((i % 28) + 1).padStart(2, '0');
    const dob = `${birthYear}-${month}-${day}`;

    // Mobile & Aadhaar & PAN
    const mobileNo = `9822${String(100000 + (i % 900000)).slice(0, 6)}`;
    const email = `voter.${epicNo.toLowerCase()}@domain.com`;
    const aadhaarNo = `8745${String(10000000 + (i % 90000000)).slice(0, 8)}`;
    const panNo = `ABCDE${String(1000 + (i % 8999))}F`;

    // Serial No within booth (1..votersPerBooth)
    const serialNo = (i % votersPerBooth) + 1;

    const voterType = voterTypes[i % voterTypes.length];
    const status = statuses[i % statuses.length];
    const isDead = i % 89 === 0 ? 'YES' : 'NO';
    const bloodGroup = bloodGroups[i % bloodGroups.length];

    // Designate head of household (~1 in 3 voters) as Family Influencer candidate (~6%)
    const isFamilyInfluencer = memberInHousehold === 0 && householdIndex % 5 === 0 ? 'YES' : 'NO';
    const isSocialInfluencer = memberInHousehold === 0 && householdIndex % 11 === 0 ? 'YES' : 'NO';

    const taluka = booth.taluka;
    const village = booth.village;
    const fullAddress = `House #${houseNo}, ${village}, ${taluka}, ${booth.districtName}, ${booth.stateName}`;
    const voterAddress = `Booth #${booth.boothNo} (${booth.boothName}), Section #${sectionNo}, ${village}`;

    rows.push([
      epicNo,
      fnObj.eng,
      mnObj.eng,
      snObj.eng,
      fnObj.loc,
      mnObj.loc,
      snObj.loc,
      gender,
      age,
      dob,
      mobileNo,
      email,
      aadhaarNo,
      panNo,
      houseNo,
      serialNo,
      sectionNo,
      booth.boothName,
      booth.boothNo,
      booth.acName,
      booth.pcName,
      booth.districtName,
      booth.stateName,
      religion,
      casteItem.caste,
      casteItem.subcaste,
      profCategory.type,
      profession,
      voterType,
      status,
      isDead,
      bloodGroup,
      party,
      isFamilyInfluencer,
      isSocialInfluencer,
      taluka,
      village,
      fullAddress,
      voterAddress,
    ]);
  }

  // Ensure cellDates is false so string dates remain clean ISO strings (YYYY-MM-DD)
  const worksheet = XLSX.utils.aoa_to_sheet(rows, { cellDates: false });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Voters');
  XLSX.writeFile(workbook, filePath, { bookType: 'xlsx' });
  console.log(`[generateSampleVotersExcel] Successfully created ${filePath} (${count} voter records, 39 columns)`);
};

// If executed directly via CLI
if (require.main === module) {
  (async () => {
    try {
      const target10k = path.join(__dirname, '../../../xlsx/voters_10000_sample.xlsx');
      const target1k = path.join(__dirname, '../../../xlsx/voters_1000_sample.xlsx');

      await generateSampleVotersExcel(10000, target10k);
      await generateSampleVotersExcel(1000, target1k);
    } catch (err) {
      console.error('[generateSampleVotersExcel] Execution failed:', err);
    } finally {
      await closeDbPool();
      process.exit(0);
    }
  })();
}
