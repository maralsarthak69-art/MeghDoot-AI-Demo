/**
 * Meghdoot AI — Telemetry Service
 *
 * Authoritative physics formula ported exactly from the original
 * meghdoot-original/src/telemetry.js implementation.
 *
 * Formula:
 *   Predicted Intensity ≈ Base + (α · Moisture) + (β · |ΔCTT|) + (γ · v · ∇z)
 *
 * Do NOT modify coefficients, rounding behaviour, or formula structure.
 * Any downstream UI calculations must call these functions — do not inline
 * alternative formulas elsewhere in the codebase.
 */

const BASE = 10.0;
const ALPHA = 0.8;   // Moisture Convergence weight
const BETA = 2.0;    // CTT Drop Rate weight (applied to absolute magnitude)
const GAMMA = 3.25;  // Orographic Uplift Vector weight

/**
 * Calculates predicted rainfall intensity in mm/hr.
 *
 * @param moisture    Moisture convergence (g/kg)
 * @param cttDropAbs  Absolute CTT drop rate magnitude (°C/hr) — pass |ΔCTT|, never negative
 * @param uplift      Orographic uplift vector v·∇z (m/s)
 * @returns           Rounded intensity in mm/hr (one decimal place)
 */
export function calculatePredictedIntensity(
  moisture: number,
  cttDropAbs: number,
  uplift: number,
): number {
  const intensity = BASE + ALPHA * moisture + BETA * cttDropAbs + GAMMA * uplift;
  return Math.round(intensity * 10) / 10;
}

/**
 * Calculates downstream river surge arrival ETA in minutes.
 *
 * Higher intensity → faster surge routing → lower ETA.
 * Minimum ETA is clamped to 12 minutes.
 *
 * @param intensity  Predicted rainfall intensity in mm/hr
 * @returns          Surge arrival ETA in whole minutes
 */
export function calculateSurgeETA(intensity: number): number {
  return Math.max(12, Math.round(62 - intensity * 0.2));
}
