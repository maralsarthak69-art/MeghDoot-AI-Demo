/**
 * Meghdoot AI — UI-facing basin data adapter
 *
 * Derives the component-facing BasinScenario objects from the authoritative
 * scenario data in scenarios.ts.
 *
 * The Kedarnath entry is built from meghdoot-original/src/scenarios.js values.
 * The Alaknanda entry has NO original Meghdoot backing data and is marked
 * isPlaceholder: true. It must NOT be treated as real scenario data.
 *
 * INITIAL_TERMINAL_LOGS lives here because it is UI initialisation state, not
 * scenario domain data.
 */

import { BasinScenario, TerminalLogEntry } from '../types/telemetry';
import { scenarios } from './scenarios';

// ─── Kedarnath basin (derived from authoritative scenario) ───────────────────

const k = scenarios.kedarnath_cloudburst;

const kedarnathBasin: BasinScenario = {
  id:           'mandakini-kedarnath',
  code:         'BASIN-ID #04-MND',
  name:         'Mandakini Basin',
  locationName: 'Kedarnath, Uttarakhand',
  // Real coordinates from scenarios.js — [lat, lng]
  lat:          k.coordinates[0],  // 30.7346
  lng:          k.coordinates[1],  // 79.0669
  riskLevel:    'HIGH OROGRAPHIC RISK',
  // Elevation range from river nodes in scenarios.ts
  elevationHigh: 3583,  // Kedarnath (node 0)
  elevationLow:  1820,  // Sonprayag  (node 6)
  corridorName:  'MANDAKINI HYDROMET CORRIDOR (KEDARNATH SECTOR)',
  incidentRef:   'CAP-UK-MND-0914',
  primaryGorge:  'RAMBARA',
  // estSurgeToGorgeMin: from scenario T+0m reference ETA
  estSurgeToGorgeMin: k.telemetry.surge_eta_minutes, // 38 min (reference)

  // Affected sectors — mapped from original affected_areas with numeric fields
  // for component rendering. Pop counts and depths from original scenarios.js.
  sectors: [
    {
      id:               'zone-1',
      name:             k.affected_areas[0].name,
      elevation:        3583,
      surgeEtaMinutes:  15,
      surgeEtaRange:    k.affected_areas[0].surge_eta,     // '0 - 15 mins'
      surgeDepthMeters: 4.2,
      population:       1450,
      hazardDescription: k.affected_areas[0].hazard_type,
      severity:         'CRITICAL',
      safeZoneName:     'Zone-A Helipad Ridge',
      safeZoneElevation: 3631,
    },
    {
      id:               'zone-2',
      name:             k.affected_areas[1].name,
      elevation:        2740,
      surgeEtaMinutes:  30,
      surgeEtaRange:    k.affected_areas[1].surge_eta,     // '22 - 30 mins'
      surgeDepthMeters: 5.0,
      population:       850,
      hazardDescription: k.affected_areas[1].hazard_type,
      severity:         'EXTREME',
      safeZoneName:     'Eastern Valley Slope (>2,800m)',
      safeZoneElevation: 2800,
    },
    {
      id:               'zone-3',
      name:             k.affected_areas[2].name,
      elevation:        1980,
      surgeEtaMinutes:  45,
      surgeEtaRange:    k.affected_areas[2].surge_eta,     // '38 - 45 mins'
      surgeDepthMeters: 3.2,
      population:       2100,
      hazardDescription: k.affected_areas[2].hazard_type,
      severity:         'HIGH',
      safeZoneName:     'Sonprayag Upper Road Bypass',
      safeZoneElevation: 2000,
    },
    {
      id:               'zone-4',
      name:             k.affected_areas[3].name,
      elevation:        1820,
      surgeEtaMinutes:  65,
      surgeEtaRange:    k.affected_areas[3].surge_eta,     // '52 - 65 mins'
      surgeDepthMeters: 2.4,
      population:       1200,
      hazardDescription: k.affected_areas[3].hazard_type,
      severity:         'MODERATE / HIGH',
      safeZoneName:     'Northern Highway Embankment',
      safeZoneElevation: 1840,
    },
  ],

  // River stations for the hydrograph x-axis — derived from scenarios.ts river_nodes
  stations: k.river_nodes.map((node, i) => ({
    name:       node.name.split(' (')[0],  // strip "(X km)" from label
    km:         node.dist,
    elevation:  node.elev,
    // Surge depths from chart.js initialDepths array (T+0m peak state)
    surgeDepth: [3.8, 4.2, 4.8, 4.5, 3.2, 2.4, 1.8][i] ?? 0,
    isCritical: [0, 4].includes(i),   // Kedarnath (0) and Rambara Camp (4)
    isWarning:  i === 5,              // Gaurikund Base
  })),
};

// ─── Alaknanda basin — PLACEHOLDER ONLY ──────────────────────────────────────
// This basin has NO counterpart in meghdoot-original/src/scenarios.js.
// All values below are placeholder/demo data from the original AI Studio
// generation and must NOT be treated as authoritative Meghdoot scenario data.
// It will be either removed or replaced with real scenario data in a future step.
const alaknandaPlaceholder: BasinScenario = {
  id:            'alaknanda-badrinath',
  code:          'BASIN-ID #07-ALK',
  name:          'Alaknanda Basin',
  locationName:  'Badrinath & Mana, Chamoli',
  lat:           30.7433,
  lng:           79.4938,
  riskLevel:     'VERY HIGH GLACIAL OUTBURST',
  elevationHigh: 3300,
  elevationLow:  1470,
  corridorName:  'ALAKNANDA HYDROMET CORRIDOR (CHAMOLI SECTOR) [PLACEHOLDER]',
  incidentRef:   'CAP-UK-ALK-PLACEHOLDER',
  primaryGorge:  'JOSHIMATH GORGE',
  estSurgeToGorgeMin: 34,
  isPlaceholder: true,  // ← signals this basin has no original scenario backing
  sectors: [
    {
      id: 'sec-badrinath',
      name: 'Badrinath Temple Valley [PLACEHOLDER]',
      elevation: 3300,
      surgeEtaMinutes: 15,
      surgeEtaRange: '0–15 min',
      surgeDepthMeters: 3.2,
      population: 2100,
      hazardDescription: 'Glacial Melt & Moraine Runoff [PLACEHOLDER DATA]',
      severity: 'CRITICAL',
      safeZoneName: 'Narayan Parvat Ridge',
      safeZoneElevation: 3450,
    },
    {
      id: 'sec-pandukeshwar',
      name: 'Pandukeshwar Valley Choke [PLACEHOLDER]',
      elevation: 1829,
      surgeEtaMinutes: 28,
      surgeEtaRange: '28 min',
      surgeDepthMeters: 3.9,
      population: 850,
      hazardDescription: 'Steep Gorge Erosion & Silt Damming [PLACEHOLDER DATA]',
      severity: 'EXTREME',
      safeZoneName: 'Govindghat High Terraces',
      safeZoneElevation: 1950,
    },
    {
      id: 'sec-joshimath',
      name: 'Vishnuprayag Confluence Base [PLACEHOLDER]',
      elevation: 1470,
      surgeEtaMinutes: 44,
      surgeEtaRange: '44 min',
      surgeDepthMeters: 2.7,
      population: 1900,
      hazardDescription: 'Alaknanda-Dhauliganga Turbid Surge [PLACEHOLDER DATA]',
      severity: 'HIGH',
      safeZoneName: 'Joshimath Cantt High Shelf',
      safeZoneElevation: 1890,
    },
  ],
  stations: [
    { name: 'Badrinath',    km: 0,  elevation: 3300, surgeDepth: 3.2, isCritical: true },
    { name: 'Hanuman Chatti', km: 9, elevation: 2560, surgeDepth: 3.6 },
    { name: 'Pandukeshwar', km: 18, elevation: 1829, surgeDepth: 3.9, isCritical: true },
    { name: 'Govindghat',   km: 24, elevation: 1750, surgeDepth: 3.1 },
    { name: 'Vishnuprayag', km: 36, elevation: 1470, surgeDepth: 2.7, isWarning: true },
  ],
};

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Active basins list consumed by App.tsx and Header basin selector.
 * Kedarnath is the only basin backed by real Meghdoot scenario data.
 * Alaknanda is a placeholder retained for UI structure only.
 */
export const BASINS_DATA: BasinScenario[] = [
  kedarnathBasin,
  alaknandaPlaceholder,
];

/**
 * Initial terminal log state for the Diagnostic Inference Terminal.
 * These are UI initialisation values, not scenario data.
 * Text matches the original meghdoot-original/src/terminal.js log format
 * so the terminal is consistent before and after the first inference run.
 * Values reflect the T+0m peak scenario telemetry (uplift=5.2, CTT=-16.4,
 * intensity=118 mm/hr reference, surge ETA=38 min reference).
 */
export const INITIAL_TERMINAL_LOGS: TerminalLogEntry[] = [
  { id: '1', timestamp: '19:24:10', step: '[INGEST] Pulling INSAT-3D TIR-1 & WV bands (MOSDAC 0.04° grid)...', status: 'OK' },
  { id: '2', timestamp: '19:24:10', step: '[PHYSICS] Orographic uplift v·∇z = 5.2 m/s | CTT Drop = -16.4°C/hr', status: 'OK' },
  { id: '3', timestamp: '19:24:10', step: '[LOSS CHECK] Moisture divergence ∇·(vq) constraint satisfied (Residual < 0.004)', status: 'OK' },
  { id: '4', timestamp: '19:24:11', step: '[TENSORRT FP16] Swin-UNet Forward Pass finished in 238 ms', status: 'OK' },
  { id: '5', timestamp: '19:24:11', step: '[PYSHEDS DAG] Routing 118 mm/hr into Mandakini drainage basin... Surge ETA: 38 min', status: 'CRITICAL', details: '38 MIN' },
];
