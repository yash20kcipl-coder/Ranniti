import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { normalizeRelation } from '../utils/relationNormalizer';

const defaultSourceCandidates = [
  path.resolve(__dirname, '../../../101finalomb (1).xlsx'),
  path.resolve(__dirname, '../../../101finalomb.xlsx'),
];

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
  if (typeof raw === 'object') return '';
  const converted = gujToAsciiDigits(raw);
  // Strip orphan Gujarati combining marks (virama U+0ACD, ra-subscript U+0AB0, vowel diacritics U+0A81-U+0ACD)
  // that cause Excel to render dotted circle ◌ placeholders when attached to digits
  const cleaned = converted.replace(/[\u0ACD\u0AB0\u0A81-\u0A83\u0ABC\u0ABE-\u0AC9\u0ACD\u0AE2\u0AE3]/g, '').trim();
  if (/^[\.\-_\/\\#\*\s]+$/.test(cleaned)) return '';
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
  if (/પુરુષ/i.test(str) || /જાતિ\s*[:*ઃ]\s*પુરુષ/i.test(str) || /^m/i.test(str)) return 'Male';
  if (/સ્ત્રી|સ્રી|સ્ટ્રી|સી/i.test(str) || /જાતિ[ં”?ઃ\s]*[:*ઃ]\s*સ્ત્રી/i.test(str) || /^f/i.test(str)) return 'Female';

  // Fallback heuristic based on common Gujarati suffixes
  if (/ભાઈ|કુમાર|લાલ|રામ/i.test(nameStr)) return 'Male';
  if (/બેન|દેવી|બા/i.test(nameStr)) return 'Female';

  return 'Other';
};

const cleanText = (str: any): string => {
  if (str === null || str === undefined) return '';
  if (typeof str === 'object') {
    if (str.error) return '';
    if (str.text != null) return String(str.text).trim();
    if (Array.isArray(str.richText)) return str.richText.map((rt: any) => rt.text).join('').trim();
    return '';
  }
  return String(str)
    .replace(/<[^>]*>/g, '') // Strip HTML tags like <del>...</del>, </b>
    .replace(/^[:*ઃ.\-\s]+/, '')
    .trim();
};

const isHouseNumber = (raw: any): boolean => {
  if (raw === undefined || raw === null || raw === '') return false;
  const s = String(raw).trim();
  const ascii = cleanHouseNo(s);
  return /^[0-9\s\-_\/\\#\*\.A-Za-z]+$/.test(ascii) && /\d/.test(ascii);
};

const stripOcrLoops = (str: string): string => {
  if (!str) return '';
  const tokens = str.split(/\s+/).filter(Boolean);
  const result: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    let j = i;
    while (j < tokens.length && tokens[j].toLowerCase() === tokens[i].toLowerCase()) {
      j++;
    }
    const runLength = j - i;
    if (runLength >= 3) {
      // OCR echo loop hallucination - drop all instances
      i = j;
    } else {
      for (let k = i; k < j; k++) {
        result.push(tokens[k]);
      }
      i = j;
    }
  }
  return result.join(' ');
};

const cleanEngName = (str: any): string => {
  let base = cleanText(str);

  // 1. Strip OCR label prefixes in English
  base = base.replace(
    /^(?:The name of the deceased is|Name of the deceased\s*[:\-]?|Name of the person\s*[:\-]?|Name of the donor\s*[:\-]?|House [nN]ame\s*[:\-]?|Gate [nN]ame\s*[:\-]?|Polling [nN]ame\s*[:\-]?|Husband'?s? [nN]ame\s*[:\-]?|Father'?s? [nN]ame\s*[:\-]?|His name is|Voter'?s [nN]ame\s*[:\-]?|Friend's name\s*[:\-]?|Edge name\s*[:\-]?|Name\s*[:\-]?|Bhootharnu\s*[:\-]?)\s*/i,
    ''
  );

  // 2. Strip machine translation sentence debris
  base = base.replace(
    /\s*\b(?:was done(?:\.\s*He)?|is deceased|has died|was a brother.*|I am a guest of honor.*)\b.*$/i,
    ''
  );

  // 3. Strip leading numbers or isolated numbers
  base = base.replace(/^[0-9]+\s*/, '').replace(/\b\d+\b/g, '');

  // 4. Strip stray Gujarati chars in English column
  base = base.replace(/[\u0A80-\u0AFF]/g, '');
  base = base.replace(/\[object\s*object?\]?/gi, '');

  // 5. Strip trailing punctuation runs like '. . . .', '_ _ _'
  base = base.replace(/[\s._,\-]+$/, '');

  // 6. Strip OCR loop hallucinations
  base = stripOcrLoops(base);

  return base.replace(/\s+/g, ' ').trim();
};

const cleanLocalName = (str: any): string => {
  let base = cleanText(str);

  // 1. Strip OCR label prefixes in Gujarati
  base = base.replace(
    /^(?:મૃતદારનું|મતદારનું|મત્તદારનું|મત્રદારનું|દારનું|ઘરનું|દ્વારનું|યારનું|ધારનું|ભૂતધર્નું|નું|નામ|પિતાનું|પતિનું|પિતા|પતિ)\s*(?:નામ)?\s*[:*ઃ.\-_/\s]+/i,
    ''
  );

  // 2. Strip leading numbers or serial numbers
  base = base.replace(/^[0-9૦-૯]+\s*/, '');
  base = base.replace(/\b[0-9૦-૯]+\b/g, '');

  // 3. Strip trailing punctuation runs like '. . . .', '_ _ _', ', , ,'
  base = base.replace(/[\s._,\-]+$/, '');

  // 4. Strip OCR loop hallucinations (tokens repeated 3+ times)
  base = stripOcrLoops(base);

  return base.replace(/\s+/g, ' ').trim();
};

const parseName = (nameStr: any, fatherNameStr: any, isEnglish = false) => {
  const cleanedName = isEnglish ? cleanEngName(nameStr) : cleanLocalName(nameStr);
  const cleanedFather = isEnglish ? cleanEngName(fatherNameStr) : cleanLocalName(fatherNameStr);
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

const cleanEpicNo = (raw: any): string => {
  if (!raw) return '';
  const str = String(raw).trim().toUpperCase();
  // Match standard 10-char alphanumeric EPIC (e.g. AQV2438349) or old ECI format (e.g. GJ/08/051/033122)
  const match = str.match(/([A-Z]{2}\/\d{2}\/\d{3}\/\d{6}|[A-Z]{3}\d{7})/);
  if (match) return match[1];
  return str.replace(/[^A-Z0-9\/\-_]/g, '');
};

const extractVillage = (addressStr: string): string => {
  if (!addressStr) return '';
  const parts = addressStr.split(',').map((p) => cleanText(p)).filter(Boolean);
  if (parts.length === 0) return '';
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = cleanText(parts[i]);
    if (/^\d{6}$/.test(part)) continue; // Skip 6-digit postal PIN codes
    if (/^(જી\.|જિલ્લો|તા\.|તાલુકો)/i.test(part)) continue; // Skip district/taluka headers
    const cleaned = part
      .replace(/^મુ\.\s*પો\.\s*/i, '')
      .replace(/^[:*ઃ.\-\s]+/, '')
      .trim();
    if (cleaned) return cleaned;
  }
  return cleanText(parts[0]);
};

export const convert101Excel = async (customSource?: string): Promise<void> => {
  const sourceFile = customSource || defaultSourceCandidates.find((f) => fs.existsSync(f)) || defaultSourceCandidates[0];

  console.log(`[Convert] Reading source file: ${sourceFile}`);
  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Source file not found at: ${sourceFile}`);
  }

  const outputDir = path.dirname(targetFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

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

  const sampleRows: (string | number | null)[][] = [headers];

  const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(sourceFile, {
    worksheets: 'emit',
    sharedStrings: 'cache',
    hyperlinks: 'ignore',
    styles: 'ignore',
  });

  let fileHeaders: string[] = [];
  let convertedCount = 0;
  let isFirstRow = true;

  for await (const sheetReader of workbookReader) {
    for await (const row of sheetReader) {
      const values = (row as ExcelJS.Row).values as any[];
      const cells = Array.isArray(values) ? values.slice(1) : [];

      if (isFirstRow) {
        fileHeaders = cells.map((v) => (v != null ? String(v).trim() : ''));
        isFirstRow = false;
        continue;
      }

      const r: Record<string, any> = {};
      for (let i = 0; i < fileHeaders.length; i++) {
        const key = fileHeaders[i];
        if (key) {
          const val = cells[i];
          if (val && typeof val === 'object' && val.richText) {
            r[key] = val.richText.map((rt: any) => rt.text).join('');
          } else if (val && typeof val === 'object' && val.text != null) {
            r[key] = val.text;
          } else {
            r[key] = val != null ? val : null;
          }
        }
      }

      const rawEpic = r.epicNo || r.EPIC_NO || r.epic_no || '';
      const epicNo = cleanEpicNo(rawEpic);
      if (!epicNo) continue;

      // Local Name
      let localName = cleanText(r.epicName || r.Name || '');
      let localFather = cleanText(r['Father Name'] || r.Father_Name || r.Guardian_Name || r['Guardian Name'] || '');

      // English Name
      let engName = cleanText(r.epicNameL1 || '');
      let engFather = cleanText(r['Father NameL1'] || '');

      let houseNo = cleanHouseNo(r.houseNo ?? r.makan);

      // Check if Father Name is actually a House Number (e.g. '33્ર', '107', '152')
      const fatherIsHouse = isHouseNumber(localFather) || /^ઘર|^મકાન/i.test(localFather);

      if (fatherIsHouse) {
        if (!houseNo) {
          houseNo = cleanHouseNo(localFather);
        }
        localFather = '';
        engFather = '';
      }

      // Handle rare OCR-shifted columns where voter name was shifted into Father Name column
      if (!localName && localFather) {
        localName = localFather;
        localFather = '';
      }
      if (!engName && engFather && (!r['Father Name'] || r.Relation === 'મતદ્દારનું')) {
        engName = engFather;
        engFather = '';
      }

      const { firstName, middleName, surname } = parseName(localName, localFather, false);
      let { firstName: engFirstName, middleName: engMiddleName, surname: engSurname } = parseName(engName, engFather, true);

      // In case English Name was completely empty in source (1 row), fallback to local name
      if (!engFirstName && firstName) {
        engFirstName = firstName;
        if (!engSurname && surname) engSurname = surname;
      }

      const gender = parseGender(r.Gender || r.sex, localName || engName);
      const age = parseAge(r.Age || r.age);
      const dob = age ? `${2026 - Number(age)}-01-01` : '';

      // Set clean guardianName and relation: if father was a house number, guardianName is empty
      let guardianName = cleanLocalName(localFather) || cleanEngName(engFather) || '';
      let relation = '';

      if (guardianName) {
        relation = normalizeRelation(r.Relation || r.relation) || (gender === 'Male' ? 'Father' : '');
      }

      const rawMobile = r.mobileNo ?? r.MOBILE_NO ?? '';
      const cleanMobile = rawMobile ? gujToAsciiDigits(rawMobile).replace(/\D/g, '') : '';
      const mobileNo = cleanMobile.length === 10 ? cleanMobile : cleanMobile.length > 10 ? cleanMobile.slice(-10) : '';
      const serialNo = r.PartSerialNo !== undefined && !isNaN(Number(r.PartSerialNo))
        ? Number(r.PartSerialNo)
        : r.sr !== undefined && !isNaN(Number(r.sr))
          ? Number(r.sr)
          : convertedCount + 1;

      const rawSection = r.Anubhag_number !== undefined ? gujToAsciiDigits(r.Anubhag_number) : '1';
      const sectionNo = !isNaN(Number(rawSection)) && Number(rawSection) > 0 ? Number(rawSection) : 1;

      const rawBooth = r.partNo !== undefined ? gujToAsciiDigits(r.partNo) : r.bhag_no !== undefined ? gujToAsciiDigits(r.bhag_no) : '1';
      const boothNo = !isNaN(Number(rawBooth)) && Number(rawBooth) > 0 ? Number(rawBooth) : 1;
      const boothName = `Booth #${boothNo}`;

      const acName = 'Gariyadhar';
      const pcName = 'Amreli';
      const districtName = 'Amreli';
      const stateName = 'Gujarat';
      const taluka = 'Gariadhar';

      const voterAddress = cleanText(r.Anubhag_name);
      const village = extractVillage(voterAddress) || 'Gariadhar';
      const fullAddress = '';

      const rowData = [
        epicNo,
        engFirstName,
        engMiddleName,
        engSurname,
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
        console.log(`[Convert] Processed ${convertedCount} records...`);
      }
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
  const argSource = process.argv[2];
  convert101Excel(argSource)
    .then(() => {
      console.log('Conversion completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Conversion failed:', err);
      process.exit(1);
    });
}
