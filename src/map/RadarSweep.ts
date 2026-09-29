/**
 * Meghdoot AI — RadarSweep
 *
 * Faithful TypeScript port of meghdoot-original/src/radar.js.
 *
 * Owns:
 *   - off-screen Canvas (400 × 400 px)
 *   - requestAnimationFrame sweep loop
 *   - setInterval texture-refresh loop (100 ms)
 *   - Leaflet L.imageOverlay placed on the map
 *
 * Does NOT own:
 *   - the Leaflet map instance  (owned by MapEngine)
 *   - React state
 *   - any scenario layers (cloudburst, river, etc.)
 *
 * Original bug fixed:
 *   radar.js never cleared the setInterval on stop/disable, which meant
 *   the interval continued running after the overlay was removed.
 *   This port tracks intervalId and clears it in both stop() and destroy().
 *
 * Original bug fixed:
 *   sweepAngle was module-scoped in radar.js, so it carried over between
 *   stop/start cycles.  Here it is a class field reset to 0 in stop().
 *
 * Coordinate convention:
 *   The Leaflet imageOverlay bounds use [[lat, lng], [lat, lng]] ordering.
 *   scenario.coordinates is [lat, lng] — used directly, no reversal needed.
 */

import L from 'leaflet';
import { scenarios } from '../data/scenarios';

// ── Canvas geometry constants (from radar.js) ─────────────────────────────────
const CANVAS_SIZE    = 400;   // pixels
const CENTER_XY      = 200;   // centerX = centerY = CANVAS_SIZE / 2
const RADIUS         = 180;   // outer radar radius in canvas pixels
const SWEEP_STEP_DEG = 2.5;   // degrees to advance per animation frame
const INTERVAL_MS    = 100;   // setInterval cadence for imageOverlay texture refresh
const OVERLAY_OPACITY = 0.85; // L.imageOverlay opacity (from radar.js)
const BOUNDS_RADIUS   = 0.08; // degrees lat/lng around center (from radar.js)

// ── Range ring radii in canvas pixels (from radar.js) ─────────────────────────
const RANGE_RINGS = [50, 100, 150, 180];

// ── RadarSweep class ──────────────────────────────────────────────────────────

export class RadarSweep {
  private readonly map:     L.Map;
  private canvas:           HTMLCanvasElement | null = null;
  private ctx:              CanvasRenderingContext2D | null = null;
  private overlay:          L.ImageOverlay | null = null;
  private animFrameId:      number | null = null;
  private intervalId:       ReturnType<typeof setInterval> | null = null;
  private sweepAngle:       number = 0;
  private running:          boolean = false;

  constructor(map: L.Map) {
    this.map = map;
  }

  // ── Public: start ───────────────────────────────────────────────────────────

  /**
   * Start the radar sweep.
   * Safe to call when already running — the guard at the top prevents
   * duplicate animation loops (StrictMode safety).
   */
  start(): void {
    if (this.running) return;
    this.running = true;

    // Remove any stale overlay from a previous activation
    if (this.overlay) {
      if (this.map.hasLayer(this.overlay)) this.map.removeLayer(this.overlay);
      this.overlay = null;
    }

    // ── Create off-screen canvas ─────────────────────────────────────────
    this.canvas = document.createElement('canvas');
    this.canvas.width  = CANVAS_SIZE;
    this.canvas.height = CANVAS_SIZE;
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      this.running = false;
      return;
    }

    // ── Compute geographic bounds from scenario coordinates ───────────────
    // scenario.coordinates = [lat, lng]  — matches Leaflet [lat, lng] ordering
    const sc = scenarios.kedarnath_cloudburst;
    const centerLat = sc.coordinates[0]; // 30.7346
    const centerLng = sc.coordinates[1]; // 79.0669
    const bounds: L.LatLngBoundsExpression = [
      [centerLat - BOUNDS_RADIUS, centerLng - BOUNDS_RADIUS],
      [centerLat + BOUNDS_RADIUS, centerLng + BOUNDS_RADIUS],
    ];

    // ── Draw first frame and create the imageOverlay ──────────────────────
    this.drawFrame();
    this.overlay = L.imageOverlay(this.canvas.toDataURL(), bounds, {
      opacity: OVERLAY_OPACITY,
    }).addTo(this.map);

    // ── Texture refresh interval (100 ms) — mirrors radar.js setInterval ─
    // The rAF loop draws into the canvas; this interval pushes the updated
    // canvas texture to the Leaflet imageOverlay via setUrl().
    this.intervalId = setInterval(() => {
      if (this.overlay && this.canvas && this.map.hasLayer(this.overlay)) {
        this.overlay.setUrl(this.canvas.toDataURL());
      }
    }, INTERVAL_MS);
  }

  // ── Public: stop ────────────────────────────────────────────────────────────

  /**
   * Stop the radar sweep and remove the overlay from the map.
   * Safe to call when already stopped.
   * Resets sweepAngle so the next start() begins from 0 (cleaner than the
   * original which carried module-scoped angle across stop/start cycles).
   */
  stop(): void {
    this.running = false;

    // Cancel animation frame
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    // Clear texture-refresh interval (BUG FIX — original never did this)
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Remove overlay from map
    if (this.overlay) {
      if (this.map.hasLayer(this.overlay)) this.map.removeLayer(this.overlay);
      this.overlay = null;
    }

    // Reset sweep position so next start() begins from north
    this.sweepAngle = 0;

    // Release canvas
    this.canvas = null;
    this.ctx    = null;
  }

  // ── Public: destroy ─────────────────────────────────────────────────────────

  /**
   * Full teardown. Stops the sweep and releases all references.
   * Called from TacticalMap.tsx useEffect cleanup.
   */
  destroy(): void {
    this.stop();
  }

  // ── Public: isActive ─────────────────────────────────────────────────────────

  isActive(): boolean {
    return this.running;
  }

  // ── Private: draw one animation frame ───────────────────────────────────────

  /**
   * Draws one full radar frame onto the canvas, then schedules the next frame.
   * Mirrors drawRadarSweep() in radar.js exactly.
   */
  private drawFrame(): void {
    // Guard: if stopped between scheduling and firing, do nothing
    if (!this.running || !this.ctx || !this.canvas) return;

    const ctx = this.ctx;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const cx = CENTER_XY;
    const cy = CENTER_XY;

    // ── Range rings ──────────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth   = 1;
    RANGE_RINGS.forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // ── Crosshair lines ──────────────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(cx - RADIUS, cy);
    ctx.lineTo(cx + RADIUS, cy);
    ctx.moveTo(cx, cy - RADIUS);
    ctx.lineTo(cx, cy + RADIUS);
    ctx.stroke();

    // ── Sweep cone with conic gradient ───────────────────────────────────
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((this.sweepAngle * Math.PI) / 180);

    const sweepGradient = ctx.createConicGradient(0, 0, 0);
    sweepGradient.addColorStop(0,    'rgba(56, 189, 248, 0.45)');
    sweepGradient.addColorStop(0.15, 'rgba(56, 189, 248, 0.1)');
    sweepGradient.addColorStop(0.3,  'rgba(56, 189, 248, 0)');
    sweepGradient.addColorStop(1,    'rgba(56, 189, 248, 0)');

    ctx.fillStyle = sweepGradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── Reflectivity heat spot over cloudburst center ─────────────────────
    const heatGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 80);
    heatGrad.addColorStop(0,   'rgba(239, 68, 68, 0.55)');
    heatGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.35)');
    heatGrad.addColorStop(1,   'rgba(15, 23, 42, 0)');

    ctx.fillStyle = heatGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 80, 0, Math.PI * 2);
    ctx.fill();

    // ── Advance sweep angle and schedule next frame ───────────────────────
    this.sweepAngle = (this.sweepAngle + SWEEP_STEP_DEG) % 360;
    this.animFrameId = requestAnimationFrame(() => this.drawFrame());
  }
}
