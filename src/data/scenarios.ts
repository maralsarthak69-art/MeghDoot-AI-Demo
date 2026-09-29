/**
 * Meghdoot AI — Authoritative Scenario Data
 *
 * Faithful TypeScript port of meghdoot-original/src/scenarios.js
 * Do NOT edit values here without cross-referencing the original source file.
 *
 * Coordinate ordering in GeoJSON features is [longitude, latitude] per the
 * GeoJSON spec. Leaflet uses [latitude, longitude] — the conversion happens
 * in the map service (Step 6), NOT here.
 *
 * The `coordinates` field at the top of each scenario uses [lat, lng] ordering
 * because it is passed directly to Leaflet's map.setView(), matching the
 * original map.js usage.
 */

import type {
  MeghdootScenario,
  ScenariosRegistry,
  RiverNode,
} from '../types/telemetry';

// ─── River nodes (from meghdoot-original/src/chart.js) ───────────────────────
// These are the seven stations used by the Chart.js hydrograph.
// Preserved exactly from the `riverNodes` array in chart.js.
export const MANDAKINI_RIVER_NODES: RiverNode[] = [
  { name: 'Kedarnath (0 km)',         dist: 0,    elev: 3583 },
  { name: 'Devdarshan (2.2 km)',      dist: 2.2,  elev: 3320 },
  { name: 'Chhoti Lincholi (5.5 km)', dist: 5.5,  elev: 2980 },
  { name: 'Badi Lincholi (7.2 km)',   dist: 7.2,  elev: 2740 },
  { name: 'Rambara Camp (9.8 km)',    dist: 9.8,  elev: 2250 },
  { name: 'Gaurikund Base (14.1 km)', dist: 14.1, elev: 1980 },
  { name: 'Sonprayag (17.5 km)',      dist: 17.5, elev: 1820 },
];

// ─── Kedarnath Cloudburst scenario ────────────────────────────────────────────

const kedarnath_cloudburst: MeghdootScenario = {
  name: 'Mandakini Basin, Kedarnath (Uttarakhand)',
  // [lat, lng] — Leaflet ordering for map.setView(); matches map.js usage
  coordinates: [30.7346, 79.0669],
  zoom: 14,
  description:
    'Severe convective cloudburst over Chorabari Glacier catchment triggering catastrophic flash flood down the Mandakini River valley.',

  // Default / peak-state telemetry (same as T+0m)
  // ctt_drop is stored SIGNED (negative). Pass Math.abs(ctt_drop) to
  // calculatePredictedIntensity(). predicted_intensity is a reference value
  // authored in scenarios.js — it is NOT the formula output.
  telemetry: {
    ctt_drop:             -16.4,
    moisture_convergence:  72.8,
    uplift_vector:          5.2,
    predicted_intensity:  118,    // reference/narrative value; formula gives 117.9
    surge_eta_minutes:     38,
    inference_latency_ms: 238,
  },

  affected_areas: [
    {
      id: 'zone-1',
      name: 'Kedarnath Temple Complex & Valley Floor',
      elevation: '3,583 m',
      risk_level: 'CRITICAL / SEVERE',
      surge_eta: '0 - 15 mins',
      pop_at_risk: '1,450 pilgrims & staff',
      est_depth: '2.8 - 4.2 meters',
      hazard_type: 'Glacial Lake Outburst & Hyper-Concentrated Debris Flow',
      evacuation_route: 'Move immediately to Zone-A Helipad (+48m high-ground ridge)',
    },
    {
      id: 'zone-2',
      name: 'Rambara & Lincholi Transit Camps',
      elevation: '2,740 m',
      risk_level: 'EXTREME',
      surge_eta: '22 - 30 mins',
      pop_at_risk: '850 transit pilgrims',
      est_depth: '3.5 - 5.0 meters',
      hazard_type: 'High-Velocity Riverbank Erosion & Torrent Surge',
      evacuation_route: 'Climb eastern valley slope trails above 2,800m contour line',
    },
    {
      id: 'zone-3',
      name: 'Gaurikund Pilgrim Base & Hot Springs',
      elevation: '1,980 m',
      risk_level: 'HIGH',
      surge_eta: '38 - 45 mins',
      pop_at_risk: '2,100 residents & pilgrims',
      est_depth: '2.1 - 3.2 meters',
      hazard_type: 'Mandakini Main Channel Overflow & Bridge Collapse Risk',
      evacuation_route: 'Evacuate parking plaza toward Sonprayag upper road bypass',
    },
    {
      id: 'zone-4',
      name: 'Sonprayag River Confluence Zone',
      elevation: '1,820 m',
      risk_level: 'MODERATE / HIGH',
      surge_eta: '52 - 65 mins',
      pop_at_risk: '1,200 downstream valley residents',
      est_depth: '1.5 - 2.4 meters',
      hazard_type: 'Debris Bottleneck & Mandakini-Vasuki Ganga Backwater Surge',
      evacuation_route: 'Ascend northern highway embankment to safety station',
    },
  ],

  // Default / peak-state GeoJSON (identical to timeline['T+0m'].geojson)
  geojson: {
    cloudburst_poly: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            hazard: 'Primary Cloudburst Core',
            rainfall_rate: '118 mm/hr',
            severity: 'Extreme',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [79.055, 30.752],
              [79.078, 30.750],
              [79.082, 30.728],
              [79.058, 30.722],
              [79.055, 30.752],
            ]],
          },
        },
      ],
    },

    hydro_flow_lines: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            name: 'Mandakini Torrent River Path',
            type: 'river_surge',
            flow_rate: '520 m³/s',
            velocity: '8.4 m/s',
            status: 'CATASTROPHIC SURGE',
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [79.0620, 30.7485], // 1. Chorabari Glacial Lake Outflow
              [79.0632, 30.7420], // 2. Upper Valley Trough
              [79.0655, 30.7380], // 3. Kedarnath North Entrance
              [79.0665, 30.7346], // 4. Kedarnath Temple East Riverbed
              [79.0668, 30.7280], // 5. Passing 3460m contour spur
              [79.0652, 30.7220], // 6. Valley Trough Bend
              [79.0615, 30.7140], // 7. Devdarshan Gorge Curve
              [79.0520, 30.7020], // 8. Upper Lincholi Gorge
              [79.0440, 30.6880], // 9. Chhoti Lincholi
              [79.0380, 30.6780], // 10. Badi Lincholi
              [79.0320, 30.6620], // 11. Rambara
              [79.0270, 30.6520], // 12. Jungle Chatti
              [79.0230, 30.6440], // 13. Gaurikund Base
              [79.0150, 30.6300], // 14. Sonprayag Confluence
            ],
          },
        },
      ],
    },

    safe_zones: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            name: 'Zone-A Helipad Ridge Shelter',
            elevation: '+48m high-ground',
            capacity: 1200,
            status: 'SAFE',
          },
          geometry: {
            type: 'Point',
            coordinates: [79.0720, 30.7380],
          },
        },
        {
          type: 'Feature',
          properties: {
            name: 'Bhim Shila Elevated Bedrock',
            elevation: '+12m elevated bedrock',
            capacity: 350,
            status: 'SAFE',
          },
          geometry: {
            type: 'Point',
            coordinates: [79.0670, 30.7358],
          },
        },
      ],
    },
  },

  // ── Per-timeline GeoJSON and telemetry (T-30m, T-15m, T+0m) ───────────────
  timeline: {
    'T-30m': {
      timestamp: 'T-30m',
      label: 'T-30m: Convective Initiation',
      telemetry: {
        ctt_drop:             -6.2,
        moisture_convergence:  38.4,
        uplift_vector:          2.1,
        predicted_intensity:   42,   // reference value; formula gives 59.9
        surge_eta_minutes:     68,   // reference value; formula gives 50
        inference_latency_ms: 215,
      },
      geojson: {
        cloudburst_poly: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                hazard: 'Developing Convective Cluster',
                rainfall_rate: '42 mm/hr',
                severity: 'Moderate',
              },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [79.058, 30.748],
                  [79.072, 30.746],
                  [79.076, 30.732],
                  [79.062, 30.728],
                  [79.058, 30.748],
                ]],
              },
            },
          ],
        },
        hydro_flow_lines: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                name: 'Mandakini Torrent River Path',
                type: 'river_baseline',
                flow_rate: '85 m³/s',
                velocity: '2.4 m/s',
                status: 'NORMAL',
              },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [79.0620, 30.7485],
                  [79.0632, 30.7420],
                  [79.0655, 30.7380],
                  [79.0665, 30.7346],
                  [79.0668, 30.7280],
                  [79.0652, 30.7220],
                  [79.0615, 30.7140],
                  [79.0520, 30.7020],
                  [79.0440, 30.6880],
                  [79.0380, 30.6780],
                  [79.0320, 30.6620],
                  [79.0270, 30.6520],
                  [79.0230, 30.6440],
                  [79.0150, 30.6300],
                ],
              },
            },
          ],
        },
        safe_zones: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                name: 'Zone-A Helipad Ridge Shelter',
                elevation: '+48m high-ground',
                capacity: 1200,
                status: 'SAFE',
              },
              geometry: {
                type: 'Point',
                coordinates: [79.0720, 30.7380],
              },
            },
          ],
        },
      },
    },

    'T-15m': {
      timestamp: 'T-15m',
      label: 'T-15m: Rapid Convective Surge',
      telemetry: {
        ctt_drop:             -12.1,
        moisture_convergence:   58.2,
        uplift_vector:           3.8,
        predicted_intensity:    85,  // reference value; formula gives 93.1
        surge_eta_minutes:      53,  // reference value; formula gives 43
        inference_latency_ms:  224,
      },
      geojson: {
        cloudburst_poly: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                hazard: 'Intense Convective Thunderstorm',
                rainfall_rate: '85 mm/hr',
                severity: 'High',
              },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [79.056, 30.750],
                  [79.075, 30.748],
                  [79.079, 30.730],
                  [79.060, 30.725],
                  [79.056, 30.750],
                ]],
              },
            },
          ],
        },
        hydro_flow_lines: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                name: 'Mandakini Torrent River Path',
                type: 'river_rising',
                flow_rate: '240 m³/s',
                velocity: '5.1 m/s',
                status: 'RISING RAPIDLY',
              },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [79.0620, 30.7485],
                  [79.0632, 30.7420],
                  [79.0655, 30.7380],
                  [79.0665, 30.7346],
                  [79.0668, 30.7280],
                  [79.0652, 30.7220],
                  [79.0615, 30.7140],
                  [79.0520, 30.7020],
                  [79.0440, 30.6880],
                  [79.0380, 30.6780],
                  [79.0320, 30.6620],
                  [79.0270, 30.6520],
                  [79.0230, 30.6440],
                  [79.0150, 30.6300],
                ],
              },
            },
          ],
        },
        safe_zones: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                name: 'Zone-A Helipad Ridge Shelter',
                elevation: '+48m high-ground',
                capacity: 1200,
                status: 'SAFE',
              },
              geometry: {
                type: 'Point',
                coordinates: [79.0720, 30.7380],
              },
            },
          ],
        },
      },
    },

    'T+0m': {
      timestamp: 'T+0m',
      label: 'T+0m: Peak Cloudburst Impact',
      telemetry: {
        ctt_drop:             -16.4,
        moisture_convergence:  72.8,
        uplift_vector:          5.2,
        predicted_intensity:  118,   // reference value; formula gives 117.9
        surge_eta_minutes:     38,
        inference_latency_ms: 238,
      },
      geojson: {
        cloudburst_poly: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                hazard: 'Primary Cloudburst Core',
                rainfall_rate: '118 mm/hr',
                severity: 'Extreme',
              },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [79.055, 30.752],
                  [79.078, 30.750],
                  [79.082, 30.728],
                  [79.058, 30.722],
                  [79.055, 30.752],
                ]],
              },
            },
          ],
        },
        hydro_flow_lines: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                name: 'Mandakini Torrent River Path',
                type: 'river_surge',
                flow_rate: '520 m³/s',
                velocity: '8.4 m/s',
                status: 'CATASTROPHIC SURGE',
              },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [79.0620, 30.7485],
                  [79.0632, 30.7420],
                  [79.0655, 30.7380],
                  [79.0665, 30.7346],
                  [79.0668, 30.7280],
                  [79.0652, 30.7220],
                  [79.0615, 30.7140],
                  [79.0520, 30.7020],
                  [79.0440, 30.6880],
                  [79.0380, 30.6780],
                  [79.0320, 30.6620],
                  [79.0270, 30.6520],
                  [79.0230, 30.6440],
                  [79.0150, 30.6300],
                ],
              },
            },
          ],
        },
        safe_zones: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                name: 'Zone-A Helipad Ridge Shelter',
                elevation: '+48m high-ground',
                capacity: 1200,
                status: 'SAFE',
              },
              geometry: {
                type: 'Point',
                coordinates: [79.0720, 30.7380],
              },
            },
            {
              type: 'Feature',
              properties: {
                name: 'Bhim Shila Elevated Bedrock',
                elevation: '+12m elevated bedrock',
                capacity: 350,
                status: 'SAFE',
              },
              geometry: {
                type: 'Point',
                coordinates: [79.0670, 30.7358],
              },
            },
          ],
        },
      },
    },
  },

  // River nodes for Chart.js hydrograph (from meghdoot-original/src/chart.js)
  river_nodes: MANDAKINI_RIVER_NODES,
};

// ─── Affected area marker coordinates ────────────────────────────────────────
// Real lat/lng from map.js areaCoords. Used by Leaflet marker placement (Step 6).
// Keys match affected_areas[].id values above.
export const KEDARNATH_AREA_COORDS: Record<string, [number, number]> = {
  'zone-1': [30.7346, 79.0665], // Kedarnath Temple East Riverbed
  'zone-2': [30.6620, 79.0320], // Rambara
  'zone-3': [30.6440, 79.0230], // Gaurikund Base
  'zone-4': [30.6300, 79.0150], // Sonprayag Confluence
};

// ─── Scenarios registry (matches meghdoot-original/src/scenarios.js export) ──
export const scenarios: ScenariosRegistry = {
  kedarnath_cloudburst,
};
