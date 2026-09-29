/**
 * Meghdoot AI — HydrographPanel
 *
 * Faithful Chart.js port of meghdoot-original/src/chart.js.
 *
 * Owns:
 *   - Chart.js dual-axis line chart instance
 *   - Riverbed elevation dataset (static, from MANDAKINI_RIVER_NODES)
 *   - Surge depth dataset (dynamic, scaled by live intensity + timeline phase)
 *   - Overflow threshold dataset (static 2.5 m line)
 *
 * Chart.js is used directly (no react-chartjs-2 wrapper) to keep the
 * migration minimal and consistent with the imperative MapEngine pattern.
 *
 * Data sources (authoritative, no invented values):
 *   - Station labels + elevations: MANDAKINI_RIVER_NODES from scenarios.ts
 *   - initialDepths: [3.8,4.2,4.8,4.5,3.2,2.4,1.8] from chart.js
 *   - T-30m/T-15m depth arrays: from chart.js updateRiverChart()
 *   - Intensity scaling: calculatePredictedIntensity() / 118.0 (from chart.js)
 *   - T+30m: no case in original — falls through to T+0m depths (preserved)
 */

import React, { useRef, useEffect } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Legend,
  Tooltip,
  type ChartConfiguration,
} from 'chart.js';
import { BasinScenario, TimelinePhase } from '../types/telemetry';
import { MANDAKINI_RIVER_NODES } from '../data/scenarios';

// Register only the components we use (tree-shaking friendly)
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Legend,
  Tooltip,
);

// ── Constants from chart.js ───────────────────────────────────────────────────

/** Station labels for the x-axis — from chart.js riverNodes */
const LABELS = MANDAKINI_RIVER_NODES.map((n) => n.name);

/** Riverbed terrain elevations — from chart.js riverNodes */
const ELEVATIONS = MANDAKINI_RIVER_NODES.map((n) => n.elev);

/** Static overflow danger mark — from chart.js overflowThreshold */
const OVERFLOW_THRESHOLD = MANDAKINI_RIVER_NODES.map(() => 2.5);

/**
 * Per-timeline base surge depths (unscaled, before intensity factor).
 * Ported exactly from chart.js updateRiverChart() stateDepths switch.
 * T+30m has no case in the original — falls through to T+0m.
 */
const STATE_DEPTHS: Record<string, number[]> = {
  'T-30m': [1.8, 1.2, 0.8, 0.6, 0.4, 0.3, 0.2],
  'T-15m': [3.2, 3.8, 2.9, 2.1, 1.4, 0.9, 0.5],
  'T+0m':  [3.8, 4.2, 4.8, 4.5, 3.2, 2.4, 1.8],
};

/** Intensity divisor for depth scaling — from chart.js: baseFactor = intensity / 118.0 */
const INTENSITY_BASELINE = 118.0;

// ── Scaling formula (from chart.js updateRiverChart) ─────────────────────────

/**
 * Calculates scaled surge depths for the given timeline phase and live intensity.
 * Mirrors: stateDepths.map(d => Math.round(d * baseFactor * 10) / 10)
 */
function getScaledDepths(phase: TimelinePhase, intensity: number): number[] {
  const baseFactor = intensity / INTENSITY_BASELINE;
  // T+30m: no case in original chart.js — use T+0m base depths (original fallback)
  const base = STATE_DEPTHS[phase] ?? STATE_DEPTHS['T+0m'];
  return base.map((d) => Math.round(d * baseFactor * 10) / 10);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface HydrographPanelProps {
  currentBasin: BasinScenario;
  predictedRainfall: number;
  timelinePhase: TimelinePhase;
}

export const HydrographPanel: React.FC<HydrographPanelProps> = ({
  currentBasin,
  predictedRainfall,
  timelinePhase,
}) => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const chartRef   = useRef<Chart | null>(null);

  // ── Effect: create chart once, destroy on unmount ──────────────────────────
  // Chart.js StrictMode safety: chartRef.current is checked before creation,
  // and destroy() is called in cleanup so the second mount gets a fresh instance.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Avoid duplicate instances (StrictMode double-mount guard)
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const initialDepths = getScaledDepths(timelinePhase, predictedRainfall);

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: LABELS,
        datasets: [
          // ── Dataset 0: Riverbed Terrain Elevation ────────────────────────
          {
            label: 'Riverbed Terrain Elevation (m)',
            data: ELEVATIONS,
            borderColor: '#94a3b8',
            backgroundColor: 'rgba(148, 163, 184, 0.15)',
            fill: true,
            tension: 0.3,
            yAxisID: 'yElevation',
            pointRadius: 3,
            pointBackgroundColor: '#94a3b8',
          },
          // ── Dataset 1: Predicted Surge Depth ─────────────────────────────
          {
            label: 'Predicted Surge Depth (m)',
            data: initialDepths,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.25)',
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: '#ef4444',
            yAxisID: 'yFlood',
          },
          // ── Dataset 2: Overflow Danger Mark ──────────────────────────────
          {
            label: 'Riverbank Overflow Danger Mark (+2.5m)',
            data: OVERFLOW_THRESHOLD,
            borderColor: '#f97316',
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0,
            yAxisID: 'yFlood',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            labels: {
              color: '#cbd5e1',
              font: { size: 11, family: 'sans-serif' },
            },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#38bdf8',
            bodyColor: '#f8fafc',
            borderColor: '#334155',
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            ticks: {
              color: '#94a3b8',
              font: { size: 10 },
              maxRotation: 30,
            },
            grid: { color: 'rgba(51, 65, 85, 0.4)' },
          },
          yElevation: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Elevation Above Sea Level (m)',
              color: '#94a3b8',
            },
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(51, 65, 85, 0.3)' },
            min: 1500,
            max: 3800,
          },
          yFlood: {
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: 'Flood Surge Depth (m)',
              color: '#ef4444',
            },
            ticks: { color: '#ef4444' },
            grid: { drawOnChartArea: false },
            min: 0,
            max: 6,
          },
        },
      },
    };

    chartRef.current = new Chart(canvas, config);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Create once. Updates driven by the effect below.

  // ── Effect: update surge depths on intensity or timeline change ────────────
  // Mirrors updateRiverChart(intensity, stateKey) from chart.js.
  // Updates only dataset[1] (surge depth) — elevation and threshold are static.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const scaled = getScaledDepths(timelinePhase, predictedRainfall);
    chart.data.datasets[1].data = scaled;
    chart.update('active'); // 'active' preserves animations matching original
  }, [predictedRainfall, timelinePhase]);

  // ── Placeholder state for basins without authoritative hydrograph data ──────
  if (currentBasin.isPlaceholder) {
    return (
      <div className="w-full bg-[#151b2b] border-t border-[#3d494c]/40 p-3 sm:p-4 flex flex-col gap-3 select-none">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3d494c]/30 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#869397] text-[20px]">water_loss</span>
            <div>
              <h3 className="text-sm sm:text-base text-[#dde2f8] font-bold tracking-tight">
                {currentBasin.name.toUpperCase()} TRANSECT PROFILE & FLOOD SURGE HYDROGRAPH
              </h3>
              <p className="text-xs text-[#869397]">
                River transect data · Dual-axis hydrograph
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#242a3a] border border-[#3d494c]/50 font-mono text-[10px] text-[#ffb95f] font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[12px]">warning</span>
            PLACEHOLDER SCENARIO
          </div>
        </div>

        {/* Unavailable state panel */}
        <div className="relative w-full h-64 bg-[#080e1d] rounded border border-[#3d494c]/30 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="material-symbols-outlined text-[#3d494c] text-[48px]">ssid_chart</span>
          <div className="flex flex-col gap-1">
            <p className="font-mono text-sm font-bold text-[#869397] uppercase tracking-widest">
              HYDROGRAPH DATA UNAVAILABLE
            </p>
            <p className="text-xs text-[#4a5568] leading-relaxed max-w-sm">
              <span className="text-[#ffb95f] font-semibold">Alaknanda Basin</span> is currently a
              placeholder scenario. Authoritative river-station elevation and surge-depth data is
              not available in this prototype.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#191f2f] border border-[#3d494c]/40 font-mono text-[10px] text-[#869397] uppercase tracking-wider">
            <span className="material-symbols-outlined text-[11px]">info</span>
            Real scenario data will replace this panel when available
          </div>
        </div>

        {/* Placeholder station row — no numeric flood values shown */}
        <div className="w-full flex items-center justify-between px-2 font-mono text-[10px] text-[#4a5568]">
          {currentBasin.stations.map((st) => (
            <div key={st.name} className="flex flex-col items-center">
              <span className="font-semibold truncate max-w-[60px] text-center text-[#4a5568]">
                {st.name}
              </span>
              <span className="text-[#3d494c]">{st.km} km</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#151b2b] border-t border-[#3d494c]/40 p-3 sm:p-4 flex flex-col gap-3 select-none">
      {/* Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3d494c]/30 pb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">water_loss</span>
          <div>
            <h3 className="text-sm sm:text-base text-[#dde2f8] font-bold tracking-tight">
              {currentBasin.name.toUpperCase()} TRANSECT PROFILE & FLOOD SURGE HYDROGRAPH
            </h3>
            <p className="text-xs text-[#869397]">
              Mandakini River — Kedarnath to Sonprayag · 7-Station Dual-Axis Chart.js
            </p>
          </div>
        </div>

        {/* Live intensity badge */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[#869397]">LIVE INTENSITY:</span>
          <span className="text-[#ffb4ab] font-bold">{Math.round(predictedRainfall)} mm/hr</span>
          <span className="text-[#869397]">·</span>
          <span className="text-[#4cd7f6] font-semibold">{timelinePhase}</span>
        </div>
      </div>

      {/* Chart.js Canvas — h-64 gives fixed pixel height; Chart fills it via maintainAspectRatio:false */}
      <div className="relative w-full h-64 bg-[#080e1d] rounded border border-[#3d494c]/30 p-2">
        <canvas ref={canvasRef} />
      </div>

      {/* X-axis station summary row */}
      <div className="w-full flex items-center justify-between px-2 font-mono text-[10px] text-[#bcc9cd]">
        {currentBasin.stations.map((st) => (
          <div key={st.name} className="flex flex-col items-center">
            <span
              className={`font-semibold truncate max-w-[60px] text-center ${
                st.isCritical ? 'text-[#ffb4ab]' : st.isWarning ? 'text-[#ffb95f]' : 'text-[#dde2f8]'
              }`}
            >
              {st.name}
            </span>
            <span className="text-[#869397]">{st.km} km</span>
          </div>
        ))}
      </div>
    </div>
  );
};
