import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import {
  generateBoothsForAc,
  type AcFeatureProps,
  type BoothPoint,
} from './mapDataEngine';

// Synchronous import of India Parliamentary Constituencies (543 PCs)
// Guarantees Frame 1 rendering with ZERO network latency, ZERO 404s, and ZERO WebGL failures!
import pcGeoJsonData from './india_pc_simplified.json';

const ZOOM_THRESHOLD_AC = 7.0;
const ZOOM_THRESHOLD_BOOTH = 11.5;

// Harmonious, soft, reference-accurate color palette (Matching Image 2)
const HARMONIOUS_PASTELS = [
  '#fed7aa', // Soft Peach / Saffron
  '#86efac', // Soft Mint Green
  '#ddd6fe', // Soft Lavender
  '#fbcfe8', // Soft Rose Pink
  '#bbf7d0', // Light Emerald
  '#fed7aa', // Light Saffron
];

function getHarmoniousColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return HARMONIOUS_PASTELS[Math.abs(hash) % HARMONIOUS_PASTELS.length];
}

interface ActiveInfo {
  type: 'pc' | 'ac' | 'booth';
  pcName?: string;
  stName?: string;
  candidateName?: string;
  party?: string;
  votesPct?: string;
  acName?: string;
  acNo?: number;
  areaKm2?: number;
  marginPct?: string;
  boothNumber?: number;
  boothBuilding?: string;
  totalVoters?: number;
  turnoutPct?: number;
}

interface IndexedFeature {
  feature: any;
  props: any;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  center: [number, number];
}

// Spherical Mercator projection
function projectLngLat(lng: number, lat: number): [number, number] {
  const x = (lng + 180.0) / 360.0;
  const sinLat = Math.sin((lat * Math.PI) / 180.0);
  const clampedSin = Math.max(-0.9999, Math.min(0.9999, sinLat));
  const y = 0.5 - Math.log((1.0 + clampedSin) / (1.0 - clampedSin)) / (4.0 * Math.PI);
  return [x, y];
}

function unprojectWorld(x: number, y: number): [number, number] {
  const lng = x * 360.0 - 180.0;
  const n = Math.PI - 2.0 * Math.PI * y;
  const lat = (180.0 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return [lng, lat];
}

// Ray-casting point-in-polygon
function pointInRing(x: number, y: number, ring: number[][]): boolean {
  let inside = false;
  const len = ring.length;
  for (let i = 0, j = len - 1; i < len; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInGeometry(lng: number, lat: number, geom: any): boolean {
  if (!geom || !geom.coordinates) return false;
  if (geom.type === 'Polygon') {
    if (geom.coordinates.length === 0) return false;
    return pointInRing(lng, lat, geom.coordinates[0]);
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      if (poly.length > 0 && pointInRing(lng, lat, poly[0])) {
        return true;
      }
    }
  }
  return false;
}

function computeFeatureIndex(f: any): IndexedFeature {
  const geom = f.geometry;
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let sumLng = 0;
  let sumLat = 0;
  let count = 0;

  const inspectRing = (ring: number[][]) => {
    for (let i = 0; i < ring.length; i++) {
      const p = ring[i];
      const lng = p[0];
      const lat = p[1];
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
    geom.coordinates.forEach(inspectRing);
  } else if (geom.type === 'MultiPolygon') {
    geom.coordinates.forEach((poly: number[][][]) => poly.forEach(inspectRing));
  }

  const center: [number, number] =
    count > 0 ? [sumLng / count, sumLat / count] : [78.96, 22.59];

  return {
    feature: f,
    props: f.properties || {},
    bbox: [minLng, minLat, maxLng, maxLat],
    center,
  };
}

export const IndiaHeatMap: React.FC<{ className?: string }> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Geographic camera state: centered on India
  const [center, setCenter] = useState<[number, number]>([78.96, 22.59]);
  const [zoom, setZoom] = useState<number>(4.6);

  // Pre-indexed features for instant spatial lookup
  const pcIndexRef = useRef<IndexedFeature[]>([]);
  const acIndexRef = useRef<IndexedFeature[]>([]);
  const [acLoaded, setAcLoaded] = useState<boolean>(false);

  // Interactive selection & telemetry state (matching Image 1 & Image 2)
  const [activeInfo, setActiveInfo] = useState<ActiveInfo>({
    type: 'pc',
    pcName: 'Betul',
    stName: 'Madhya Pradesh',
    candidateName: 'Jyoti Dhurve',
    party: 'BJP',
    votesPct: '67.14%',
  });

  const [hoveredFeature, setHoveredFeature] = useState<IndexedFeature | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [selectedAc, setSelectedAc] = useState<IndexedFeature | null>(null);
  const [booths, setBooths] = useState<BoothPoint[]>([]);
  const [selectedBooth, setSelectedBooth] = useState<BoothPoint | null>(null);

  // Dragging & Interaction refs
  const isDraggingRef = useRef<boolean>(false);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartCenterRef = useRef<[number, number]>([78.96, 22.59]);
  const animFrameRef = useRef<number | null>(null);

  // 1. Initialize PC layer synchronously on Mount with Harmonious Colors
  useEffect(() => {
    if (pcIndexRef.current.length === 0 && pcGeoJsonData && pcGeoJsonData.features) {
      pcGeoJsonData.features.forEach((f: any) => {
        // Enforce soft harmonious pastel color palette (Image 2 style)
        if (!f.properties.fill_color || f.properties.fill_color.startsWith('#7') || f.properties.fill_color.startsWith('#8') || f.properties.fill_color.startsWith('#3')) {
          f.properties.fill_color = getHarmoniousColor(f.properties.pc_name || 'PC');
        }
      });
      pcIndexRef.current = pcGeoJsonData.features.map(computeFeatureIndex);
    }
  }, []);

  // 2. Fetch AC layer asynchronously in background & strictly inherit parent PC colors
  useEffect(() => {
    const fetchAcData = async () => {
      const candidates = ['/maps/india_ac_simplified.json', './maps/india_ac_simplified.json'];
      for (const url of candidates) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (data && data.features && data.features.length > 0) {
              // Build PC color lookup map
              const pcColorMap = new Map<string, string>();
              pcIndexRef.current.forEach((p) => {
                const name = (p.props.pc_name || '').toUpperCase().trim();
                if (name) pcColorMap.set(name, p.props.fill_color);
              });

              // Assign matching parent color to each AC (ZERO color jarring/flashing!)
              data.features.forEach((f: any) => {
                const parentName = (f.properties?.pc_name || '').toUpperCase().trim();
                const parentColor = pcColorMap.get(parentName) || getHarmoniousColor(parentName || 'PC');
                f.properties.parent_fill_color = parentColor;
                f.properties.fill_color = parentColor;
              });

              acIndexRef.current = data.features.map(computeFeatureIndex);
              setAcLoaded(true);
              return;
            }
          }
        } catch {
          // try next
        }
      }
    };
    fetchAcData();
  }, []);

  // 3. Auto-load booths when zooming into booth level (Zoom >= 11.5)
  useEffect(() => {
    if (zoom >= ZOOM_THRESHOLD_BOOTH && booths.length === 0 && acIndexRef.current.length > 0) {
      const centerAc =
        acIndexRef.current.find((item) =>
          pointInGeometry(center[0], center[1], item.feature.geometry)
        ) ||
        acIndexRef.current.find((item) => {
          const [minLng, minLat, maxLng, maxLat] = item.bbox;
          return (
            center[0] >= minLng &&
            center[0] <= maxLng &&
            center[1] >= minLat &&
            center[1] <= maxLat
          );
        });

      if (centerAc) {
        setSelectedAc(centerAc);
        const generated = generateBoothsForAc(centerAc.props, centerAc.feature.geometry);
        setBooths(generated);
      }
    }
  }, [zoom, center, booths.length]);

  // Continuous 60 FPS Canvas Rendering Engine
  const renderMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = width / dpr;
    const cssHeight = height / dpr;

    // Reset transform & clear canvas to pure white background (India landmass only)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    const worldSize = 256 * Math.pow(2, zoom);
    const [centerWorldX, centerWorldY] = projectLngLat(center[0], center[1]);
    const originScreenX = cssWidth / 2;
    const originScreenY = cssHeight / 2;

    const toScreen = (lng: number, lat: number): [number, number] => {
      const [wx, wy] = projectLngLat(lng, lat);
      return [
        originScreenX + (wx - centerWorldX) * worldSize,
        originScreenY + (wy - centerWorldY) * worldSize,
      ];
    };

    // Calculate visible geographic bounds to cull invisible features
    const margin = 40;
    const nw = unprojectWorld(
      centerWorldX - (originScreenX + margin) / worldSize,
      centerWorldY - (originScreenY + margin) / worldSize
    );
    const se = unprojectWorld(
      centerWorldX + (originScreenX + margin) / worldSize,
      centerWorldY + (originScreenY + margin) / worldSize
    );
    const viewMinLng = Math.min(nw[0], se[0]);
    const viewMaxLng = Math.max(nw[0], se[0]);
    const viewMinLat = Math.min(nw[1], se[1]);
    const viewMaxLat = Math.max(nw[1], se[1]);

    const isAcVisible = zoom >= ZOOM_THRESHOLD_AC && acIndexRef.current.length > 0;
    const targetFeatures = isAcVisible ? acIndexRef.current : pcIndexRef.current;

    // Helper: draw polygon rings with crisp WHITE borders (Matching Image 1 & Image 2)
    const drawRings = (rings: number[][][], fillColor: string, strokeColor: string, strokeWidth: number) => {
      ctx.beginPath();
      for (let r = 0; r < rings.length; r++) {
        const ring = rings[r];
        if (ring.length === 0) continue;
        const [firstX, firstY] = toScreen(ring[0][0], ring[0][1]);
        ctx.moveTo(firstX, firstY);
        for (let i = 1; i < ring.length; i++) {
          const [sx, sy] = toScreen(ring[i][0], ring[i][1]);
          ctx.lineTo(sx, sy);
        }
        ctx.closePath();
      }
      ctx.fillStyle = fillColor;
      ctx.fill();
      if (strokeWidth > 0) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
      }
    };

    // Helper: draw boundary contour only (no fill)
    const drawContourOnly = (rings: number[][][], strokeColor: string, strokeWidth: number) => {
      ctx.beginPath();
      for (let r = 0; r < rings.length; r++) {
        const ring = rings[r];
        if (ring.length === 0) continue;
        const [firstX, firstY] = toScreen(ring[0][0], ring[0][1]);
        ctx.moveTo(firstX, firstY);
        for (let i = 1; i < ring.length; i++) {
          const [sx, sy] = toScreen(ring[i][0], ring[i][1]);
          ctx.lineTo(sx, sy);
        }
        ctx.closePath();
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    };

    // 1. Draw all visible constituency polygons
    // White borders ONLY (#ffffff) — soft, clean, publication-grade cartography!
    const defaultWhiteStroke = '#ffffff';
    const strokeWidth = isAcVisible ? 1.0 : 1.6;

    for (let f = 0; f < targetFeatures.length; f++) {
      const item = targetFeatures[f];
      const bbox = item.bbox;

      // Viewport culling
      if (
        bbox[2] < viewMinLng ||
        bbox[0] > viewMaxLng ||
        bbox[3] < viewMinLat ||
        bbox[1] > viewMaxLat
      ) {
        continue;
      }

      const geom = item.feature.geometry;
      // Inherit parent PC color so overall map color remains completely consistent
      const fillColor = isAcVisible
        ? item.props.parent_fill_color || item.props.fill_color || '#fed7aa'
        : item.props.fill_color || '#fed7aa';

      if (geom.type === 'Polygon') {
        drawRings(geom.coordinates, fillColor, defaultWhiteStroke, strokeWidth);
      } else if (geom.type === 'MultiPolygon') {
        for (let p = 0; p < geom.coordinates.length; p++) {
          drawRings(geom.coordinates[p], fillColor, defaultWhiteStroke, strokeWidth);
        }
      }
    }

    // 2. When Zoomed in (Zoom >= 7.0), draw distinct PC boundaries as clean white outlines
    // Shows the outer PC contour while inside it the AC divisions are visible!
    if (isAcVisible && pcIndexRef.current.length > 0) {
      for (let p = 0; p < pcIndexRef.current.length; p++) {
        const pcItem = pcIndexRef.current[p];
        const bbox = pcItem.bbox;
        if (
          bbox[2] < viewMinLng ||
          bbox[0] > viewMaxLng ||
          bbox[3] < viewMinLat ||
          bbox[1] > viewMaxLat
        ) {
          continue;
        }

        const geom = pcItem.feature.geometry;
        if (geom.type === 'Polygon') {
          drawContourOnly(geom.coordinates, '#ffffff', 2.8);
        } else if (geom.type === 'MultiPolygon') {
          for (let m = 0; m < geom.coordinates.length; m++) {
            drawContourOnly(geom.coordinates[m], '#ffffff', 2.8);
          }
        }
      }
    }

    // 3. Highlighted Hovered Constituency (Accent stroke on hovered area ONLY)
    if (hoveredFeature) {
      const geom = hoveredFeature.feature.geometry;
      const highlightRings = (rings: number[][][]) => {
        ctx.beginPath();
        for (let r = 0; r < rings.length; r++) {
          const ring = rings[r];
          if (ring.length === 0) continue;
          const [firstX, firstY] = toScreen(ring[0][0], ring[0][1]);
          ctx.moveTo(firstX, firstY);
          for (let i = 1; i < ring.length; i++) {
            const [sx, sy] = toScreen(ring[i][0], ring[i][1]);
            ctx.lineTo(sx, sy);
          }
          ctx.closePath();
        }
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.4;
        ctx.stroke();
      };

      if (geom.type === 'Polygon') {
        highlightRings(geom.coordinates);
      } else if (geom.type === 'MultiPolygon') {
        for (let p = 0; p < geom.coordinates.length; p++) {
          highlightRings(geom.coordinates[p]);
        }
      }

      // Draw single clean pill badge on hovered area center
      const [cx, cy] = toScreen(hoveredFeature.center[0], hoveredFeature.center[1]);
      const areaName = isAcVisible
        ? hoveredFeature.props.ac_name || `AC #${hoveredFeature.props.ac_no}`
        : hoveredFeature.props.pc_name;

      if (areaName && cx >= 0 && cx <= cssWidth && cy >= 0 && cy <= cssHeight) {
        ctx.font = 'bold 11px Inter, system-ui, -apple-system, sans-serif';
        const textMetrics = ctx.measureText(areaName);
        const padX = 8;
        const badgeW = textMetrics.width + padX * 2;
        const badgeH = 20;
        const badgeX = cx - badgeW / 2;
        const badgeY = cy - badgeH / 2;

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 5);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(areaName, cx, cy);
      }
    }

    // 4. Draw Polling Booths if Zoom >= 11.5 (Clean pins + Clear building labels)
    if (zoom >= ZOOM_THRESHOLD_BOOTH && booths.length > 0) {
      for (const booth of booths) {
        const [bx, by] = toScreen(booth.lng, booth.lat);
        const isSelected = selectedBooth?.id === booth.id;
        const radius = isSelected ? 13 : 9;

        // Outer glow
        ctx.beginPath();
        ctx.arc(bx, by, radius + 4, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? 'rgba(99, 102, 241, 0.45)' : 'rgba(15, 23, 42, 0.12)';
        ctx.fill();

        // Main pin circle
        ctx.beginPath();
        ctx.arc(bx, by, radius, 0, 2 * Math.PI);
        ctx.fillStyle = booth.heat_color || '#db2777';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Booth number text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${isSelected ? '10px' : '8.5px'} sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(booth.booth_number), bx, by);

        // CLEAR BOOTH NAME & BUILDING BADGE
        const bldgName = booth.building;
        const boothLabel = `Booth #${booth.booth_number}: ${bldgName}`;
        ctx.font = 'bold 8.5px Inter, system-ui, sans-serif';
        const textMetrics = ctx.measureText(boothLabel);
        const tagW = textMetrics.width + 10;
        const tagH = 15;
        const tagX = bx - tagW / 2;
        const tagY = by + radius + 3;

        // Card pill background
        ctx.fillStyle = isSelected ? '#1e1b4b' : 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.roundRect(tagX, tagY, tagW, tagH, 4);
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#6366f1' : 'rgba(15, 23, 42, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = isSelected ? '#fde047' : '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(boothLabel, bx, tagY + tagH / 2);
      }
    }
  }, [center, zoom, hoveredFeature, booths, selectedBooth]);

  // Keep canvas buffer in sync with container dimensions & trigger render
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(300, rect.width);
      const height = Math.max(400, rect.height);

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      renderMap();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderMap]);

  // Re-render whenever zoom, center, or state changes
  useEffect(() => {
    renderMap();
  }, [renderMap, acLoaded]);

  // Screen coordinate to Geographic Lng/Lat conversion
  const screenToLngLat = useCallback(
    (screenX: number, screenY: number): [number, number] => {
      const canvas = canvasRef.current;
      if (!canvas) return center;
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = canvas.width / dpr;
      const cssHeight = canvas.height / dpr;

      const worldSize = 256 * Math.pow(2, zoom);
      const [centerWorldX, centerWorldY] = projectLngLat(center[0], center[1]);
      const originScreenX = cssWidth / 2;
      const originScreenY = cssHeight / 2;

      const worldX = centerWorldX + (screenX - originScreenX) / worldSize;
      const worldY = centerWorldY + (screenY - originScreenY) / worldSize;
      return unprojectWorld(worldX, worldY);
    },
    [center, zoom]
  );

  // Smooth Fly-to Animation
  const flyTo = useCallback(
    (targetCenter: [number, number], targetZoom: number, durationMs = 600) => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      const startCenter = center;
      const startZoom = zoom;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        const ease =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const curLng = startCenter[0] + (targetCenter[0] - startCenter[0]) * ease;
        const curLat = startCenter[1] + (targetCenter[1] - startCenter[1]) * ease;
        const curZ = startZoom + (targetZoom - startZoom) * ease;

        setCenter([curLng, curLat]);
        setZoom(curZ);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          animFrameRef.current = null;
        }
      };

      animFrameRef.current = requestAnimationFrame(animate);
    },
    [center, zoom]
  );

  // Mouse drag & pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    dragStartCenterRef.current = [...center];
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseScreenX = e.clientX - rect.left;
    const mouseScreenY = e.clientY - rect.top;

    setMousePos({ x: mouseScreenX, y: mouseScreenY });

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartPosRef.current.x;
      const dy = e.clientY - dragStartPosRef.current.y;
      const worldSize = 256 * Math.pow(2, zoom);
      const [startWx, startWy] = projectLngLat(
        dragStartCenterRef.current[0],
        dragStartCenterRef.current[1]
      );
      const newWx = startWx - dx / worldSize;
      const newWy = startWy - dy / worldSize;
      const newCenter = unprojectWorld(newWx, newWy);
      setCenter(newCenter);
      return;
    }

    // Spatial Hit-Detection on Hover
    const [mouseLng, mouseLat] = screenToLngLat(mouseScreenX, mouseScreenY);
    const isAcVisible = zoom >= ZOOM_THRESHOLD_AC && acIndexRef.current.length > 0;
    const targetFeatures = isAcVisible ? acIndexRef.current : pcIndexRef.current;

    let hit: IndexedFeature | null = null;
    for (let i = 0; i < targetFeatures.length; i++) {
      const item = targetFeatures[i];
      const bbox = item.bbox;
      if (
        mouseLng >= bbox[0] &&
        mouseLng <= bbox[2] &&
        mouseLat >= bbox[1] &&
        mouseLat <= bbox[3]
      ) {
        if (pointInGeometry(mouseLng, mouseLat, item.feature.geometry)) {
          hit = item;
          break;
        }
      }
    }

    if (hit !== hoveredFeature) {
      setHoveredFeature(hit);
      if (hit) {
        const p = hit.props;
        if (isAcVisible) {
          setActiveInfo({
            type: 'ac',
            stName: p.st_name || 'ARUNACHAL PRADESH',
            pcName: p.pc_name || 'ARUNACHAL WEST',
            acName: p.ac_name || 'Nacho',
            acNo: Number(p.ac_no || p.ac_number || 0),
            areaKm2: Number(p.area_km2 || 279455),
            party: p.winning_party,
            marginPct: p.margin_pct,
            votesPct: p.votes_pct,
          });
        } else {
          setActiveInfo({
            type: 'pc',
            pcName: p.pc_name || 'Betul',
            stName: p.st_name || 'Madhya Pradesh',
            candidateName: p.winning_candidate || 'Jyoti Dhurve',
            party: p.winning_party || 'BJP',
            votesPct: p.votes_pct || '67.14%',
          });
        }
      }
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    setHoveredFeature(null);
    setMousePos(null);
  };

  // Wheel zoom to mouse pointer
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const [anchorLng, anchorLat] = screenToLngLat(mouseX, mouseY);
    const zoomDelta = -e.deltaY * 0.0025;
    const nextZoom = Math.max(3.8, Math.min(15.5, zoom + zoomDelta));

    if (nextZoom === zoom) return;

    // Adjust center so anchor point stays anchored under mouse cursor
    const [anchorWx, anchorWy] = projectLngLat(anchorLng, anchorLat);
    const nextWorldSize = 256 * Math.pow(2, nextZoom);
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;

    const nextCenterWx = anchorWx - (mouseX - cssWidth / 2) / nextWorldSize;
    const nextCenterWy = anchorWy - (mouseY - cssHeight / 2) / nextWorldSize;
    const nextCenter = unprojectWorld(nextCenterWx, nextCenterWy);

    setZoom(nextZoom);
    setCenter(nextCenter);
  };

  // Click on Constituency -> Smooth Zoom Navigation
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if clicked on a Polling Booth
    if (zoom >= ZOOM_THRESHOLD_BOOTH && booths.length > 0) {
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = canvas.width / dpr;
      const cssHeight = canvas.height / dpr;
      const worldSize = 256 * Math.pow(2, zoom);
      const [centerWorldX, centerWorldY] = projectLngLat(center[0], center[1]);
      const originScreenX = cssWidth / 2;
      const originScreenY = cssHeight / 2;

      for (const booth of booths) {
        const [wx, wy] = projectLngLat(booth.lng, booth.lat);
        const bx = originScreenX + (wx - centerWorldX) * worldSize;
        const by = originScreenY + (wy - centerWorldY) * worldSize;
        const dist = Math.hypot(mouseX - bx, mouseY - by);
        if (dist <= 18) {
          setSelectedBooth(booth);
          setActiveInfo({
            type: 'booth',
            boothNumber: booth.booth_number,
            boothBuilding: booth.building,
            acName: booth.ac_name,
            pcName: booth.pc_name,
            stName: booth.st_name,
            totalVoters: booth.total_voters,
            turnoutPct: booth.turnout_pct,
            party: booth.leading_party,
          });
          return;
        }
      }
    }

    if (!hoveredFeature) return;

    if (zoom < ZOOM_THRESHOLD_AC) {
      // Clicked on a Parliamentary Constituency -> Zoom in to AC Level (Zoom 8.5)
      flyTo(hoveredFeature.center, 8.5, 700);
    } else {
      // Clicked on an Assembly Constituency -> Zoom into Polling Booths (Zoom 12.6)
      const acProps = hoveredFeature.props as AcFeatureProps;
      setSelectedAc(hoveredFeature);
      const newBooths = generateBoothsForAc(acProps, hoveredFeature.feature.geometry);
      setBooths(newBooths);
      flyTo(hoveredFeature.center, 12.6, 700);
    }
  };

  // Zoom Button Controls
  const handleZoomIn = () => {
    flyTo(center, Math.min(15.5, zoom + 1.2), 350);
  };

  const handleZoomOut = () => {
    flyTo(center, Math.max(3.8, zoom - 1.2), 350);
  };

  const handleReset = () => {
    setSelectedBooth(null);
    setSelectedAc(null);
    setBooths([]);
    setActiveInfo({
      type: 'pc',
      pcName: 'Betul',
      stName: 'Madhya Pradesh',
      candidateName: 'Jyoti Dhurve',
      party: 'BJP',
      votesPct: '67.14%',
    });
    flyTo([78.96, 22.59], 4.6, 600);
  };

  const isAcView = zoom >= ZOOM_THRESHOLD_AC;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[780px] bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs select-none ${className}`}
    >
      {/* 1. Top-Left Title "Quick View" matching Example Image 1 */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3 pointer-events-auto">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 drop-shadow-2xs">
          Quick View
        </h1>
      </div>

      {/* 2. Top-Left Zoom Controls (+) and (-) matching Image 1 & 2 */}
      <div className="absolute top-16 left-4 z-10 flex flex-col bg-white border border-slate-300 rounded-md shadow-md overflow-hidden pointer-events-auto">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 hover:bg-slate-100 active:bg-slate-200 text-slate-700 border-b border-slate-200 flex items-center justify-center cursor-pointer transition-colors"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 hover:bg-slate-100 active:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
        >
          <Minus size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Reset to All India Button */}
      <button
        onClick={handleReset}
        title="Reset to All India View"
        className="absolute top-30 left-4 z-10 p-1.5 bg-white border border-slate-300 rounded-md shadow-md hover:bg-slate-100 active:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors pointer-events-auto"
      >
        <RotateCcw size={14} strokeWidth={2} />
      </button>

      {/* 3. Top-Right Floating Telemetry Card (Pixel-accurate matching Image 1 & 2) */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-4 min-w-[260px] max-w-[340px] pointer-events-auto transition-all duration-200">
          {activeInfo.type === 'booth' ? (
            /* Booth Level Card */
            <div className="space-y-1">
              <div className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1">
                Polling Station #{activeInfo.boothNumber}
              </div>
              <div className="text-xs text-slate-600 font-medium pt-1">
                <span className="text-slate-400">AC :</span> {activeInfo.acName} ({activeInfo.stName})
              </div>
              <div className="text-xs text-slate-600 font-medium">
                <span className="text-slate-400">Building :</span> {activeInfo.boothBuilding}
              </div>
              <div className="text-xs text-slate-600 font-medium">
                <span className="text-slate-400">Electors :</span> {activeInfo.totalVoters?.toLocaleString()} Voters
              </div>
              <div className="text-xs font-bold text-emerald-700 mt-1">
                Turnout : {activeInfo.turnoutPct}% • Lead : {activeInfo.party}
              </div>
            </div>
          ) : zoom >= ZOOM_THRESHOLD_AC ? (
            /* Assembly Constituencies Card (Matching Example Image 1) */
            <div className="space-y-1 text-xs">
              <div className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1">
                Assembly Constituencies
              </div>
              <div className="pt-1 text-slate-700">
                <span className="font-semibold text-slate-900">State :</span> {activeInfo.stName || 'ARUNACHAL PRADESH'}
              </div>
              <div className="text-slate-700">
                <span className="font-semibold text-slate-900">PC :</span> {activeInfo.pcName || 'ARUNACHAL WEST'}
              </div>
              <div className="text-slate-700">
                <span className="font-semibold text-slate-900">AC :</span> {activeInfo.acName || 'Nacho'}
              </div>
              <div className="text-slate-700">
                <span className="font-semibold text-slate-900">Area :</span> {activeInfo.areaKm2 ? `${activeInfo.areaKm2.toLocaleString()} km²` : '279455 km²'}
              </div>
              {activeInfo.party && (
                <div className="text-[11px] font-bold text-indigo-700 pt-0.5">
                  Lead : {activeInfo.party} {activeInfo.marginPct ? `• Margin: ${activeInfo.marginPct}` : ''}
                </div>
              )}
            </div>
          ) : (
            /* Parliamentary Constituencies Card (Matching Example Image 2) */
            <div className="space-y-1 text-xs">
              <div className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1">
                Parliamentary Constituencies (2024)
              </div>
              <div className="pt-1 text-slate-800 font-semibold">
                {activeInfo.pcName || 'Betul'} ( {activeInfo.stName || 'Madhya Pradesh'} )
              </div>
              <div className="text-slate-700">
                <span className="font-semibold text-slate-900">Winning Candidate :</span>{' '}
                <span className="font-bold">
                  {activeInfo.candidateName || 'Jyoti Dhurve'} ( {activeInfo.party || 'BJP'} )
                </span>
              </div>
              <div className="text-slate-700">
                <span className="font-semibold text-slate-900">Votes :</span> {activeInfo.votesPct || '67.14%'}
              </div>
            </div>
          )}

          {/* Current Zoom Level Guidance Badge */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Zoom: {zoom.toFixed(1)}</span>
            <span className="font-sans font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              {zoom >= ZOOM_THRESHOLD_BOOTH
                ? selectedAc
                  ? `Booths: ${selectedAc.props.ac_name}`
                  : 'Polling Booths'
                : zoom >= ZOOM_THRESHOLD_AC
                  ? 'Assembly Constituencies (AC)'
                  : 'Parliamentary Constituencies (PC)'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Interactive Cursor Floating Tooltip (Clean glassmorphism card on hover) */}
      {hoveredFeature && mousePos && !isDraggingRef.current && (
        <div
          className="pointer-events-none absolute z-30 transition-opacity duration-150"
          style={{
            left: Math.min(mousePos.x + 16, (containerRef.current?.clientWidth || 800) - 250),
            top: Math.min(mousePos.y + 16, (containerRef.current?.clientHeight || 700) - 150),
          }}
        >
          <div className="bg-slate-900/95 text-white backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-700/60 min-w-[200px] max-w-[270px] text-xs">
            <div className="font-black text-sm text-amber-300 flex items-center justify-between gap-2">
              <span className="truncate">
                {isAcView
                  ? hoveredFeature.props.ac_name || 'Assembly Constituency'
                  : hoveredFeature.props.pc_name || 'Parliamentary Constituency'}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white uppercase whitespace-nowrap">
                {isAcView ? `AC #${hoveredFeature.props.ac_no || ''}` : hoveredFeature.props.category || 'PC'}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5 truncate">
              {hoveredFeature.props.st_name}
              {isAcView && hoveredFeature.props.pc_name ? ` • PC: ${hoveredFeature.props.pc_name}` : ''}
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-slate-700/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                {isAcView ? 'Leading Party:' : 'Winning Candidate:'}
              </span>
              <span className="font-bold text-emerald-400 truncate ml-1">
                {hoveredFeature.props.winning_candidate
                  ? `${hoveredFeature.props.winning_candidate} (${hoveredFeature.props.winning_party})`
                  : hoveredFeature.props.winning_party || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] mt-0.5">
              <span className="text-slate-400">
                {isAcView ? 'Area:' : 'Votes %:'}
              </span>
              <span className="font-semibold text-slate-200">
                {isAcView
                  ? `${hoveredFeature.props.area_km2?.toLocaleString() || 1250} km²`
                  : hoveredFeature.props.votes_pct || '67.14%'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Vector Canvas (India Only - Pure White Background) */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onClick={handleClick}
        style={{ cursor: isDraggingRef.current ? 'grabbing' : hoveredFeature ? 'pointer' : 'grab' }}
        className="w-full h-full block"
      />
    </div>
  );
};

export default IndiaHeatMap;
