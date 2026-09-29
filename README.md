# Meghdoot AI — Atmospheric Intelligence

**Himalayan Cloudburst & Flash-Flood Decision Support Prototype**

Meghdoot AI is an interactive geospatial command-center prototype for situational awareness during extreme orographic rainfall events in the Himalayan river basin. It demonstrates the intended architecture of a physics-informed AI nowcasting and flood-surge routing system, built around the 2013 Kedarnath cloudburst scenario.

> **This is a prototype/simulation.** It does not connect to live satellite feeds, operational radar, or real emergency broadcast infrastructure. All inference, telemetry, and alert dispatch shown in the UI are simulated representations of the intended system design.

---

## Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 + TypeScript |
| Build tooling | Vite 8 |
| Styling | Tailwind CSS v4 |
| Tactical map | Leaflet 1.9 (direct, no react-leaflet) |
| Hydrograph | Chart.js 4 (direct, no react-chartjs-2) |
| Icons | Material Symbols (Google Fonts CDN) |

---

## Prototype Capabilities

### Tactical Map
- Real Leaflet map with OpenTopoMap terrain tiles
- Cloudburst polygon overlay (severity-styled GeoJSON)
- Mandakini river surge path (animated hydro-flow LineString)
- Affected-area impact zone markers with detailed popups
- Safe-zone ridge markers
- Layer visibility controls (cloudburst, river, safe zones, affected areas, radar)
- Zoom, pan, recenter controls
- Marker click → React sector-selection state (no SVG overlay)

### Radar Visualization
- Canvas-based Doppler radar sweep (X-band simulation)
- Rotating sweep cone, range rings, crosshair, reflectivity heat spot
- Leaflet ImageOverlay aligned to scenario coordinates
- Toggle on/off with full animation and interval cleanup

### Telemetry Engine
- Three interactive sliders: moisture convergence, CTT drop rate, orographic uplift
- Authoritative rainfall formula: `BASE + α·moisture + β·|ΔCTT| + γ·uplift`
- Live ETA derived from intensity: `max(12, round(62 − intensity × 0.2))`
- Threshold classification: Normal / Warning / Cloudburst
- Single formula source of truth in `src/services/telemetry.ts`

### Event Timeline
- Four timeline phases: T−30m · T−15m · T+0m · T+30m
- Each phase drives telemetry, hazard state, map layers, and hydrograph
- Kedarnath scenario data for T−30m / T−15m / T+0m from authoritative source
- T+30m conservatively extrapolated (no original scenario backing)

### Hydrograph
- Chart.js dual-axis line chart: riverbed terrain elevation + flood surge depth
- 7-station Mandakini transect (Kedarnath → Sonprayag)
- Surge depths dynamically scaled by live telemetry intensity
- Overflow danger threshold at 2.5 m
- Updates live on timeline and telemetry changes

### Simulated Inference Pipeline
- 5-stage terminal simulation: INGEST → PHYSICS → LOSS CHECK → TENSORRT FP16 → PYSHEDS DAG
- Stage timing matches original terminal.js delays (40 / 110 / 180 / 242 / 300 ms)
- Log text reflects live slider values at trigger time
- Run-ID cancellation token prevents stale callbacks on repeated runs

### Simulated CAP / EOC Alert
- Generates a CAP v1.2-style JSON payload (eventCode: FLW)
- Fields: identifier, sender, sent, status, msgType, scope, category, event,
  urgency, severity, certainty (AI confidence 94.8%), expires (+1 hr), headline,
  description, instruction, area, polygon
- Copy-to-clipboard and simulated satellite dispatch (no real network call)
- Clearly marked "SIMULATED ENVIRONMENT ONLY"

### Sector Selection
- Leaflet affected-area marker click → React sector selection state
- ScenarioControlPanel highlights the selected impact zone
- No legacy SVG overlay

---

## Scenarios

| Basin | Status |
|---|---|
| **Mandakini Basin — Kedarnath** | Full scenario with authoritative data |
| Alaknanda Basin — Badrinath | Placeholder only — no authoritative data available |

The Alaknanda entry exists as a UI structural placeholder. Its hydrograph panel explicitly shows a "DATA UNAVAILABLE" state. No fabricated values are shown.

---

## Running Locally

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:3000/
```

**No API key or environment variable is required** to run the prototype. The `.env.example` file is present but unused — all simulation is client-side only.

```bash
# TypeScript check
npm run lint

# Production build (outputs to dist/)
npm run build
```

---

## Deployment

This is a static client-side application. After `npm run build`, deploy the `dist/` directory to any static host.

**Netlify** (recommended — add `netlify.toml` to project root):

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
```

**Vercel / other static hosts:** set build command to `npm run build` and publish directory to `dist`.

---

## Project Structure

```
src/
├── components/
│   ├── Header.tsx             — Top nav, basin selector, action buttons
│   ├── EmergencyBanner.tsx    — Pinned operational status bar
│   ├── ScenarioControlPanel.tsx — Telemetry sliders, timeline, sector list
│   ├── TacticalMap.tsx        — Leaflet map host + layer/radar wiring
│   ├── HydrographPanel.tsx    — Chart.js flood surge hydrograph
│   ├── PipelineAndTerminal.tsx — Pipeline stage cards + inference terminal
│   └── DeocModal.tsx          — CAP alert modal
│
├── map/
│   ├── MapEngine.ts           — Leaflet singleton (layers, markers, lifecycle)
│   └── RadarSweep.ts          — Canvas radar + Leaflet ImageOverlay
│
├── services/
│   ├── telemetry.ts           — Authoritative rainfall & ETA formulas
│   ├── eoc.ts                 — CAP alert payload generator
│   └── terminal.ts            — Inference pipeline log sequence
│
├── data/
│   ├── scenarios.ts           — Kedarnath scenario data (GeoJSON, telemetry, nodes)
│   └── basins.ts              — UI-facing basin adapter + initial terminal logs
│
├── types/
│   └── telemetry.ts           — Shared TypeScript interfaces
│
├── App.tsx                    — Root state, wiring, layout
├── index.css                  — Tailwind + Leaflet CSS + custom overrides
└── main.tsx                   — React entry point
```

---

## Important Limitations

This prototype **does not** provide:

- Live INSAT-3D / MOSDAC satellite feeds
- Live operational Doppler radar data
- A trained Swin-UNet deep learning model
- Actual TensorRT inference
- Actual PySheds hydrological processing
- Backend, database, or authentication
- Real emergency alert broadcasting
- NDRF / SDRF operational integration
- Public warning capability of any kind

The inference terminal, radar overlay, CAP/EOC dispatch, and telemetry values are **simulated representations** of the intended system architecture, built for demonstration and prototype validation purposes only.

---

## Acknowledgements

Scenario data and system concept based on the Kedarnath 2013 cloudburst event.  
Terrain tiles: [OpenTopoMap](https://opentopomap.org) © OpenTopoMap contributors.  
Original Vanilla JS prototype: `meghdoot-original/`.
