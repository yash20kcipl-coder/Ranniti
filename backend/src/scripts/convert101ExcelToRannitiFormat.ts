import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

const sourceFile = path.resolve(__dirname, '../../../101finalomb.xlsx');
const targetFile = path.resolve(__dirname, '../../../xlsx/voters_ac_101_formatted.xlsx');
const sampleTargetFile = path.resolve(__dirname, '../../../xlsx/voters_ac_101_sample_5000.xlsx');

const gujToAsciiDigits = (str: any): string => {
  if (!str) return '';
  const map: Record<string, string> = {
    '૦': '0',
    '૧': '1',
    '૨': '2',
    '૩': '3',
    '૪': '4',
    '૫': '5',
    '૬': '6',
    '૭': '7',
    '૮': '8',
    '૯': '9',
  };
  return String(str).replace(/[૦-૯]/g, (d) => map[d] || d);
};

const cleanHouseNo = (raw: any): string => {
  if (raw === undefined || raw === null || raw === '') return '';
  const converted = gujToAsciiDigits(raw);
  // Strip orphan Gujarati combining marks (virama U+0ACD, ra-subscript U+0AB0, vowel diacritics U+0A81-U+0ACD)
  // that cause Excel to render dotted circle ◌ placeholders when attached to digits
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

  // Fallback heuristic based on common Gujarati suffixes
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

const extractVillage = (addressStr: string): string => {
  if (!addressStr) return '';
  const parts = addressStr.split(',');
  if (parts.length > 1) {
    return cleanText(parts[parts.length - 1]);
  }
  return '';
};

export const convert101Excel = async (): Promise<void> => {
  console.log(`[Convert] Reading source file: ${sourceFile}`);
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
  console.log(`[Convert] Successfully loaded ${rawRows.length} rows from sheet '${sheetName}'`);

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

  console.log(`[Convert] Initializing ExcelJS streaming writer for full dataset: ${targetFile}`);
  const fullWorkbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    filename: targetFile,
    useStyles: false,
    useSharedStrings: false,
  });

  const fullSheet = fullWorkbook.addWorksheet('Voters');
  fullSheet.addRow(headers).commit();

  const sampleRows: (string | number)[][] = [headers];

  let convertedCount = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const r = rawRows[i];
    const epicNo = String(r.EPIC_NO || r.epic_no || '').trim().toUpperCase();
    if (!epicNo) continue;

    const { firstName, middleName, surname } = parseName(r.Name, r['Father Name']);
    const relation = cleanText(r.Relation || r.relation || '');
    const guardianName = cleanText(r['Father Name'] || r.Father_Name || r.Guardian_Name || r['Guardian Name'] || '');
    const gender = parseGender(r.sex, r.Name);
    const age = parseAge(r.age);
    const dob = age ? `${2026 - Number(age)}-01-01` : '';

    const rawMobile = r.MOBILE_NO !== undefined && r.MOBILE_NO !== null ? String(r.MOBILE_NO).trim() : '';
    const cleanMobile = rawMobile ? gujToAsciiDigits(rawMobile).replace(/\D/g, '') : '';
    const mobileNo = cleanMobile.length === 10 ? cleanMobile : cleanMobile.length > 10 ? cleanMobile.slice(-10) : '';

    const houseNo = cleanHouseNo(r.makan);
    const serialNo = r.sr !== undefined && !isNaN(Number(r.sr)) ? Number(r.sr) : i + 1;
    const sectionNo = r.Anubhag_number !== undefined && !isNaN(Number(r.Anubhag_number)) ? Number(r.Anubhag_number) : 1;
    const boothNo = r.bhag_no !== undefined && !isNaN(Number(r.bhag_no)) ? Number(r.bhag_no) : 1;
    const boothName = `Booth #${boothNo}`;

    const acName = 'Gariyadhar';
    const pcName = 'Amreli';
    const districtName = 'Amreli';
    const stateName = 'Gujarat';
    const taluka = 'Gariadhar';

    const voterAddress = cleanText(r.Anubhag_name);
    const village = extractVillage(voterAddress) || 'Gariadhar';
    const fullAddress = ''; // Avoid full address for now

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
      acName,
      pcName,
      districtName,
      stateName,
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
      taluka,
      village,
      fullAddress,
      voterAddress,
    ];

    fullSheet.addRow(rowData).commit();
    convertedCount++;

    if (sampleRows.length <= 5000) {
      sampleRows.push(rowData);
    }

    if (convertedCount % 25000 === 0) {
      console.log(`[Convert] Processed ${convertedCount} / ${rawRows.length} records...`);
    }
  }

  console.log(`[Convert] Committing full workbook to disk...`);
  await fullSheet.commit();
  await fullWorkbook.commit();
  console.log(`[Convert] Successfully generated full copy: ${targetFile} (${convertedCount} rows)`);

  // Write 5,000 sample file for fast browser testing
  console.log(`[Convert] Generating 5,000 records sample copy: ${sampleTargetFile}`);
  const sampleWs = XLSX.utils.aoa_to_sheet(sampleRows, { cellDates: false });
  const sampleWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(sampleWb, sampleWs, 'Voters');
  XLSX.writeFile(sampleWb, sampleTargetFile, { bookType: 'xlsx' });
  console.log(`[Convert] Successfully generated sample copy: ${sampleTargetFile} (${sampleRows.length - 1} rows)`);
};

if (require.main === module) {
  convert101Excel()
    .then(() => {
      console.log('Conversion completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Conversion failed:', err);
      process.exit(1);
    });
}
