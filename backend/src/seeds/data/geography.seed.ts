export const initialPcs = [
  // Maharashtra PCs
  { pcNumber: 33, name: 'Pune', stateName: 'Maharashtra' },
  { pcNumber: 34, name: 'Baramati', stateName: 'Maharashtra' },
  { pcNumber: 30, name: 'Mumbai South', stateName: 'Maharashtra' },
  { pcNumber: 25, name: 'Thane', stateName: 'Maharashtra' },
  { pcNumber: 10, name: 'Nagpur', stateName: 'Maharashtra' },
  // Delhi PCs
  { pcNumber: 4, name: 'New Delhi', stateName: 'Delhi' },
  { pcNumber: 1, name: 'Chandni Chowk', stateName: 'Delhi' },
  { pcNumber: 3, name: 'East Delhi', stateName: 'Delhi' },
  // Uttar Pradesh PCs
  { pcNumber: 57, name: 'Varanasi', stateName: 'Uttar Pradesh' },
  { pcNumber: 35, name: 'Lucknow', stateName: 'Uttar Pradesh' },
];

export const initialAcs = [
  // Pune PC (Maharashtra)
  { acNumber: 210, name: 'Kothrud', pcName: 'Pune', districtName: 'Pune' },
  { acNumber: 214, name: 'Shivajinagar', pcName: 'Pune', districtName: 'Pune' },
  { acNumber: 208, name: 'Vadgaon Sheri', pcName: 'Pune', districtName: 'Pune' },
  // Baramati PC (Maharashtra)
  { acNumber: 211, name: 'Khadakwasla', pcName: 'Baramati', districtName: 'Pune' },
  { acNumber: 201, name: 'Baramati Assembly', pcName: 'Baramati', districtName: 'Pune' },
  // Mumbai South PC (Maharashtra)
  { acNumber: 185, name: 'Malabar Hill', pcName: 'Mumbai South', districtName: 'Mumbai' },
  { acNumber: 186, name: 'Mumbadevi', pcName: 'Mumbai South', districtName: 'Mumbai' },
  // New Delhi PC (Delhi)
  { acNumber: 50, name: 'New Delhi Assembly', pcName: 'New Delhi', districtName: 'New Delhi' },
  // Chandni Chowk PC (Delhi)
  { acNumber: 20, name: 'Chandni Chowk Assembly', pcName: 'Chandni Chowk', districtName: 'Central' },
  // Varanasi PC (Uttar Pradesh)
  { acNumber: 387, name: 'Varanasi Cantt.', pcName: 'Varanasi', districtName: 'Varanasi' },
  // Lucknow PC (Uttar Pradesh)
  { acNumber: 171, name: 'Lucknow West', pcName: 'Lucknow', districtName: 'Lucknow' },
];

export const initialBooths = [
  // Kothrud AC
  {
    boothNumber: 101,
    name: 'Abhasaheb Garware College, Main Building Room 1',
    acName: 'Kothrud',
    locationBuilding: 'Karve Road, Deccan Gymkhana, Pune',
    totalVoters: 1240,
  },
  {
    boothNumber: 102,
    name: 'MES Sou Vimlabai Garware High School, Room 3',
    acName: 'Kothrud',
    locationBuilding: 'Off Karve Road, Kothrud, Pune',
    totalVoters: 1180,
  },
  {
    boothNumber: 103,
    name: 'MIT World Peace University, Central Library Block',
    acName: 'Kothrud',
    locationBuilding: 'Paud Road, Kothrud, Pune',
    totalVoters: 1350,
  },
  {
    boothNumber: 104,
    name: 'Zilla Parishad Primary School, Room 2',
    acName: 'Kothrud',
    locationBuilding: 'Kothrud Gaothan, Pune',
    totalVoters: 1410,
  },
  // Shivajinagar AC
  {
    boothNumber: 15,
    name: 'Modern High School, Main Hall',
    acName: 'Shivajinagar',
    locationBuilding: 'Shivajinagar, Pune',
    totalVoters: 1290,
  },
  {
    boothNumber: 16,
    name: 'COEP Technological University, Mechanical Dept Room 4',
    acName: 'Shivajinagar',
    locationBuilding: 'Shivajinagar, Pune',
    totalVoters: 1150,
  },
  // Vadgaon Sheri AC
  {
    boothNumber: 42,
    name: 'Nutan Marathi Vidyalaya (NMV), Primary Section',
    acName: 'Vadgaon Sheri',
    locationBuilding: 'Viman Nagar, Pune',
    totalVoters: 1380,
  },
  // New Delhi Assembly AC
  {
    boothNumber: 8,
    name: 'Navyug School, Ground Floor Room A',
    acName: 'New Delhi Assembly',
    locationBuilding: 'Lodhi Road, New Delhi',
    totalVoters: 1050,
  },
  {
    boothNumber: 9,
    name: 'Kendriya Vidyalaya No. 1, Block B',
    acName: 'New Delhi Assembly',
    locationBuilding: 'Gole Market, New Delhi',
    totalVoters: 1220,
  },
  // Chandni Chowk Assembly AC
  {
    boothNumber: 5,
    name: 'Queens Mary School, Main Auditorium',
    acName: 'Chandni Chowk Assembly',
    locationBuilding: 'Tis Hazari, Delhi',
    totalVoters: 1110,
  },
  // Varanasi Cantt. AC
  {
    boothNumber: 12,
    name: 'Queen Rajghat Inter College, Room 10',
    acName: 'Varanasi Cantt.',
    locationBuilding: 'Cantt Road, Varanasi',
    totalVoters: 1480,
  },
];
