import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Map, Marker, LngLatBounds, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Geographic reference data
import {
  WATER_BODIES,
  NEIGHBORING_COUNTRIES,
  INDIAN_STATES,
  INDIAN_CITIES,
} from '../data/mapGeoData';

// Clean State Boundaries GeoJSON
import indiaStatesData from '../data/india_states.min.geojson';

export interface StateInfo {
  state_code: string;
  state_name: string;
  capital: string;
  zone: string;
}

export interface IndiaMapProps {
  /** Selected state code (e.g. 'GJ', 'MH') */
  selectedState?: string | null;
  /** Custom fill colors per state code, e.g. { GJ: '#fed7aa', MH: '#bbf7d0' } */
  stateColors?: Record<string, string>;
  /** Default fallback fill color for states */
  defaultFillColor?: string;
  /** Callback fired when user selects a state */
  onSelectState?: (state: StateInfo) => void;
  /** Component height (default '650px') */
  height?: string;
  /** Wrapper CSS class name */
  className?: string;
  /** Show city markers (default true) */
  showCities?: boolean;
  /** Show surrounding seas and neighboring countries (default true) */
  showSurroundings?: boolean;
  /** Show state centroid labels (default true) */
  showStateLabels?: boolean;
}

const DEFAULT_STATE_COLORS: Record<string, string> = {
  GJ: '#fed7aa',
  MH: '#bbf7d0',
  RJ: '#fef08a',
  MP: '#e9d5ff',
  UP: '#fbcfe8',
  BR: '#c7d2fe',
  WB: '#fed7aa',
  OD: '#bbf7d0',
  KA: '#fef08a',
  TN: '#fbcfe8',
  KL: '#bae6fd',
  AP: '#e9d5ff',
  TG: '#fed7aa',
  PB: '#c7d2fe',
  HR: '#bbf7d0',
  CG: '#fef08a',
  JH: '#fbcfe8',
  AS: '#bae6fd',
  HP: '#e9d5ff',
  UK: '#fed7aa',
  JK: '#c7d2fe',
  LA: '#f1f5f9',
  AR: '#bbf7d0',
  GA: '#fef08a',
  SK: '#fbcfe8',
  TR: '#bae6fd',
  ML: '#e9d5ff',
  MN: '#fed7aa',
  NL: '#c7d2fe',
  MZ: '#bbf7d0',
  PY: '#fef08a',
  AN: '#bae6fd',
  LD: '#bae6fd',
  DL: '#f87171',
  CH: '#a7f3d0',
  DH: '#fde047',
  CT: '#fef08a',
  OR: '#bbf7d0',
  UT: '#fed7aa',
  TS: '#fed7aa',
  DD: '#fde047',
  DN: '#fde047',
};

export const IndiaMap: React.FC<IndiaMapProps> = ({
  selectedState = null,
  stateColors = {},
  defaultFillColor = '#e2e8f0',
  onSelectState,
  height = '650px',
  className = '',
  showCities = true,
  showSurroundings = true,
  showStateLabels = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  const [activeState, setActiveState] = useState<StateInfo | null>(null);
  const [internalCities, setInternalCities] = useState(showCities);
  const [internalSurroundings, setInternalSurroundings] = useState(showSurroundings);
  const [internalLabels, setInternalLabels] = useState(showStateLabels);

  const cityMarkersRef = useRef<Array<{ marker: Marker; tier: number; el: HTMLElement }>>([]);
  const stateLabelMarkersRef = useRef<Array<{ marker: Marker; minZoom: number; el: HTMLElement }>>([]);
  const surroundingMarkersRef = useRef<Array<{ marker: Marker; el: HTMLElement; minZoom: number }>>([]);

  // 1. Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': '#dbeafe', // Soft ocean
            },
          },
        ],
      },
      center: [78.9629, 22.5937],
      zoom: 4.2,
      minZoom: 3.5,
      maxZoom: 14,
      attributionControl: false,
    });

    mapRef.current = map;

    // Handle container resizing
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    map.on('load', () => {
      // Setup neighboring countries
      const neighborFeatures = NEIGHBORING_COUNTRIES.map((nc) => ({
        type: 'Feature' as const,
        properties: { name: nc.name },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [nc.polygon],
        },
      }));

      map.addSource('neighbor-countries', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: neighborFeatures,
        },
      });

      map.addLayer({
        id: 'neighbor-fill',
        type: 'fill',
        source: 'neighbor-countries',
        paint: {
          'fill-color': '#f1efe9',
          'fill-opacity': 0.88,
        },
      });

      map.addLayer({
        id: 'neighbor-border',
        type: 'line',
        source: 'neighbor-countries',
        paint: {
          'line-color': '#cbd5e1',
          'line-width': 1.2,
          'line-dasharray': [2, 2],
        },
      });

      // Setup Indian States GeoJSON
      map.addSource('india-states', {
        type: 'geojson',
        data: indiaStatesData as any,
      });

      // Match expression for state fill colors
      const combinedColors = { ...DEFAULT_STATE_COLORS, ...stateColors };
      const colorExpr: any = ['match', ['get', 'state_code']];
      for (const [code, hex] of Object.entries(combinedColors)) {
        colorExpr.push(code, hex);
      }
      colorExpr.push(defaultFillColor);

      map.addLayer({
        id: 'states-fill',
        type: 'fill',
        source: 'india-states',
        paint: {
          'fill-color': colorExpr,
          'fill-opacity': 0.85,
        },
      });

      map.addLayer({
        id: 'states-border',
        type: 'line',
        source: 'india-states',
        paint: {
          'line-color': '#ffffff',
          'line-width': 1.2,
        },
      });

      map.addLayer({
        id: 'states-highlight',
        type: 'line',
        source: 'india-states',
        filter: ['==', 'state_code', ''],
        paint: {
          'line-color': '#0284c7',
          'line-width': 2.5,
        },
      });

      // Hover effects
      map.on('mousemove', 'states-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          const code = e.features[0].properties?.state_code || '';
          map.setFilter('states-highlight', ['==', 'state_code', code]);
        }
      });

      map.on('mouseleave', 'states-fill', () => {
        map.getCanvas().style.cursor = '';
        if (selectedState) {
          map.setFilter('states-highlight', ['==', 'state_code', selectedState]);
        } else {
          map.setFilter('states-highlight', ['==', 'state_code', '']);
        }
      });

      // Click to select
      map.on('click', 'states-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties as StateInfo;
          setActiveState(props);
          if (onSelectState) onSelectState(props);
          map.setFilter('states-highlight', ['==', 'state_code', props.state_code]);
        }
      });

      // Setup Markers (Cities, States, Water bodies)
      renderCityMarkers(map);
      renderStateLabels(map);
      renderSurroundings(map);
    });

    return () => {
      ro.disconnect();
      map.remove();
    };
  }, []);

  // Update selected state highlight filter
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    mapRef.current.setFilter('states-highlight', ['==', 'state_code', selectedState || '']);
  }, [selectedState]);

  // 2. City Markers
  const renderCityMarkers = (map: Map) => {
    INDIAN_CITIES.forEach((city) => {
      const el = document.createElement('div');
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.gap = '4px';
      el.style.cursor = 'pointer';

      const dot = document.createElement('div');
      dot.style.width = city.isCapital ? '9px' : '7px';
      dot.style.height = city.isCapital ? '9px' : '7px';
      dot.style.borderRadius = '50%';
      dot.style.backgroundColor = city.isCapital ? '#dc2626' : '#2563eb';
      dot.style.border = '1.5px solid #ffffff';
      dot.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';

      const label = document.createElement('span');
      label.innerText = city.name;
      label.style.fontSize = '11px';
      label.style.fontWeight = '600';
      label.style.color = '#1e293b';
      label.style.textShadow = '0 0 3px #ffffff, 0 0 4px #ffffff';
      label.style.whiteSpace = 'nowrap';

      el.appendChild(dot);
      el.appendChild(label);

      el.onclick = (e) => {
        e.stopPropagation();
        map.flyTo({ center: [city.lng, city.lat], zoom: 8.5, essential: true });
      };

      const marker = new Marker({ element: el }).setLngLat([city.lng, city.lat]).addTo(map);

      cityMarkersRef.current.push({ marker, tier: city.tier, el });
    });

    const updateVisibility = () => {
      const zoom = map.getZoom();
      cityMarkersRef.current.forEach(({ tier, el }) => {
        if (!internalCities) {
          el.style.display = 'none';
          return;
        }
        if (tier === 1 || (tier === 2 && zoom >= 5.0) || (tier === 3 && zoom >= 6.5)) {
          el.style.display = 'flex';
        } else {
          el.style.display = 'none';
        }
      });
    };

    map.on('zoom', updateVisibility);
    updateVisibility();
  };

  // 3. State Centroid Labels
  const renderStateLabels = (map: Map) => {
    INDIAN_STATES.forEach((st) => {
      const el = document.createElement('div');
      el.innerText = st.name;
      el.style.fontSize = `${st.fontSize}px`;
      el.style.fontWeight = '700';
      el.style.color = '#475569';
      el.style.letterSpacing = '0.8px';
      el.style.textTransform = 'uppercase';
      el.style.textShadow = '0 0 3px #ffffff, 0 0 4px #ffffff';
      el.style.pointerEvents = 'none';
      el.style.whiteSpace = 'nowrap';

      const marker = new Marker({ element: el, anchor: 'center' }).setLngLat([st.lng, st.lat]).addTo(map);

      stateLabelMarkersRef.current.push({ marker, minZoom: st.minZoom || 3.5, el });
    });

    const updateVisibility = () => {
      const zoom = map.getZoom();
      stateLabelMarkersRef.current.forEach(({ minZoom, el }) => {
        el.style.display = internalLabels && zoom >= minZoom ? 'block' : 'none';
      });
    };

    map.on('zoom', updateVisibility);
    updateVisibility();
  };

  // 4. Surroundings (Water bodies & neighboring countries)
  const renderSurroundings = (map: Map) => {
    WATER_BODIES.forEach((wb) => {
      const el = document.createElement('div');
      el.innerText = wb.name;
      el.style.fontSize = `${wb.fontSize}px`;
      el.style.fontStyle = 'italic';
      el.style.color = '#0284c7';
      el.style.opacity = '0.65';
      el.style.fontWeight = '600';
      el.style.letterSpacing = '1.2px';
      el.style.textTransform = 'uppercase';
      el.style.pointerEvents = 'none';
      el.style.textShadow = '0 0 4px rgba(255,255,255,0.8)';

      const marker = new Marker({ element: el, anchor: 'center' }).setLngLat([wb.lng, wb.lat]).addTo(map);

      surroundingMarkersRef.current.push({ marker, el, minZoom: wb.minZoom || 3.5 });
    });

    NEIGHBORING_COUNTRIES.forEach((nc) => {
      const el = document.createElement('div');
      el.innerText = nc.name;
      el.style.fontSize = '10px';
      el.style.fontWeight = '700';
      el.style.color = '#94a3b8';
      el.style.letterSpacing = '1.5px';
      el.style.textTransform = 'uppercase';
      el.style.pointerEvents = 'none';
      el.style.textShadow = '0 0 3px #ffffff';

      const marker = new Marker({ element: el, anchor: 'center' }).setLngLat(nc.labelCoord).addTo(map);

      surroundingMarkersRef.current.push({ marker, el, minZoom: 3.5 });
    });

    const updateVisibility = () => {
      const zoom = map.getZoom();
      surroundingMarkersRef.current.forEach(({ minZoom, el }) => {
        el.style.display = internalSurroundings && zoom >= minZoom ? 'block' : 'none';
      });
    };

    map.on('zoom', updateVisibility);
    updateVisibility();
  };

  // Controls
  const handleReset = useCallback(() => {
    if (!mapRef.current) return;
    setActiveState(null);
    mapRef.current.flyTo({
      center: [78.9629, 22.5937],
      zoom: 4.2,
      pitch: 0,
      bearing: 0,
      essential: true,
    });
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
        overflow: 'hidden',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0',
      }}
      className={className}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Control Buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setInternalCities(!internalCities)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              background: internalCities ? '#0284c7' : '#ffffff',
              color: internalCities ? '#ffffff' : '#334155',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            }}
          >
            🏙️ Cities
          </button>
          <button
            type="button"
            onClick={() => setInternalLabels(!internalLabels)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              background: internalLabels ? '#0284c7' : '#ffffff',
              color: internalLabels ? '#ffffff' : '#334155',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            }}
          >
            🏷️ States
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '36px',
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            style={{ height: '36px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px' }}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            style={{
              height: '36px',
              border: 'none',
              borderTop: '1px solid #f1f5f9',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            −
          </button>
          <button
            type="button"
            onClick={handleReset}
            title="Reset View"
            style={{
              height: '36px',
              border: 'none',
              borderTop: '1px solid #f1f5f9',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ↺
          </button>
        </div>
      </div>

      {/* Selected State Popup Card */}
      {activeState && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            zIndex: 5,
            width: '260px',
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              {activeState.state_name}
            </h4>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: '#f1f5f9',
                color: '#475569',
              }}
            >
              {activeState.state_code}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '13px' }}>
            <span style={{ color: '#64748b' }}>Capital:</span>
            <strong style={{ color: '#1e293b' }}>{activeState.capital}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '13px' }}>
            <span style={{ color: '#64748b' }}>Zone:</span>
            <strong style={{ color: '#1e293b' }}>{activeState.zone}</strong>
          </div>

          <button
            type="button"
            onClick={() => setActiveState(null)}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '6px 0',
              border: 'none',
              borderRadius: '6px',
              background: '#f1f5f9',
              color: '#475569',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default IndiaMap;
