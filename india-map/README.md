# 🇮🇳 Republic of India — Standalone Vector Map

A high-performance, self-contained, interactive Indian Geographic Map package ready to share, explore, or integrate into any web application or GIS workflow.

---

## ✨ Features

- **Pure State Boundaries**: High-precision vector geometries for all **28 Indian States & 8 Union Territories** (36 administrative entities total, compliant with official Survey of India 2019-2024 reorganizations including **Ladakh**, **Jammu & Kashmir**, **Telangana**, **Andaman & Nicobar Islands**, and **Lakshadweep**). **100% clean — zero political, Parliamentary (PC), or Assembly (AC) election clutter.**
- **Authentic Gujarat & Coastal Geography**: 100% geographically true representation of Gujarat — open **Gulf of Kutch (કચ્છનો અખાત)** separating Kutch from Jamnagar/Dwarka, contiguous Great Rann of Kutch up to the international border (lat 24.71° N), complete Saurashtra peninsula (Dwarka, Porbandar, Somnath, Diu, Bhavnagar), and the Gulf of Khambhat.
- **Accurate Subcontinental Geography**: Realigned international borders with neighboring countries (Pakistan, Nepal, Bhutan, Bangladesh, Myanmar, China, Sri Lanka, Afghanistan) and surrounding water bodies (Arabian Sea, Bay of Bengal, Indian Ocean, Laccadive Sea, Andaman Sea, Gulf of Kutch, Gulf of Khambhat).
- **Three-Tier Indian Cities Hierarchy**:
  - **Tier 1 (Core Metros)**: Delhi, Mumbai, Bengaluru, Kolkata, Chennai, Hyderabad, Ahmedabad (always visible).
  - **Tier 2 (Capitals & Commercial Hubs)**: Jaipur, Lucknow, Pune, Surat, Chandigarh, Bhopal, Patna, etc. (visible at zoom ≥ 5.0).
  - **Tier 3 (Regional Centers)**: Rajkot, Vadodara, Nashik, Mysuru, Madurai, Varanasi, Jodhpur, etc. (visible at zoom ≥ 6.5).
- **100% Offline Vector Rendering**: Zero external map tile dependencies, zero API keys (no Google Maps, Mapbox, or CARTO tokens required).
- **Interactive UI**: State search bar, click-to-select state detail cards, zoom controls, 3D tilt perspective toggle, and layer toggles for cities and water bodies.

---

## 📁 Package Directory Structure

```text
india-map/
├── index.html                 # 🚀 Instant Interactive Viewer (Double-click to open!)
├── README.md                  # 📖 Documentation & Integration Guide
├── data/
│   ├── india_states.geojson   # Full standard GeoJSON (for GIS, QGIS, Python)
│   ├── india_states.min.geojson # Compact minified GeoJSON (596 KB, for web apps)
│   ├── india_states_data.js   # Universal JS bundle (offline file:// protocol support)
│   ├── mapGeoData.ts          # TypeScript geographic metadata (cities, seas, neighbors)
│   └── mapGeoData.js          # JavaScript geographic metadata (cities, seas, neighbors)
└── react/
    ├── IndiaMap.tsx           # Production-ready React component (TypeScript)
    └── IndiaMap.jsx           # Production-ready React component (Plain JavaScript / JSX)
```

---

## 🚀 How to Use

### Option 1: Instant Quickstart (Zero Installation)
1. Double-click `index.html` in your file manager (Finder on macOS, File Explorer on Windows).
2. It opens directly in your web browser (Chrome, Safari, Firefox, Edge).
3. **No Node.js, no terminal commands, and no local server needed.** Everything runs instantly offline!

---

### Option 2: Run with a Local Web Server
If you prefer running via a local server:

**Using Python:**
```bash
# In the india-map directory:
python3 -m http.server 8080
```
Then visit [http://localhost:8080](http://localhost:8080) in your browser.

**Using Node.js / npx:**
```bash
npx serve .
```

---

### Option 3: Use in a React / Vite / Next.js Project

1. **Install MapLibre GL**:
   ```bash
   npm install maplibre-gl
   ```

2. **Copy the Files**:
   - Copy `react/IndiaMap.tsx` (or `IndiaMap.jsx`) into your components folder (e.g. `src/components/IndiaMap.tsx`).
   - Copy `data/india_states.min.geojson` and `data/mapGeoData.ts` into your data folder.

3. **Import and Render**:
   ```tsx
   import React, { useState } from 'react';
   import { IndiaMap, StateInfo } from './components/IndiaMap';

   export const MyDashboard: React.FC = () => {
     const [selected, setSelected] = useState<StateInfo | null>(null);

     // Optional: custom theme colors for specific states
     const customColors = {
       GJ: '#fed7aa', // Gujarat
       MH: '#bbf7d0', // Maharashtra
       KA: '#fef08a', // Karnataka
       DL: '#f87171', // Delhi
     };

     return (
       <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '24px' }}>
         <h1>My India Geographic Dashboard</h1>
         
         <IndiaMap
           height="700px"
           stateColors={customColors}
           onSelectState={(state) => {
             console.log('Selected State:', state);
             setSelected(state);
           }}
         />

         {selected && (
           <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
             <h3>{selected.state_name} ({selected.state_code})</h3>
             <p>Capital: {selected.capital}</p>
             <p>Zone: {selected.zone}</p>
           </div>
         )}
       </div>
     );
   };
   ```

#### Component Props (`IndiaMapProps`):

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `height` | `string` | `'650px'` | Height of the map container (e.g. `'600px'`, `'100%'`). |
| `stateColors` | `Record<string, string>` | `{}` | Key-value pairs of state codes to hex colors (e.g. `{ GJ: '#fed7aa' }`). |
| `selectedState` | `string \| null` | `null` | Currently highlighted state code (e.g. `'GJ'`). |
| `onSelectState` | `(state: StateInfo) => void` | `undefined` | Callback invoked when a user clicks any state. |
| `showCities` | `boolean` | `true` | Show or hide interactive city markers. |
| `showStateLabels`| `boolean` | `true` | Show or hide state centroid labels. |
| `showSurroundings` | `boolean` | `true` | Show or hide surrounding water bodies and neighbor countries. |
| `className` | `string` | `''` | Custom CSS class for the container. |

---

### Option 4: Use in Python / Jupyter / Pandas / QGIS

`data/india_states.geojson` is a clean standard GeoJSON FeatureCollection.

**Python (GeoPandas):**
```python
import geopandas as gpd
import matplotlib.pyplot as plt

# Load state boundaries
gdf = gpd.read_file('data/india_states.geojson')

print(gdf[['state_code', 'state_name', 'capital', 'zone']].head())

# Plot the map
gdf.plot(edgecolor='white', color='#38bdf8', figsize=(10, 10))
plt.title('Republic of India — State Boundaries')
plt.show()
```

---

## 📊 State Properties Reference

Each state feature in `data/india_states.geojson` contains:

```json
{
  "type": "Feature",
  "id": "GJ",
  "properties": {
    "state_code": "GJ",
    "state_name": "Gujarat",
    "capital": "Gandhinagar",
    "zone": "Western"
  },
  "geometry": {
    "type": "MultiPolygon",
    "coordinates": [...]
  }
}
```

---

## 🛠️ Offline Support & Browser Compatibility

- Supported in all modern browsers: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+.
- Supports mobile touch gestures (pinch-to-zoom, two-finger rotate and tilt).
- Completely self-contained with no external server tracking or network requirements.
