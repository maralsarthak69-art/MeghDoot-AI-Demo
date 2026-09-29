import React, { useState, useRef, useEffect } from 'react';
import { BasinScenario, AffectedSector, TimelinePhase } from '../types/telemetry';
import { mapEngine, LayerKey } from '../map/MapEngine';
import { RadarSweep } from '../map/RadarSweep';
import { scenarios } from '../data/scenarios';

interface TacticalMapProps {
  currentBasin: BasinScenario;
  onSelectSector: (sector: AffectedSector) => void;
  radarActive: boolean;
  onToggleRadar: () => void;
  timelinePhase: TimelinePhase;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  currentBasin,
  onSelectSector,
  radarActive,
  onToggleRadar,
  timelinePhase,
}) => {
  // Ref for the Leaflet mount container
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Ref for the RadarSweep instance — created once after map is ready,
  // destroyed on component unmount. Never recreated between renders.
  const radarRef = useRef<RadarSweep | null>(null);

  // Layer toggle state — controls real Leaflet layers via mapEngine.setLayerVisible().
  const [layersMenuOpen, setLayersMenuOpen] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    cloudburstZone: true,
    riverSurge:     true,
    safeZones:      true,
    affectedAreas:  true,
  });

  // ── Effect 1: Map init / destroy ─────────────────────────────────────────
  // Runs once on mount. Cleanup destroys the Leaflet instance on unmount.
  // StrictMode safety: mapEngine.init() is idempotent (guards if this.map !== null).
  // mapEngine.destroy() nulls the reference so the second mount gets a fresh init.
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const scenario = scenarios.kedarnath_cloudburst;
    mapEngine.init(container, scenario);
    mapEngine.renderLayers('T+0m'); // render default T+0m layers on first mount

    return () => {
      // Destroy radar before destroying the map so the overlay is removed cleanly
      if (radarRef.current) {
        radarRef.current.destroy();
        radarRef.current = null;
      }
      mapEngine.destroy();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Route authoritative Leaflet affected-area marker clicks to the existing
  // React sector selection state. This replaces the retired SVG-percentage
  // sector-pill overlay without introducing duplicate map geometry.
  useEffect(() => {
    mapEngine.setAffectedAreaSelectHandler((areaId) => {
      const sector = currentBasin.sectors.find(({ id }) => id === areaId);
      if (sector) onSelectSector(sector);
    });

    return () => mapEngine.setAffectedAreaSelectHandler(null);
  }, [currentBasin, onSelectSector]);

  // ── Effect 2: RadarSweep create/wire — runs after map is initialised ─────
  // Creates the RadarSweep instance once the map ref is available.
  // Starts or stops immediately based on current radarActive value.
  // This effect runs once on mount ([] dep) — start/stop is handled by Effect 3.
  useEffect(() => {
    const map = mapEngine.getMap();
    if (!map) return;

    // Create the RadarSweep instance and store in ref
    const sweep = new RadarSweep(map);
    radarRef.current = sweep;

    // Apply initial radarActive state — if App already has radar on at mount time
    if (radarActive) {
      sweep.start();
    }

    return () => {
      sweep.destroy();
      radarRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: radarActive intentionally NOT in deps — start/stop handled by Effect 3
  // to avoid recreating the RadarSweep instance on every toggle.

  // ── Effect 3: radarActive → start / stop ─────────────────────────────────
  // Fires whenever radarActive prop changes.
  // Calls start() or stop() on the existing RadarSweep instance.
  // Safe to call when sweep hasn't been created yet (guard at top).
  useEffect(() => {
    const sweep = radarRef.current;
    if (!sweep) return;

    if (radarActive) {
      sweep.start();
    } else {
      sweep.stop();
    }
  }, [radarActive]);

  // ── Effect 4: Timeline synchronization ───────────────────────────────────
  // Fires whenever timelinePhase changes. Re-renders the scenario GeoJSON layers.
  // T+30m has no GeoJSON — MapEngine keeps the last valid layers in that case.
  useEffect(() => {
    mapEngine.renderLayers(timelinePhase);
  }, [timelinePhase]);

  // ── Effect 5: Layer visibility synchronization ────────────────────────────
  // Fires whenever activeLayers changes. Updates each real Leaflet layer.
  useEffect(() => {
    const realLayers: { key: LayerKey; visible: boolean }[] = [
      { key: 'cloudburstZone', visible: activeLayers.cloudburstZone },
      { key: 'riverSurge',     visible: activeLayers.riverSurge     },
      { key: 'safeZones',      visible: activeLayers.safeZones      },
      { key: 'affectedAreas',  visible: activeLayers.affectedAreas  },
    ];
    realLayers.forEach(({ key, visible }) => mapEngine.setLayerVisible(key, visible));
  }, [activeLayers]);

  // ── Effect 6: Resize observer ─────────────────────────────────────────────
  // Notifies Leaflet when the container resizes so tile grid recalculates.
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      mapEngine.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-[580px] xl:min-h-[700px] h-full bg-[#080e1d] overflow-hidden flex flex-col justify-between select-none">

      {/* ── 1. Leaflet map container ──────────────────────────────────────── */}
      {/* MapEngine owns everything inside this div.                          */}
      {/* bg-[#0f172a] matches OpenTopoMap dark tile background before load.  */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 z-0 bg-[#0f172a]"
      />

      {/* ── 2. Top Map Controls Bar & Geodetic Header ─────────────────────── */}
      <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between gap-2 pointer-events-none">
        {/* Radar scan metadata */}
        <div className="pointer-events-auto flex items-center gap-2 bg-[#191f2f]/95 backdrop-blur px-2.5 py-1 rounded border border-[#3d494c]/50 shadow-md">
          <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-pulse" />
          <span className="font-mono text-xs text-[#dde2f8] font-semibold">
            RADAR SCAN: 3.2 GHz X-BAND [DOPPLER {radarActive ? 'ACTIVE' : 'STANDBY'}]
          </span>
          <span className="text-[#869397] text-xs">|</span>
          <span className="font-mono text-[11px] text-[#bcc9cd]">BEAM ELEV: +1.8°</span>
        </div>

        {/* Compact Map Controls & Layer Toggles */}
        <div className="pointer-events-auto flex items-center gap-1 bg-[#191f2f]/95 backdrop-blur p-1 rounded border border-[#3d494c]/50 shadow-md">
          <button
            type="button"
            onClick={() => mapEngine.zoomIn()}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#33394a] text-[#dde2f8] font-mono text-sm font-bold cursor-pointer transition-colors"
            title="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => mapEngine.zoomOut()}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#33394a] text-[#dde2f8] font-mono text-sm font-bold cursor-pointer transition-colors"
            title="Zoom Out"
          >
            -
          </button>
          <div className="w-px h-4 bg-[#3d494c]/60" />
          <button
            type="button"
            onClick={() => mapEngine.recenter()}
            className="px-2 h-7 flex items-center gap-1 rounded hover:bg-[#33394a] text-[#dde2f8] font-mono text-xs cursor-pointer transition-colors"
            title="Recenter Map"
          >
            <span className="material-symbols-outlined text-[14px] text-[#4cd7f6]">center_focus_strong</span>
            <span className="hidden sm:inline">RECENTER</span>
          </button>

          {/* Layers button & popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLayersMenuOpen(!layersMenuOpen)}
              className="px-2 h-7 flex items-center gap-1 rounded hover:bg-[#33394a] text-[#dde2f8] font-mono text-xs cursor-pointer transition-colors"
              title="Toggle Map Layers"
            >
              <span className="material-symbols-outlined text-[14px]">layers</span>
              <span className="hidden sm:inline">LAYERS</span>
            </button>

            {layersMenuOpen && (
              <div className="absolute right-0 mt-1 w-52 bg-[#191f2f] border border-[#3d494c] rounded shadow-2xl p-2 z-50 text-xs">
                <div className="text-[10px] font-mono uppercase text-[#869397] tracking-wider mb-1.5 border-b border-[#3d494c]/40 pb-1">
                  Cartographic Layers
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <label className="flex items-center gap-2 text-[#dde2f8] cursor-pointer hover:text-[#4cd7f6]">
                    <input
                      type="checkbox"
                      checked={activeLayers.cloudburstZone}
                      onChange={(e) => setActiveLayers({ ...activeLayers, cloudburstZone: e.target.checked })}
                      className="accent-[#ef4444]"
                    />
                    <span>Cloudburst Polygon</span>
                  </label>
                  <label className="flex items-center gap-2 text-[#dde2f8] cursor-pointer hover:text-[#4cd7f6]">
                    <input
                      type="checkbox"
                      checked={activeLayers.riverSurge}
                      onChange={(e) => setActiveLayers({ ...activeLayers, riverSurge: e.target.checked })}
                      className="accent-[#06b6d4]"
                    />
                    <span>River Surge Wave</span>
                  </label>
                  <label className="flex items-center gap-2 text-[#dde2f8] cursor-pointer hover:text-[#4cd7f6]">
                    <input
                      type="checkbox"
                      checked={activeLayers.safeZones}
                      onChange={(e) => setActiveLayers({ ...activeLayers, safeZones: e.target.checked })}
                      className="accent-emerald-400"
                    />
                    <span>Safe Zone Ridges</span>
                  </label>
                  <label className="flex items-center gap-2 text-[#dde2f8] cursor-pointer hover:text-[#4cd7f6]">
                    <input
                      type="checkbox"
                      checked={activeLayers.affectedAreas}
                      onChange={(e) => setActiveLayers({ ...activeLayers, affectedAreas: e.target.checked })}
                      className="accent-[#ef4444]"
                    />
                    <span>Affected Areas</span>
                  </label>
                  {/* Radar coverage — wired to radarActive via onToggleRadar.
                      The original radar.js has a single overlay (no separate
                      coverage layer). This checkbox mirrors the RADAR button. */}
                  <label className="flex items-center gap-2 text-[#dde2f8] cursor-pointer hover:text-[#4cd7f6]">
                    <input
                      type="checkbox"
                      checked={radarActive}
                      onChange={onToggleRadar}
                      className="accent-[#06b6d4]"
                    />
                    <span>Doppler Radar Sweep</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleRadar}
            className={`px-2 h-7 flex items-center gap-1 rounded font-mono text-xs border transition-colors cursor-pointer ${
              radarActive
                ? 'bg-[#33394a] text-[#4cd7f6] border-[#4cd7f6]/60'
                : 'text-[#869397] border-[#3d494c]/40 hover:text-[#dde2f8]'
            }`}
            title="Toggle Doppler Radar Sweep"
          >
            <span className="material-symbols-outlined text-[14px]">radar</span>
            <span className="hidden sm:inline">RADAR</span>
          </button>
        </div>
      </div>

      {/* ── 3. Cartographic Legend ────────────────────────────────────────── */}
      <div className="relative z-10 m-3 sm:m-4 self-end pointer-events-auto bg-[#191f2f]/95 backdrop-blur p-2.5 rounded border border-[#3d494c]/40 shadow-xl">
        <div className="font-mono text-[10px] uppercase font-bold text-[#869397] tracking-wider mb-1.5 border-b border-[#3d494c]/30 pb-0.5">
          CARTOGRAPHIC LEGEND
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px] text-[#dde2f8]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
            <span>Cloudburst Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ffb3ad]" />
            <span>Affected Area</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Safe Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-[#4cd7f6]" />
            <span>River Flow</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <span className={`w-2.5 h-2.5 rounded-full border ${radarActive ? 'border-[#4cd7f6] bg-[#4cd7f6]/20' : 'border-[#4cd7f6]'}`} />
            <span className={radarActive ? 'text-[#4cd7f6]' : ''}>
              Radar Coverage {radarActive ? '(ACTIVE)' : '(STANDBY)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
