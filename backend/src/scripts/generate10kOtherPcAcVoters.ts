import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { normalizeRelation } from '../utils/relationNormalizer';

const sourceFile = path.resolve(__dirname, '../../../101finalomb.xlsx');
const targetFile = path.resolve(__dirname, '../../../xlsx/voters_10k_test_other_pc_ac.xlsx');
const TARGET_COUNT = 10000;

// Configurable target PC & AC for multi-constituency testing
const TARGET_PC = 'Rajkot';
const TARGET_AC = 'Rajkot AC 1';
const TARGET_DISTRICT = 'Rajkot';
const TARGET_STATE = 'Gujarat';
const TARGET_TALUKA = 'Rajkot';
const TARGET_VILLAGE = 'Rajkot';
const EPIC_PREFIX = 'TEST_RJK_';

const gujToAsciiDigits = (str: any): string => {
  if (!str) return '';
  const map: Record<string, string> = {
    '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4',
    '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9',
  };
  return String(str).replace(/[૦-૯]/g, (d) => map[d] || d);
};

const cleanHouseNo = (raw: any): string => {
  if (raw === undefined || raw === null || raw === '') return '';
  const converted = gujToAsciiDigits(raw);
  const cleaned = converted.replace(/[\u0ACD\u0AB0\u0A81-\u0A83\u0ABC\u0ABE-\u0AC9\u0ACD\u0AE2\u0AE3]/g, '').trim();
  return cleaned || converted.trim();
};

const parseAge = (raw: any): number | '' => {
  if (raw === undefined || raw === null || raw === '') return '';
  const converted = gujToAsciiDigits(raw);
  const match = converted.match(/\d+/);
  if (!match) return '';
  const val = parseInt(match[0], 10);
  return val >= 18 && val <= 125 ? val : '';
};

const parseGender = (raw: any, nameStr: string): 'Male' | 'Female' | 'Other' => {
  const str = String(raw || '').trim();
  if (/પુરુષ/i.test(str) || /જાતિ\s*[:*ઃ]\s*પુરુષ/i.test(str)) return 'Male';
  if (/સ્ત્રી|સ્રી|સ્ટ્રી|સી/i.test(str) || /જાતિ[ં”?ઃ\s]*[:*ઃ]\s*સ્ત્રી/i.test(str)) return 'Female';

  if (/ભાઈ|કુમાર|લાલ|રામ/i.test(nameStr)) return 'Male';
  if (/બેન|દેવી|બા/i.test(nameStr)) return 'Female';

  return 'Other';
};

const cleanText = (str: any): string => {
  return String(str || '')
    .replace(/^[:*ઃ.\-\s]+/, '')
    .trim();
};

const parseName = (nameStr: any, fatherNameStr: any) => {
  const cleanedName = cleanText(nameStr);
  const cleanedFather = cleanText(fatherNameStr);
  const parts = cleanedName.split(/\s+/).filter(Boolean);

  let firstName = '';
  let middleName = '';
  let surname = '';

  if (parts.length >= 3) {
    firstName = parts[0];
    middleName = parts[1];
    surname = parts.slice(2).join(' ');
  } else if (parts.length === 2) {
    firstName = parts[0];
    surname = parts[1];
    if (cleanedFather) {
      const fParts = cleanedFather.split(/\s+/).filter(Boolean);
      middleName = fParts[0] || '';
    }
  } else if (parts.length === 1) {
    firstName = parts[0];
    if (cleanedFather) {
      const fParts = cleanedFather.split(/\s+/).filter(Boolean);
      middleName = fParts[0] || '';
      if (fParts.length > 1) surname = fParts[fParts.length - 1];
    }
  }

  return { firstName, middleName, surname };
};

export const generate10kOtherPcAcVoters = async (): Promise<void> => {
  console.log(`[Generate10kOther] Reading source file: ${sourceFile}`);
  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Source file not found at: ${sourceFile}`);
  }

  const outputDir = path.dirname(targetFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const wb = XLSX.readFile(sourceFile, { cellDates: false });
  const sheetName = wb.SheetNames[0] || 'Sheet1';
  const rawRows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
  console.log(`[Generate10kOther] Loaded ${rawRows.length} total rows from '${sheetName}'`);

  const headers = [
    'EPIC No',
    'First Name (Eng)',
    'Middle Name (Eng)',
    'Surname (Eng)',
    'First Name (Local)',
    'Middle Name (Local)',
    'Surname (Local)',
    'Relation',
    'Guardian Name',
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

  console.log(`[Generate10kOther] Writing streaming Excel file: ${targetFile}`);
  const fullWorkbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    filename: targetFile,
    useStyles: false,
    useSharedStrings: false,
  });

  const fullSheet = fullWorkbook.addWorksheet('Voters');
  fullSheet.addRow(headers).commit();

  let exportedCount = 0;

  for (let i = 0; i < rawRows.length && exportedCount < TARGET_COUNT; i++) {
    const r = rawRows[i];
    const rawEpic = String(r.EPIC_NO || r.epic_no || '').trim().toUpperCase();
    if (!rawEpic) continue;

    // Distinct test prefix for easy tracking & single-query deletion
    const epicNo = `${EPIC_PREFIX}${rawEpic}`;

    const { firstName, middleName, surname } = parseName(r.Name, r['Father Name']);
    const relation = normalizeRelation(r.Relation || r.relation) || 'Father';
    const guardianName = cleanText(r['Father Name'] || r.Father_Name || r.Guardian_Name || r['Guardian Name'] || '');
    const gender = parseGender(r.sex, r.Name);
    const age = parseAge(r.age);
    const dob = age ? `${2026 - Number(age)}-01-01` : '';

    const rawMobile = r.MOBILE_NO !== undefined && r.MOBILE_NO !== null ? String(r.MOBILE_NO).trim() : '';
    const cleanMobile = rawMobile ? gujToAsciiDigits(rawMobile).replace(/\D/g, '') : '';
    const mobileNo = cleanMobile.length === 10 ? cleanMobile : cleanMobile.length > 10 ? cleanMobile.slice(-10) : '';

    const houseNo = cleanHouseNo(r.makan);
    const serialNo = exportedCount + 1;
    const sectionNo = r.Anubhag_number !== undefined && !isNaN(Number(r.Anubhag_number)) ? Number(r.Anubhag_number) : 1;
    // Map to booths 1 through 10 in the target AC
    const boothNo = (exportedCount % 10) + 1;
    const boothName = `Booth #${boothNo} - ${TARGET_AC}`;

    const voterAddress = cleanText(r.Anubhag_name) || `${TARGET_VILLAGE}, ${TARGET_TALUKA}`;
    const fullAddress = voterAddress;

    const rowData = [
      epicNo,
      '', // First Name (Eng)
      '', // Middle Name (Eng)
      '', // Surname (Eng)
      firstName,
      middleName,
      surname,
      relation,
      guardianName,
      gender,
      age,
      dob,
      mobileNo,
      '', // Email
      '', // Aadhaar No
      '', // PAN No
      houseNo,
      serialNo,
      sectionNo,
      boothName,
      boothNo,
      TARGET_AC,
      TARGET_PC,
      TARGET_DISTRICT,
      TARGET_STATE,
      '', // Religion
      '', // Caste
      '', // Subcaste
      '', // Profession Type
      '', // Profession
      'Voter',
      'ACTIVE',
      'NO',
      '', // Blood Group
      '', // Party
      'NO',
      'NO',
      TARGET_TALUKA,
      TARGET_VILLAGE,
      fullAddress,
      voterAddress,
    ];

    fullSheet.addRow(rowData).commit();
    exportedCount++;
  }

  await fullWorkbook.commit();
  console.log(`[Generate10kOther] Successfully generated ${exportedCount} test voter records in: ${targetFile}`);
  console.log(`[Generate10kOther] Target Constituencies: AC='${TARGET_AC}', PC='${TARGET_PC}', District='${TARGET_DISTRICT}', State='${TARGET_STATE}'`);
};

if (require.main === module) {
  generate10kOtherPcAcVoters()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Generate10kOther] Error:', err);
      process.exit(1);
    });
}
