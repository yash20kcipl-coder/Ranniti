/**
 * Spatial calculation and dynamic polling booth data engine for Ranniti Indian GIS Heat Map
 */

export interface PcFeatureProps {
  id: string;
  pc_id: number;
  pc_name: string;
  st_name: string;
  winning_candidate: string;
  winning_party: string;
  votes_pct: string;
  margin_pct: string;
  category: 'GEN' | 'SC' | 'ST';
  fill_color: string;
  total_acs: number;
  total_voters: number;
  total_booths: number;
}

export interface AcFeatureProps {
  ac_no?: number;
  ac_number?: number;
  ac_name: string;
  st_name: string;
  pc_name: string;
  dist_name?: string;
  area_km2: number;
  winning_party: string;
  votes_pct: string;
  margin_pct: string;
  turnout_pct: number;
  fill_color: string;
  total_voters: number;
  total_booths: number;
}

export interface BoothPoint {
  id: string;
  booth_number: number;
  name: string;
  building: string;
  ac_name: string;
  pc_name: string;
  st_name: string;
  lat: number;
  lng: number;
  total_voters: number;
  turnout_pct: number;
  leading_party: string;
  heat_color: string;
}

export interface SpatialMetrics {
  center: [number, number]; // [lng, lat]
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

/**
 * Calculates centroid and bounding box of GeoJSON geometry
 */
export function getPolygonMetrics(geom: any): SpatialMetrics {
  if (!geom || !geom.coordinates) {
    return { center: [78.96, 22.59], bbox: [68.1, 7.5, 97.4, 37.2] };
  }

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let sumLng = 0;
  let sumLat = 0;
  let count = 0;

  const processRing = (ring: number[][]) => {
    for (const p of ring) {
      if (!p || p.length < 2) continue;
      const [lng, lat] = p;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      sumLng += lng;
      sumLat += lat;
      count++;
    }
  };

  if (geom.type === 'Polygon') {
    geom.coordinates.forEach(processRing);
  } else if (geom.type === 'MultiPolygon') {
    geom.coordinates.forEach((poly: number[][][]) => poly.forEach(processRing));
  }

  if (count === 0) {
    return { center: [78.96, 22.59], bbox: [68.1, 7.5, 97.4, 37.2] };
  }

  return {
    center: [sumLng / count, sumLat / count],
    bbox: [minLng, minLat, maxLng, maxLat],
  };
}

function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const BOOTH_BUILDINGS = [
  'Govt Primary School (Room 1)',
  'Govt Primary School (Room 2)',
  'Community Hall West Wing',
  'Panchayat Bhavan Hall',
  'Sarvajanik High School Room A',
  'Zilla Parishad Senior Secondary School',
  'Town Hall North Entrance',
  'Public Health Center Compound',
  'Mahila Mandal Sabha Bhavan',
  'Anganwadi Kendra No. 1',
  'Municipal Primary School Room 4',
  'Village Library & Reading Room',
];

const BOOTH_HEAT_COLORS = [
  '#be185d', '#9d174d', '#831843', '#701a75', '#4a044e',
  '#ec4899', '#db2777', '#f472b6', '#334155', '#1e1b4b'
];

/**
 * Generates realistic polling booths inside the bounding box of any visible AC
 */
export function generateBoothsForAc(ac: AcFeatureProps, geom: any): BoothPoint[] {
  const metrics = getPolygonMetrics(geom);
  const [minLng, minLat, maxLng, maxLat] = metrics.bbox;
  const [centerLng, centerLat] = metrics.center;

  // Number of booths to display: 18 - 36 for crisp, clear visual density
  const boothCount = Math.min(36, Math.max(18, Math.round((ac.total_booths || 180) / 8)));
  const booths: BoothPoint[] = [];

  const lngSpan = Math.max(0.015, (maxLng - minLng) * 0.7);
  const latSpan = Math.max(0.015, (maxLat - minLat) * 0.7);

  for (let i = 1; i <= boothCount; i++) {
    const seed = hashStr(`${ac.st_name}-${ac.ac_name}-${i}`);
    const angle = (i / boothCount) * 2 * Math.PI + ((seed % 100) / 100);
    const radiusFrac = 0.2 + 0.75 * (((seed >> 3) % 100) / 100);

    const lng = centerLng + Math.cos(angle) * (lngSpan / 2) * radiusFrac;
    const lat = centerLat + Math.sin(angle) * (latSpan / 2) * radiusFrac;

    const building = BOOTH_BUILDINGS[seed % BOOTH_BUILDINGS.length];
    const totalVoters = 750 + (seed % 650);
    const turnoutPct = 48 + (seed % 42);
    const heatColor = BOOTH_HEAT_COLORS[seed % BOOTH_HEAT_COLORS.length];

    booths.push({
      id: `booth-${ac.ac_name}-${i}`,
      booth_number: i,
      name: `Polling Station #${i}`,
      building,
      ac_name: ac.ac_name,
      pc_name: ac.pc_name,
      st_name: ac.st_name,
      lat,
      lng,
      total_voters: totalVoters,
      turnout_pct: turnoutPct,
      leading_party: ac.winning_party || 'BJP',
      heat_color: heatColor,
    });
  }

  return booths;
}
