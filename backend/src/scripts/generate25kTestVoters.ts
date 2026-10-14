import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';

const targetFile = path.resolve(__dirname, '../../../xlsx/voters_25k_test_data.xlsx');
const TARGET_COUNT = 25000;

// Test entity configuration
const TARGET_PC = 'TEST PC 99';
const TARGET_PC_NO = 99;
const TARGET_AC = 'TEST AC 999';
const TARGET_AC_NO = 999;
const TARGET_DISTRICT = 'TEST District';
const TARGET_STATE = 'Gujarat';
const TARGET_TALUKA = 'TEST Taluka';

const MALE_NAMES_ENG = [
  'Aakash', 'Bharat', 'Chirag', 'Dipak', 'Ishwar', 'Jayesh', 'Kalpesh',
  'Manoj', 'Nilesh', 'Paresh', 'Rajesh', 'Suresh', 'Tushar', 'Vijay', 'Yogesh',
];
const FEMALE_NAMES_ENG = [
  'Anita', 'Bhavna', 'Chetna', 'Daksha', 'Gita', 'Hina', 'Jayshree',
  'Kiran', 'Lata', 'Meena', 'Neha', 'Pooja', 'Rekha', 'Sarita', 'Varsha',
];
const SURNAMES_ENG = [
  'Patel', 'Shah', 'Mehta', 'Joshi', 'Desai', 'Chavda', 'Rathod',
  'Varma', 'Parmar', 'Solanki', 'Gohil', 'Zala', 'Trivedi', 'Bhatt',
];

const MALE_NAMES_LOCAL: Record<string, string> = {
  Aakash: 'આકાશ', Bharat: 'ભરત', Chirag: 'ચિરાગ', Dipak: 'દિપક', Ishwar: 'ઈશ્વર',
  Jayesh: 'જયેશ', Kalpesh: 'કલ્પેશ', Manoj: 'મનોજ', Nilesh: 'નિલેશ', Paresh: 'પરેશ',
  Rajesh: 'રાજેશ', Suresh: 'સુરેશ', Tushar: 'તુષાર', Vijay: 'વિજય', Yogesh: 'યોગેશ',
};
const FEMALE_NAMES_LOCAL: Record<string, string> = {
  Anita: 'અનીતા', Bhavna: 'ભાવના', Chetna: 'ચેતના', Daksha: 'દક્ષા', Gita: 'ગીતા',
  Hina: 'હિના', Jayshree: 'જયશ્રી', Kiran: 'કિરણ', Lata: 'લતા', Meena: 'મીના',
  Neha: 'નેહા', Pooja: 'પૂજા', Rekha: 'રેખા', Sarita: 'સરિતા', Varsha: 'વર્ષા',
};
const SURNAMES_LOCAL: Record<string, string> = {
  Patel: 'પટેલ', Shah: 'શાહ', Mehta: 'મહેતા', Joshi: 'જોશી', Desai: 'દેસાઈ',
  Chavda: 'ચાવડા', Rathod: 'રાઠોડ', Varma: 'વર્મા', Parmar: 'પરમાર',
  Solanki: 'સોલંકી', Gohil: 'ગોહિલ', Zala: 'ઝાલા', Trivedi: 'ત્રિવેદી', Bhatt: 'ભટ્ટ',
};

const BLOOD_GROUPS = ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'O-'];
const PROFESSIONS = ['Teacher', 'Engineer', 'Farmer', 'Business', 'Advocate', 'Doctor', 'Shopkeeper'];

export async function generate25kTestVoters(): Promise<string> {
  const outputDir = path.dirname(targetFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`[Generate25kTestVoters] Initializing streaming Excel workbook: ${targetFile}`);

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    filename: targetFile,
    useStyles: false,
    useSharedStrings: false,
  });

  const sheet = workbook.addWorksheet('Voters');

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
    'Ward Name',
    'Ward No',
    'Booth Name',
    'Booth No',
    'AC Name',
    'AC No',
    'PC Name',
    'PC No',
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

  sheet.addRow(headers).commit();

  const TOTAL_BOOTHS = 25;
  const VOTERS_PER_BOOTH = TARGET_COUNT / TOTAL_BOOTHS; // 1000 voters per booth
  const BOOTHS_PER_WARD = 5; // 5 booths per ward = 5 wards total

  let globalIndex = 0;

  for (let boothIdx = 1; boothIdx <= TOTAL_BOOTHS; boothIdx++) {
    const boothNo = boothIdx;
    const boothName = `TEST Booth #${boothNo} (${TARGET_AC})`;
    const wardNo = Math.floor((boothIdx - 1) / BOOTHS_PER_WARD) + 1;
    const wardName = `TEST Ward ${wardNo} - ${TARGET_AC}`;
    const villageName = `TEST Village ${wardNo}`;

    for (let voterInBooth = 1; voterInBooth <= VOTERS_PER_BOOTH; voterInBooth++) {
      globalIndex++;

      const voterSeqStr = String(globalIndex).padStart(5, '0');
      const epicNo = `TEST_EPIC_${voterSeqStr}`;

      // Household structuring: 5 voters per household family
      const houseNum = Math.floor((voterInBooth - 1) / 5) + 1;
      const memberInHouse = (voterInBooth - 1) % 5;
      const houseNo = `TEST-H-${houseNum}`;

      const surnameEng = SURNAMES_ENG[(houseNum + boothIdx) % SURNAMES_ENG.length];
      const surnameLocal = SURNAMES_LOCAL[surnameEng] || 'ટેસ્ટ અટક';

      let gender: 'Male' | 'Female';
      let firstNameEng: string;
      let firstNameLocal: string;
      let middleNameEng: string;
      let middleNameLocal: string;
      let relation: string;
      let guardianName: string;
      let age: number;

      if (memberInHouse === 0) {
        // Head of household (Father/Husband)
        gender = 'Male';
        firstNameEng = `TEST ${MALE_NAMES_ENG[(houseNum * 3) % MALE_NAMES_ENG.length]}`;
        firstNameLocal = `ટેસ્ટ ${MALE_NAMES_LOCAL[MALE_NAMES_ENG[(houseNum * 3) % MALE_NAMES_ENG.length]] || 'નામ'}`;
        middleNameEng = `TEST ${MALE_NAMES_ENG[(houseNum * 7) % MALE_NAMES_ENG.length]}`;
        middleNameLocal = `ટેસ્ટ ${MALE_NAMES_LOCAL[MALE_NAMES_ENG[(houseNum * 7) % MALE_NAMES_ENG.length]] || 'નામ'}`;
        relation = 'Father';
        guardianName = `${middleNameEng} ${surnameEng}`;
        age = 50 + (houseNum % 25);
      } else if (memberInHouse === 1) {
        // Spouse (Mother/Wife)
        gender = 'Female';
        firstNameEng = `TEST ${FEMALE_NAMES_ENG[(houseNum * 2) % FEMALE_NAMES_ENG.length]}`;
        firstNameLocal = `ટેસ્ટ ${FEMALE_NAMES_LOCAL[FEMALE_NAMES_ENG[(houseNum * 2) % FEMALE_NAMES_ENG.length]] || 'નામ'}`;
        middleNameEng = `TEST ${MALE_NAMES_ENG[(houseNum * 3) % MALE_NAMES_ENG.length]}`;
        middleNameLocal = `ટેસ્ટ ${MALE_NAMES_LOCAL[MALE_NAMES_ENG[(houseNum * 3) % MALE_NAMES_ENG.length]] || 'નામ'}`;
        relation = 'Husband';
        guardianName = `${middleNameEng} ${surnameEng}`;
        age = 47 + (houseNum % 23);
      } else if (memberInHouse === 2) {
        // Eldest child
        gender = (houseNum % 2 === 0) ? 'Male' : 'Female';
        const rawName = gender === 'Male'
          ? MALE_NAMES_ENG[(houseNum + 1) % MALE_NAMES_ENG.length]
          : FEMALE_NAMES_ENG[(houseNum + 1) % FEMALE_NAMES_ENG.length];
        firstNameEng = `TEST ${rawName}`;
        firstNameLocal = `ટેસ્ટ ${gender === 'Male' ? MALE_NAMES_LOCAL[rawName] : FEMALE_NAMES_LOCAL[rawName]}`;
        middleNameEng = `TEST ${MALE_NAMES_ENG[(houseNum * 3) % MALE_NAMES_ENG.length]}`;
        middleNameLocal = `ટેસ્ટ ${MALE_NAMES_LOCAL[MALE_NAMES_ENG[(houseNum * 3) % MALE_NAMES_ENG.length]] || 'નામ'}`;
        relation = 'Father';
        guardianName = `${middleNameEng} ${surnameEng}`;
        age = 26 + (houseNum % 6);
      } else if (memberInHouse === 3) {
        // Second child
        gender = (houseNum % 2 === 0) ? 'Female' : 'Male';
        const rawName = gender === 'Male'
          ? MALE_NAMES_ENG[(houseNum + 5) % MALE_NAMES_ENG.length]
          : FEMALE_NAMES_ENG[(houseNum + 5) % FEMALE_NAMES_ENG.length];
        firstNameEng = `TEST ${rawName}`;
        firstNameLocal = `ટેસ્ટ ${gender === 'Male' ? MALE_NAMES_LOCAL[rawName] : FEMALE_NAMES_LOCAL[rawName]}`;
        middleNameEng = `TEST ${MALE_NAMES_ENG[(houseNum * 3) % MALE_NAMES_ENG.length]}`;
        middleNameLocal = `ટેસ્ટ ${MALE_NAMES_LOCAL[MALE_NAMES_ENG[(houseNum * 3) % MALE_NAMES_ENG.length]] || 'નામ'}`;
        relation = 'Father';
        guardianName = `${middleNameEng} ${surnameEng}`;
        age = 22 + (houseNum % 5);
      } else {
        // Third child or elder
        gender = (houseNum % 3 === 0) ? 'Female' : 'Male';
        const rawName = gender === 'Male'
          ? MALE_NAMES_ENG[(houseNum + 9) % MALE_NAMES_ENG.length]
          : FEMALE_NAMES_ENG[(houseNum + 9) % FEMALE_NAMES_ENG.length];
        firstNameEng = `TEST ${rawName}`;
        firstNameLocal = `ટેસ્ટ ${gender === 'Male' ? MALE_NAMES_LOCAL[rawName] : FEMALE_NAMES_LOCAL[rawName]}`;
        middleNameEng = `TEST ${MALE_NAMES_ENG[(houseNum * 3) % MALE_NAMES_ENG.length]}`;
        middleNameLocal = `ટેસ્ટ ${MALE_NAMES_LOCAL[MALE_NAMES_ENG[(houseNum * 3) % MALE_NAMES_ENG.length]] || 'નામ'}`;
        relation = 'Father';
        guardianName = `${middleNameEng} ${surnameEng}`;
        age = 19 + (houseNum % 4);
      }

      const birthYear = 2026 - age;
      const dob = `${birthYear}-05-15`;

      // 10-digit clean mobile starting with 9879
      const mobileNo = `9879${String(globalIndex).padStart(6, '0')}`;
      const email = `test_voter_${voterSeqStr}@testranniti.com`;

      const serialNo = voterInBooth;
      const sectionNo = Math.floor((voterInBooth - 1) / 200) + 1; // 5 sections per booth

      const religion = (houseNum % 10 === 0) ? 'TEST Muslim' : (houseNum % 15 === 0) ? 'TEST Jain' : 'TEST Hindu';
      const caste = (houseNum % 3 === 0) ? 'TEST OBC' : (houseNum % 5 === 0) ? 'TEST SC' : 'TEST General';
      const subcaste = `TEST ${surnameEng}`;
      const professionType = (houseNum % 2 === 0) ? 'TEST Business' : 'TEST Service';
      const profession = `TEST ${PROFESSIONS[houseNum % PROFESSIONS.length]}`;

      const bloodGroup = BLOOD_GROUPS[houseNum % BLOOD_GROUPS.length];
      const isDead = 'NO';
      const status = 'ACTIVE';

      // 5 family influencers and 2 social influencers per booth
      const isFamilyInfluencer = (memberInHouse === 0 && houseNum <= 5) ? 'YES' : 'NO';
      const isSocialInfluencer = (memberInHouse === 0 && (houseNum === 7 || houseNum === 14)) ? 'YES' : 'NO';

      const fullAddress = `TEST House No ${houseNum}, ${wardName}, ${villageName}, ${TARGET_TALUKA}, ${TARGET_DISTRICT}`;
      const voterAddress = `TEST Street ${sectionNo}, ${boothName}, ${wardName}`;

      const rowValues = [
        epicNo,
        firstNameEng,
        middleNameEng,
        `TEST ${surnameEng}`,
        firstNameLocal,
        middleNameLocal,
        surnameLocal,
        relation,
        guardianName,
        gender,
        age,
        dob,
        mobileNo,
        email,
        '', // Aadhaar
        '', // PAN
        houseNo,
        serialNo,
        sectionNo,
        wardName,
        wardNo,
        boothName,
        boothNo,
        TARGET_AC,
        TARGET_AC_NO,
        TARGET_PC,
        TARGET_PC_NO,
        TARGET_DISTRICT,
        TARGET_STATE,
        religion,
        caste,
        subcaste,
        professionType,
        profession,
        'TEST Voter',
        status,
        isDead,
        bloodGroup,
        'TEST Party',
        isFamilyInfluencer,
        isSocialInfluencer,
        TARGET_TALUKA,
        villageName,
        fullAddress,
        voterAddress,
      ];

      sheet.addRow(rowValues).commit();

      if (globalIndex % 5000 === 0) {
        console.log(`[Generate25kTestVoters] Streamed ${globalIndex} / ${TARGET_COUNT} rows...`);
      }
    }
  }

  await workbook.commit();
  console.log(`[Generate25kTestVoters] ✅ Successfully generated ${TARGET_COUNT} test voters in: ${targetFile}`);
  return targetFile;
}

if (require.main === module) {
  generate25kTestVoters()
    .then((filePath) => {
      console.log(`File ready at: ${filePath}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error generating file:', err);
      process.exit(1);
    });
}
