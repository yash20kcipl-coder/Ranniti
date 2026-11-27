/**
 * Geographic Reference Data for Ranniti Indian GIS Heat Map
 * Includes:
 * 1. Surrounding Water Bodies & Oceanic Styling (Refined typography)
 * 2. Neighboring Countries (Landmass buffer)
 * 3. All Indian States & Union Territories with Geographic Centroids
 * 4. Comprehensive Hierarchy of Indian Cities (Tier 1 Metros, Tier 2 Capitals/Hubs, Tier 3 District Centers)
 */

export interface WaterBody {
  name: string;
  lng: number;
  lat: number;
  fontSize: number;
  minZoom?: number;
}

export interface NeighborCountry {
  name: string;
  labelCoord: [number, number];
  polygon: [number, number][];
}

export interface StateLabel {
  name: string;
  code: string;
  lng: number;
  lat: number;
  fontSize: number;
  minZoom?: number;
  maxZoom?: number;
}

export interface CityItem {
  name: string;
  state: string;
  lng: number;
  lat: number;
  tier: 1 | 2 | 3;
  isCapital?: boolean;
}

// 1. Water Bodies (Arabian Sea, Bay of Bengal, Indian Ocean, etc.)
export const WATER_BODIES: WaterBody[] = [
  {
    name: 'Arabian Sea',
    lng: 69.2,
    lat: 16.0,
    fontSize: 10,
    minZoom: 3.5,
  },
  {
    name: 'Bay of Bengal',
    lng: 88.5,
    lat: 14.5,
    fontSize: 10.5,
    minZoom: 3.5,
  },
  {
    name: 'Indian Ocean',
    lng: 78.5,
    lat: 5.2,
    fontSize: 11,
    minZoom: 3.5,
  },
  {
    name: 'Laccadive Sea',
    lng: 74.8,
    lat: 9.2,
    fontSize: 8.5,
    minZoom: 5.5,
  },
  {
    name: 'Andaman Sea',
    lng: 95.2,
    lat: 11.5,
    fontSize: 8.5,
    minZoom: 5.5,
  },
  {
    name: 'Gulf of Kutch',
    lng: 69.5,
    lat: 22.6,
    fontSize: 8,
    minZoom: 6.5,
  },
  {
    name: 'Gulf of Khambhat',
    lng: 72.3,
    lat: 21.3,
    fontSize: 8,
    minZoom: 6.5,
  },
  {
    name: 'Palk Strait',
    lng: 79.5,
    lat: 9.5,
    fontSize: 8,
    minZoom: 6.5,
  },
];

// Decorative ocean wave marks in open waters
export const OCEAN_WAVE_LOCATIONS: [number, number][] = [
  [67.0, 14.0],
  [68.5, 19.5],
  [66.5, 10.5],
  [68.0, 7.5],
  [88.0, 12.0],
  [90.0, 17.5],
  [87.0, 7.5],
  [91.5, 9.5],
  [75.0, 4.5],
  [82.0, 4.0],
  [72.0, 6.0],
  [94.0, 7.0],
];

// 2. Neighboring Countries (To preserve realistic land vs water cartography)
export const NEIGHBORING_COUNTRIES: NeighborCountry[] = [
  {
    name: 'Sri Lanka',
    labelCoord: [80.7, 7.8],
    polygon: [
      [79.6, 9.8], [80.3, 9.8], [80.9, 9.1], [81.3, 8.6], [81.8, 7.5],
      [81.9, 6.9], [81.2, 6.2], [80.6, 5.9], [80.1, 6.0], [79.8, 6.9],
      [79.8, 8.0], [79.6, 9.8],
    ],
  },
  {
    name: 'Bangladesh',
    labelCoord: [90.3, 23.8],
    polygon: [
      [88.9, 21.7], [89.1, 22.8], [88.5, 24.3], [88.2, 25.1], [88.9, 26.3],
      [89.7, 26.0], [90.5, 25.2], [91.8, 25.2], [92.3, 24.9], [92.0, 24.0],
      [91.3, 23.8], [91.2, 23.2], [92.0, 22.8], [92.4, 21.4], [92.1, 20.7],
      [91.7, 21.4], [90.5, 21.9], [89.7, 21.7], [88.9, 21.7],
    ],
  },
  {
    name: 'Nepal',
    labelCoord: [84.1, 28.3],
    polygon: [
      [80.1, 30.2], [81.2, 29.8], [82.5, 28.7], [84.1, 27.5], [85.5, 27.1],
      [87.0, 26.5], [88.1, 26.8], [88.1, 27.9], [87.2, 28.0], [85.5, 28.4],
      [83.5, 29.3], [81.5, 30.4], [80.1, 30.2],
    ],
  },
  {
    name: 'Bhutan',
    labelCoord: [90.4, 27.5],
    polygon: [
      [88.9, 27.3], [90.2, 26.8], [91.5, 26.8], [92.1, 27.3], [91.5, 28.1],
      [90.4, 28.3], [89.3, 27.9], [88.9, 27.3],
    ],
  },
  {
    name: 'Pakistan',
    labelCoord: [69.2, 29.5],
    polygon: [
      [68.16, 23.85], [68.10, 24.20], [68.20, 24.50], [68.80, 24.45], [70.00, 24.55], [71.15, 24.70],
      [71.0, 27.0], [72.5, 28.5], [74.0, 30.5], [75.0, 31.5], [74.5, 32.5], [74.5, 34.5],
      [75.5, 36.0], [74.5, 37.0], [73.0, 36.5], [71.5, 35.0], [70.5, 33.5], [69.5, 32.0],
      [66.5, 30.5], [63.5, 29.5], [61.0, 29.5], [61.0, 28.0], [61.5, 25.2], [64.5, 25.3],
      [66.8, 25.0], [67.0, 24.8], [67.5, 24.0], [68.16, 23.85],
    ],
  },
  {
    name: 'Myanmar',
    labelCoord: [96.0, 21.5],
    polygon: [
      [92.4, 21.4], [93.2, 22.5], [93.4, 24.0], [94.5, 25.5], [95.5, 26.8],
      [97.0, 27.5], [98.5, 27.0], [98.5, 24.0], [98.0, 21.0], [99.0, 19.5],
      [97.5, 16.5], [94.5, 16.0], [93.5, 18.5], [92.4, 20.5], [92.4, 21.4],
    ],
  },
  {
    name: 'China',
    labelCoord: [85.0, 32.5],
    polygon: [
      [74.5, 37.0], [78.0, 36.5], [80.5, 35.0], [84.0, 33.0], [88.0, 31.0],
      [92.0, 29.0], [97.0, 29.0], [98.5, 27.0], [98.5, 38.0], [74.5, 38.0],
      [74.5, 37.0],
    ],
  },
  {
    name: 'Afghanistan',
    labelCoord: [67.8, 33.5],
    polygon: [
      [61.0, 29.5], [61.0, 34.0], [65.0, 37.0], [71.0, 37.5], [74.5, 37.0],
      [71.5, 35.0], [69.5, 32.0], [66.5, 30.5], [63.5, 29.5], [61.0, 29.5],
    ],
  },
];

// 3. Indian States and Union Territories (refined typography, sizes 8px - 10px)
export const INDIAN_STATES: StateLabel[] = [
  // Major States (Visible at national zoom)
  { name: 'GUJARAT', code: 'GJ', lng: 71.5, lat: 22.4, fontSize: 9.5 },
  { name: 'MAHARASHTRA', code: 'MH', lng: 75.8, lat: 19.4, fontSize: 9.5 },
  { name: 'RAJASTHAN', code: 'RJ', lng: 73.8, lat: 26.5, fontSize: 10 },
  { name: 'MADHYA PRADESH', code: 'MP', lng: 78.2, lat: 23.5, fontSize: 10 },
  { name: 'UTTAR PRADESH', code: 'UP', lng: 80.5, lat: 27.2, fontSize: 10 },
  { name: 'BIHAR', code: 'BR', lng: 85.5, lat: 25.8, fontSize: 9 },
  { name: 'WEST BENGAL', code: 'WB', lng: 87.8, lat: 23.1, fontSize: 8.5 },
  { name: 'ODISHA', code: 'OD', lng: 84.5, lat: 20.5, fontSize: 9 },
  { name: 'KARNATAKA', code: 'KA', lng: 75.8, lat: 14.8, fontSize: 9 },
  { name: 'TAMIL NADU', code: 'TN', lng: 78.5, lat: 11.2, fontSize: 9 },
  { name: 'KERALA', code: 'KL', lng: 76.4, lat: 10.2, fontSize: 8 },
  { name: 'ANDHRA PRADESH', code: 'AP', lng: 79.8, lat: 15.5, fontSize: 9 },
  { name: 'TELANGANA', code: 'TG', lng: 79.1, lat: 17.8, fontSize: 8.5 },
  { name: 'PUNJAB', code: 'PB', lng: 75.3, lat: 31.0, fontSize: 8 },
  { name: 'HARYANA', code: 'HR', lng: 76.2, lat: 29.2, fontSize: 8 },
  { name: 'CHHATTISGARH', code: 'CG', lng: 82.0, lat: 21.3, fontSize: 8.5 },
  { name: 'JHARKHAND', code: 'JH', lng: 85.3, lat: 23.6, fontSize: 8.5 },
  { name: 'ASSAM', code: 'AS', lng: 92.8, lat: 26.2, fontSize: 8.5 },
  { name: 'HIMACHAL PRADESH', code: 'HP', lng: 77.0, lat: 31.8, fontSize: 8 },
  { name: 'UTTARAKHAND', code: 'UK', lng: 79.2, lat: 30.1, fontSize: 8 },
  { name: 'JAMMU & KASHMIR', code: 'JK', lng: 74.8, lat: 33.6, fontSize: 8 },
  { name: 'LADAKH', code: 'LA', lng: 77.5, lat: 34.2, fontSize: 8.5 },
  { name: 'ARUNACHAL PRADESH', code: 'AR', lng: 94.5, lat: 28.0, fontSize: 8.5 },

  // Compact / Smaller States (minZoom: 5.6 to avoid crowding at All-India view)
  { name: 'GOA', code: 'GA', lng: 74.0, lat: 15.4, fontSize: 7.5, minZoom: 5.6 },
  { name: 'SIKKIM', code: 'SK', lng: 88.5, lat: 27.4, fontSize: 7.5, minZoom: 5.6 },
  { name: 'TRIPURA', code: 'TR', lng: 91.7, lat: 23.8, fontSize: 7.5, minZoom: 5.6 },
  { name: 'MEGHALAYA', code: 'ML', lng: 91.3, lat: 25.5, fontSize: 7.5, minZoom: 5.6 },
  { name: 'MANIPUR', code: 'MN', lng: 93.9, lat: 24.7, fontSize: 7.5, minZoom: 5.6 },
  { name: 'NAGALAND', code: 'NL', lng: 94.5, lat: 26.1, fontSize: 7.5, minZoom: 5.6 },
  { name: 'MIZORAM', code: 'MZ', lng: 92.8, lat: 23.3, fontSize: 7.5, minZoom: 5.6 },
  { name: 'PUDUCHERRY', code: 'PY', lng: 79.8, lat: 11.9, fontSize: 7.5, minZoom: 6.2 },
  { name: 'ANDAMAN & NICOBAR', code: 'AN', lng: 92.9, lat: 11.6, fontSize: 7.5, minZoom: 4.8 },
  { name: 'LAKSHADWEEP', code: 'LD', lng: 72.6, lat: 10.5, fontSize: 7.5, minZoom: 5.2 },
];

// 4. Indian Cities Hierarchy (Tier 1: Metros, Tier 2: Capitals/Hubs, Tier 3: Regional Centers)
export const INDIAN_CITIES: CityItem[] = [
  // --- TIER 1: Core Metros & National Capital (Visible Zoom >= 3.8) ---
  { name: 'New Delhi', state: 'Delhi', lng: 77.2090, lat: 28.6139, tier: 1, isCapital: true },
  { name: 'Mumbai', state: 'Maharashtra', lng: 72.8777, lat: 19.0760, tier: 1 },
  { name: 'Bengaluru', state: 'Karnataka', lng: 77.5946, lat: 12.9716, tier: 1 },
  { name: 'Kolkata', state: 'West Bengal', lng: 88.3639, lat: 22.5726, tier: 1 },
  { name: 'Chennai', state: 'Tamil Nadu', lng: 80.2707, lat: 13.0827, tier: 1 },
  { name: 'Hyderabad', state: 'Telangana', lng: 78.4867, lat: 17.3850, tier: 1 },
  { name: 'Ahmedabad', state: 'Gujarat', lng: 72.5714, lat: 23.0225, tier: 1 },

  // --- TIER 2: State Capitals & Major Commercial Hubs (Visible Zoom >= 5.4) ---
  { name: 'Jaipur', state: 'Rajasthan', lng: 75.7873, lat: 26.9124, tier: 2 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lng: 80.9462, lat: 26.8467, tier: 2 },
  { name: 'Pune', state: 'Maharashtra', lng: 73.8567, lat: 18.5204, tier: 2 },
  { name: 'Surat', state: 'Gujarat', lng: 72.8311, lat: 21.1702, tier: 2 },
  { name: 'Vadodara', state: 'Gujarat', lng: 73.1812, lat: 22.3072, tier: 2 },
  { name: 'Rajkot', state: 'Gujarat', lng: 70.8022, lat: 22.3039, tier: 2 },
  { name: 'Gandhinagar', state: 'Gujarat', lng: 72.6369, lat: 23.2156, tier: 2 },
  { name: 'Bhopal', state: 'Madhya Pradesh', lng: 77.4126, lat: 23.2599, tier: 2, isCapital: true },
  { name: 'Indore', state: 'Madhya Pradesh', lng: 75.8577, lat: 22.7196, tier: 2 },
  { name: 'Nagpur', state: 'Maharashtra', lng: 79.0882, lat: 21.1458, tier: 2 },
  { name: 'Nashik', state: 'Maharashtra', lng: 73.7898, lat: 19.9975, tier: 2 },
  { name: 'Panaji', state: 'Goa', lng: 73.8278, lat: 15.4909, tier: 2, isCapital: true },
  { name: 'Chandigarh', state: 'Punjab/Haryana', lng: 76.7794, lat: 30.7333, tier: 2, isCapital: true },
  { name: 'Amritsar', state: 'Punjab', lng: 74.8723, lat: 31.6340, tier: 2 },
  { name: 'Ludhiana', state: 'Punjab', lng: 75.8573, lat: 30.9010, tier: 2 },
  { name: 'Shimla', state: 'Himachal Pradesh', lng: 77.1734, lat: 31.1048, tier: 2, isCapital: true },
  { name: 'Dehradun', state: 'Uttarakhand', lng: 78.0322, lat: 30.3165, tier: 2, isCapital: true },
  { name: 'Srinagar', state: 'Jammu & Kashmir', lng: 74.7973, lat: 34.0837, tier: 2, isCapital: true },
  { name: 'Jammu', state: 'Jammu & Kashmir', lng: 74.8570, lat: 32.7266, tier: 2 },
  { name: 'Leh', state: 'Ladakh', lng: 77.5771, lat: 34.1526, tier: 2 },
  { name: 'Kanpur', state: 'Uttar Pradesh', lng: 80.3319, lat: 26.4499, tier: 2 },
  { name: 'Varanasi', state: 'Uttar Pradesh', lng: 82.9739, lat: 25.3176, tier: 2 },
  { name: 'Agra', state: 'Uttar Pradesh', lng: 78.0081, lat: 27.1767, tier: 2 },
  { name: 'Prayagraj', state: 'Uttar Pradesh', lng: 81.8463, lat: 25.4358, tier: 2 },
  { name: 'Patna', state: 'Bihar', lng: 85.1376, lat: 25.5941, tier: 2, isCapital: true },
  { name: 'Ranchi', state: 'Jharkhand', lng: 85.3096, lat: 23.3441, tier: 2, isCapital: true },
  { name: 'Bhubaneswar', state: 'Odisha', lng: 85.8245, lat: 20.2961, tier: 2, isCapital: true },
  { name: 'Raipur', state: 'Chhattisgarh', lng: 81.6296, lat: 21.2514, tier: 2, isCapital: true },
  { name: 'Jodhpur', state: 'Rajasthan', lng: 73.0243, lat: 26.2389, tier: 2 },
  { name: 'Udaipur', state: 'Rajasthan', lng: 73.7125, lat: 24.5854, tier: 2 },
  { name: 'Kota', state: 'Rajasthan', lng: 75.8648, lat: 25.2138, tier: 2 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lng: 83.2185, lat: 17.6868, tier: 2 },
  { name: 'Vijayawada', state: 'Andhra Pradesh', lng: 80.6480, lat: 16.5062, tier: 2 },
  { name: 'Kochi', state: 'Kerala', lng: 76.2673, lat: 9.9312, tier: 2 },
  { name: 'Thiruvananthapuram', state: 'Kerala', lng: 76.9366, lat: 8.5241, tier: 2, isCapital: true },
  { name: 'Coimbatore', state: 'Tamil Nadu', lng: 76.9558, lat: 11.0168, tier: 2 },
  { name: 'Madurai', state: 'Tamil Nadu', lng: 78.1198, lat: 9.9252, tier: 2 },
  { name: 'Mysuru', state: 'Karnataka', lng: 76.6394, lat: 12.2958, tier: 2 },
  { name: 'Hubballi', state: 'Karnataka', lng: 75.1240, lat: 15.3647, tier: 2 },
  { name: 'Guwahati', state: 'Assam', lng: 91.7362, lat: 26.1445, tier: 2 },
  { name: 'Shillong', state: 'Meghalaya', lng: 91.8933, lat: 25.5788, tier: 2, isCapital: true },
  { name: 'Imphal', state: 'Manipur', lng: 93.9368, lat: 24.8170, tier: 2, isCapital: true },
  { name: 'Aizawl', state: 'Mizoram', lng: 92.7176, lat: 23.7271, tier: 2, isCapital: true },
  { name: 'Kohima', state: 'Nagaland', lng: 94.1086, lat: 25.6751, tier: 2, isCapital: true },
  { name: 'Agartala', state: 'Tripura', lng: 91.2868, lat: 23.8315, tier: 2, isCapital: true },
  { name: 'Gangtok', state: 'Sikkim', lng: 88.6138, lat: 27.3389, tier: 2, isCapital: true },
  { name: 'Itanagar', state: 'Arunachal Pradesh', lng: 93.6053, lat: 27.0844, tier: 2, isCapital: true },
  { name: 'Port Blair', state: 'Andaman & Nicobar', lng: 92.7265, lat: 11.6234, tier: 2 },

  // --- TIER 3: Regional Hubs & District Centers (Visible Zoom >= 7.0) ---
  { name: 'Bhavnagar', state: 'Gujarat', lng: 72.1500, lat: 21.7645, tier: 3 },
  { name: 'Jamnagar', state: 'Gujarat', lng: 70.0667, lat: 22.4707, tier: 3 },
  { name: 'Junagadh', state: 'Gujarat', lng: 70.4579, lat: 21.5222, tier: 3 },
  { name: 'Bhuj', state: 'Gujarat', lng: 69.6669, lat: 23.2420, tier: 3 },
  { name: 'Anand', state: 'Gujarat', lng: 72.9289, lat: 22.5645, tier: 3 },
  { name: 'Bharuch', state: 'Gujarat', lng: 72.9959, lat: 21.7051, tier: 3 },
  { name: 'Navsari', state: 'Gujarat', lng: 72.9282, lat: 20.9500, tier: 3 },
  { name: 'Valsad', state: 'Gujarat', lng: 72.9342, lat: 20.5992, tier: 3 },
  { name: 'Porbandar', state: 'Gujarat', lng: 69.6293, lat: 21.6417, tier: 3 },
  { name: 'Mehsana', state: 'Gujarat', lng: 72.3999, lat: 23.5880, tier: 3 },
  { name: 'Aurangabad', state: 'Maharashtra', lng: 75.3433, lat: 19.8762, tier: 3 },
  { name: 'Solapur', state: 'Maharashtra', lng: 75.9064, lat: 17.6599, tier: 3 },
  { name: 'Kolhapur', state: 'Maharashtra', lng: 74.2433, lat: 16.7050, tier: 3 },
  { name: 'Amravati', state: 'Maharashtra', lng: 77.7523, lat: 20.9374, tier: 3 },
  { name: 'Jalgaon', state: 'Maharashtra', lng: 75.5626, lat: 21.0077, tier: 3 },
  { name: 'Gwalior', state: 'Madhya Pradesh', lng: 78.1828, lat: 26.2183, tier: 3 },
  { name: 'Jabalpur', state: 'Madhya Pradesh', lng: 79.9864, lat: 23.1815, tier: 3 },
  { name: 'Ujjain', state: 'Madhya Pradesh', lng: 75.7873, lat: 23.1765, tier: 3 },
  { name: 'Sagar', state: 'Madhya Pradesh', lng: 78.7378, lat: 23.8388, tier: 3 },
  { name: 'Satna', state: 'Madhya Pradesh', lng: 80.8322, lat: 24.6005, tier: 3 },
  { name: 'Bikaner', state: 'Rajasthan', lng: 73.3119, lat: 28.0229, tier: 3 },
  { name: 'Ajmer', state: 'Rajasthan', lng: 74.6399, lat: 26.4499, tier: 3 },
  { name: 'Alwar', state: 'Rajasthan', lng: 76.6083, lat: 27.5530, tier: 3 },
  { name: 'Bhilwara', state: 'Rajasthan', lng: 74.6313, lat: 25.3407, tier: 3 },
  { name: 'Bareilly', state: 'Uttar Pradesh', lng: 79.4304, lat: 28.3670, tier: 3 },
  { name: 'Aligarh', state: 'Uttar Pradesh', lng: 78.0880, lat: 27.8974, tier: 3 },
  { name: 'Moradabad', state: 'Uttar Pradesh', lng: 78.7768, lat: 28.8351, tier: 3 },
  { name: 'Gorakhpur', state: 'Uttar Pradesh', lng: 83.3732, lat: 26.7606, tier: 3 },
  { name: 'Jhansi', state: 'Uttar Pradesh', lng: 78.5685, lat: 25.4484, tier: 3 },
  { name: 'Ayodhya', state: 'Uttar Pradesh', lng: 82.1998, lat: 26.7922, tier: 3 },
  { name: 'Mathura', state: 'Uttar Pradesh', lng: 77.6737, lat: 27.4924, tier: 3 },
  { name: 'Meerut', state: 'Uttar Pradesh', lng: 77.7064, lat: 28.9845, tier: 3 },
  { name: 'Gaya', state: 'Bihar', lng: 85.0002, lat: 24.7914, tier: 3 },
  { name: 'Muzaffarpur', state: 'Bihar', lng: 85.3906, lat: 26.1209, tier: 3 },
  { name: 'Bhagalpur', state: 'Bihar', lng: 87.0000, lat: 25.2425, tier: 3 },
  { name: 'Jamshedpur', state: 'Jharkhand', lng: 86.2029, lat: 22.8046, tier: 3 },
  { name: 'Dhanbad', state: 'Jharkhand', lng: 86.4304, lat: 23.7957, tier: 3 },
  { name: 'Siliguri', state: 'West Bengal', lng: 88.4316, lat: 26.7271, tier: 3 },
  { name: 'Asansol', state: 'West Bengal', lng: 86.9746, lat: 23.6889, tier: 3 },
  { name: 'Durgapur', state: 'West Bengal', lng: 87.3119, lat: 23.5204, tier: 3 },
  { name: 'Cuttack', state: 'Odisha', lng: 85.8830, lat: 20.4625, tier: 3 },
  { name: 'Rourkela', state: 'Odisha', lng: 84.8536, lat: 22.2604, tier: 3 },
  { name: 'Puri', state: 'Odisha', lng: 85.8312, lat: 19.8135, tier: 3 },
  { name: 'Warangal', state: 'Telangana', lng: 79.5941, lat: 17.9689, tier: 3 },
  { name: 'Guntur', state: 'Andhra Pradesh', lng: 80.4365, lat: 16.3067, tier: 3 },
  { name: 'Tirupati', state: 'Andhra Pradesh', lng: 79.4192, lat: 13.6288, tier: 3 },
  { name: 'Mangaluru', state: 'Karnataka', lng: 74.8560, lat: 12.9141, tier: 3 },
  { name: 'Belagavi', state: 'Karnataka', lng: 74.4977, lat: 15.8497, tier: 3 },
  { name: 'Salem', state: 'Tamil Nadu', lng: 78.1460, lat: 11.6643, tier: 3 },
  { name: 'Tiruchirappalli', state: 'Tamil Nadu', lng: 78.7047, lat: 10.7905, tier: 3 },
  { name: 'Kozhikode', state: 'Kerala', lng: 75.7804, lat: 11.2588, tier: 3 },
  { name: 'Thrissur', state: 'Kerala', lng: 76.2144, lat: 10.5276, tier: 3 },
];
