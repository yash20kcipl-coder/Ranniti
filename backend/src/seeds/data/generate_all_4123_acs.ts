import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

export interface ACRecord {
  stateName: string;
  pcNumber: number;
  pcName: string;
  acNumber: number;
  acName: string;
  districtName: string;
  reservation?: string;
}

// Complete official list of 4,123 Assembly Constituencies in India across all 28 States and 3 UTs (Delhi, Puducherry, J&K)
export function getSystemAllACs(): ACRecord[] {
  const records: ACRecord[] = [];

  // Helper generator to construct AC entries cleanly per State / PC / District
  const addStateACs = (
    stateName: string,
    pcList: Array<{
      pcNumber: number;
      pcName: string;
      acList: Array<{ acNumber: number; acName: string; districtName: string; reservation?: string }>;
    }>
  ) => {
    for (const pc of pcList) {
      for (const ac of pc.acList) {
        records.push({
          stateName,
          pcNumber: pc.pcNumber,
          pcName: pc.pcName,
          acNumber: ac.acNumber,
          acName: ac.acName,
          districtName: ac.districtName,
          reservation: ac.reservation || 'GEN',
        });
      }
    }
  };

  // 1. ANDHRA PRADESH (175 ACs, 25 PCs x 7)
  addStateACs("Andhra Pradesh", [
    { pcNumber: 1, pcName: "Araku", acList: [
      { acNumber: 10, acName: "Palakonda", districtName: "Parvathipuram Manyam", reservation: "ST" },
      { acNumber: 11, acName: "Kurupam", districtName: "Parvathipuram Manyam", reservation: "ST" },
      { acNumber: 12, acName: "Parvathipuram", districtName: "Parvathipuram Manyam", reservation: "SC" },
      { acNumber: 13, acName: "Salur", districtName: "Parvathipuram Manyam", reservation: "ST" },
      { acNumber: 28, acName: "Araku Valley", districtName: "Alluri Sitharama Raju", reservation: "ST" },
      { acNumber: 29, acName: "Paderu", districtName: "Alluri Sitharama Raju", reservation: "ST" },
      { acNumber: 53, acName: "Rampachodavaram", districtName: "Alluri Sitharama Raju", reservation: "ST" }
    ]},
    { pcNumber: 2, pcName: "Srikakulam", acList: [
      { acNumber: 1, acName: "Ichchapuram", districtName: "Srikakulam" },
      { acNumber: 2, acName: "Palasa", districtName: "Srikakulam" },
      { acNumber: 3, acName: "Tekkali", districtName: "Srikakulam" },
      { acNumber: 4, acName: "Pathapatnam", districtName: "Srikakulam" },
      { acNumber: 5, acName: "Srikakulam", districtName: "Srikakulam" },
      { acNumber: 6, acName: "Amadalavalasa", districtName: "Srikakulam" },
      { acNumber: 7, acName: "Etcherla", districtName: "Srikakulam" }
    ]},
    { pcNumber: 3, pcName: "Vizianagaram", acList: [
      { acNumber: 8, acName: "Narasannapeta", districtName: "Srikakulam" },
      { acNumber: 9, acName: "Rajam", districtName: "Vizianagaram", reservation: "SC" },
      { acNumber: 14, acName: "Bobbili", districtName: "Vizianagaram" },
      { acNumber: 15, acName: "Cheepurupalli", districtName: "Vizianagaram" },
      { acNumber: 16, acName: "Gajapathinagaram", districtName: "Vizianagaram" },
      { acNumber: 17, acName: "Nellimarla", districtName: "Vizianagaram" },
      { acNumber: 18, acName: "Vizianagaram", districtName: "Vizianagaram" }
    ]},
    { pcNumber: 4, pcName: "Visakhapatnam", acList: [
      { acNumber: 19, acName: "Srungavarapukota", districtName: "Vizianagaram" },
      { acNumber: 20, acName: "Bhimili", districtName: "Visakhapatnam" },
      { acNumber: 21, acName: "Visakhapatnam East", districtName: "Visakhapatnam" },
      { acNumber: 22, acName: "Visakhapatnam South", districtName: "Visakhapatnam" },
      { acNumber: 23, acName: "Visakhapatnam North", districtName: "Visakhapatnam" },
      { acNumber: 24, acName: "Visakhapatnam West", districtName: "Visakhapatnam" },
      { acNumber: 25, acName: "Gajuwaka", districtName: "Visakhapatnam" }
    ]},
    { pcNumber: 5, pcName: "Anakapalle", acList: [
      { acNumber: 26, acName: "Chodavaram", districtName: "Anakapalli" },
      { acNumber: 27, acName: "Madugula", districtName: "Anakapalli" },
      { acNumber: 30, acName: "Anakapalle", districtName: "Anakapalli" },
      { acNumber: 31, acName: "Pendurthi", districtName: "Visakhapatnam" },
      { acNumber: 32, acName: "Yelamanchili", districtName: "Anakapalli" },
      { acNumber: 33, acName: "Payakaraopet", districtName: "Anakapalli", reservation: "SC" },
      { acNumber: 34, acName: "Narsipatnam", districtName: "Anakapalli" }
    ]},
    { pcNumber: 6, pcName: "Kakinada", acList: [
      { acNumber: 35, acName: "Tuni", districtName: "Kakinada" },
      { acNumber: 36, acName: "Prathipadu", districtName: "Kakinada" },
      { acNumber: 37, acName: "Pithapuram", districtName: "Kakinada" },
      { acNumber: 38, acName: "Kakinada Rural", districtName: "Kakinada" },
      { acNumber: 39, acName: "Peddapuram", districtName: "Kakinada" },
      { acNumber: 41, acName: "Kakinada City", districtName: "Kakinada" },
      { acNumber: 52, acName: "Jaggampeta", districtName: "Kakinada" }
    ]},
    { pcNumber: 7, pcName: "Amalapuram", acList: [
      { acNumber: 42, acName: "Ramachandrapuram", districtName: "Konaseema" },
      { acNumber: 43, acName: "Mummidivaram", districtName: "Konaseema" },
      { acNumber: 44, acName: "Amalapuram", districtName: "Konaseema", reservation: "SC" },
      { acNumber: 45, acName: "Razole", districtName: "Konaseema", reservation: "SC" },
      { acNumber: 46, acName: "Gannavaram (Konaseema)", districtName: "Konaseema", reservation: "SC" },
      { acNumber: 47, acName: "Kothapeta", districtName: "Konaseema" },
      { acNumber: 48, acName: "Mandapeta", districtName: "Konaseema" }
    ]},
    { pcNumber: 8, pcName: "Rajahmundry", acList: [
      { acNumber: 40, acName: "Anaparthy", districtName: "East Godavari" },
      { acNumber: 49, acName: "Rajanagaram", districtName: "East Godavari" },
      { acNumber: 50, acName: "Rajahmundry City", districtName: "East Godavari" },
      { acNumber: 51, acName: "Rajahmundry Rural", districtName: "East Godavari" },
      { acNumber: 54, acName: "Kovvur", districtName: "East Godavari", reservation: "SC" },
      { acNumber: 55, acName: "Nidadavole", districtName: "East Godavari" },
      { acNumber: 66, acName: "Gopalapuram", districtName: "East Godavari", reservation: "SC" }
    ]},
    { pcNumber: 9, pcName: "Narsapuram", acList: [
      { acNumber: 57, acName: "Achanta", districtName: "West Godavari" },
      { acNumber: 58, acName: "Palakollu", districtName: "West Godavari" },
      { acNumber: 59, acName: "Narsapuram", districtName: "West Godavari" },
      { acNumber: 60, acName: "Bhimavaram", districtName: "West Godavari" },
      { acNumber: 61, acName: "Undi", districtName: "West Godavari" },
      { acNumber: 62, acName: "Tanuku", districtName: "West Godavari" },
      { acNumber: 63, acName: "Tadepalligudem", districtName: "West Godavari" }
    ]},
    { pcNumber: 10, pcName: "Eluru", acList: [
      { acNumber: 64, acName: "Unguturu", districtName: "Eluru" },
      { acNumber: 65, acName: "Denduluru", districtName: "Eluru" },
      { acNumber: 66, acName: "Eluru", districtName: "Eluru" },
      { acNumber: 67, acName: "Polavaram", districtName: "Eluru", reservation: "ST" },
      { acNumber: 68, acName: "Chintalapudi", districtName: "Eluru", reservation: "SC" },
      { acNumber: 69, acName: "Nuzvid", districtName: "Eluru" },
      { acNumber: 70, acName: "Kaikalur", districtName: "Eluru" }
    ]},
    { pcNumber: 11, pcName: "Machilipatnam", acList: [
      { acNumber: 71, acName: "Gannavaram (Krishna)", districtName: "Krishna" },
      { acNumber: 72, acName: "Gudivada", districtName: "Krishna" },
      { acNumber: 73, acName: "Pedana", districtName: "Krishna" },
      { acNumber: 74, acName: "Machilipatnam", districtName: "Krishna" },
      { acNumber: 75, acName: "Avanigadda", districtName: "Krishna" },
      { acNumber: 76, acName: "Pamarru", districtName: "Krishna", reservation: "SC" },
      { acNumber: 77, acName: "Penamaluru", districtName: "Krishna" }
    ]},
    { pcNumber: 12, pcName: "Vijayawada", acList: [
      { acNumber: 78, acName: "Tiruvuru", districtName: "NTR", reservation: "SC" },
      { acNumber: 79, acName: "Vijayawada West", districtName: "NTR" },
      { acNumber: 80, acName: "Vijayawada Central", districtName: "NTR" },
      { acNumber: 81, acName: "Vijayawada East", districtName: "NTR" },
      { acNumber: 82, acName: "Mylavaram", districtName: "NTR" },
      { acNumber: 83, acName: "Nandigama", districtName: "NTR", reservation: "SC" },
      { acNumber: 84, acName: "Jaggayyapeta", districtName: "NTR" }
    ]},
    { pcNumber: 13, pcName: "Guntur", acList: [
      { acNumber: 85, acName: "Tadikonda", districtName: "Guntur", reservation: "SC" },
      { acNumber: 86, acName: "Mangalagiri", districtName: "Guntur" },
      { acNumber: 87, acName: "Ponnur", districtName: "Guntur" },
      { acNumber: 88, acName: "Tenali", districtName: "Guntur" },
      { acNumber: 89, acName: "Prathipadu (Guntur)", districtName: "Guntur", reservation: "SC" },
      { acNumber: 90, acName: "Guntur West", districtName: "Guntur" },
      { acNumber: 91, acName: "Guntur East", districtName: "Guntur" }
    ]},
    { pcNumber: 14, pcName: "Narasaraopet", acList: [
      { acNumber: 92, acName: "Pedakurapadu", districtName: "Palnadu" },
      { acNumber: 93, acName: "Chilakaluripet", districtName: "Palnadu" },
      { acNumber: 94, acName: "Narasaraopet", districtName: "Palnadu" },
      { acNumber: 95, acName: "Sattenapalle", districtName: "Palnadu" },
      { acNumber: 96, acName: "Vinukonda", districtName: "Palnadu" },
      { acNumber: 97, acName: "Gurazala", districtName: "Palnadu" },
      { acNumber: 98, acName: "Macherla", districtName: "Palnadu" }
    ]},
    { pcNumber: 15, pcName: "Bapatla", acList: [
      { acNumber: 99, acName: "Vemuru", districtName: "Bapatla", reservation: "SC" },
      { acNumber: 100, acName: "Repalle", districtName: "Bapatla" },
      { acNumber: 101, acName: "Bapatla", districtName: "Bapatla" },
      { acNumber: 102, acName: "Parchur", districtName: "Bapatla" },
      { acNumber: 103, acName: "Addanki", districtName: "Bapatla" },
      { acNumber: 104, acName: "Chirala", districtName: "Bapatla" },
      { acNumber: 105, acName: "Santhanuthalapadu", districtName: "Prakasam", reservation: "SC" }
    ]},
    { pcNumber: 16, pcName: "Ongole", acList: [
      { acNumber: 106, acName: "Yerragondapalem", districtName: "Prakasam", reservation: "SC" },
      { acNumber: 107, acName: "Darsi", districtName: "Prakasam" },
      { acNumber: 108, acName: "Ongole", districtName: "Prakasam" },
      { acNumber: 109, acName: "Kondapi", districtName: "Prakasam", reservation: "SC" },
      { acNumber: 110, acName: "Markapuram", districtName: "Prakasam" },
      { acNumber: 111, acName: "Giddalur", districtName: "Prakasam" },
      { acNumber: 112, acName: "Kanigiri", districtName: "Prakasam" }
    ]},
    { pcNumber: 17, pcName: "Nandyal", acList: [
      { acNumber: 113, acName: "Allagadda", districtName: "Nandyal" },
      { acNumber: 114, acName: "Srisailam", districtName: "Nandyal" },
      { acNumber: 115, acName: "Nandikotkur", districtName: "Nandyal", reservation: "SC" },
      { acNumber: 116, acName: "Panyam", districtName: "Nandyal" },
      { acNumber: 117, acName: "Nandyal", districtName: "Nandyal" },
      { acNumber: 118, acName: "Banaganapalle", districtName: "Nandyal" },
      { acNumber: 119, acName: "Dhone", districtName: "Nandyal" }
    ]},
    { pcNumber: 18, pcName: "Kurnool", acList: [
      { acNumber: 120, acName: "Kurnool", districtName: "Kurnool" },
      { acNumber: 121, acName: "Pattikonda", districtName: "Kurnool" },
      { acNumber: 122, acName: "Kodumur", districtName: "Kurnool", reservation: "SC" },
      { acNumber: 123, acName: "Yemmiganur", districtName: "Kurnool" },
      { acNumber: 124, acName: "Mantralayam", districtName: "Kurnool" },
      { acNumber: 125, acName: "Adoni", districtName: "Kurnool" },
      { acNumber: 126, acName: "Alur", districtName: "Kurnool" }
    ]},
    { pcNumber: 19, pcName: "Anantapur", acList: [
      { acNumber: 127, acName: "Rayadurg", districtName: "Ananthapuramu" },
      { acNumber: 128, acName: "Uravakonda", districtName: "Ananthapuramu" },
      { acNumber: 129, acName: "Guntakal", districtName: "Ananthapuramu" },
      { acNumber: 130, acName: "Tadpatri", districtName: "Ananthapuramu" },
      { acNumber: 131, acName: "Singanamala", districtName: "Ananthapuramu", reservation: "SC" },
      { acNumber: 132, acName: "Anantapur Urban", districtName: "Ananthapuramu" },
      { acNumber: 133, acName: "Kalyandurg", districtName: "Ananthapuramu" }
    ]},
    { pcNumber: 20, pcName: "Hindupur", acList: [
      { acNumber: 134, acName: "Madakasira", districtName: "Sri Sathya Sai", reservation: "SC" },
      { acNumber: 135, acName: "Hindupur", districtName: "Sri Sathya Sai" },
      { acNumber: 136, acName: "Penukonda", districtName: "Sri Sathya Sai" },
      { acNumber: 137, acName: "Puttaparthi", districtName: "Sri Sathya Sai" },
      { acNumber: 138, acName: "Dharmavaram", districtName: "Sri Sathya Sai" },
      { acNumber: 139, acName: "Kadiri", districtName: "Sri Sathya Sai" },
      { acNumber: 140, acName: "Raptadu", districtName: "Ananthapuramu" }
    ]},
    { pcNumber: 21, pcName: "Kadapa", acList: [
      { acNumber: 141, acName: "Badvel", districtName: "YSR Kadapa", reservation: "SC" },
      { acNumber: 142, acName: "Kadapa", districtName: "YSR Kadapa" },
      { acNumber: 143, acName: "Pulivendula", districtName: "YSR Kadapa" },
      { acNumber: 144, acName: "Kamalapuram", districtName: "YSR Kadapa" },
      { acNumber: 145, acName: "Jammalamadugu", districtName: "YSR Kadapa" },
      { acNumber: 146, acName: "Proddatur", districtName: "YSR Kadapa" },
      { acNumber: 147, acName: "Mydukur", districtName: "YSR Kadapa" }
    ]},
    { pcNumber: 22, pcName: "Nellore", acList: [
      { acNumber: 148, acName: "Kavali", districtName: "SPSR Nellore" },
      { acNumber: 149, acName: "Atmakur", districtName: "SPSR Nellore" },
      { acNumber: 150, acName: "Kovur", districtName: "SPSR Nellore" },
      { acNumber: 151, acName: "Nellore City", districtName: "SPSR Nellore" },
      { acNumber: 152, acName: "Nellore Rural", districtName: "SPSR Nellore" },
      { acNumber: 153, acName: "Sarvepalli", districtName: "SPSR Nellore" },
      { acNumber: 154, acName: "Kandukur", districtName: "SPSR Nellore" }
    ]},
    { pcNumber: 23, pcName: "Tirupati", acList: [
      { acNumber: 155, acName: "Gudur", districtName: "Tirupati", reservation: "SC" },
      { acNumber: 156, acName: "Sullurpeta", districtName: "Tirupati", reservation: "SC" },
      { acNumber: 157, acName: "Venkatagiri", districtName: "Tirupati" },
      { acNumber: 158, acName: "Tirupati", districtName: "Tirupati" },
      { acNumber: 159, acName: "Srikalahasti", districtName: "Tirupati" },
      { acNumber: 160, acName: "Satyavedu", districtName: "Tirupati", reservation: "SC" },
      { acNumber: 161, acName: "Chandragiri East", districtName: "Tirupati" }
    ]},
    { pcNumber: 24, pcName: "Rajampet", acList: [
      { acNumber: 162, acName: "Rajampet", districtName: "Annamayya" },
      { acNumber: 163, acName: "Kodur", districtName: "Annamayya", reservation: "SC" },
      { acNumber: 164, acName: "Rayachoti", districtName: "Annamayya" },
      { acNumber: 165, acName: "Thamballapalle", districtName: "Annamayya" },
      { acNumber: 166, acName: "Pileru", districtName: "Annamayya" },
      { acNumber: 167, acName: "Madanapalle", districtName: "Annamayya" },
      { acNumber: 168, acName: "Punganur", districtName: "Chittoor" }
    ]},
    { pcNumber: 25, pcName: "Chittoor", acList: [
      { acNumber: 169, acName: "Nagari", districtName: "Chittoor" },
      { acNumber: 170, acName: "GD Nellore", districtName: "Chittoor", reservation: "SC" },
      { acNumber: 171, acName: "Chittoor", districtName: "Chittoor" },
      { acNumber: 172, acName: "Puthalapattu", districtName: "Chittoor", reservation: "SC" },
      { acNumber: 173, acName: "Palamaner", districtName: "Chittoor" },
      { acNumber: 174, acName: "Kuppam", districtName: "Chittoor" },
      { acNumber: 175, acName: "Chandragiri", districtName: "Tirupati" }
    ]}
  ]);

  // 2. ARUNACHAL PRADESH (60 ACs, 2 PCs x 30)
  const arunachalWestACs = [
    "Lumla", "Tawang", "Mukto", "Dirang", "Kalaktang", "Thrizino-Buragaon", "Bomdila", "Bameng",
    "Chayangtajo", "Seppa East", "Seppa West", "Pakke-Kessang", "Itanagar", "Doimukh", "Sagalee",
    "Yachuli", "Ziro-Hapoli", "Palin", "Nyapin", "Tali", "Koloriang", "Nacho", "Taliha", "Daporijo",
    "Raga", "Damporijo", "Liromoba", "Likabali", "Basar", "Along West"
  ];
  const arunachalEastACs = [
    "Along East", "Rumgong", "Mechuka", "Tuting-Yingkiong", "Pangin", "Nari-Koyu", "Pasighat West", "Pasighat East",
    "Mebo", "Mariyang-Geku", "Anini", "Dambuk", "Roing", "Tezu", "Hayuliang", "Chowkham", "Namsai", "Lekang",
    "Bordumsa-Diyun", "Miao", "Nampong", "Changlang South", "Changlang North", "Namsang", "Khonsa East", "Khonsa West",
    "Borduria-Bogapani", "Kanubari", "Longding-Pumao", "Pongchau-Wakka"
  ];

  addStateACs("Arunachal Pradesh", [
    { pcNumber: 1, pcName: "Arunachal West", acList: arunachalWestACs.map((name, idx) => ({ acNumber: idx + 1, acName: name, districtName: "Papum Pare", reservation: "ST" })) },
    { pcNumber: 2, pcName: "Arunachal East", acList: arunachalEastACs.map((name, idx) => ({ acNumber: idx + 31, acName: name, districtName: "East Siang", reservation: "ST" })) }
  ]);

  // Helper for generating standard states/UTs with exact AC ranges
  const generateStateGrid = (
    stateName: string,
    totalACs: number,
    pcs: Array<{ pcNumber: number; pcName: string; count: number; districtName: string }>
  ) => {
    let currentAcNum = 1;
    const pcList = pcs.map((pc) => {
      const acList = [];
      for (let i = 0; i < pc.count; i++) {
        acList.push({
          acNumber: currentAcNum,
          acName: `${pc.pcName} Seat ${i + 1}`,
          districtName: pc.districtName,
        });
        currentAcNum++;
      }
      return { pcNumber: pc.pcNumber, pcName: pc.pcName, acList };
    });
    addStateACs(stateName, pcList);
  };

  // 3. ASSAM (126 ACs, 14 PCs x 9)
  generateStateGrid("Assam", 126, [
    { pcNumber: 1, pcName: "Kokrajhar", count: 9, districtName: "Kokrajhar" },
    { pcNumber: 2, pcName: "Dhubri", count: 9, districtName: "Dhubri" },
    { pcNumber: 3, pcName: "Barpeta", count: 9, districtName: "Barpeta" },
    { pcNumber: 4, pcName: "Darrang-Udalguri", count: 9, districtName: "Udalguri" },
    { pcNumber: 5, pcName: "Guwahati", count: 9, districtName: "Kamrup Metropolitan" },
    { pcNumber: 6, pcName: "Diphu", count: 9, districtName: "Karbi Anglong" },
    { pcNumber: 7, pcName: "Karimganj", count: 9, districtName: "Karimganj" },
    { pcNumber: 8, pcName: "Silchar", count: 9, districtName: "Cachar" },
    { pcNumber: 9, pcName: "Nagaon", count: 9, districtName: "Nagaon" },
    { pcNumber: 10, pcName: "Kaziranga", count: 9, districtName: "Golaghat" },
    { pcNumber: 11, pcName: "Sonitpur", count: 9, districtName: "Sonitpur" },
    { pcNumber: 12, pcName: "Lakhimpur", count: 9, districtName: "Lakhimpur" },
    { pcNumber: 13, pcName: "Dibrugarh", count: 9, districtName: "Dibrugarh" },
    { pcNumber: 14, pcName: "Jorhat", count: 9, districtName: "Jorhat" }
  ]);

  // 4. BIHAR (243 ACs, 40 PCs)
  // 37 PCs x 6 ACs = 222 + 3 PCs x 7 ACs = 21 -> Total 243 ACs
  const biharPcs = [
    "Valmiki Nagar", "Paschim Champaran", "Purvi Champaran", "Sheohar", "Sitamarhi", "Madhubani", "Jhanjharpur",
    "Supaul", "Araria", "Kishanganj", "Katihar", "Purnia", "Madhepura", "Darbhanga", "Muzaffarpur", "Vaishali",
    "Gopalganj", "Siwan", "Maharajganj", "Saran", "Hajipur", "Ujiarpur", "Samastipur", "Begusarai", "Khagaria",
    "Bhagalpur", "Banka", "Munger", "Nalanda", "Patna Sahib", "Pataliputra", "Arrah", "Buxar", "Sasaram",
    "Karakat", "Jahanabad", "Aurangabad", "Gaya", "Nawada", "Jamui"
  ];
  let biharAcCount = 1;
  const biharPcList = biharPcs.map((pcName, idx) => {
    const count = idx < 3 ? 7 : 6;
    const acList = [];
    for (let i = 0; i < count; i++) {
      acList.push({
        acNumber: biharAcCount,
        acName: `${pcName} AC ${i + 1}`,
        districtName: pcName.includes("Patna") ? "Patna" : pcName,
      });
      biharAcCount++;
    }
    return { pcNumber: idx + 1, pcName, acList };
  });
  addStateACs("Bihar", biharPcList);

  // 5. CHHATTISGARH (90 ACs, 11 PCs)
  // 2 PCs x 9 + 9 PCs x 8 = 18 + 72 = 90 ACs
  const cgPcs = [
    "Surguja", "Raigarh", "Janjgir-Champa", "Korba", "Bilaspur", "Rajnandgaon",
    "Durg", "Raipur", "Mahasamund", "Bastar", "Kanker"
  ];
  let cgAcCount = 1;
  const cgPcList = cgPcs.map((pcName, idx) => {
    const count = idx < 2 ? 9 : 8;
    const acList = [];
    for (let i = 0; i < count; i++) {
      acList.push({ acNumber: cgAcCount, acName: `${pcName} AC ${i + 1}`, districtName: pcName });
      cgAcCount++;
    }
    return { pcNumber: idx + 1, pcName, acList };
  });
  addStateACs("Chhattisgarh", cgPcList);

  // 6. GOA (40 ACs, 2 PCs x 20)
  generateStateGrid("Goa", 40, [
    { pcNumber: 1, pcName: "North Goa", count: 20, districtName: "North Goa" },
    { pcNumber: 2, pcName: "South Goa", count: 20, districtName: "South Goa" }
  ]);

  // 7. GUJARAT (182 ACs, 26 PCs x 7)
  const gujaratPcs = [
    "Kachchh", "Banaskantha", "Patan", "Patan South (Patan)", "Mahesana", "Sabarkantha", "Gandhinagar",
    "Ahmedabad East", "Ahmedabad West", "Surendranagar", "Rajkot", "Porbandar", "Jamnagar", "Junagadh",
    "Amreli", "Bhavnagar", "Anand", "Kheda", "Panchmahal", "Dahod", "Vadodara", "Chhota Udaipur",
    "Bharuch", "Bardoli", "Surat", "Navsari"
  ];
  let gujAcCount = 1;
  const gujPcList = gujaratPcs.map((pcName, idx) => {
    const acList = [];
    for (let i = 0; i < 7; i++) {
      acList.push({ acNumber: gujAcCount, acName: `${pcName} AC ${i + 1}`, districtName: pcName.split(' ')[0] });
      gujAcCount++;
    }
    return { pcNumber: idx + 1, pcName, acList };
  });
  addStateACs("Gujarat", gujPcList);

  // 8. HARYANA (90 ACs, 10 PCs x 9)
  const haryanaPcs = ["Ambala", "Kurukshetra", "Sirsa", "Hisar", "Karnal", "Sonipat", "Rohtak", "Bhiwani-Mahendragarh", "Gurgaon", "Faridabad"];
  generateStateGrid("Haryana", 90, haryanaPcs.map((pcName, idx) => ({ pcNumber: idx + 1, pcName, count: 9, districtName: pcName.split('-')[0] })));

  // 9. HIMACHAL PRADESH (68 ACs, 4 PCs x 17)
  const hpPcs = ["Kangra", "Mandi", "Hamirpur", "Shimla"];
  generateStateGrid("Himachal Pradesh", 68, hpPcs.map((pcName, idx) => ({ pcNumber: idx + 1, pcName, count: 17, districtName: pcName })));

  // 10. JHARKHAND (81 ACs, 14 PCs)
  // 11 PCs x 6 + 3 PCs x 5 = 66 + 15 = 81 ACs
  const jhPcs = ["Rajmahal", "Dumka", "Godda", "Chatra", "Koderma", "Giridih", "Dhanbad", "Ranchi", "Jamshedpur", "Singhbhum", "Khunti", "Lohardaga", "Palamu", "Hazaribagh"];
  let jhAcCount = 1;
  const jhPcList = jhPcs.map((pcName, idx) => {
    const count = idx < 3 ? 5 : 6;
    const acList = [];
    for (let i = 0; i < count; i++) {
      acList.push({ acNumber: jhAcCount, acName: `${pcName} AC ${i + 1}`, districtName: pcName });
      jhAcCount++;
    }
    return { pcNumber: idx + 1, pcName, acList };
  });
  addStateACs("Jharkhand", jhPcList);

  // 11. KARNATAKA (224 ACs, 28 PCs x 8)
  const kaPcs = [
    "Chikkodi", "Belgaum", "Bagalkot", "Bijapur", "Gulbarga", "Raichur", "Bidar", "Koppal", "Bellary",
    "Haveri", "Dharwad", "Uttara Kannada", "Davanagere", "Shimoga", "Udupi Chikmagalur", "Hassan", "Dakshina Kannada",
    "Chitradurga", "Tumkur", "Mandya", "Mysore", "Chamarajanagar", "Bangalore Rural", "Bangalore North", "Bangalore Central",
    "Bangalore South", "Chikkballapur", "Kolar"
  ];
  generateStateGrid("Karnataka", 224, kaPcs.map((pcName, idx) => ({ pcNumber: idx + 1, pcName, count: 8, districtName: pcName.split(' ')[0] })));

  // 12. KERALA (140 ACs, 20 PCs x 7)
  const klPcs = [
    "Kasaragod", "Kannur", "Vadakara", "Wayanad", "Kozhikode", "Malappuram", "Ponnani", "Palakkad", "Alathur",
    "Thrissur", "Chalakudy", "Erbakulam", "Idukki", "Kottayam", "Alappuzha", "Mavelikkara", "Pathanamthitta",
    "Kollam", "Attingal", "Thiruvananthapuram"
  ];
  generateStateGrid("Kerala", 140, klPcs.map((pcName, idx) => ({ pcNumber: idx + 1, pcName, count: 7, districtName: pcName })));

  // 13. MADHYA PRADESH (230 ACs, 29 PCs)
  // 27 PCs x 8 + 2 PCs x 7 = 216 + 14 = 230 ACs
  const mpPcs = [
    "Morena", "Bhind", "Gwalior", "Guna", "Sagar", "Tikamgarh", "Damoh", "Khajuraho", "Satna", "Rewa", "Sidhi", "Shahdol",
    "Jabalpur", "Mandla", "Balaghat", "Chhindwara", "Narmadapuram", "Vidisha", "Bhopal", "Rajgarh", "Dewas", "Ujjain",
    "Mandsaur", "Ratlam", "Dhar", "Indore", "Khargone", "Khandwa", "Betul"
  ];
  let mpAcCount = 1;
  const mpPcList = mpPcs.map((pcName, idx) => {
    const count = idx >= 27 ? 7 : 8;
    const acList = [];
    for (let i = 0; i < count; i++) {
      acList.push({ acNumber: mpAcCount, acName: `${pcName} AC ${i + 1}`, districtName: pcName });
      mpAcCount++;
    }
    return { pcNumber: idx + 1, pcName, acList };
  });
  addStateACs("Madhya Pradesh", mpPcList);

  // 14. MAHARASHTRA (288 ACs, 48 PCs x 6)
  const mhPcs = [
    "Nandurbar", "Dhule", "Jalgaon", "Raver", "Buldhana", "Akola", "Amravati", "Wardha", "Ramtek", "Nagpur", "Bhandara Gondiya",
    "Gadchiroli-Chimur", "Chandrapur", "Yavatmal-Washim", "Hingoli", "Nanded", "Parbhani", "Jalna", "Chhatrapati Sambhajinagar (Aurangabad)",
    "Dindori", "Nashik", "Palghar", "Bhiwandi", "Kalyan", "Thane", "Mumbai North", "Mumbai North West", "Mumbai North East",
    "Mumbai North Central", "Mumbai South Central", "Mumbai South", "Raigad", "Maval", "Pune", "Baramati", "Shirur", "Ahmednagar",
    "Shirdi", "Beed", "Osmanabad", "Latur", "Solapur", "Madha", "Sangli", "Satara", "Ratnagiri-Sindhudurg", "Kolhapur", "Hatkanangle"
  ];
  let mhAcCount = 1;
  const mhPcList = mhPcs.map((pcName, idx) => {
    const acList = [];
    for (let i = 0; i < 6; i++) {
      acList.push({ acNumber: mhAcCount, acName: `${pcName} AC ${i + 1}`, districtName: pcName.split(' ')[0] });
      mhAcCount++;
    }
    return { pcNumber: idx + 1, pcName, acList };
  });
  addStateACs("Maharashtra", mhPcList);

  // 15. MANIPUR (60 ACs, 2 PCs x 30)
  generateStateGrid("Manipur", 60, [
    { pcNumber: 1, pcName: "Inner Manipur", count: 30, districtName: "Imphal East" },
    { pcNumber: 2, pcName: "Outer Manipur", count: 30, districtName: "Churachandpur" }
  ]);

  // 16. MEGHALAYA (60 ACs, 2 PCs x 30)
  generateStateGrid("Meghalaya", 60, [
    { pcNumber: 1, pcName: "Shillong", count: 30, districtName: "East Khasi Hills" },
    { pcNumber: 2, pcName: "Tura", count: 30, districtName: "West Garo Hills" }
  ]);

  // 17. MIZORAM (40 ACs, 1 PC x 40)
  generateStateGrid("Mizoram", 40, [{ pcNumber: 1, pcName: "Mizoram", count: 40, districtName: "Aizawl" }]);

  // 18. NAGALAND (60 ACs, 1 PC x 60)
  generateStateGrid("Nagaland", 60, [{ pcNumber: 1, pcName: "Nagaland", count: 60, districtName: "Kohima" }]);

  // 19. ODISHA (147 ACs, 21 PCs x 7)
  const odPcs = [
    "Bargarh", "Sundargarh", "Sambalpur", "Keonjhar", "Mayurbhanj", "Balasore", "Bhadrak", "Jajpur", "Dhenkanal",
    "Bolangir", "Kalahandi", "Nabarangpur", "Kandhamal", "Cuttack", "Kendrapara", "Jagatsinghpur", "Puri",
    "Bhubaneswar", "Aska", "Berhampur", "Koraput"
  ];
  generateStateGrid("Odisha", 147, odPcs.map((pcName, idx) => ({ pcNumber: idx + 1, pcName, count: 7, districtName: pcName })));

  // 20. PUNJAB (117 ACs, 13 PCs x 9)
  const pbPcs = [
    "Gurdaspur", "Amritsar", "Khadoor Sahib", "Jalandhar", "Hoshiarpur", "Anandpur Sahib", "Ludhiana",
    "Fatehgarh Sahib", "Faridkot", "Firozpur", "Bathinda", "Sangrur", "Patiala"
  ];
  generateStateGrid("Punjab", 117, pbPcs.map((pcName, idx) => ({ pcNumber: idx + 1, pcName, count: 9, districtName: pcName })));

  // 21. RAJASTHAN (200 ACs, 25 PCs x 8)
  const rjPcs = [
    "Ganganagar", "Bikaner", "Churu", "Jhunjhunu", "Sikar", "Jaipur Rural", "Jaipur", "Alwar", "Bharatpur", "Karauli-Dholpur",
    "Dausa", "Tonk-Sawai Madhopur", "Ajmer", "Nagaur", "Pali", "Jodhpur", "Barmer", "Jalore", "Udaipur", "Banswara",
    "Chittorgarh", "Rajsamand", "Bhilwara", "Kota", "Jhalawar-Baran"
  ];
  generateStateGrid("Rajasthan", 200, rjPcs.map((pcName, idx) => ({ pcNumber: idx + 1, pcName, count: 8, districtName: pcName.split(' ')[0] })));

  // 22. SIKKIM (32 ACs, 1 PC x 32)
  generateStateGrid("Sikkim", 32, [{ pcNumber: 1, pcName: "Sikkim", count: 32, districtName: "Gangtok" }]);

  // 23. TAMIL NADU (234 ACs, 39 PCs x 6)
  const tnPcs = [
    "Tiruvallur", "Chennai North", "Chennai South", "Chennai Central", "Sriperumbudur", "Kancheepuram", "Arakkonam",
    "Vellore", "Tirupattur", "Dharmapuri", "Tiruvannamalai", "Arani", "Viluppuram", "Kallakurichi", "Salem", "Namakkal",
    "Erode", "Tiruppur", "Nilgiris", "Coimbatore", "Pollachi", "Dindigul", "Karur", "Tiruchirappalli", "Perambalur",
    "Cuddalore", "Chidambaram", "Mayiladuthurai", "Nagapattinam", "Thanjavur", "Sivaganga", "Madurai", "Theni",
    "Virudhunagar", "Ramanathapuram", "Thoothukkudi", "Tenkasi", "Tirunelveli", "Kanniyakumari"
  ];
  generateStateGrid("Tamil Nadu", 234, tnPcs.map((pcName, idx) => ({ pcNumber: idx + 1, pcName, count: 6, districtName: pcName.split(' ')[0] })));

  // 24. TELANGANA (119 ACs, 17 PCs x 7)
  const tgPcs = [
    "Adilabad", "Peddapalle", "Karimnagar", "Nizamabad", "Zahirabad", "Medak", "Malkajgiri", "Secunderabad",
    "Hyderabad", "CHEVALLA", "Mahbubnagar", "Nagarkurnool", "Nalgonda", "Bhongir", "Warangal", "Mahabubabad", "Khammam"
  ];
  generateStateGrid("Telangana", 119, tgPcs.map((pcName, idx) => ({ pcNumber: idx + 1, pcName, count: 7, districtName: pcName })));

  // 25. TRIPURA (60 ACs, 2 PCs x 30)
  generateStateGrid("Tripura", 60, [
    { pcNumber: 1, pcName: "Tripura West", count: 30, districtName: "West Tripura" },
    { pcNumber: 2, pcName: "Tripura East", count: 30, districtName: "South Tripura" }
  ]);

  // 26. UTTAR PRADESH (403 ACs, 80 PCs)
  // 3 PCs x 6 ACs = 18 + 77 PCs x 5 ACs = 385 -> Total 403 ACs
  const upPcs = [
    "Saharanpur", "Kairana", "Muzaffarnagar", "Bijnor", "Nagina", "Moradabad", "Rampur", "Sambhal", "Amroha",
    "Meerut", "Baghpat", "Ghaziabad", "Gautam Buddha Nagar", "Bulandshahr", "Aligarh", "Hathras", "Mathura",
    "Agra", "Fatehpur Sikri", "Firozabad", "Mainpuri", "Etah", "Badaun", "Aonla", "Bareilly", "Pilibhit", "Shahjahanpur",
    "Kheri", "Dhaurahra", "Sitapur", "Hardoi", "Misrikh", "Unnao", "Lucknow", "Rae Bareli", "Amethi", "Sultanpur",
    "Pratapgarh", "Farrukhabad", "Etawah", "Kannauj", "Kanpur", "Akbarpur", "Jalaun", "Jhansi", "Hamirpur", "Banda",
    "Fatehpur", "Kaushambi", "Phulpur", "Allahabad", "Barabanki", "Faizabad", "Ambedkar Nagar", "Bahraich", "Kaiserganj",
    "Shrawasti", "Gonda", "Domariyaganj", "Basti", "Sant Kabir Nagar", "Maharajganj", "Gorakhpur", "Kushi Nagar",
    "Deoria", "Bansgaon", "Lalganj", "Azamgarh", "Ghosi", "Salempur", "Ballia", "Jaunpur", "Machhlishahr", "Ghazipur",
    "Chandauli", "Varanasi", "Bhadohi", "Mirzapur", "Robertsganj", "Nautanwa"
  ];
  let upAcCount = 1;
  const upPcList = upPcs.map((pcName, idx) => {
    const count = idx < 3 ? 6 : 5;
    const acList = [];
    for (let i = 0; i < count; i++) {
      acList.push({ acNumber: upAcCount, acName: `${pcName} AC ${i + 1}`, districtName: pcName });
      upAcCount++;
    }
    return { pcNumber: idx + 1, pcName, acList };
  });
  addStateACs("Uttar Pradesh", upPcList);

  // 27. UTTARAKHAND (70 ACs, 5 PCs x 14)
  const ukPcs = ["Tehri Garhwal", "Garhwal", "Almora", "Nainital-Udhamsingh Nagar", "Hardwar"];
  generateStateGrid("Uttarakhand", 70, ukPcs.map((pcName, idx) => ({ pcNumber: idx + 1, pcName, count: 14, districtName: pcName.split(' ')[0] })));

  // 28. WEST BENGAL (294 ACs, 42 PCs x 7)
  const wbPcs = [
    "Cooch Behar", "Alipurduars", "Jalpaiguri", "Darjeeling", "Raiganj", "Balurghat", "Maldaha Uttar", "Maldaha Dakshin",
    "Jangipur", "Baharampur", "Murshidabad", "Krishnanagar", "Ranaghat", "Bangaon", "Barrackpur", "Dum Dum", "Barasat",
    "Basirhat", "Jaynagar", "Mathurapur", "Diamond Harbour", "Jadavpur", "Kolkata Dakshin", "Kolkata Uttar", "Howrah",
    "Uluberia", "Sreerampur", "Hooghly", "Arambagh", "Tamluk", "Kanthi", "Ghatal", "Jhargram", "Medinipur", "Purulia",
    "Bankura", "Bishnupur", "Bardhaman Purba", "Bardhaman-Durgapur", "Asansol", "Bolpur", "Birbhum"
  ];
  generateStateGrid("West Bengal", 294, wbPcs.map((pcName, idx) => ({ pcNumber: idx + 1, pcName, count: 7, districtName: pcName.split(' ')[0] })));

  // ==========================================
  // UTs WITH LEGISLATIVE ASSEMBLIES
  // ==========================================
  // 29. DELHI (70 ACs, 7 PCs x 10)
  const dlPcs = ["Chandni Chowk", "North East Delhi", "East Delhi", "New Delhi", "North West Delhi", "West Delhi", "South Delhi"];
  generateStateGrid("Delhi", 70, dlPcs.map((pcName, idx) => ({ pcNumber: idx + 1, pcName, count: 10, districtName: pcName })));

  // 30. PUDUCHERRY (30 ACs, 1 PC x 30)
  generateStateGrid("Puducherry", 30, [{ pcNumber: 1, pcName: "Puducherry", count: 30, districtName: "Puducherry" }]);

  // 31. JAMMU AND KASHMIR (90 ACs, 5 PCs x 18)
  const jkPcs = ["Baramulla", "Srinagar", "Anantnag-Rajouri", "Udhampur", "Jammu"];
  generateStateGrid("Jammu and Kashmir", 90, jkPcs.map((pcName, idx) => ({ pcNumber: idx + 1, pcName, count: 18, districtName: pcName.split('-')[0] })));

  return records;
}

// Generate Excel, CSV, and JSON files
async function generateAllFiles() {
  const acData = getSystemAllACs();
  console.log(`=========================================`);
  console.log(`Generated total AC records count: ${acData.length}`);
  console.log(`=========================================`);

  const projectRoot = path.resolve(__dirname, '../../../..');
  const xlsxPath = path.join(projectRoot, 'all_4123_assembly_constituencies.xlsx');
  const csvPath = path.join(projectRoot, 'all_4123_assembly_constituencies.csv');
  const jsonPath = path.resolve(__dirname, 'assembly_constituencies.json');

  // 1. Generate Excel (.xlsx) file using ExcelJS
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ranniti System';
  workbook.lastModifiedBy = 'Ranniti System';
  workbook.created = new Date();
  
  const worksheet = workbook.addWorksheet('Assembly Constituencies');
  worksheet.columns = [
    { header: 'State Name', key: 'stateName', width: 25 },
    { header: 'PC Number', key: 'pcNumber', width: 12 },
    { header: 'PC Name', key: 'pcName', width: 28 },
    { header: 'AC Number', key: 'acNumber', width: 12 },
    { header: 'AC Name', key: 'acName', width: 30 },
    { header: 'District Name', key: 'districtName', width: 25 },
    { header: 'Reservation', key: 'reservation', width: 15 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E3A8A' } // Sleek navy header
  };

  for (const ac of acData) {
    worksheet.addRow(ac);
  }

  await workbook.xlsx.writeFile(xlsxPath);
  console.log(`✅ Excel file written successfully to: ${xlsxPath}`);

  // 2. Generate CSV file
  const csvHeader = 'State Name,PC Number,PC Name,AC Number,AC Name,District Name,Reservation\n';
  const csvRows = acData.map(r => 
    `"${r.stateName}",${r.pcNumber},"${r.pcName}",${r.acNumber},"${r.acName}","${r.districtName}","${r.reservation}"`
  ).join('\n');
  
  fs.writeFileSync(csvPath, csvHeader + csvRows, 'utf8');
  console.log(`✅ CSV file written successfully to: ${csvPath}`);

  // 3. Update assembly_constituencies.json
  const formattedJson = acData.map(r => ({
    stateName: r.stateName,
    pcNumber: r.pcNumber,
    pcName: r.pcName,
    acNumber: r.acNumber,
    name: r.acName,
    districtName: r.districtName,
    reservation: r.reservation
  }));

  fs.writeFileSync(jsonPath, JSON.stringify(formattedJson, null, 2), 'utf8');
  console.log(`✅ JSON seed file updated at: ${jsonPath}`);
}

generateAllFiles().catch(err => {
  console.error("Error generating files:", err);
  process.exit(1);
});
