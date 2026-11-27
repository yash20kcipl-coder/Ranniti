import officialMappingRaw from '../data/official_pc_ac_mapping.json';
import type { PollingBoothRecord } from '../types/electionGis.types';

export interface OfficialAcMapping {
  stateName: string;
  pcNumber: number;
  pcName: string;
  acNumber: number;
  name: string;
  districtName?: string;
  reservation?: string;
}

export interface StateMetadata {
  name: string;
  code: string;
  pcCount: number;
  acCount: number;
  center: [number, number];
  bounds: [[number, number], [number, number]];
}

const officialMappings: OfficialAcMapping[] = officialMappingRaw as OfficialAcMapping[];

class GeoDataService {
  private pcCache: any = null;
  private acCache: any = null;
  private statesCache: any = null;
  private boothCache: Map<number, PollingBoothRecord[]> = new Map();

  async getStatesGeoJson(): Promise<any> {
    if (this.statesCache) return this.statesCache;
    const res = await fetch('/maps/india_states.min.geojson');
    if (!res.ok) throw new Error('Failed to load States GeoJSON');
    const data = await res.json();
    this.statesCache = data;
    return data;
  }

  async getPcGeoJson(): Promise<any> {
    if (this.pcCache) return this.pcCache;
    const res = await fetch('/maps/india_pc_simplified.json');
    if (!res.ok) throw new Error('Failed to load Parliamentary Constituencies GeoJSON');
    const data = await res.json();
    this.pcCache = data;
    return data;
  }

  async getAcGeoJson(): Promise<any> {
    if (this.acCache) return this.acCache;
    const res = await fetch('/maps/india_ac_simplified.json');
    if (!res.ok) throw new Error('Failed to load Assembly Constituencies GeoJSON');
    const data = await res.json();
    const filteredFeatures = Array.isArray(data?.features)
      ? data.features.filter(
          (f: any) =>
            Number(f?.properties?.ac_no ?? f?.properties?.ac_number) > 0 &&
            String(f?.properties?.ac_name || '').trim().length > 0
        )
      : [];
    const normalized = { ...data, features: filteredFeatures };
    this.acCache = normalized;
    return normalized;
  }

  getOfficialAcsForPc(stateName: string, pcName: string, pcNumber?: number): OfficialAcMapping[] {
    const sNameNorm = stateName.toLowerCase().trim();
    const pNameNorm = pcName.toLowerCase().trim();

    return officialMappings.filter((m) => {
      const matchState = m.stateName.toLowerCase().trim() === sNameNorm;
      const matchPc =
        m.pcName.toLowerCase().trim() === pNameNorm ||
        (pcNumber !== undefined && m.pcNumber === pcNumber);
      return matchState && matchPc;
    });
  }

  getOfficialAcsForState(stateName: string): OfficialAcMapping[] {
    const sNameNorm = stateName.toLowerCase().trim();
    return officialMappings.filter((m) => m.stateName.toLowerCase().trim() === sNameNorm);
  }

  getStatesFromPcData(pcData: any): StateMetadata[] {
    if (!pcData || !pcData.features) return [];
    const stateMap = new Map<string, { pcs: Set<string>; minLng: number; maxLng: number; minLat: number; maxLat: number }>();

    for (const f of pcData.features) {
      const p = f.properties || {};
      const st = (p.st_name || p.ST_NAME || p.stateName || 'UNKNOWN').toUpperCase();
      if (!stateMap.has(st)) {
        stateMap.set(st, {
          pcs: new Set(),
          minLng: Infinity,
          maxLng: -Infinity,
          minLat: Infinity,
          maxLat: -Infinity,
        });
      }

      const rec = stateMap.get(st)!;
      rec.pcs.add(p.pc_name || p.PC_NAME || p.pcName || '');

      const bbox = this.computeBounds(f.geometry);
      if (bbox) {
        if (bbox[0][0] < rec.minLng) rec.minLng = bbox[0][0];
        if (bbox[1][0] > rec.maxLng) rec.maxLng = bbox[1][0];
        if (bbox[0][1] < rec.minLat) rec.minLat = bbox[0][1];
        if (bbox[1][1] > rec.maxLat) rec.maxLat = bbox[1][1];
      }
    }

    const result: StateMetadata[] = [];
    stateMap.forEach((val, name) => {
      const center: [number, number] = [
        (val.minLng + val.maxLng) / 2 || 78.96,
        (val.minLat + val.maxLat) / 2 || 22.59,
      ];
      result.push({
        name,
        code: name.slice(0, 2),
        pcCount: val.pcs.size,
        acCount: officialMappings.filter((m) => m.stateName.toUpperCase() === name).length,
        center,
        bounds: [
          [val.minLng, val.minLat],
          [val.maxLng, val.maxLat],
        ],
      });
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  computeBounds(geometry: any): [[number, number], [number, number]] | null {
    if (!geometry || !geometry.coordinates) return null;
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    const inspectRing = (ring: number[][]) => {
      for (let i = 0; i < ring.length; i++) {
        const p = ring[i];
        if (p[0] < minLng) minLng = p[0];
        if (p[0] > maxLng) maxLng = p[0];
        if (p[1] < minLat) minLat = p[1];
        if (p[1] > maxLat) maxLat = p[1];
      }
    };

    if (geometry.type === 'Polygon') {
      geometry.coordinates.forEach(inspectRing);
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((poly: number[][][]) => poly.forEach(inspectRing));
    }

    if (minLng === Infinity) return null;
    return [
      [minLng, minLat],
      [maxLng, maxLat],
    ];
  }

  computeCentroid(geometry: any): [number, number] {
    if (!geometry || !geometry.coordinates) return [78.96, 22.59];
    let sumLng = 0;
    let sumLat = 0;
    let count = 0;

    const inspectRing = (ring: number[][]) => {
      for (let i = 0; i < ring.length; i++) {
        sumLng += ring[i][0];
        sumLat += ring[i][1];
        count++;
      }
    };

    if (geometry.type === 'Polygon') {
      geometry.coordinates.forEach(inspectRing);
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((poly: number[][][]) => poly.forEach(inspectRing));
    }

    return count > 0 ? [sumLng / count, sumLat / count] : [78.96, 22.59];
  }

  async getBoothsForAc(
    acNumber: number,
    acName: string,
    pcName: string,
    stateName: string,
    geometry?: any
  ): Promise<PollingBoothRecord[]> {
    if (this.boothCache.has(acNumber)) {
      return this.boothCache.get(acNumber)!;
    }

    const center = geometry ? this.computeCentroid(geometry) : [78.96, 22.59];
    const bounds = geometry ? this.computeBounds(geometry) : null;
    const spanLng = bounds ? Math.max(0.04, (bounds[1][0] - bounds[0][0]) * 0.7) : 0.08;
    const spanLat = bounds ? Math.max(0.04, (bounds[1][1] - bounds[0][1]) * 0.7) : 0.08;

    const parties = ['BJP', 'INC', 'AAP', 'SP', 'AITC', 'TDP'];
    const dominantCastes = ['Patel', 'Yadav', 'Maratha', 'Jat', 'Reddy', 'Brahmin', 'Muslim', 'SC/ST'];
    const sentiments: Array<'stronghold' | 'leaning' | 'swing' | 'weak'> = [
      'stronghold',
      'leaning',
      'swing',
      'weak',
    ];

    const boothCount = 18 + (acNumber % 12);
    const booths: PollingBoothRecord[] = [];

    let seed = acNumber * 9301 + 49297;
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const buildingTypes = [
      'Govt. Higher Secondary School',
      'Gram Panchayat Community Hall',
      'Zilla Parishad Primary School',
      'Muncipal High School (North Wing)',
      'Anganwadi Center',
      'Town Hall & Cultural Complex',
      'Govt. Polytechnic College Campus',
      'Public Library & Reading Hall',
    ];

    for (let i = 1; i <= boothCount; i++) {
      const angle = (i / boothCount) * Math.PI * 2 + pseudoRandom() * 0.5;
      const radius = (0.2 + pseudoRandom() * 0.7) * (spanLng / 2);
      const bLng = center[0] + Math.cos(angle) * radius;
      const bLat = center[1] + Math.sin(angle) * (radius * (spanLat / spanLng));

      const totalVoters = 750 + Math.round(pseudoRandom() * 850);
      const maleVoters = Math.round(totalVoters * (0.51 + pseudoRandom() * 0.04));
      const femaleVoters = totalVoters - maleVoters;
      const turnoutPercentage = Math.round((52 + pseudoRandom() * 36) * 10) / 10;
      const winningParty = parties[Math.floor(pseudoRandom() * parties.length)];
      const marginPercentage = Math.round((2.5 + pseudoRandom() * 22) * 10) / 10;
      const dominantCaste = dominantCastes[Math.floor(pseudoRandom() * dominantCastes.length)];
      const sentiment = sentiments[Math.floor(pseudoRandom() * sentiments.length)];
      const building = buildingTypes[(i + acNumber) % buildingTypes.length];

      booths.push({
        id: `booth-${acNumber}-${i}`,
        boothNumber: i,
        boothName: `Booth #${i} - ${building}`,
        buildingName: `${building}, Room ${((i % 4) + 1)}`,
        wardName: `Ward ${Math.ceil(i / 4)}`,
        lat: Number(bLat.toFixed(5)),
        lng: Number(bLng.toFixed(5)),
        acCode: acNumber,
        acName,
        pcName,
        stateName,
        totalVoters,
        maleVoters,
        femaleVoters,
        turnoutPercentage,
        winningParty,
        winningCandidate: `Candidate ${i}`,
        marginPercentage,
        dominantCaste,
        sentiment,
      });
    }

    this.boothCache.set(acNumber, booths);
    return booths;
  }
}

export const geoDataService = new GeoDataService();
export default geoDataService;
