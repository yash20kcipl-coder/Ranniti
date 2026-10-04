import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';

export interface RegionDataRecord {
  stateName: string;
  regionName: string;
  districtName: string;
  description?: string;
}

export const sampleRegionsData: RegionDataRecord[] = [
  // MAHARASHTRA
  { stateName: 'Maharashtra', regionName: 'Paschim Maharashtra', districtName: 'Pune', description: 'Western Maharashtra Sugarcane Belt' },
  { stateName: 'Maharashtra', regionName: 'Paschim Maharashtra', districtName: 'Satara', description: 'Western Maharashtra Sugarcane Belt' },
  { stateName: 'Maharashtra', regionName: 'Paschim Maharashtra', districtName: 'Sangli', description: 'Western Maharashtra Sugarcane Belt' },
  { stateName: 'Maharashtra', regionName: 'Paschim Maharashtra', districtName: 'Kolhapur', description: 'Western Maharashtra Sugarcane Belt' },
  { stateName: 'Maharashtra', regionName: 'Paschim Maharashtra', districtName: 'Solapur', description: 'Western Maharashtra Sugarcane Belt' },

  { stateName: 'Maharashtra', regionName: 'Marathwada', districtName: 'Chhatrapati Sambhaji Nagar', description: 'Marathwada Region' },
  { stateName: 'Maharashtra', regionName: 'Marathwada', districtName: 'Jalna', description: 'Marathwada Region' },
  { stateName: 'Maharashtra', regionName: 'Marathwada', districtName: 'Beed', description: 'Marathwada Region' },
  { stateName: 'Maharashtra', regionName: 'Marathwada', districtName: 'Dharashiv', description: 'Marathwada Region' },
  { stateName: 'Maharashtra', regionName: 'Marathwada', districtName: 'Nanded', description: 'Marathwada Region' },
  { stateName: 'Maharashtra', regionName: 'Marathwada', districtName: 'Latur', description: 'Marathwada Region' },
  { stateName: 'Maharashtra', regionName: 'Marathwada', districtName: 'Parbhani', description: 'Marathwada Region' },
  { stateName: 'Maharashtra', regionName: 'Marathwada', districtName: 'Hingoli', description: 'Marathwada Region' },

  { stateName: 'Maharashtra', regionName: 'Vidarbha', districtName: 'Nagpur', description: 'Vidarbha Region' },
  { stateName: 'Maharashtra', regionName: 'Vidarbha', districtName: 'Bhandara', description: 'Vidarbha Region' },
  { stateName: 'Maharashtra', regionName: 'Vidarbha', districtName: 'Gondia', description: 'Vidarbha Region' },
  { stateName: 'Maharashtra', regionName: 'Vidarbha', districtName: 'Chandrapur', description: 'Vidarbha Region' },
  { stateName: 'Maharashtra', regionName: 'Vidarbha', districtName: 'Gadchiroli', description: 'Vidarbha Region' },
  { stateName: 'Maharashtra', regionName: 'Vidarbha', districtName: 'Wardha', description: 'Vidarbha Region' },
  { stateName: 'Maharashtra', regionName: 'Vidarbha', districtName: 'Amravati', description: 'Vidarbha Region' },
  { stateName: 'Maharashtra', regionName: 'Vidarbha', districtName: 'Akola', description: 'Vidarbha Region' },
  { stateName: 'Maharashtra', regionName: 'Vidarbha', districtName: 'Yavatmal', description: 'Vidarbha Region' },
  { stateName: 'Maharashtra', regionName: 'Vidarbha', districtName: 'Buldhana', description: 'Vidarbha Region' },
  { stateName: 'Maharashtra', regionName: 'Vidarbha', districtName: 'Washim', description: 'Vidarbha Region' },

  { stateName: 'Maharashtra', regionName: 'Konkan', districtName: 'Thane', description: 'Konkan Coastal Region' },
  { stateName: 'Maharashtra', regionName: 'Konkan', districtName: 'Palghar', description: 'Konkan Coastal Region' },
  { stateName: 'Maharashtra', regionName: 'Konkan', districtName: 'Raigad', description: 'Konkan Coastal Region' },
  { stateName: 'Maharashtra', regionName: 'Konkan', districtName: 'Ratnagiri', description: 'Konkan Coastal Region' },
  { stateName: 'Maharashtra', regionName: 'Konkan', districtName: 'Sindhudurg', description: 'Konkan Coastal Region' },
  { stateName: 'Maharashtra', regionName: 'Mumbai Metropolitan Region', districtName: 'Mumbai City', description: 'MMR Capital' },
  { stateName: 'Maharashtra', regionName: 'Mumbai Metropolitan Region', districtName: 'Mumbai Suburban', description: 'MMR Capital' },

  { stateName: 'Maharashtra', regionName: 'Khandesh', districtName: 'Nashik', description: 'North Maharashtra' },
  { stateName: 'Maharashtra', regionName: 'Khandesh', districtName: 'Dhule', description: 'North Maharashtra' },
  { stateName: 'Maharashtra', regionName: 'Khandesh', districtName: 'Jalgaon', description: 'North Maharashtra' },
  { stateName: 'Maharashtra', regionName: 'Khandesh', districtName: 'Nandurbar', description: 'North Maharashtra' },
  { stateName: 'Maharashtra', regionName: 'Khandesh', districtName: 'Ahilyanagar', description: 'North Maharashtra' },

  // UTTAR PRADESH
  { stateName: 'Uttar Pradesh', regionName: 'Poorvanchal', districtName: 'Varanasi', description: 'Eastern UP' },
  { stateName: 'Uttar Pradesh', regionName: 'Poorvanchal', districtName: 'Gorakhpur', description: 'Eastern UP' },
  { stateName: 'Uttar Pradesh', regionName: 'Poorvanchal', districtName: 'Azamgarh', description: 'Eastern UP' },
  { stateName: 'Uttar Pradesh', regionName: 'Poorvanchal', districtName: 'Ghazipur', description: 'Eastern UP' },
  { stateName: 'Uttar Pradesh', regionName: 'Poorvanchal', districtName: 'Ballia', description: 'Eastern UP' },
  { stateName: 'Uttar Pradesh', regionName: 'Poorvanchal', districtName: 'Jaunpur', description: 'Eastern UP' },
  { stateName: 'Uttar Pradesh', regionName: 'Poorvanchal', districtName: 'Prayagraj', description: 'Eastern UP' },

  { stateName: 'Uttar Pradesh', regionName: 'Awadh', districtName: 'Lucknow', description: 'Central UP' },
  { stateName: 'Uttar Pradesh', regionName: 'Awadh', districtName: 'Ayodhya', description: 'Central UP' },
  { stateName: 'Uttar Pradesh', regionName: 'Awadh', districtName: 'Barabanki', description: 'Central UP' },
  { stateName: 'Uttar Pradesh', regionName: 'Awadh', districtName: 'Rae Bareli', description: 'Central UP' },
  { stateName: 'Uttar Pradesh', regionName: 'Awadh', districtName: 'Amethi', description: 'Central UP' },
  { stateName: 'Uttar Pradesh', regionName: 'Awadh', districtName: 'Sitapur', description: 'Central UP' },

  { stateName: 'Uttar Pradesh', regionName: 'Paschim Pradesh', districtName: 'Meerut', description: 'Western UP Belt' },
  { stateName: 'Uttar Pradesh', regionName: 'Paschim Pradesh', districtName: 'Saharanpur', description: 'Western UP Belt' },
  { stateName: 'Uttar Pradesh', regionName: 'Paschim Pradesh', districtName: 'Muzaffarnagar', description: 'Western UP Belt' },
  { stateName: 'Uttar Pradesh', regionName: 'Paschim Pradesh', districtName: 'Gautam Buddha Nagar', description: 'Western UP Belt' },
  { stateName: 'Uttar Pradesh', regionName: 'Paschim Pradesh', districtName: 'Ghaziabad', description: 'Western UP Belt' },
  { stateName: 'Uttar Pradesh', regionName: 'Paschim Pradesh', districtName: 'Agra', description: 'Western UP Belt' },
  { stateName: 'Uttar Pradesh', regionName: 'Paschim Pradesh', districtName: 'Mathura', description: 'Western UP Belt' },
  { stateName: 'Uttar Pradesh', regionName: 'Paschim Pradesh', districtName: 'Aligarh', description: 'Western UP Belt' },

  { stateName: 'Uttar Pradesh', regionName: 'Bundelkhand', districtName: 'Jhansi', description: 'Bundelkhand Plateau' },
  { stateName: 'Uttar Pradesh', regionName: 'Bundelkhand', districtName: 'Banda', description: 'Bundelkhand Plateau' },
  { stateName: 'Uttar Pradesh', regionName: 'Bundelkhand', districtName: 'Lalitpur', description: 'Bundelkhand Plateau' },
  { stateName: 'Uttar Pradesh', regionName: 'Bundelkhand', districtName: 'Mahoba', description: 'Bundelkhand Plateau' },

  // GUJARAT
  { stateName: 'Gujarat', regionName: 'Saurashtra', districtName: 'Rajkot', description: 'Saurashtra Peninsula' },
  { stateName: 'Gujarat', regionName: 'Saurashtra', districtName: 'Jamnagar', description: 'Saurashtra Peninsula' },
  { stateName: 'Gujarat', regionName: 'Saurashtra', districtName: 'Junagadh', description: 'Saurashtra Peninsula' },
  { stateName: 'Gujarat', regionName: 'Saurashtra', districtName: 'Bhavnagar', description: 'Saurashtra Peninsula' },
  { stateName: 'Gujarat', regionName: 'Saurashtra', districtName: 'Amreli', description: 'Saurashtra Peninsula' },
  { stateName: 'Gujarat', regionName: 'Kutch', districtName: 'Kutch', description: 'Kutch Region' },
  { stateName: 'Gujarat', regionName: 'North Gujarat', districtName: 'Mehsana', description: 'North Gujarat' },
  { stateName: 'Gujarat', regionName: 'North Gujarat', districtName: 'Banaskantha', description: 'North Gujarat' },
  { stateName: 'Gujarat', regionName: 'North Gujarat', districtName: 'Gandhinagar', description: 'North Gujarat' },
  { stateName: 'Gujarat', regionName: 'Central Gujarat', districtName: 'Ahmedabad', description: 'Central Gujarat' },
  { stateName: 'Gujarat', regionName: 'Central Gujarat', districtName: 'Vadodara', description: 'Central Gujarat' },
  { stateName: 'Gujarat', regionName: 'South Gujarat', districtName: 'Surat', description: 'South Gujarat' },
  { stateName: 'Gujarat', regionName: 'South Gujarat', districtName: 'Navsari', description: 'South Gujarat' },

  // BIHAR
  { stateName: 'Bihar', regionName: 'Mithila / Tirhut', districtName: 'Darbhanga', description: 'Mithilanchal' },
  { stateName: 'Bihar', regionName: 'Mithila / Tirhut', districtName: 'Madhubani', description: 'Mithilanchal' },
  { stateName: 'Bihar', regionName: 'Mithila / Tirhut', districtName: 'Muzaffarpur', description: 'Tirhut' },
  { stateName: 'Bihar', regionName: 'Magadh', districtName: 'Patna', description: 'Magadh Region' },
  { stateName: 'Bihar', regionName: 'Magadh', districtName: 'Gaya', description: 'Magadh Region' },
  { stateName: 'Bihar', regionName: 'Magadh', districtName: 'Nalanda', description: 'Magadh Region' },
  { stateName: 'Bihar', regionName: 'Seemanchal', districtName: 'Purnia', description: 'Eastern Seemanchal' },
  { stateName: 'Bihar', regionName: 'Seemanchal', districtName: 'Katihar', description: 'Eastern Seemanchal' },
  { stateName: 'Bihar', regionName: 'Seemanchal', districtName: 'Kishanganj', description: 'Eastern Seemanchal' },
  { stateName: 'Bihar', regionName: 'Bhojpur', districtName: 'Bhojpur', description: 'Western Bihar' },
  { stateName: 'Bihar', regionName: 'Bhojpur', districtName: 'Buxar', description: 'Western Bihar' },

  // KARNATAKA
  { stateName: 'Karnataka', regionName: 'Kittur Karnataka', districtName: 'Belagavi', description: 'North West Karnataka' },
  { stateName: 'Karnataka', regionName: 'Kittur Karnataka', districtName: 'Dharwad', description: 'North West Karnataka' },
  { stateName: 'Karnataka', regionName: 'Kalyana Karnataka', districtName: 'Kalaburagi', description: 'Hyderabad Karnataka' },
  { stateName: 'Karnataka', regionName: 'Kalyana Karnataka', districtName: 'Ballari', description: 'Hyderabad Karnataka' },
  { stateName: 'Karnataka', regionName: 'Old Mysore', districtName: 'Mysuru', description: 'South Karnataka' },
  { stateName: 'Karnataka', regionName: 'Old Mysore', districtName: 'Mandya', description: 'South Karnataka' },
  { stateName: 'Karnataka', regionName: 'Old Mysore', districtName: 'Bengaluru Urban', description: 'Capital Region' },
  { stateName: 'Karnataka', regionName: 'Karavali', districtName: 'Dakshina Kannada', description: 'Coastal Karnataka' },
  { stateName: 'Karnataka', regionName: 'Karavali', districtName: 'Udupi', description: 'Coastal Karnataka' },

  // PUNJAB
  { stateName: 'Punjab', regionName: 'Malwa', districtName: 'Ludhiana', description: 'Southern Malwa Belt' },
  { stateName: 'Punjab', regionName: 'Malwa', districtName: 'Patiala', description: 'Southern Malwa Belt' },
  { stateName: 'Punjab', regionName: 'Malwa', districtName: 'Bathinda', description: 'Southern Malwa Belt' },
  { stateName: 'Punjab', regionName: 'Majha', districtName: 'Amritsar', description: 'Border Majha Region' },
  { stateName: 'Punjab', regionName: 'Majha', districtName: 'Gurdaspur', description: 'Border Majha Region' },
  { stateName: 'Punjab', regionName: 'Doaba', districtName: 'Jalandhar', description: 'Doaba NRI Belt' },
  { stateName: 'Punjab', regionName: 'Doaba', districtName: 'Hoshiarpur', description: 'Doaba NRI Belt' },

  // TAMIL NADU
  { stateName: 'Tamil Nadu', regionName: 'Kongu Nadu', districtName: 'Coimbatore', description: 'Western TN' },
  { stateName: 'Tamil Nadu', regionName: 'Kongu Nadu', districtName: 'Tiruppur', description: 'Western TN' },
  { stateName: 'Tamil Nadu', regionName: 'Kongu Nadu', districtName: 'Erode', description: 'Western TN' },
  { stateName: 'Tamil Nadu', regionName: 'Kongu Nadu', districtName: 'Salem', description: 'Western TN' },
  { stateName: 'Tamil Nadu', regionName: 'Tondaimandalam', districtName: 'Chennai', description: 'Northern TN' },
  { stateName: 'Tamil Nadu', regionName: 'Tondaimandalam', districtName: 'Kanchipuram', description: 'Northern TN' },
  { stateName: 'Tamil Nadu', regionName: 'Chola Nadu', districtName: 'Thanjavur', description: 'Delta Region' },
  { stateName: 'Tamil Nadu', regionName: 'Chola Nadu', districtName: 'Tiruchirappalli', description: 'Delta Region' },
  { stateName: 'Tamil Nadu', regionName: 'Pandya Nadu', districtName: 'Madurai', description: 'Southern TN' },
  { stateName: 'Tamil Nadu', regionName: 'Pandya Nadu', districtName: 'Tirunelveli', description: 'Southern TN' },

  // RAJASTHAN
  { stateName: 'Rajasthan', regionName: 'Marwar', districtName: 'Jodhpur', description: 'Western Desert Region' },
  { stateName: 'Rajasthan', regionName: 'Marwar', districtName: 'Barmer', description: 'Western Desert Region' },
  { stateName: 'Rajasthan', regionName: 'Mewar', districtName: 'Udaipur', description: 'Southern Mewar' },
  { stateName: 'Rajasthan', regionName: 'Mewar', districtName: 'Chittorgarh', description: 'Southern Mewar' },
  { stateName: 'Rajasthan', regionName: 'Dhundhar', districtName: 'Jaipur', description: 'Central Capital Region' },
  { stateName: 'Rajasthan', regionName: 'Hadoti', districtName: 'Kota', description: 'South Eastern Hadoti' },
  { stateName: 'Rajasthan', regionName: 'Shekhawati', districtName: 'Sikar', description: 'Northern Shekhawati' },

  // WEST BENGAL
  { stateName: 'West Bengal', regionName: 'North Bengal', districtName: 'Darjeeling', description: 'Himalayan & Dooars' },
  { stateName: 'West Bengal', regionName: 'North Bengal', districtName: 'Jalpaiguri', description: 'Himalayan & Dooars' },
  { stateName: 'West Bengal', regionName: 'North Bengal', districtName: 'Malda', description: 'North Bengal Plains' },
  { stateName: 'West Bengal', regionName: 'South Bengal', districtName: 'Kolkata', description: 'Presidency Region' },
  { stateName: 'West Bengal', regionName: 'South Bengal', districtName: 'North 24 Parganas', description: 'Presidency Region' },
  { stateName: 'West Bengal', regionName: 'Rarh', districtName: 'Paschim Medinipur', description: 'Western Tribal Belt' },
  { stateName: 'West Bengal', regionName: 'Rarh', districtName: 'Bankura', description: 'Western Tribal Belt' },

  // TELANGANA
  { stateName: 'Telangana', regionName: 'North Telangana', districtName: 'Nizamabad', description: 'Northern Districts' },
  { stateName: 'Telangana', regionName: 'North Telangana', districtName: 'Karimnagar', description: 'Northern Districts' },
  { stateName: 'Telangana', regionName: 'Central Telangana', districtName: 'Hyderabad', description: 'Capital Region' },
  { stateName: 'Telangana', regionName: 'South Telangana', districtName: 'Mahabubnagar', description: 'Southern Districts' },
  { stateName: 'Telangana', regionName: 'South Telangana', districtName: 'Nalgonda', description: 'Southern Districts' },

  // ANDHRA PRADESH
  { stateName: 'Andhra Pradesh', regionName: 'Uttara Andhra', districtName: 'Visakhapatnam', description: 'North Coastal AP' },
  { stateName: 'Andhra Pradesh', regionName: 'Uttara Andhra', districtName: 'Vizianagaram', description: 'North Coastal AP' },
  { stateName: 'Andhra Pradesh', regionName: 'Kosta Andhra', districtName: 'Vijayawada / NTR', description: 'Central Coastal AP' },
  { stateName: 'Andhra Pradesh', regionName: 'Kosta Andhra', districtName: 'Guntur', description: 'Central Coastal AP' },
  { stateName: 'Andhra Pradesh', regionName: 'Rayalaseema', districtName: 'Ananthapuramu', description: 'Rayalaseema Region' },
  { stateName: 'Andhra Pradesh', regionName: 'Rayalaseema', districtName: 'Chittoor', description: 'Rayalaseema Region' },

  // KERALA
  { stateName: 'Kerala', regionName: 'Malabar', districtName: 'Kozhikode', description: 'North Kerala' },
  { stateName: 'Kerala', regionName: 'Malabar', districtName: 'Kannur', description: 'North Kerala' },
  { stateName: 'Kerala', regionName: 'Kochi / Central Kerala', districtName: 'Ernakulam', description: 'Central Kerala' },
  { stateName: 'Kerala', regionName: 'Kochi / Central Kerala', districtName: 'Thrissur', description: 'Central Kerala' },
  { stateName: 'Kerala', regionName: 'Travancore', districtName: 'Thiruvananthapuram', description: 'South Kerala' }
];

export const generateRegionsXlsx = async (): Promise<string[]> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ranniti System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Indian Administrative Regions');

  worksheet.columns = [
    { header: 'State Name', key: 'stateName', width: 25 },
    { header: 'Region Name', key: 'regionName', width: 30 },
    { header: 'District Name', key: 'districtName', width: 30 },
    { header: 'Description / Zone', key: 'description', width: 35 },
  ];

  // Apply styling to Header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0F766E' }, // Deep Teal Header
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 26;

  // Add Data Rows
  sampleRegionsData.forEach((rec, idx) => {
    const row = worksheet.addRow({
      stateName: rec.stateName,
      regionName: rec.regionName,
      districtName: rec.districtName,
      description: rec.description || '',
    });

    row.height = 20;

    if (idx % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F0FDFA' },
      };
    }

    row.getCell('stateName').alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell('regionName').alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell('districtName').alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell('description').alignment = { vertical: 'middle', horizontal: 'left' };

    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'CCFBF1' } },
        bottom: { style: 'thin', color: { argb: 'CCFBF1' } },
        left: { style: 'thin', color: { argb: 'CCFBF1' } },
        right: { style: 'thin', color: { argb: 'CCFBF1' } },
      };
    });
  });

  const rootXlsxDir = path.join(__dirname, '../../../xlsx');
  const targetPaths = [
    path.join(rootXlsxDir, 'regions.xlsx'),
    path.join(rootXlsxDir, 'regions_import.xlsx'),
    path.join(__dirname, 'data/regions.xlsx'),
  ];

  for (const p of targetPaths) {
    if (!fs.existsSync(path.dirname(p))) {
      fs.mkdirSync(path.dirname(p), { recursive: true });
    }
    await workbook.xlsx.writeFile(p);
  }

  // Also write JSON seed file
  const jsonSeedPath = path.join(__dirname, 'data/regions.json');
  fs.writeFileSync(jsonSeedPath, JSON.stringify(sampleRegionsData, null, 2), 'utf8');

  return targetPaths;
};

if (require.main === module || (process.argv[1] && process.argv[1].endsWith('generate_regions_import.ts'))) {
  generateRegionsXlsx()
    .then((filePaths) => {
      console.log(`Successfully generated Region XLSX & JSON files at:`, filePaths);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to generate Region XLSX file:', err);
      process.exit(1);
    });
}
