# Indian Election GIS & Analytics Dashboard

## 1. Overview
The Indian Election GIS & Analytics Dashboard is a production-ready, interactive geospatial election intelligence platform built using **React.js**, **TypeScript**, and **MapLibre GL JS**.

It provides seamless multi-level hierarchical election boundaries:
$$\text{India} \longrightarrow \text{State} \longrightarrow \text{Parliamentary Constituency (PC)} \longrightarrow \text{Assembly Constituency (AC)} \longrightarrow \text{Polling Booth}$$

---

## 2. Integrated Geospatial Datasets

The dashboard natively integrates and fully supports the leading open-access Indian electoral geospatial repositories:

| Dataset Repository | Source / Reference | Coverage | Attributes Supported |
| :--- | :--- | :--- | :--- |
| **India Geodata — PC boundaries** | [yashveeeeeer/india-geodata](https://yashveeeeeer.github.io/india-geodata/) | 543 Parliamentary Constituencies | `pc_name`, `pc_id`, `pc_no`, `st_name`, `st_code`, `total_voters` |
| **India Geodata — AC boundaries** | [yashveeeeeer/india-geodata (electoral)](https://github.com/yashveeeeeer/india-geodata/blob/main/data/electoral/assembly-constituencies/README.md) | 4,123+ All-India Assembly Constituencies | `ac_name`, `ac_no`, `pc_name`, `pc_no`, `st_name`, `dist_name` |
| **DataMeet Maps** | [projects.datameet.org/maps](https://projects.datameet.org/maps/) | PC, AC, and State Boundaries | `ST_NAME`, `ST_CODE`, `PC_NAME`, `PC_NO`, `AC_NAME`, `AC_NO`, `DIST_NAME` |
| **Election Commission of India (ECI)** | ECI Delimitation Commission Orders | Official PC-to-AC Delimitation Master | `stateName`, `pcNumber`, `pcName`, `acNumber`, `name`, `districtName` |

### Multi-Schema Property Compatibility
The application's `IndiaMap.tsx` and `geoDataService.ts` implement an automated property normalizer:
- **Case Agnostic**: Seamlessly reads both uppercase (`ST_NAME`, `PC_NAME`, `AC_NAME`, `AC_NO`, `DIST_NAME`) and lowercase (`st_name`, `pc_name`, `ac_name`, `ac_no`, `dist_name`).
- **Delimiter Agnostic**: Recognizes snake_case, camelCase, and space-separated keys.
- **Zero Configuration**: Any GeoJSON or Shapefile export from `yashveeeeeer/india-geodata` or `DataMeet` can be dropped into the upload module or loaded locally without manual preprocessing.

---

## 3. Key Architecture & Features

### A. Offline Local Vector Boundaries (No External Tile Dependency)
- **Zero External Raster Tiles**: Does not rely on OpenStreetMap, CARTO, or Mapbox hosted raster tiles.
- **Pure Local Vector Rendering**: Renders standard ECI delimitation GeoJSON layers with hardware-accelerated WebGL directly in MapLibre GL JS.
- **Viewport Fit & Navigation**: Fits India on launch with smooth zoom, pan, 3D perspective pitch tilt ($0^\circ \to 45^\circ$), and North compass reset.

### B. Official Constituency Mapping (Delimitation 2008–2024)
- **543 Parliamentary Constituencies (PCs)**: Full geographic coverage with winner details, turnout %, vote %, and registered electors.
- **4,123 Assembly Constituencies (ACs)**: Official ECI parent PC-to-AC mapping dataset. Clicking any PC automatically isolates and loads only the ACs legally belonging to that PC.
- **Polling Booths**: Point coordinates with circular markers displaying booth number, building name, voters, and turnout.

### C. 8 Election Heatmap Visualization Modes
1. **Winning Party**: Distinct political colors for BJP (Saffron), INC (Congress Blue), AITC (Grassroot Green), AAP (Cyan), SP (Crimson), DMK (Red), TDP (Amber), YSRCP (Royal Blue), Shiv Sena, NCP, CPI/CPM, and Others.
2. **Party-wise Vote Share (%)**: Graduated orange-saffron intensity ($25\% \to 70\%+$).
3. **Voter Turnout (%)**: Continuous thermal gradient from Low Turnout ($< 45\%$, Deep Red) $\to$ Amber $\to$ Lime $\to$ High Turnout ($> 85\%$, Emerald Green).
4. **Winning Margin**: Battleground seats ($< 5\%$ Rose Alert) $\to$ Competitive ($5\% - 15\%$) $\to$ Safe Seats ($> 25\%$ Deep Indigo).
5. **Total Votes Polled**: Quantile density scale ($400\text{k} \to 2.2\text{M}+$ electors).
6. **NOTA Votes (%)**: None-of-the-above protest voting density ($0.5\% \to 4.0\%+$).
7. **Leading Party**: Active counting lead projections.
8. **Custom Election Metric**: User-defined scores from uploaded CSV/Excel files.

### D. Custom Election Data Upload (CSV, XLS, XLSX, GeoJSON)
- Standard Schema:
  `state_code`, `pc_code`, `pc_name`, `ac_code`, `ac_name`, `party`, `candidate`, `votes`, `vote_share`, `turnout`, `margin`, `election_year`, `election_type`
- **Validation**:
  - Automatically identifies missing columns and duplicates.
  - Validates constituency names/codes against the ECI delimitation master table.
  - Identifies unmatched records with row numbers and reasons.
  - Interactive preview table of first records.
  - Data join on unique codes (`pc_code` / `ac_code`) without overwriting baseline data without confirmation.

---

## 4. Directory Structure

```
web/src/
├── components/
│   ├── Map/
│   │   ├── IndiaMap.tsx              # Master MapLibre WebGL canvas (Offline local vector)
│   │   ├── MapControls.tsx           # Zoom, reset, 3D pitch, opacity, borders
│   │   └── MapLegend.tsx             # Dynamic legend for all 8 metrics
│   ├── Dashboard/
│   │   ├── Header.tsx                # Navy blue header with breadcrumb trail
│   │   ├── Sidebar.tsx               # Boundary level selector, search, metric picker
│   │   ├── AnalyticsPanel.tsx        # Right sidebar constituency telemetry
│   │   ├── BottomAnalyticsPanel.tsx  # Collapsible drawer for charts & trends
│   │   └── ElectionDashboard.tsx     # Master unified dashboard container
│   ├── Charts/
│   │   ├── PartyChart.tsx            # Recharts seat pie & vote share bar
│   │   ├── TurnoutChart.tsx          # Historical turnout trends area chart
│   │   └── VoteShareChart.tsx        # Multi-election comparison bar chart
│   └── Upload/
│       └── FileUploadModal.tsx       # Modal with drag-drop, mapping & validation
├── services/
│   ├── mapService.ts                 # MapLibre offline style & paint expressions
│   ├── electionService.ts            # Results data, party colors, historical stats
│   ├── geoDataService.ts             # Boundary loader, official PC-AC mapping, booths
│   └── uploadService.ts              # SheetJS (XLSX) parser, column mapper, validator
├── types/
│   └── electionGis.types.ts          # Complete TypeScript definitions
└── data/
    └── official_pc_ac_mapping.json   # 4,123 official ECI PC-AC records
```

---

## 5. Sample Datasets (Maintained in `xlsx/` per Rule 22)
- [sample_election_results_2024.xlsx](file:///Users/mac-yash/Documents/GitHub/Ranniti/xlsx/sample_election_results_2024.xlsx): Production Excel dataset with standard schema headers and sample records.
- [sample_election_data.csv](file:///Users/mac-yash/Documents/GitHub/Ranniti/xlsx/sample_election_data.csv): Matching CSV dataset.
- [sample_election_boundaries.geojson](file:///Users/mac-yash/Documents/GitHub/Ranniti/xlsx/sample_election_boundaries.geojson): Sample GeoJSON format with ECI metadata and properties.
