/**
 * Meghdoot AI — Inference Pipeline Terminal Service
 *
 * Faithful TypeScript port of meghdoot-original/src/terminal.js.
 *
 * IMPORTANT — delay semantics (preserved exactly from original):
 *   All delayMs values are ABSOLUTE offsets from the moment the pipeline is
 *   started, NOT cumulative gaps between stages. This matches terminal.js which
 *   passes every log to a separate setTimeout(fn, log.delay) call from a shared
 *   starting point.
 *
 *   Original delays:  40 / 110 / 180 / 242 / 300 ms  (onComplete: 350 ms)
 *
 * LATENCY NOTE:
 *   The [TENSORRT FP16] stage fires at 242 ms because that is intentionally
 *   close to the scenario's inference_latency_ms value (238 ms).  The scenario
 *   latency appears inside the LOG TEXT, not as the UI animation delay.  The
 *   two numbers (242 ms delay vs 238 ms latency) are independent: the delay
 *   controls when the line appears on screen; the latency value is what gets
 *   printed in the line.
 *
 * NO DOM MANIPULATION — this service is pure data.  It returns a typed array
 * that React can schedule and render without any direct DOM access.
 */

import { scenarios } from '../data/scenarios';
import { calculatePredictedIntensity, calculateSurgeETA } from './telemetry';
import type { TerminalLogEntry } from '../types/telemetry';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A single pending log line produced by the inference pipeline.
 * delayMs is ABSOLUTE from pipeline start (matching terminal.js semantics).
 */
export interface PipelineLogEntry {
  delayMs: number;
  entry: TerminalLogEntry;
}

// ─── Inference latency constant (from scenarios.ts) ──────────────────────────
// Used in the [TENSORRT FP16] log text — NOT as a UI animation delay.
const INFERENCE_LATENCY_MS =
  scenarios.kedarnath_cloudburst.telemetry.inference_latency_ms; // 238

/** Delay at which the onComplete callback fires (from terminal.js: 350 ms). */
export const PIPELINE_COMPLETE_DELAY_MS = 350;

// ─── Main service function ────────────────────────────────────────────────────

/**
 * Builds the ordered inference pipeline log sequence.
 *
 * Accepts live telemetry inputs so the log text reflects the current slider
 * state rather than always showing T+0m peak values (improvement over the
 * original vanilla-JS version which had no reactive state to draw from).
 *
 * Returns an array of PipelineLogEntry objects.  The caller (App.tsx) is
 * responsible for scheduling the setTimeouts and cancelling them on unmount
 * or when a new run supersedes the current one.
 *
 * @param moisture    Current moisture convergence (g/kg) — absolute value
 * @param cttDropAbs  Current CTT drop magnitude (°C/hr) — absolute value
 * @param uplift      Current orographic uplift (m/s)
 * @param timestamp   HH:MM:SS string for log line prefixes
 */
export function buildInferencePipeline(
  moisture: number,
  cttDropAbs: number,
  uplift: number,
  timestamp: string,
): PipelineLogEntry[] {
  // Compute live intensity and ETA using authoritative service functions
  const intensity = calculatePredictedIntensity(moisture, cttDropAbs, uplift);
  const surgeEta  = calculateSurgeETA(intensity);

  // Round displayed values to match original terminal.js formatting
  const upliftDisplay    = uplift.toFixed(1);
  const cttDropDisplay   = (-cttDropAbs).toFixed(1);  // show as negative, matching original
  const intensityDisplay = Math.round(intensity);

  return [
    // ── Stage 1 — INGEST ─────────────────────────────────────────────────────
    // delay: 40 ms  (from terminal.js logs[0].delay)
    {
      delayMs: 40,
      entry: {
        id:        '1',
        timestamp,
        step:      '[INGEST] Pulling INSAT-3D TIR-1 & WV bands (MOSDAC 0.04° grid)...',
        status:    'OK',
      },
    },

    // ── Stage 2 — PHYSICS ────────────────────────────────────────────────────
    // delay: 110 ms  (from terminal.js logs[1].delay)
    {
      delayMs: 110,
      entry: {
        id:        '2',
        timestamp,
        step:      `[PHYSICS] Orographic uplift v·∇z = ${upliftDisplay} m/s | CTT Drop = ${cttDropDisplay}°C/hr`,
        status:    'OK',
      },
    },

    // ── Stage 3 — LOSS CHECK ─────────────────────────────────────────────────
    // delay: 180 ms  (from terminal.js logs[2].delay)
    {
      delayMs: 180,
      entry: {
        id:        '3',
        timestamp,
        step:      '[LOSS CHECK] Moisture divergence ∇·(vq) constraint satisfied (Residual < 0.004)',
        status:    'OK',
      },
    },

    // ── Stage 4 — TENSORRT FP16 ──────────────────────────────────────────────
    // delay: 242 ms  (from terminal.js logs[3].delay)
    // The INFERENCE_LATENCY_MS value (238) appears in the log TEXT here —
    // it is the scenario's declared latency, not the animation delay (242).
    {
      delayMs: 242,
      entry: {
        id:        '4',
        timestamp,
        step:      `[TENSORRT FP16] Swin-UNet Forward Pass finished in ${INFERENCE_LATENCY_MS} ms`,
        status:    'OK',
      },
    },

    // ── Stage 5 — PYSHEDS DAG ────────────────────────────────────────────────
    // delay: 300 ms  (from terminal.js logs[4].delay)
    {
      delayMs: 300,
      entry: {
        id:        '5',
        timestamp,
        step:      `[PYSHEDS DAG] Routing ${intensityDisplay} mm/hr into Mandakini drainage basin... Surge ETA: ${surgeEta} min`,
        status:    'CRITICAL',
        details:   `${surgeEta} MIN`,
      },
    },
  ];
}
