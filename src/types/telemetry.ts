// =============================================================================
// UI-FACING TYPES
// These are used directly by React components. Do NOT remove or rename them
// without updating every component that consumes them.
// =============================================================================

export interface AffectedSector {
  id: string;
  name: string;
  elevation: number; // in meters
  surgeEtaMinutes: number;
  surgeEtaRange?: string;
  surgeDepthMeters: number;
  population: number;
  hazardDescription: string;
  severity: 'CRITICAL' | 'EXTREME' | 'HIGH' | 'MODERATE / HIGH';
  safeZoneName?: string;
  safeZoneElevation?: number;
}

export interface BasinScenario {
  id: string;
  code: string;
  name: string;
  locationName: string;
  lat: number;
  lng: number;
  riskLevel: string;
  elevationHigh: number;
  elevationLow: number;
  corridorName: string;
  incidentRef: string;
  primaryGorge: string;
  estSurgeToGorgeMin: number;
  sectors: AffectedSector[];
  stations: {
    name: string;
    km: number;
    elevation: number;
    surgeDepth: number;
    isCritical?: boolean;
    isWarning?: boolean;
  }[];
  /** True when this basin has no real Meghdoot scenario backing it yet. */
  isPlaceholder?: boolean;
}

export interface AtmosphericTelemetry {
  moistureConvergence: number; // g/kg (10 - 90)
  cttDropRate: number;         // °C/hr absolute magnitude (0 - 30)
  orographicUplift: number;    // m/s (0.5 - 10.0)
  predictedRainfall: number;   // mm/hr — derived; always equals calculatePredictedIntensity() output
}

export interface TerminalLogEntry {
  id: string;
  timestamp: string;
  step: string;
  status: 'OK' | 'RUNNING' | 'CRITICAL' | 'WARN';
  details?: string;
}

export type TimelinePhase = 'T-30m' | 'T-15m' | 'T+0m' | 'T+30m';

export type HazardState = 'NORMAL' | 'WARN' | 'CRITICAL';


// =============================================================================
// SCENARIO DOMAIN TYPES
// These mirror the original meghdoot-original/src/scenarios.js data model.
// Used by src/data/scenarios.ts and eventually by map/chart services.
// =============================================================================

// ─── GeoJSON primitives ──────────────────────────────────────────────────────

/** GeoJSON position: [longitude, latitude] — standard GeoJSON ordering. */
export type GeoPosition = [number, number];

export interface GeoPolygonGeometry {
  type: 'Polygon';
  /** Array of rings; first ring is exterior. Each position is [lng, lat]. */
  coordinates: GeoPosition[][];
}

export interface GeoLineStringGeometry {
  type: 'LineString';
  coordinates: GeoPosition[];
}

export interface GeoPointGeometry {
  type: 'Point';
  coordinates: GeoPosition;
}

export interface GeoFeature<G, P extends object = Record<string, unknown>> {
  type: 'Feature';
  properties: P;
  geometry: G;
}

export interface GeoFeatureCollection<G, P extends object = Record<string, unknown>> {
  type: 'FeatureCollection';
  features: GeoFeature<G, P>[];
}

// ─── Scenario-specific GeoJSON property shapes ───────────────────────────────

export interface CloudburstPolyProps {
  hazard: string;
  rainfall_rate: string;
  severity: 'Extreme' | 'High' | 'Moderate';
}

export interface HydroFlowLineProps {
  name: string;
  type: 'river_surge' | 'river_rising' | 'river_baseline';
  flow_rate: string;
  velocity: string;
  status: string;
}

export interface SafeZoneProps {
  name: string;
  elevation: string;
  capacity: number;
  status: 'SAFE';
}

// ─── Scenario data structures ─────────────────────────────────────────────────

/** Authoritative telemetry inputs from a timeline state.
 *  ctt_drop is stored as a NEGATIVE value (e.g. -16.4).
 *  When passed to calculatePredictedIntensity, use Math.abs(ctt_drop).
 *  predicted_intensity is a reference/narrative value authored in scenarios.js;
 *  it is NOT guaranteed to equal the formula output for that set of inputs.
 *  The live React UI always computes intensity via calculatePredictedIntensity().
 */
export interface TimelineTelemetry {
  ctt_drop: number;              // signed °C/hr (e.g. -16.4)
  moisture_convergence: number;  // g/kg
  uplift_vector: number;         // m/s
  /** Reference/narrative declared intensity — NOT always equal to formula output.
   *  See Step 3 analysis: T-30m declared=42 but formula gives 59.9 mm/hr.
   *  Use calculatePredictedIntensity() for all live calculations. */
  predicted_intensity: number;
  surge_eta_minutes: number;     // reference ETA (same caveat as above)
  inference_latency_ms: number;  // nominal TensorRT FP16 latency for display
}

/** One affected impact zone from the original scenario. */
export interface OriginalAffectedArea {
  id: string;
  name: string;
  elevation: string;       // formatted string, e.g. "3,583 m"
  risk_level: string;
  surge_eta: string;       // formatted string, e.g. "0 - 15 mins"
  pop_at_risk: string;
  est_depth: string;
  hazard_type: string;
  evacuation_route: string;
}

/** River node for the Chart.js hydrograph (from meghdoot-original/src/chart.js). */
export interface RiverNode {
  name: string;   // station label including distance, e.g. "Kedarnath (0 km)"
  dist: number;   // km from Kedarnath
  elev: number;   // elevation in metres ASL
}

/** Bundled GeoJSON layers for a single timeline state. */
export interface ScenarioGeoJSON {
  cloudburst_poly: GeoFeatureCollection<GeoPolygonGeometry, CloudburstPolyProps>;
  hydro_flow_lines: GeoFeatureCollection<GeoLineStringGeometry, HydroFlowLineProps>;
  safe_zones: GeoFeatureCollection<GeoPointGeometry, SafeZoneProps>;
}

/** One discrete timeline state (T-30m, T-15m, T+0m). */
export interface ScenarioTimeline {
  timestamp: string;  // e.g. "T-30m"
  label: string;      // human-readable label
  telemetry: TimelineTelemetry;
  geojson: ScenarioGeoJSON;
}

/** Full Meghdoot scenario — faithful to meghdoot-original/src/scenarios.js. */
export interface MeghdootScenario {
  name: string;
  coordinates: [number, number];  // [lat, lng] — Leaflet ordering for map.setView
  zoom: number;
  description: string;
  telemetry: TimelineTelemetry;   // default / peak state telemetry
  affected_areas: OriginalAffectedArea[];
  geojson: ScenarioGeoJSON;       // default / peak state GeoJSON (same as T+0m)
  timeline: {
    'T-30m': ScenarioTimeline;
    'T-15m': ScenarioTimeline;
    'T+0m': ScenarioTimeline;
  };
  /** River nodes for the Chart.js hydrograph.
   *  From meghdoot-original/src/chart.js riverNodes array. */
  river_nodes: RiverNode[];
}

/** Top-level scenarios registry. */
export interface ScenariosRegistry {
  kedarnath_cloudburst: MeghdootScenario;
}
