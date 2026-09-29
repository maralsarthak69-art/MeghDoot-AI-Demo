/**
 * Meghdoot AI — MapEngine
 *
 * Imperative Leaflet map service.
 * Faithful TypeScript port of meghdoot-original/src/map.js.
 *
 * Owns:
 *   - Leaflet map instance
 *   - OpenTopoMap tile layer
 *   - cloudburst polygon layer
 *   - hydro-flow LineString layer
 *   - safe-zone circleMarker layer
 *   - affected-area circleMarker group
 *
 * Does NOT own:
 *   - radar canvas / imageOverlay  (Step 7)
 *   - React state
 *   - DOM outside the container div passed to init()
 *
 * Coordinate convention:
 *   - GeoJSON coordinates stay as [lng, lat] — L.geoJSON() converts automatically.
 *   - L.circleMarker() / map.setView() / L.latLng() use [lat, lng].
 *   - KEDARNATH_AREA_COORDS is already [lat, lng] — use directly.
 */

import L from 'leaflet';
import { scenarios, KEDARNATH_AREA_COORDS } from '../data/scenarios';
import type { MeghdootScenario, ScenarioGeoJSON } from '../types/telemetry';

// ── Layer key type (exposed for TacticalMap layer toggle wiring) ─────────────
export type LayerKey = 'cloudburstZone' | 'riverSurge' | 'safeZones' | 'affectedAreas';

// ── Valid timeline keys that have real GeoJSON ───────────────────────────────
type ValidTimelineKey = 'T-30m' | 'T-15m' | 'T+0m';

// ── MapEngine class ──────────────────────────────────────────────────────────

class MapEngine {
  private map:              L.Map | null       = null;
  private tileLayer:        L.TileLayer | null = null;
  private cloudburstLayer:  L.GeoJSON | null   = null;
  private hydroLayer:       L.GeoJSON | null   = null;
  private shelterLayer:     L.GeoJSON | null   = null;
  private areaMarkersGroup: L.LayerGroup | null = null;
  private onAffectedAreaSelect: ((areaId: string) => void) | null = null;

  // Track which layers are currently visible so setLayerVisible can be
  // called before or after a renderLayers() call and remain consistent.
  private layerVisible: Record<LayerKey, boolean> = {
    cloudburstZone: true,
    riverSurge:     true,
    safeZones:      true,
    affectedAreas:  true,
  };

  // The last valid scenario GeoJSON rendered (used to keep T+30m from blanking the map)
  private lastValidGeoJSON: ScenarioGeoJSON | null = null;

  // ── Public: initialise ─────────────────────────────────────────────────────

  /**
   * Mount the Leaflet map on `container`.
   * Idempotent: safe to call more than once (guards React StrictMode double-mount).
   * Must be called with a container that already has pixel dimensions.
   */
  init(container: HTMLDivElement, scenario: MeghdootScenario): void {
    if (this.map !== null) return; // already initialised

    this.map = L.map(container, {
      zoomControl: false,  // React UI provides custom zoom buttons
    }).setView(
      scenario.coordinates as L.LatLngExpression,
      scenario.zoom,
    );

    // OpenTopoMap — high-contrast mountain terrain tiles (from map.js)
    this.tileLayer = L.tileLayer(
      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 17,
        attribution: '© OpenTopoMap',
      },
    ).addTo(this.map);
  }

  // ── Public: render / update scenario layers ────────────────────────────────

  /**
   * Replace all scenario layers with those for the given timeline phase.
   * T+30m has no GeoJSON in scenarios.ts — keep the most recent valid layers.
   */
  renderLayers(stateKey: string): void {
    if (!this.map) return;

    const sc = scenarios.kedarnath_cloudburst;

    // Resolve GeoJSON for this phase, falling back to peak T+0m default
    let geojson: ScenarioGeoJSON;
    if (stateKey === 'T-30m' || stateKey === 'T-15m' || stateKey === 'T+0m') {
      geojson = sc.timeline[stateKey as ValidTimelineKey].geojson;
      this.lastValidGeoJSON = geojson;
    } else {
      // T+30m or unknown: keep last valid layers rather than blanking the map
      if (!this.lastValidGeoJSON) return;
      geojson = this.lastValidGeoJSON;
    }

    // ── Remove existing layers ─────────────────────────────────────────────
    if (this.cloudburstLayer) {
      this.map.removeLayer(this.cloudburstLayer);
      this.cloudburstLayer = null;
    }
    if (this.hydroLayer) {
      this.map.removeLayer(this.hydroLayer);
      this.hydroLayer = null;
    }
    if (this.shelterLayer) {
      this.map.removeLayer(this.shelterLayer);
      this.shelterLayer = null;
    }
    if (this.areaMarkersGroup) {
      this.map.removeLayer(this.areaMarkersGroup);
      this.areaMarkersGroup = null;
    }

    // ── 1. Cloudburst polygon ──────────────────────────────────────────────
    this.cloudburstLayer = L.geoJSON(
      geojson.cloudburst_poly as GeoJSON.GeoJsonObject,
      {
        style: (feature) => {
          const isExtreme = feature?.properties?.severity === 'Extreme';
          return {
            color:       isExtreme ? '#ef4444' : '#f97316',
            fillColor:   isExtreme ? '#ef4444' : '#f97316',
            fillOpacity: isExtreme ? 0.45 : 0.25,
            weight:      isExtreme ? 2 : 1.5,
            ...(isExtreme ? {} : { dashArray: '4, 4' }),
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties ?? {};
          layer.bindPopup(`
            <div class="p-1.5 font-sans min-w-[200px]">
              <div class="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">${p.hazard ?? ''}</div>
              <div class="text-sm font-bold text-white mb-1">Precipitation Rate: ${p.rainfall_rate ?? ''}</div>
              <div class="text-xs text-slate-300 leading-relaxed">Convective cell intensity verified via MOSDAC radar &amp; INSAT-3D TIR-1.</div>
            </div>
          `);
        },
      },
    );
    if (this.layerVisible.cloudburstZone) this.cloudburstLayer.addTo(this.map);

    // ── 2. Mandakini hydro-flow path ───────────────────────────────────────
    this.hydroLayer = L.geoJSON(
      geojson.hydro_flow_lines as GeoJSON.GeoJsonObject,
      {
        style: (feature) => {
          const isSurge = feature?.properties?.type === 'river_surge';
          return {
            color:     isSurge ? '#38bdf8' : '#0284c7',
            weight:    isSurge ? 5 : 3.5,
            opacity:   0.95,
            className: 'animated-flow',
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties ?? {};
          layer.bindPopup(`
            <div class="p-1.5 font-sans min-w-[220px]">
              <div class="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">${p.name ?? ''}</div>
              <div class="text-sm font-bold text-white mb-1">Status: ${p.status ?? ''}</div>
              <div class="text-xs text-slate-200 mt-1">Discharge Flow Rate: <b class="text-sky-300">${p.flow_rate ?? ''}</b></div>
              <div class="text-xs text-slate-200 mt-0.5">Surface Flow Velocity: <b class="text-teal-300">${p.velocity ?? ''}</b></div>
            </div>
          `);
        },
      },
    );
    if (this.layerVisible.riverSurge) this.hydroLayer.addTo(this.map);

    // ── 3. Safe-zone shelter markers ───────────────────────────────────────
    this.shelterLayer = L.geoJSON(
      geojson.safe_zones as GeoJSON.GeoJsonObject,
      {
        pointToLayer: (feature, latlng) => {
          const p = feature.properties ?? {};
          return L.circleMarker(latlng, {
            radius:      8,
            fillColor:   '#10b981',
            color:       '#ffffff',
            weight:      2,
            fillOpacity: 0.95,
          }).bindPopup(`
            <div class="p-1.5 font-sans min-w-[200px]">
              <div class="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">${p.name ?? ''}</div>
              <div class="text-sm font-bold text-white mb-1">Safe Elevation: ${p.elevation ?? ''}</div>
              <div class="text-xs text-slate-200">Shelter Capacity: <b class="text-emerald-300">${p.capacity ?? ''} persons</b></div>
            </div>
          `);
        },
      },
    );
    if (this.layerVisible.safeZones) this.shelterLayer.addTo(this.map);

    // ── 4. Affected-area node markers ──────────────────────────────────────
    this.areaMarkersGroup = L.layerGroup();

    sc.affected_areas.forEach((zone) => {
      const coords = KEDARNATH_AREA_COORDS[zone.id]; // [lat, lng]
      if (!coords) return;

      const isCriticalOrExtreme =
        zone.risk_level.includes('CRITICAL') || zone.risk_level.includes('EXTREME');

      const marker = L.circleMarker(coords as L.LatLngExpression, {
        radius:      7.5,
        fillColor:   isCriticalOrExtreme ? '#ef4444' : '#f97316',
        color:       '#ffffff',
        weight:      1.5,
        fillOpacity: 0.95,
      }).bindPopup(`
        <div class="p-1.5 font-sans max-w-xs min-w-[240px]">
          <div class="text-xs font-bold text-red-400 uppercase tracking-wider mb-0.5">${zone.risk_level} IMPACT ZONE</div>
          <div class="text-sm font-bold text-white mb-2 leading-tight">${zone.name}</div>
          <div class="text-xs text-slate-200 space-y-1 mb-2">
            <div><b>Elevation:</b> <span class="text-slate-100">${zone.elevation}</span></div>
            <div><b>Surge ETA:</b> <span class="text-sky-300 font-bold">${zone.surge_eta}</span></div>
            <div><b>Est. Flood Depth:</b> <span class="text-amber-300 font-bold">${zone.est_depth}</span></div>
            <div><b>At-Risk Population:</b> <span class="text-slate-100">${zone.pop_at_risk}</span></div>
          </div>
          <div class="text-[11px] text-amber-200 bg-slate-900/90 p-2 rounded border border-slate-700/80 leading-relaxed">
            <span class="text-red-400 font-bold">Evacuation:</span> ${zone.evacuation_route}
          </div>
        </div>
      `);

      marker.on('click', () => this.onAffectedAreaSelect?.(zone.id));

      this.areaMarkersGroup!.addLayer(marker);
    });

    if (this.layerVisible.affectedAreas) this.areaMarkersGroup.addTo(this.map);
  }

  // ── Public: layer visibility toggle ───────────────────────────────────────

  /**
   * Show or hide a named scenario layer.
   * Persists the requested state even if the layer is null (applied on next renderLayers).
   */
  setLayerVisible(layer: LayerKey, visible: boolean): void {
    this.layerVisible[layer] = visible;
    if (!this.map) return;

    const target = this.getLayerByKey(layer);
    if (!target) return;

    if (visible) {
      if (!this.map.hasLayer(target)) target.addTo(this.map);
    } else {
      if (this.map.hasLayer(target)) this.map.removeLayer(target);
    }
  }

  // ── Public: navigation ─────────────────────────────────────────────────────

  zoomIn(): void {
    this.map?.zoomIn();
  }

  zoomOut(): void {
    this.map?.zoomOut();
  }

  /**
   * Restore map center and zoom to the current scenario defaults.
   * Does NOT recreate the map.
   */
  recenter(): void {
    if (!this.map) return;
    const sc = scenarios.kedarnath_cloudburst;
    this.map.setView(
      sc.coordinates as L.LatLngExpression,
      sc.zoom,
    );
  }

  // ── Public: resize ─────────────────────────────────────────────────────────

  /**
   * Notify Leaflet that the container has been resized.
   * Must be called from a ResizeObserver in TacticalMap.tsx.
   */
  invalidateSize(): void {
    this.map?.invalidateSize();
  }

  // ── Public: radar access (Step 7) ─────────────────────────────────────────

  /**
   * Expose the raw Leaflet map reference for the radar service (Step 7).
   * Returns null if not yet initialised.
   */
  getMap(): L.Map | null {
    return this.map;
  }

  /**
   * Connect Leaflet affected-area marker clicks to React sector selection.
   * The map retains geographic rendering; the component owns application state.
   */
  setAffectedAreaSelectHandler(handler: ((areaId: string) => void) | null): void {
    this.onAffectedAreaSelect = handler;
  }

  // ── Public: teardown ───────────────────────────────────────────────────────

  /**
   * Remove the Leaflet map and all layers. Null out all references.
   * Called from React useEffect cleanup — safe to call on an already-destroyed engine.
   */
  destroy(): void {
    if (!this.map) return;

    // Remove each layer if it exists
    [
      this.cloudburstLayer,
      this.hydroLayer,
      this.shelterLayer,
      this.areaMarkersGroup,
      this.tileLayer,
    ].forEach((layer) => {
      if (layer && this.map?.hasLayer(layer)) {
        this.map.removeLayer(layer);
      }
    });

    this.map.remove(); // removes Leaflet DOM and event listeners
    this.map              = null;
    this.tileLayer        = null;
    this.cloudburstLayer  = null;
    this.hydroLayer       = null;
    this.shelterLayer     = null;
    this.areaMarkersGroup = null;
    this.lastValidGeoJSON = null;
    this.onAffectedAreaSelect = null;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private getLayerByKey(key: LayerKey): L.Layer | null {
    switch (key) {
      case 'cloudburstZone': return this.cloudburstLayer;
      case 'riverSurge':     return this.hydroLayer;
      case 'safeZones':      return this.shelterLayer;
      case 'affectedAreas':  return this.areaMarkersGroup;
      default:               return null;
    }
  }
}

// ── Singleton export ─────────────────────────────────────────────────────────
// A single instance is shared across the React component tree.
// TacticalMap.tsx calls mapEngine.init() on mount and mapEngine.destroy() on unmount.
export const mapEngine = new MapEngine();
