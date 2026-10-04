import path from 'path';
import ExcelJS from 'exceljs';

export interface VillageImportRecord {
  districtName: string;
  talukaName: string;
  villageName: string;
}

export const sampleVillagesData: VillageImportRecord[] = [
  // Haveli Taluka (Pune)
  { districtName: 'Pune', talukaName: 'Haveli', villageName: 'Khadakwasla' },
  { districtName: 'Pune', talukaName: 'Haveli', villageName: 'Nanded' },
  { districtName: 'Pune', talukaName: 'Haveli', villageName: 'Kondhwa Budruk' },
  { districtName: 'Pune', talukaName: 'Haveli', villageName: 'Dhayari' },
  { districtName: 'Pune', talukaName: 'Haveli', villageName: 'Narhe' },
  { districtName: 'Pune', talukaName: 'Haveli', villageName: 'Wagholi' },
  { districtName: 'Pune', talukaName: 'Haveli', villageName: 'Loni Kalbhor' },
  { districtName: 'Pune', talukaName: 'Haveli', villageName: 'Uttamnagar' },
  { districtName: 'Pune', talukaName: 'Haveli', villageName: 'Uruli Kanchan' },
  { districtName: 'Pune', talukaName: 'Haveli', villageName: 'Kirkatwadi' },

  // Pune City Taluka (Pune)
  { districtName: 'Pune', talukaName: 'Pune City', villageName: 'Kothrud' },
  { districtName: 'Pune', talukaName: 'Pune City', villageName: 'Shivajinagar' },
  { districtName: 'Pune', talukaName: 'Pune City', villageName: 'Parvati' },
  { districtName: 'Pune', talukaName: 'Pune City', villageName: 'Kasba Peth' },
  { districtName: 'Pune', talukaName: 'Pune City', villageName: 'Hadapsar' },
  { districtName: 'Pune', talukaName: 'Pune City', villageName: 'Aundh' },
  { districtName: 'Pune', talukaName: 'Pune City', villageName: 'Erandwane' },
  { districtName: 'Pune', talukaName: 'Pune City', villageName: 'Ghorpadi' },

  // Baramati Taluka (Pune)
  { districtName: 'Pune', talukaName: 'Baramati', villageName: 'Dorlewadi' },
  { districtName: 'Pune', talukaName: 'Baramati', villageName: 'Malegaon Budruk' },
  { districtName: 'Pune', talukaName: 'Baramati', villageName: 'Kalthan' },
  { districtName: 'Pune', talukaName: 'Baramati', villageName: 'Supe' },
  { districtName: 'Pune', talukaName: 'Baramati', villageName: 'Sangvi' },
  { districtName: 'Pune', talukaName: 'Baramati', villageName: 'Pandhare' },
  { districtName: 'Pune', talukaName: 'Baramati', villageName: 'Karhati' },
  { districtName: 'Pune', talukaName: 'Baramati', villageName: 'Medad' },

  // Ambegaon Taluka (Pune)
  { districtName: 'Pune', talukaName: 'Ambegaon', villageName: 'Ghodegaon' },
  { districtName: 'Pune', talukaName: 'Ambegaon', villageName: 'Manchar' },
  { districtName: 'Pune', talukaName: 'Ambegaon', villageName: 'Shinoli' },
  { districtName: 'Pune', talukaName: 'Ambegaon', villageName: 'Narodi' },
  { districtName: 'Pune', talukaName: 'Ambegaon', villageName: 'Kalamb' },
  { districtName: 'Pune', talukaName: 'Ambegaon', villageName: 'Pargaon' },
  { districtName: 'Pune', talukaName: 'Ambegaon', villageName: 'Nirgudsar' },

  // Junnar Taluka (Pune)
  { districtName: 'Pune', talukaName: 'Junnar', villageName: 'Narayangaon' },
  { districtName: 'Pune', talukaName: 'Junnar', villageName: 'Otur' },
  { districtName: 'Pune', talukaName: 'Junnar', villageName: 'Alephata' },
  { districtName: 'Pune', talukaName: 'Junnar', villageName: 'Junnar Town' },
  { districtName: 'Pune', talukaName: 'Junnar', villageName: 'Rajuri' },
  { districtName: 'Pune', talukaName: 'Junnar', villageName: 'Yenere' },
  { districtName: 'Pune', talukaName: 'Junnar', villageName: 'Aptale' },

  // Shirur Taluka (Pune)
  { districtName: 'Pune', talukaName: 'Shirur', villageName: 'Shikrapur' },
  { districtName: 'Pune', talukaName: 'Shirur', villageName: 'Sanaswadi' },
  { districtName: 'Pune', talukaName: 'Shirur', villageName: 'Ranjangaon Ganpati' },
  { districtName: 'Pune', talukaName: 'Shirur', villageName: 'Shirur Town' },
  { districtName: 'Pune', talukaName: 'Shirur', villageName: 'Nabalgaon' },
  { districtName: 'Pune', talukaName: 'Shirur', villageName: 'Pabal' },
  { districtName: 'Pune', talukaName: 'Shirur', villageName: 'Takali Haji' },

  // Khed Taluka (Pune)
  { districtName: 'Pune', talukaName: 'Khed', villageName: 'Chakan' },
  { districtName: 'Pune', talukaName: 'Khed', villageName: 'Rajgurunagar' },
  { districtName: 'Pune', talukaName: 'Khed', villageName: 'Alandi' },
  { districtName: 'Pune', talukaName: 'Khed', villageName: 'Khed Shivapur' },
  { districtName: 'Pune', talukaName: 'Khed', villageName: 'Shelgaon' },
  { districtName: 'Pune', talukaName: 'Khed', villageName: 'Waki' },
  { districtName: 'Pune', talukaName: 'Khed', villageName: 'Kadus' },

  // Purandar Taluka (Pune)
  { districtName: 'Pune', talukaName: 'Purandar', villageName: 'Saswad' },
  { districtName: 'Pune', talukaName: 'Purandar', villageName: 'Jejuri' },
  { districtName: 'Pune', talukaName: 'Purandar', villageName: 'Belsar' },
  { districtName: 'Pune', talukaName: 'Purandar', villageName: 'Diwale' },
  { districtName: 'Pune', talukaName: 'Purandar', villageName: 'Walhe' },
  { districtName: 'Pune', talukaName: 'Purandar', villageName: 'Parinche' },
  { districtName: 'Pune', talukaName: 'Purandar', villageName: 'Chambli' },

  // Bhor Taluka (Pune)
  { districtName: 'Pune', talukaName: 'Bhor', villageName: 'Bhor Town' },
  { districtName: 'Pune', talukaName: 'Bhor', villageName: 'Nasrapur' },
  { districtName: 'Pune', talukaName: 'Bhor', villageName: 'Sangamner' },
  { districtName: 'Pune', talukaName: 'Bhor', villageName: 'Utroli' },
  { districtName: 'Pune', talukaName: 'Bhor', villageName: 'Kari' },
  { districtName: 'Pune', talukaName: 'Bhor', villageName: 'Kikvi' },
  { districtName: 'Pune', talukaName: 'Bhor', villageName: 'Velhe' },

  // Division Talukas matching DB entries for Pune
  { districtName: 'Pune', talukaName: 'Pune City East Division', villageName: 'Yerawada' },
  { districtName: 'Pune', talukaName: 'Pune City East Division', villageName: 'Wadgaon Sheri' },
  { districtName: 'Pune', talukaName: 'Pune City East Division', villageName: 'Kharadi' },
  { districtName: 'Pune', talukaName: 'Pune City West Division', villageName: 'Pashan' },
  { districtName: 'Pune', talukaName: 'Pune City West Division', villageName: 'Baner' },
  { districtName: 'Pune', talukaName: 'Pune City West Division', villageName: 'Bavdhan' },
  { districtName: 'Pune', talukaName: 'Pune Moffusil Division', villageName: 'Pirangut' },
  { districtName: 'Pune', talukaName: 'Pune Moffusil Division', villageName: 'Paud' },

  // Mumbai South (Mumbai City)
  { districtName: 'Mumbai City', talukaName: 'Mumbai South', villageName: 'Colaba' },
  { districtName: 'Mumbai City', talukaName: 'Mumbai South', villageName: 'Malabar Hill' },
  { districtName: 'Mumbai City', talukaName: 'Mumbai South', villageName: 'Girgaon' },
  { districtName: 'Mumbai City', talukaName: 'Mumbai South', villageName: 'Fort' },

  // Nagpur Urban (Nagpur)
  { districtName: 'Nagpur', talukaName: 'Nagpur Urban', villageName: 'Sitabuldi' },
  { districtName: 'Nagpur', talukaName: 'Nagpur Urban', villageName: 'Dharampeth' },
  { districtName: 'Nagpur', talukaName: 'Nagpur Urban', villageName: 'Sadar' },
  { districtName: 'Nagpur', talukaName: 'Nagpur Urban', villageName: 'Itwari' }
];

export async function generateVillagesImportFile() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ranniti';
  const worksheet = workbook.addWorksheet('Villages');

  worksheet.columns = [
    { header: 'District Name', key: 'districtName', width: 25 },
    { header: 'Taluka Name', key: 'talukaName', width: 30 },
    { header: 'Village Name', key: 'villageName', width: 35 },
  ];

  // Header styling
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' }, // Slate/Navy Blue
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 26;

  for (const rec of sampleVillagesData) {
    const row = worksheet.addRow(rec);
    row.alignment = { vertical: 'middle', horizontal: 'left' };
  }

  // Border formatting for cells
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    }
  });

  const rootExcelPath = path.join(__dirname, '../../../xlsx/villages_import.xlsx');
  await workbook.xlsx.writeFile(rootExcelPath);
  console.log(`✅ Excel file generated at xlsx directory: ${rootExcelPath}`);

  const sampleDataPath = path.join(__dirname, '../../sample_data/villages_import.xlsx');
  await workbook.xlsx.writeFile(sampleDataPath);
  console.log(`✅ Excel file copied to sample_data: ${sampleDataPath}`);
}

if (require.main === module) {
  generateVillagesImportFile().catch(console.error);
}
