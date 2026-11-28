import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Map, Marker, setWorkerUrl, LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

// Configure MapLibre Web Worker URL explicitly for Vite
if (typeof window !== 'undefined') {
  setWorkerUrl(maplibreWorkerUrl);
}
import {
  Waves,
  Building2,
  Layers,
} from 'lucide-react';
import type {
  GeoLevel,
  HeatmapMetric,
  PollingBoothRecord,
} from '../../types/electionGis.types';
import { mapService } from '../../services/mapService';
import { geoDataService } from '../../services/geoDataService';
import { MapLegend } from './MapLegend';
import { MapControls } from './MapControls';
import {
  WATER_BODIES,
  NEIGHBORING_COUNTRIES,
  INDIAN_STATES,
  INDIAN_CITIES,
} from '../maps/mapGeoData';

// Synchronous PC boundary data (543 Parliamentary Constituencies)
import pcRawData from '../maps/india_pc_simplified.json';

export interface IndiaMapProps {
  level?: GeoLevel;
  selectedState?: string | null;
  selectedPc?: string | null;
  selectedAc?: string | null;
  selectedBooth?: string | null;
  metric?: HeatmapMetric;
  onSelectState?: (stateName: string) => void;
  onSelectPc?: (pcName: string, stateName: string, pcNumber?: number) => void;
  onSelectAc?: (acName: string, acNumber: number, pcName: string, stateName: string) => void;
  onSelectBooth?: (booth: PollingBoothRecord) => void;
  onNavigateUp?: () => void;
  showNeighboringCountries?: boolean;
  /** Show top-left Cities / Sea / States toggle pills (default: true) */
  showLayerToggles?: boolean;
  /** Show MapControls toolbar (default: true) */
  showControls?: boolean;
  /** Show bottom-right MapLegend (default: true) */
  showLegend?: boolean;
  /** Show hover info tooltip card (default: true) */
  showHoverTooltip?: boolean;
  /** Initial visibility of city markers (default: true) */
  defaultShowCities?: boolean;
  /** Initial visibility of sea/water bodies (default: true) */
  defaultShowSea?: boolean;
  /** Initial visibility of state labels (default: true) */
  defaultShowStates?: boolean;
  /** Initial fill opacity 0..1 (default: 0.85) */
  defaultOpacity?: number;
  /** Initial border style (default: 'white') */
  defaultBorderStyle?: 'white' | 'dark' | 'none';
  /** Automatically fit bounds to selectedState / selectedPc / selectedAc (default: false) */
  autoFitSelection?: boolean;
  /** Keep surrounding state boundaries visible as muted context when zoomed into PC/AC (default: false) */
  showStateContext?: boolean;
  /** List of assigned AC names whose opacity is emphasized while non-assigned ACs are dimmed */
  assignedAcNames?: string[];
  /** List of assigned AC numbers (ac_no) used as fallback when DB AC names differ from GeoJSON */
  assignedAcNumbers?: number[];
  /** Enable/disable map pan & zoom interactions (default: true) */
  interactive?: boolean;
  /** Optional callback receiving the underlying MapLibre Map instance */
  onMapReady?: (map: Map) => void;
  /** Tailwind min-height class for the map container (default: 'min-h-[680px]') */
  minHeightClassName?: string;
  className?: string;
}

const normalizeGeoKey = (val?: string | null): string =>
  (val || '')
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();

const extendBoundsFromCoords = (coords: any, bounds: LngLatBounds) => {
  if (!Array.isArray(coords)) return;
  if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    bounds.extend([coords[0], coords[1]]);
  } else {
    for (const child of coords) {
      extendBoundsFromCoords(child, bounds);
    }
  }
};

export const IndiaMap: React.FC<IndiaMapProps> = ({
  level = 'india',
  selectedState = null,
  selectedPc = null,
  selectedAc = null,
  metric = 'winning_party',
  onSelectState,
  onSelectPc,
  onSelectAc,
  onSelectBooth,
  showNeighboringCountries = false,
  showLayerToggles = true,
  showControls = true,
  showLegend = true,
  showHoverTooltip = true,
  defaultShowCities = true,
  defaultShowSea = true,
  defaultShowStates = true,
  defaultOpacity = 0.85,
  defaultBorderStyle = 'white',
  autoFitSelection = false,
  showStateContext = false,
  assignedAcNames,
  assignedAcNumbers,
  interactive = true,
  onMapReady,
  minHeightClassName = 'min-h-[680px]',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const isLoadedRef = useRef<boolean>(false);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const markersRef = useRef<Marker[]>([]);
  const selectionBoundsRef = useRef<LngLatBounds | null>(null);

  // Display Settings
  const [opacity, setOpacity] = useState<number>(defaultOpacity);
  const [borderStyle, setBorderStyle] = useState<'white' | 'dark' | 'none'>(defaultBorderStyle);
  const [is3d, setIs3d] = useState<boolean>(false);

  // Layer Visibility Toggles (Cities, Sea, States)
  const [showCities, setShowCities] = useState<boolean>(defaultShowCities);
  const [showSea, setShowSea] = useState<boolean>(defaultShowSea);
  const [showStates, setShowStates] = useState<boolean>(defaultShowStates);

  const normalizedAssignedAcList = useMemo(
    () => (assignedAcNames || []).map((n) => n.toLowerCase().trim()).filter(Boolean),
    [assignedAcNames]
  );

  const assignedAcNumberList = useMemo(
    () => (assignedAcNumbers || []).map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0),
    [assignedAcNumbers]
  );

  // Data State
  const [acGeoJson, setAcGeoJson] = useState<any | null>(null);
  const [booths, setBooths] = useState<PollingBoothRecord[]>([]);

  // Resolve assigned / selected AC GeoJSON features with name -> ac_no -> PC fallbacks
  const resolvedAssignedAc = useMemo(() => {
    const empty = { features: [] as any[], namesLower: [] as string[] };
    if (!acGeoJson?.features) return empty;

    const targetState = normalizeGeoKey(selectedState);
    const targetPc = normalizeGeoKey(selectedPc);
    const stateFeatures = targetState
      ? acGeoJson.features.filter((f: any) => normalizeGeoKey(f?.properties?.st_name) === targetState)
      : acGeoJson.features;

    let matched: any[] = [];

    if (normalizedAssignedAcList.length > 0 || assignedAcNumberList.length > 0) {
      const assignedKeys = new Set(normalizedAssignedAcList.map((n) => normalizeGeoKey(n)));
      const assignedNumbers = new Set(assignedAcNumberList);

      // 1. Match by normalized AC name (preferring matching PC if specified)
      if (assignedKeys.size > 0) {
        matched = stateFeatures.filter((f: any) => {
          const acMatch = assignedKeys.has(normalizeGeoKey(f?.properties?.ac_name));
          const pcMatch = !targetPc || normalizeGeoKey(f?.properties?.pc_name) === targetPc;
          return acMatch && pcMatch;
        });
        if (matched.length === 0 && targetPc) {
          matched = stateFeatures.filter((f: any) =>
            assignedKeys.has(normalizeGeoKey(f?.properties?.ac_name))
          );
        }
      }

      // 2. Fallback to ac_no when DB uses placeholder/different AC names (for single/specific AC assignments)
      if (matched.length === 0 && assignedNumbers.size > 0 && !targetPc) {
        matched = stateFeatures.filter((f: any) =>
          assignedNumbers.has(Number(f?.properties?.ac_no || f?.properties?.ac_number))
        );
      }

      // 3. Fallback to all ACs in selectedPc (e.g. when assigned to a PC whose DB ACs have placeholder names)
      if (matched.length === 0 && targetPc) {
        matched = stateFeatures.filter(
          (f: any) => normalizeGeoKey(f?.properties?.pc_name) === targetPc
        );
      }

      // 4. Last resort: match by ac_no even when targetPc is set
      if (matched.length === 0 && assignedNumbers.size > 0) {
        matched = stateFeatures.filter((f: any) =>
          assignedNumbers.has(Number(f?.properties?.ac_no || f?.properties?.ac_number))
        );
      }
    } else if ((level === 'ac' || level === 'booth') && selectedAc) {
      const targetAc = normalizeGeoKey(selectedAc);
      matched = stateFeatures.filter((f: any) => {
        const acMatch = normalizeGeoKey(f?.properties?.ac_name) === targetAc;
        const pcMatch = !targetPc || normalizeGeoKey(f?.properties?.pc_name) === targetPc;
        return acMatch && pcMatch;
      });
    } else if (targetPc) {
      matched = stateFeatures.filter(
        (f: any) => normalizeGeoKey(f?.properties?.pc_name) === targetPc
      );
    }

    const namesLower = Array.from(
      new Set(
        matched
          .map((f: any) => String(f?.properties?.ac_name || '').toLowerCase().trim())
          .filter(Boolean)
      )
    );
    return { features: matched, namesLower };
  }, [acGeoJson, selectedState, selectedPc, selectedAc, level, normalizedAssignedAcList, assignedAcNumberList]);

  // Hover Tooltip State
  const [hoverInfo, setHoverInfo] = useState<{
    name: string;
    level: GeoLevel;
    state?: string;
    party?: string;
    candidate?: string;
    turnout?: number;
    margin?: number;
    votes?: number;
    x: number;
    y: number;
  } | null>(null);

  // 1. Normalize PC GeoJSON Data
  const normalizedPcData = useMemo(() => {
    if (!pcRawData || !pcRawData.features) return null;
    return {
      type: 'FeatureCollection',
      features: pcRawData.features.map((f: any) => {
        const p = f.properties || {};
        const pcName = p.pc_name || p.PC_NAME || p.pcName || `PC-${p.pc_id || ''}`;
        const stName = p.st_name || p.ST_NAME || p.stateName || '';
        const pcCode = p.pc_id || p.pc_no || p.PC_NO || p.pcNumber;
        const turnoutNum = typeof p.turnout_pct === 'number'
          ? p.turnout_pct
          : parseFloat(String(p.votes_pct || p.turnout || 65).replace('%', '')) || 65;
        const marginNum = typeof p.margin_pct === 'number'
          ? p.margin_pct
          : parseFloat(String(p.margin_pct || p.margin || 12).replace('%', '')) || 12;
        const voteShareNum = typeof p.votes_pct === 'number'
          ? p.votes_pct
          : parseFloat(String(p.votes_pct || p.vote_share || 52).replace('%', '')) || 52;

        return {
          ...f,
          properties: {
            ...p,
            pc_name: pcName,
            st_name: stName,
            pc_no: pcCode,
            pc_id: pcCode,
            winning_party: p.winning_party || p.party || 'BJP',
            winning_candidate: p.winning_candidate || p.candidate || 'Elected Candidate',
            fill_color: p.fill_color || '#fed7aa',
            turnout_num: turnoutNum,
            margin_num: marginNum,
            vote_share_num: voteShareNum,
            total_votes_num: p.total_voters ? Math.round(p.total_voters * (turnoutNum / 100)) : 1200000,
            nota_pct_num: 1.4,
            custom_metric_num: (turnoutNum * 0.6 + marginNum * 0.4),
          },
        };
      }),
    };
  }, []);

  // 2. Neighboring Countries GeoJSON (Pakistan, China, Nepal, Bhutan, Bangladesh, Myanmar, Sri Lanka)
  const neighborsGeoJson = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: NEIGHBORING_COUNTRIES.map((c) => ({
        type: 'Feature',
        properties: { name: c.name },
        geometry: {
          type: 'Polygon',
          coordinates: [c.polygon],
        },
      })),
    };
  }, []);

  // 3. Fetch AC GeoJSON asynchronously
  useEffect(() => {
    let active = true;
    const fetchAc = async () => {
      try {
        const data = await geoDataService.getAcGeoJson();
        if (active && data && data.features) {
          const normalized = {
            type: 'FeatureCollection',
            features: data.features.map((f: any) => {
              const p = f.properties || {};
              const acName = p.ac_name || p.AC_NAME || p.acName || `AC-${p.ac_no || ''}`;
              const acNo = Number(p.ac_no || p.AC_NO || p.acNumber || p.ac_number || 1);
              const pcName = p.pc_name || p.PC_NAME || p.pcName || '';
              const stName = p.st_name || p.ST_NAME || p.stateName || '';
              const distName = p.dist_name || p.DIST_NAME || p.districtName || '';
              const turnoutNum = typeof p.turnout_pct === 'number'
                ? p.turnout_pct
                : parseFloat(String(p.turnout_pct || p.turnout || p.votes_pct || 66).replace('%', '')) || 66;
              const marginNum = typeof p.margin_pct === 'number'
                ? p.margin_pct
                : parseFloat(String(p.margin_pct || p.margin || 10).replace('%', '')) || 10;
              const voteShareNum = typeof p.votes_pct === 'number'
                ? p.votes_pct
                : parseFloat(String(p.votes_pct || p.vote_share || 48).replace('%', '')) || 48;

              return {
                ...f,
                properties: {
                  ...p,
                  ac_name: acName,
                  ac_no: acNo,
                  ac_number: acNo,
                  pc_name: pcName,
                  st_name: stName,
                  dist_name: distName,
                  winning_party: p.winning_party || p.party || 'BJP',
                  winning_candidate: p.winning_candidate || p.candidate || 'Elected Candidate',
                  fill_color: p.fill_color || '#86efac',
                  turnout_num: turnoutNum,
                  margin_num: marginNum,
                  vote_share_num: voteShareNum,
                  total_votes_num: p.total_voters ? Math.round(p.total_voters * (turnoutNum / 100)) : 160000,
                  nota_pct_num: 1.6,
                  custom_metric_num: (turnoutNum * 0.5 + marginNum * 0.5),
                },
              };
            }),
          };
          setAcGeoJson(normalized);
        }
      } catch (err) {
        console.warn('AC fetch error:', err);
      }
    };
    fetchAc();
    return () => {
      active = false;
    };
  }, []);

  // 4. Fetch Polling Booths when an AC is selected
  useEffect(() => {
    if ((level === 'ac' || level === 'booth') && selectedAc) {
      const targetFeature = acGeoJson?.features?.find(
        (f: any) => (f.properties?.ac_name || '').toLowerCase() === selectedAc.toLowerCase()
      );
      const acNum = targetFeature?.properties?.ac_no || 1;
      const pc = targetFeature?.properties?.pc_name || selectedPc || 'PC';
      const st = targetFeature?.properties?.st_name || selectedState || 'State';

      geoDataService
        .getBoothsForAc(acNum, selectedAc, pc, st, targetFeature?.geometry)
        .then((b) => setBooths(b))
        .catch(() => setBooths([]));
    } else {
      setBooths([]);
    }
  }, [level, selectedAc, selectedPc, selectedState, acGeoJson]);

  // Convert booths to Point GeoJSON
  const boothGeoJson = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: booths.map((b) => ({
        type: 'Feature',
        properties: {
          id: b.id,
          booth_number: b.boothNumber,
          booth_name: b.boothName,
          total_voters: b.totalVoters,
          turnout_pct: b.turnoutPercentage,
          winning_party: b.winningParty,
          sentiment: b.sentiment,
        },
        geometry: {
          type: 'Point',
          coordinates: [b.lng, b.lat],
        },
      })),
    };
  }, [booths]);

  // 5. Attach Local Vector Sources and Layers
  const setupLayers = useCallback((map: Map) => {
    if (!normalizedPcData) return;

    // --- A. Neighboring Countries Layer (Landmass surrounding India - optional) ---
    if (!map.getSource('neighbor-source')) {
      map.addSource('neighbor-source', {
        type: 'geojson',
        data: neighborsGeoJson as any,
      });
    }

    if (!map.getLayer('neighbor-fill-layer')) {
      map.addLayer({
        id: 'neighbor-fill-layer',
        type: 'fill',
        source: 'neighbor-source',
        layout: {
          visibility: showNeighboringCountries ? 'visible' : 'none',
        },
        paint: {
          'fill-color': '#f1efe9',
          'fill-opacity': 0.95,
        },
      });
    }

    if (!map.getLayer('neighbor-border-layer')) {
      map.addLayer({
        id: 'neighbor-border-layer',
        type: 'line',
        source: 'neighbor-source',
        layout: {
          visibility: showNeighboringCountries ? 'visible' : 'none',
        },
        paint: {
          'line-color': '#d1d5db',
          'line-width': 1.0,
          'line-dasharray': [3, 2],
        },
      });
    }

    // --- B. Parliamentary Constituencies (543 PCs) ---
    if (!map.getSource('pc-source')) {
      map.addSource('pc-source', {
        type: 'geojson',
        data: normalizedPcData as any,
      });
    }

    if (!map.getLayer('pc-fill-layer')) {
      map.addLayer({
        id: 'pc-fill-layer',
        type: 'fill',
        source: 'pc-source',
        paint: {
          'fill-color': mapService.getColorExpression(metric),
          'fill-opacity': opacity,
        },
      });
    }

    if (!map.getLayer('pc-border-layer')) {
      map.addLayer({
        id: 'pc-border-layer',
        type: 'line',
        source: 'pc-source',
        paint: {
          'line-color': borderStyle === 'dark' ? '#1e293b' : '#ffffff',
          'line-width': 1.1,
          'line-opacity': 0.9,
        },
      });
    }

    if (!map.getLayer('pc-highlight-layer')) {
      map.addLayer({
        id: 'pc-highlight-layer',
        type: 'line',
        source: 'pc-source',
        paint: {
          'line-color': '#0284c7',
          'line-width': 3.5,
        },
        filter: ['==', 'pc_name', ''],
      });
    }

    // --- C. Assembly Constituencies (ACs) ---
    if (acGeoJson) {
      if (!map.getSource('ac-source')) {
        map.addSource('ac-source', {
          type: 'geojson',
          data: acGeoJson as any,
        });
      }

      if (!map.getLayer('ac-fill-layer')) {
        map.addLayer({
          id: 'ac-fill-layer',
          type: 'fill',
          source: 'ac-source',
          layout: {
            visibility: (level === 'ac' || level === 'booth') ? 'visible' : 'none',
          },
          paint: {
            'fill-color': mapService.getColorExpression(metric),
            'fill-opacity': opacity,
          },
        });
      }

      if (!map.getLayer('ac-border-layer')) {
        map.addLayer({
          id: 'ac-border-layer',
          type: 'line',
          source: 'ac-source',
          layout: {
            visibility: (level === 'ac' || level === 'booth') ? 'visible' : 'none',
          },
          paint: {
            'line-color': borderStyle === 'dark' ? '#0f172a' : '#ffffff',
            'line-width': 0.9,
            'line-opacity': 0.85,
          },
        });
      }

      if (!map.getLayer('ac-highlight-layer')) {
        map.addLayer({
          id: 'ac-highlight-layer',
          type: 'line',
          source: 'ac-source',
          paint: {
            'line-color': '#4f46e5',
            'line-width': 3.0,
          },
          filter: ['==', 'ac_name', ''],
        });
      }
    }

    // --- D. Polling Booth Layer ---
    if (!map.getSource('booth-source')) {
      map.addSource('booth-source', {
        type: 'geojson',
        data: boothGeoJson as any,
      });
    }

    if (!map.getLayer('booth-circle-layer')) {
      map.addLayer({
        id: 'booth-circle-layer',
        type: 'circle',
        source: 'booth-source',
        layout: {
          visibility: level === 'booth' ? 'visible' : 'none',
        },
        paint: {
          'circle-radius': 6.5,
          'circle-color': '#f59e0b',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
      });
    }
  }, [normalizedPcData, neighborsGeoJson, acGeoJson, boothGeoJson, metric, opacity, borderStyle, level, showNeighboringCountries]);

  // 6. Update HTML DOM Markers (States, Cities, Sea Labels with Tier-Based Zoom Filtering)
  const updateDomMarkers = useCallback((map: Map) => {
    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const zoom = map.getZoom();

    // --- A. Sea / Water Body Labels ---
    if (showSea) {
      WATER_BODIES.forEach((wb) => {
        if (wb.minZoom && zoom < wb.minZoom) return;

        const el = document.createElement('div');
        el.className = 'pointer-events-none select-none text-sky-800/60 font-serif italic text-xs tracking-widest uppercase transition-opacity duration-300';
        el.style.fontSize = `${wb.fontSize}px`;
        el.style.textShadow = '0 1px 3px rgba(255,255,255,0.8)';
        el.textContent = wb.name;

        const marker = new Marker({ element: el, anchor: 'center' })
          .setLngLat([wb.lng, wb.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });

      // Neighboring country labels (only rendered if enabled)
      if (showNeighboringCountries) {
        NEIGHBORING_COUNTRIES.forEach((nc) => {
          const el = document.createElement('div');
          el.className = 'pointer-events-none select-none text-slate-500 font-sans font-bold text-[10px] tracking-widest uppercase opacity-70';
          el.textContent = nc.name;

          const marker = new Marker({ element: el, anchor: 'center' })
            .setLngLat(nc.labelCoord)
            .addTo(map);

          markersRef.current.push(marker);
        });
      }
    }

    // --- B. State Name Labels ---
    if (showStates) {
      INDIAN_STATES.forEach((s) => {
        // Hide small states at national zoom (< 5.6) to avoid overcrowding
        if (s.minZoom && zoom < s.minZoom) return;

        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none font-extrabold text-slate-700/80 hover:text-indigo-600 tracking-wider transition-all';
        el.style.fontSize = `${s.fontSize * 0.9}px`;
        el.style.textShadow = '0 0 3px rgba(255,255,255,0.95), 0 0 1px #fff';
        el.textContent = s.name;
        el.onclick = (e) => {
          e.stopPropagation();
          onSelectState?.(s.name);
        };

        const marker = new Marker({ element: el, anchor: 'center' })
          .setLngLat([s.lng, s.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });
    }

    // --- C. Major Indian Cities (Filtered by Zoom Level to eliminate clutter!) ---
    if (showCities) {
      INDIAN_CITIES.forEach((c) => {
        // Zoom < 5.8: ONLY Tier 1 Metros (7 cities: Delhi, Mumbai, Bengaluru, Kolkata, Chennai, Hyderabad, Ahmedabad)
        // Zoom 5.8 to 8.2: Tier 1 + Tier 2 (State Capitals & Major Hubs)
        // Zoom >= 8.2: All Cities (including regional centers)
        if (zoom < 5.8 && c.tier > 1) return;
        if (zoom < 8.2 && c.tier > 2) return;

        const el = document.createElement('div');
        el.className = 'flex items-center gap-1 cursor-pointer select-none transform transition-transform hover:scale-110';

        const dot = document.createElement('span');
        dot.className = `w-2 h-2 rounded-full shadow-sm ${c.isCapital ? 'bg-red-600 ring-2 ring-white ring-offset-1' : 'bg-blue-600 border border-white'
          }`;

        const txt = document.createElement('span');
        txt.className = `text-[10px] font-bold ${c.isCapital ? 'text-red-700 font-extrabold' : 'text-slate-800'
          }`;
        txt.style.textShadow = '0 0 3px #ffffff, 0 0 5px #ffffff';
        txt.textContent = c.name;

        el.appendChild(dot);
        el.appendChild(txt);

        const marker = new Marker({ element: el, anchor: 'left' })
          .setLngLat([c.lng, c.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });
    }

  // --- D. Focused AC Name Labels ---
  if (resolvedAssignedAc.features.length > 0 && (normalizedAssignedAcList.length > 0 || assignedAcNumberList.length > 0 || ((level === 'ac' || level === 'booth') && selectedAc))) {
    resolvedAssignedAc.features.forEach((feature: any) => {
      if (!feature?.geometry?.coordinates) return;
      const b = new LngLatBounds();
      extendBoundsFromCoords(feature.geometry.coordinates, b);
      if (b.isEmpty()) return;
      const center = b.getCenter();
      const acName = feature?.properties?.ac_name;
      const acNo = feature?.properties?.ac_no || feature?.properties?.ac_number;
      if (!acName) return;

      const el = document.createElement('div');
      el.className =
        'px-2 py-0.5 rounded-full bg-white/95 dark:bg-slate-900/95 border border-indigo-300 dark:border-indigo-600 shadow-sm text-[11px] font-bold text-indigo-800 dark:text-indigo-200 whitespace-nowrap pointer-events-none select-none';
      el.textContent = acNo ? `${acNo} · ${acName}` : acName;

      const marker = new Marker({ element: el, anchor: 'center' })
        .setLngLat([center.lng, center.lat])
        .addTo(map);
      markersRef.current.push(marker);
    });
  }
}, [
  showCities,
  showSea,
  showStates,
  showNeighboringCountries,
  onSelectState,
  resolvedAssignedAc,
  level,
  selectedAc,
  normalizedAssignedAcList,
  assignedAcNumberList,
]);

// 7. Initialize MapLibre GL Map Instance
useEffect(() => {
  if (!containerRef.current) return;

  // Use oceanic soft blue background (#dbeafe) matching Image 1
  const style = mapService.createLocalVectorStyle('#dbeafe');

  const map = new Map({
    container: containerRef.current,
    style,
    center: [78.96, 22.59],
    zoom: 4.6,
    minZoom: 3.5,
    maxZoom: 17,
    pitch: 0,
    interactive,
    attributionControl: false,
  });

  mapRef.current = map;

  // Safe layer addition on load
  map.on('load', () => {
    isLoadedRef.current = true;
    setIsMapLoaded(true);
    setupLayers(map);
    updateDomMarkers(map);
    map.resize();
    onMapReady?.(map);
  });

  // Re-filter markers smoothly on zoom changes
  map.on('zoomend', () => {
    updateDomMarkers(map);
  });

  // ResizeObserver: Guaranteed fix for flexbox / 0px container heights!
  const resizeObserver = new ResizeObserver(() => {
    map.resize();
  });
  if (containerRef.current) {
    resizeObserver.observe(containerRef.current);
  }

  // --- Hover Interactions on PC ---
  map.on('mousemove', 'pc-fill-layer', (e) => {
    if (!e.features || e.features.length === 0) return;
    const p = e.features[0].properties || {};
    map.getCanvas().style.cursor = 'pointer';

    if (map.getLayer('pc-highlight-layer')) {
      map.setFilter('pc-highlight-layer', ['==', 'pc_name', p.pc_name || ''] as any);
    }

    setHoverInfo({
      name: p.pc_name,
      level: 'pc',
      state: p.st_name,
      party: p.winning_party,
      candidate: p.winning_candidate,
      turnout: p.turnout_num,
      margin: p.margin_num,
      votes: p.total_votes_num,
      x: e.point.x,
      y: e.point.y,
    });
  });

  map.on('mouseleave', 'pc-fill-layer', () => {
    map.getCanvas().style.cursor = '';
    if (map.getLayer('pc-highlight-layer')) {
      map.setFilter('pc-highlight-layer', ['==', 'pc_name', ''] as any);
    }
    setHoverInfo(null);
  });

  // --- Click Interactions for PC ---
  map.on('click', 'pc-fill-layer', (e) => {
    if (!e.features || e.features.length === 0) return;
    const p = e.features[0].properties || {};
    const pcName = p.pc_name;
    const stName = p.st_name;
    const pcNum = p.pc_id || p.pc_no;

    onSelectPc?.(pcName, stName, pcNum);

    map.flyTo({
      center: [e.lngLat.lng, e.lngLat.lat],
      zoom: 7.8,
      speed: 1.2,
    });
  });

  // --- Hover Interactions on AC ---
  map.on('mousemove', 'ac-fill-layer', (e) => {
    if (!e.features || e.features.length === 0) return;
    const p = e.features[0].properties || {};
    map.getCanvas().style.cursor = 'pointer';

    if (map.getLayer('ac-highlight-layer')) {
      map.setFilter('ac-highlight-layer', ['==', 'ac_name', p.ac_name || ''] as any);
    }

    setHoverInfo({
      name: `${p.ac_name} (#${p.ac_no || p.ac_number || ''})`,
      level: 'ac',
      state: `${p.st_name} • PC: ${p.pc_name}`,
      party: p.winning_party,
      candidate: p.winning_candidate,
      turnout: p.turnout_num,
      margin: p.margin_num,
      votes: p.total_votes_num,
      x: e.point.x,
      y: e.point.y,
    });
  });

  map.on('mouseleave', 'ac-fill-layer', () => {
    map.getCanvas().style.cursor = '';
    if (map.getLayer('ac-highlight-layer')) {
      map.setFilter('ac-highlight-layer', ['==', 'ac_name', ''] as any);
    }
    setHoverInfo(null);
  });

  // --- Click Interactions on AC ---
  map.on('click', 'ac-fill-layer', (e) => {
    if (!e.features || e.features.length === 0) return;
    const p = e.features[0].properties || {};
    const acName = p.ac_name;
    const acNum = p.ac_no || p.ac_number || 1;
    const pcName = p.pc_name || selectedPc || '';
    const stName = p.st_name || selectedState || '';

    onSelectAc?.(acName, acNum, pcName, stName);

    map.flyTo({
      center: [e.lngLat.lng, e.lngLat.lat],
      zoom: 10.8,
      speed: 1.2,
    });
  });

  // --- Click Interactions on Booths ---
  map.on('click', 'booth-circle-layer', (e) => {
    if (!e.features || e.features.length === 0) return;
    const p = e.features[0].properties || {};
    const foundBooth = booths.find((b) => b.id === p.id);
    if (foundBooth) {
      onSelectBooth?.(foundBooth);
    }
  });

  return () => {
    resizeObserver.disconnect();
    markersRef.current.forEach((m) => m.remove());
    map.remove();
    mapRef.current = null;
    isLoadedRef.current = false;
  };
}, []); // Mounts once

// 8. Update DOM Markers when toggles change
useEffect(() => {
  const map = mapRef.current;
  if (map && isLoadedRef.current) {
    updateDomMarkers(map);
  }
}, [updateDomMarkers]);

// 8b. Sync interactive state dynamically
useEffect(() => {
  const map = mapRef.current;
  if (!map) return;

  const handlers = [
    map.scrollZoom,
    map.boxZoom,
    map.dragRotate,
    map.dragPan,
    map.keyboard,
    map.doubleClickZoom,
    map.touchZoomRotate,
  ];
  handlers.forEach((h) => (interactive ? h.enable() : h.disable()));
}, [interactive]);

// 9. Update Layers when AC Data loads
useEffect(() => {
  const map = mapRef.current;
  if (!map || !isLoadedRef.current) return;
  setupLayers(map);
}, [acGeoJson, setupLayers]);

// 10. Update Booth Source when booths change
useEffect(() => {
  const map = mapRef.current;
  if (!map || !isLoadedRef.current) return;

  const source: any = map.getSource('booth-source');
  if (source) {
    source.setData(boothGeoJson);
  }
}, [boothGeoJson]);

// 11. Dynamic Level Visibility & Filter Management
useEffect(() => {
  const map = mapRef.current;
  if (!map || !isLoadedRef.current) return;

  if (showStateContext && selectedState) {
    const statePcFilter = ['==', ['upcase', ['coalesce', ['get', 'st_name'], '']], selectedState.toUpperCase()] as any;
    if (map.getLayer('pc-fill-layer')) {
      map.setLayoutProperty('pc-fill-layer', 'visibility', 'visible');
      map.setFilter('pc-fill-layer', statePcFilter);
      map.setPaintProperty('pc-fill-layer', 'fill-color', '#cbd5e1');
      map.setPaintProperty('pc-fill-layer', 'fill-opacity', 0.55);
    }
    if (map.getLayer('pc-border-layer')) {
      map.setLayoutProperty('pc-border-layer', 'visibility', borderStyle !== 'none' ? 'visible' : 'none');
      map.setFilter('pc-border-layer', statePcFilter);
      map.setPaintProperty('pc-border-layer', 'line-width', 0.7);
      map.setPaintProperty('pc-border-layer', 'line-opacity', 0.6);
    }
    if (map.getLayer('pc-highlight-layer')) {
      map.setLayoutProperty('pc-highlight-layer', 'visibility', 'none');
    }

    const assignedAcCondition: any =
      resolvedAssignedAc.namesLower.length > 0
        ? ['in', ['downcase', ['coalesce', ['get', 'ac_name'], '']], ['literal', resolvedAssignedAc.namesLower]]
        : selectedPc
          ? ['==', ['downcase', ['coalesce', ['get', 'pc_name'], '']], selectedPc.toLowerCase()]
          : statePcFilter;

    if (map.getLayer('ac-fill-layer')) {
      map.setLayoutProperty('ac-fill-layer', 'visibility', 'visible');
      map.setFilter('ac-fill-layer', assignedAcCondition);
      map.setPaintProperty('ac-fill-layer', 'fill-color', mapService.getColorExpression(metric));
      map.setPaintProperty('ac-fill-layer', 'fill-opacity', opacity);
    }

    if (map.getLayer('ac-border-layer')) {
      map.setLayoutProperty('ac-border-layer', 'visibility', borderStyle !== 'none' ? 'visible' : 'none');
      map.setFilter('ac-border-layer', assignedAcCondition);
      map.setPaintProperty('ac-border-layer', 'line-width', 2);
      map.setPaintProperty('ac-border-layer', 'line-opacity', 0.95);
    }

    if (map.getLayer('booth-circle-layer')) {
      map.setLayoutProperty('booth-circle-layer', 'visibility', level === 'booth' ? 'visible' : 'none');
    }
    return;
  }

  if (level === 'india') {
    if (map.getLayer('pc-fill-layer')) {
      map.setLayoutProperty('pc-fill-layer', 'visibility', 'visible');
      map.setFilter('pc-fill-layer', null);
    }
    if (map.getLayer('pc-border-layer')) {
      map.setLayoutProperty('pc-border-layer', 'visibility', borderStyle !== 'none' ? 'visible' : 'none');
      map.setFilter('pc-border-layer', null);
    }
    if (map.getLayer('ac-fill-layer')) map.setLayoutProperty('ac-fill-layer', 'visibility', 'none');
    if (map.getLayer('ac-border-layer')) map.setLayoutProperty('ac-border-layer', 'visibility', 'none');
    if (map.getLayer('booth-circle-layer')) map.setLayoutProperty('booth-circle-layer', 'visibility', 'none');
  } else if (level === 'state' && selectedState) {
    const filter = ['==', ['upcase', ['coalesce', ['get', 'st_name'], '']], selectedState.toUpperCase()];
    if (map.getLayer('pc-fill-layer')) {
      map.setLayoutProperty('pc-fill-layer', 'visibility', 'visible');
      map.setFilter('pc-fill-layer', filter as any);
    }
    if (map.getLayer('pc-border-layer')) {
      map.setLayoutProperty('pc-border-layer', 'visibility', borderStyle !== 'none' ? 'visible' : 'none');
      map.setFilter('pc-border-layer', filter as any);
    }
    if (map.getLayer('ac-fill-layer')) map.setLayoutProperty('ac-fill-layer', 'visibility', 'none');
    if (map.getLayer('ac-border-layer')) map.setLayoutProperty('ac-border-layer', 'visibility', 'none');
    if (map.getLayer('booth-circle-layer')) map.setLayoutProperty('booth-circle-layer', 'visibility', 'none');
  } else if (level === 'pc' && selectedPc) {
    const acFilter = ['==', ['downcase', ['coalesce', ['get', 'pc_name'], '']], selectedPc.toLowerCase()];
    if (map.getLayer('pc-fill-layer')) {
      map.setLayoutProperty('pc-fill-layer', 'visibility', 'visible');
      map.setFilter('pc-fill-layer', ['==', ['downcase', ['coalesce', ['get', 'pc_name'], '']], selectedPc.toLowerCase()] as any);
    }
    if (map.getLayer('pc-border-layer')) {
      map.setLayoutProperty('pc-border-layer', 'visibility', borderStyle !== 'none' ? 'visible' : 'none');
      map.setFilter('pc-border-layer', ['==', ['downcase', ['coalesce', ['get', 'pc_name'], '']], selectedPc.toLowerCase()] as any);
    }
    if (map.getLayer('ac-fill-layer')) {
      map.setLayoutProperty('ac-fill-layer', 'visibility', 'visible');
      map.setFilter('ac-fill-layer', acFilter as any);
    }
    if (map.getLayer('ac-border-layer')) {
      map.setLayoutProperty('ac-border-layer', 'visibility', borderStyle !== 'none' ? 'visible' : 'none');
      map.setFilter('ac-border-layer', acFilter as any);
    }
    if (map.getLayer('booth-circle-layer')) map.setLayoutProperty('booth-circle-layer', 'visibility', 'none');
  } else if (level === 'ac' || level === 'booth') {
    if (map.getLayer('pc-fill-layer')) map.setLayoutProperty('pc-fill-layer', 'visibility', 'none');
    if (map.getLayer('pc-border-layer')) map.setLayoutProperty('pc-border-layer', 'visibility', 'none');
    const acFilter = selectedAc
      ? (['==', ['downcase', ['coalesce', ['get', 'ac_name'], '']], selectedAc.toLowerCase()] as any)
      : null;
    if (map.getLayer('ac-fill-layer')) {
      map.setLayoutProperty('ac-fill-layer', 'visibility', 'visible');
      map.setFilter('ac-fill-layer', acFilter);
    }
    if (map.getLayer('ac-border-layer')) {
      map.setLayoutProperty('ac-border-layer', 'visibility', borderStyle !== 'none' ? 'visible' : 'none');
      map.setFilter('ac-border-layer', acFilter);
    }
    if (map.getLayer('booth-circle-layer')) {
      map.setLayoutProperty('booth-circle-layer', 'visibility', level === 'booth' ? 'visible' : 'none');
    }
  }
}, [isMapLoaded, level, selectedState, selectedPc, selectedAc, borderStyle, acGeoJson, showStateContext, resolvedAssignedAc, opacity, metric]);

// 11b. Auto-fit bounds to selected region when autoFitSelection is enabled
useEffect(() => {
  const map = mapRef.current;
  if (!autoFitSelection || !map || !isLoadedRef.current) return;

  let targetFeatures: any[] = [];

  if (resolvedAssignedAc.features.length > 0) {
    targetFeatures = resolvedAssignedAc.features;
  } else if (selectedPc && normalizedPcData?.features) {
    const targetPc = normalizeGeoKey(selectedPc);
    targetFeatures = normalizedPcData.features.filter(
      (f: any) => normalizeGeoKey(f?.properties?.pc_name) === targetPc
    );
  } else if (selectedState && normalizedPcData?.features) {
    const targetState = normalizeGeoKey(selectedState);
    targetFeatures = normalizedPcData.features.filter(
      (f: any) => normalizeGeoKey(f?.properties?.st_name) === targetState
    );
  }

  if (targetFeatures.length === 0) return;

  const bounds = new LngLatBounds();
  targetFeatures.forEach((f: any) => {
    if (f?.geometry?.coordinates) {
      extendBoundsFromCoords(f.geometry.coordinates, bounds);
    }
  });

  if (!bounds.isEmpty()) {
    selectionBoundsRef.current = bounds;
    map.fitBounds(bounds, { padding: 40, duration: 0 });
  }
}, [isMapLoaded, autoFitSelection, level, selectedState, selectedPc, selectedAc, resolvedAssignedAc, normalizedPcData]);

// 12. Update Metric Expressions
useEffect(() => {
  const map = mapRef.current;
  if (!map || !isLoadedRef.current || showStateContext) return;

  const expr = mapService.getColorExpression(metric);
  if (map.getLayer('pc-fill-layer')) {
    map.setPaintProperty('pc-fill-layer', 'fill-color', expr);
  }
  if (map.getLayer('ac-fill-layer')) {
    map.setPaintProperty('ac-fill-layer', 'fill-color', expr);
  }
}, [metric, showStateContext]);

// 13. Update Opacity & Borders
useEffect(() => {
  const map = mapRef.current;
  if (!map || !isLoadedRef.current) return;

  if (!showStateContext) {
    if (map.getLayer('pc-fill-layer')) {
      map.setPaintProperty('pc-fill-layer', 'fill-opacity', opacity);
    }
    if (map.getLayer('ac-fill-layer')) {
      map.setPaintProperty('ac-fill-layer', 'fill-opacity', opacity);
    }
  }
  if (map.getLayer('pc-border-layer')) {
    map.setPaintProperty('pc-border-layer', 'line-color', borderStyle === 'dark' ? '#1e293b' : '#ffffff');
    map.setLayoutProperty('pc-border-layer', 'visibility', borderStyle !== 'none' ? 'visible' : 'none');
  }
  if (map.getLayer('ac-border-layer')) {
    map.setPaintProperty('ac-border-layer', 'line-color', borderStyle === 'dark' ? '#0f172a' : '#ffffff');
    map.setLayoutProperty('ac-border-layer', 'visibility', borderStyle !== 'none' ? 'visible' : 'none');
  }
  if (map.getLayer('neighbor-fill-layer')) {
    map.setLayoutProperty('neighbor-fill-layer', 'visibility', showNeighboringCountries ? 'visible' : 'none');
  }
  if (map.getLayer('neighbor-border-layer')) {
    map.setLayoutProperty('neighbor-border-layer', 'visibility', showNeighboringCountries ? 'visible' : 'none');
  }
}, [opacity, borderStyle, showNeighboringCountries]);

// Map Control Actions
const handleZoomIn = () => mapRef.current?.zoomIn();
const handleZoomOut = () => mapRef.current?.zoomOut();
const handleResetView = () => {
  if (autoFitSelection && selectionBoundsRef.current) {
    mapRef.current?.fitBounds(selectionBoundsRef.current, { padding: 40, duration: 400 });
    return;
  }
  mapRef.current?.flyTo({ center: [78.96, 22.59], zoom: 4.6, pitch: 0, bearing: 0, speed: 1.2 });
};
const handleResetBearing = () => mapRef.current?.resetNorth();
const handleTogglePitch = () => {
  const map = mapRef.current;
  if (!map) return;
  const nextPitch = is3d ? 0 : 45;
  map.easeTo({ pitch: nextPitch });
  setIs3d(!is3d);
};
const handleToggleFullscreen = () => {
  if (!containerRef.current) return;
  if (!document.fullscreenElement) {
    containerRef.current.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
};

return (
  <div
    ref={containerRef}
    className={`relative w-full h-full ${minHeightClassName} bg-[#dbeafe] overflow-hidden select-none ${className}`}
  >
    {/* Top Left: Reference-style Badge Toggles (Cities / Sea / States) */}
    {showLayerToggles && (
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setShowCities(!showCities)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${showCities
            ? 'bg-indigo-600 text-white shadow-indigo-500/25'
            : 'bg-white/90 text-slate-700 hover:bg-white backdrop-blur-sm'
            }`}
          title="Toggle Indian Cities"
        >
          <Building2 size={13} />
          <span>Cities</span>
        </button>

        <button
          onClick={() => setShowSea(!showSea)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${showSea
            ? 'bg-sky-600 text-white shadow-sky-500/25'
            : 'bg-white/90 text-slate-700 hover:bg-white backdrop-blur-sm'
            }`}
          title="Toggle Surrounding Oceans & Neighboring Lands"
        >
          <Waves size={13} />
          <span>Sea</span>
        </button>

        <button
          onClick={() => setShowStates(!showStates)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${showStates
            ? 'bg-emerald-600 text-white shadow-emerald-500/25'
            : 'bg-white/90 text-slate-700 hover:bg-white backdrop-blur-sm'
            }`}
          title="Toggle State Names"
        >
          <Layers size={13} />
          <span>States</span>
        </button>
      </div>
    )}

    {/* Top Left (Below badges): Map Controls */}
    {showControls && (
      <div className={`absolute ${showLayerToggles ? 'top-16' : 'top-4'} left-4 z-10 pointer-events-auto`}>
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          onResetBearing={handleResetBearing}
          onTogglePitch={handleTogglePitch}
          onToggleFullscreen={handleToggleFullscreen}
          is3d={is3d}
          opacity={opacity}
          onOpacityChange={setOpacity}
          borderStyle={borderStyle}
          onBorderStyleChange={setBorderStyle}
        />
      </div>
    )}

    {/* Bottom Right: Dynamic Election Heatmap Legend */}
    {showLegend && (
      <div className="absolute bottom-4 right-4 z-10 pointer-events-auto">
        <MapLegend metric={metric} />
      </div>
    )}

    {/* Hover Info Tooltip Card */}
    {showHoverTooltip && hoverInfo && (
      <div
        className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
        style={{ left: hoverInfo.x, top: hoverInfo.y }}
      >
        <div className="bg-slate-900/95 text-white backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-700/80 text-xs max-w-xs animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <span className="font-black text-sm tracking-tight">{hoverInfo.name}</span>
          </div>
          {hoverInfo.state && (
            <div className="text-[11px] text-slate-300 font-medium">
              {hoverInfo.state}
            </div>
          )}
          {hoverInfo.candidate && (
            <div className="text-[11px] text-amber-300 font-medium mt-0.5">
              {hoverInfo.candidate} {hoverInfo.party ? `(${hoverInfo.party})` : ''}
            </div>
          )}
          <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center justify-between gap-4 text-[11px] font-mono">
            {hoverInfo.turnout !== undefined && (
              <span className="text-emerald-400 font-bold">
                Turnout: {hoverInfo.turnout.toFixed(1)}%
              </span>
            )}
            {hoverInfo.margin !== undefined && (
              <span className="text-sky-300 font-medium">
                Margin: {hoverInfo.margin.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default IndiaMap;
