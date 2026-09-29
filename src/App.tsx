import { useState, useCallback, useRef } from 'react';
import { BASINS_DATA, INITIAL_TERMINAL_LOGS } from './data/basins';
import { scenarios } from './data/scenarios';
import { calculatePredictedIntensity, calculateSurgeETA } from './services/telemetry';
import { buildInferencePipeline, PIPELINE_COMPLETE_DELAY_MS } from './services/terminal';
import {
  BasinScenario,
  AffectedSector,
  AtmosphericTelemetry,
  TimelinePhase,
  HazardState,
  TerminalLogEntry,
} from './types/telemetry';
import { Header } from './components/Header';
import { EmergencyBanner } from './components/EmergencyBanner';
import { ScenarioControlPanel } from './components/ScenarioControlPanel';
import { TacticalMap } from './components/TacticalMap';
import { HydrographPanel } from './components/HydrographPanel';
import { PipelineAndTerminal } from './components/PipelineAndTerminal';
import { DeocModal } from './components/DeocModal';

// ─── Module-level constants derived from authoritative T+0m scenario ──────────
// These are computed once at module load time, not on every render.
const _t0 = scenarios.kedarnath_cloudburst.timeline['T+0m'].telemetry;
const INITIAL_INTENSITY = calculatePredictedIntensity(
  _t0.moisture_convergence,
  Math.abs(_t0.ctt_drop),
  _t0.uplift_vector,
); // 117.9 mm/hr
const INITIAL_SURGE_ETA = calculateSurgeETA(INITIAL_INTENSITY); // 38 min
const INITIAL_TELEMETRY: AtmosphericTelemetry = {
  moistureConvergence: _t0.moisture_convergence,  // 72.8
  cttDropRate:         Math.abs(_t0.ctt_drop),    // 16.4
  orographicUplift:    _t0.uplift_vector,          //  5.2
  predictedRainfall:   INITIAL_INTENSITY,          // 117.9
};

export default function App() {
  const [currentBasin, setCurrentBasin] = useState<BasinScenario>(BASINS_DATA[0]);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(
    BASINS_DATA[0].sectors[0].id
  );
  const [radarActive, setRadarActive] = useState<boolean>(true);
  const [hazardState, setHazardState] = useState<HazardState>('CRITICAL');
  const [timelinePhase, setTimelinePhase] = useState<TimelinePhase>('T+0m');
  const [deocModalOpen, setDeocModalOpen] = useState<boolean>(false);

  // Atmospheric telemetry state — initialised from authoritative T+0m scenario
  const [telemetry, setTelemetry] = useState<AtmosphericTelemetry>(INITIAL_TELEMETRY);
  const [surgeEtaMinutes, setSurgeEtaMinutes] = useState<number>(INITIAL_SURGE_ETA);

  // Inference state
  const [isInferenceRunning, setIsInferenceRunning] = useState<boolean>(false);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(2); // Stage 03 NOWCAST active by default
  const [terminalLogs, setTerminalLogs] = useState<TerminalLogEntry[]>(INITIAL_TERMINAL_LOGS);

  // Cancellation token — incremented on each new run so stale setTimeout
  // callbacks from a previous run can detect they are superseded and no-op.
  const runIdRef = useRef<number>(0);

  // Update telemetry values
  const handleChangeTelemetry = useCallback((updated: Partial<AtmosphericTelemetry>) => {
    setTelemetry((prev) => {
      const next = { ...prev, ...updated };
      // Authoritative formulas from telemetry.js (meghdoot-original)
      const intensity = calculatePredictedIntensity(
        next.moistureConvergence,
        next.cttDropRate,   // stored as absolute magnitude (positive); see slider onChange
        next.orographicUplift,
      );
      const eta = calculateSurgeETA(intensity);
      setSurgeEtaMinutes(eta);
      return { ...next, predictedRainfall: intensity };
    });
  }, []);

  // Timeline phase change — data-driven from authoritative scenario telemetry.
  // T-30m / T-15m / T+0m values come from scenarios.kedarnath_cloudburst.timeline.
  // T+30m has no original Meghdoot scenario backing; we keep the UI phase but
  // extrapolate slider inputs conservatively (they will be replaced when real
  // scenario data exists for this phase).
  const handleSelectTimeline = useCallback(
    (phase: TimelinePhase) => {
      setTimelinePhase(phase);

      const timelineMap = scenarios.kedarnath_cloudburst.timeline;

      if (phase === 'T-30m' || phase === 'T-15m' || phase === 'T+0m') {
        const t = timelineMap[phase].telemetry;
        handleChangeTelemetry({
          moistureConvergence: t.moisture_convergence,
          cttDropRate:         Math.abs(t.ctt_drop), // convert signed → absolute for slider
          orographicUplift:    t.uplift_vector,
        });
        // Hazard state follows intensity threshold used in original updateUIStatus():
        // >= 100 mm/hr → CRITICAL, >= 50 mm/hr → WARN, else NORMAL
        const liveIntensity = calculatePredictedIntensity(
          t.moisture_convergence,
          Math.abs(t.ctt_drop),
          t.uplift_vector,
        );
        setHazardState(liveIntensity >= 100 ? 'CRITICAL' : liveIntensity >= 50 ? 'WARN' : 'NORMAL');
      } else {
        // T+30m: no original scenario data — use conservatively escalated values
        handleChangeTelemetry({
          moistureConvergence: 84.5,
          cttDropRate:         19.8,
          orographicUplift:    6.4,
        });
        setHazardState('CRITICAL');
      }
    },
    [handleChangeTelemetry],
  );

  // Switch basin
  const handleSelectBasin = useCallback((basin: BasinScenario) => {
    setCurrentBasin(basin);
    setSelectedSectorId(basin.sectors[0]?.id || null);
  }, []);

  // Run Inference Pipeline
  // Architecture: App.tsx schedules timers; terminal service owns all log content.
  // A run-ID cancellation token (runIdRef) ensures stale callbacks from a
  // previous run never update state after a new run has started.
  const handleRunInference = useCallback(() => {
    if (isInferenceRunning) return;

    // Increment run ID — any closure that captured a lower ID is stale
    const currentRunId = runIdRef.current + 1;
    runIdRef.current = currentRunId;

    setIsInferenceRunning(true);
    setActiveStageIndex(0);

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // Show the RUNNING trigger line immediately (before any stage fires)
    setTerminalLogs([{
      id:        '0',
      timestamp: timeStr,
      step:      '[MEGHDOOT] Inference pipeline triggered...',
      status:    'RUNNING',
    }]);

    // Build the authoritative log sequence from the terminal service.
    // Uses live slider values so log text reflects current telemetry state.
    const pipeline = buildInferencePipeline(
      telemetry.moistureConvergence,
      telemetry.cttDropRate,
      telemetry.orographicUplift,
      timeStr,
    );

    // Stage highlight animation: advance activeStageIndex in step with each log.
    // Stages 0-4 map to pipeline entries 0-4 (one-to-one correspondence).
    pipeline.forEach((item, idx) => {
      setTimeout(() => {
        if (runIdRef.current !== currentRunId) return; // stale run — abort
        setActiveStageIndex(idx);
        // Append each log entry as it fires rather than replacing the whole list,
        // so the user sees lines appear sequentially (matching original DOM behaviour)
        setTerminalLogs((prev) => {
          // Replace trigger line on first entry, then accumulate
          const base = prev.filter((l) => l.status !== 'RUNNING');
          return [...base, item.entry];
        });
      }, item.delayMs);
    });

    // onComplete: fires at 350 ms (PIPELINE_COMPLETE_DELAY_MS from terminal.ts,
    // matching original terminal.js setTimeout(..., 350)).
    // Computes final ETA from live telemetry and resets pipeline to NOWCAST stage.
    setTimeout(() => {
      if (runIdRef.current !== currentRunId) return; // stale run — abort

      const finalIntensity = calculatePredictedIntensity(
        telemetry.moistureConvergence,
        telemetry.cttDropRate,
        telemetry.orographicUplift,
      );
      const finalEta = calculateSurgeETA(finalIntensity);
      setSurgeEtaMinutes(finalEta);

      setIsInferenceRunning(false);
      setActiveStageIndex(2); // return to NOWCAST stage highlight
    }, PIPELINE_COMPLETE_DELAY_MS);
  }, [isInferenceRunning, telemetry.moistureConvergence, telemetry.cttDropRate, telemetry.orographicUplift]);

  return (
    <div className="min-h-screen bg-[#080e1d] text-[#dde2f8] flex flex-col font-sans select-none antialiased">
      {/* 1. Header (Fixed top 52px) */}
      <Header
        currentBasin={currentBasin}
        basins={BASINS_DATA}
        onSelectBasin={handleSelectBasin}
        radarActive={radarActive}
        onToggleRadar={() => setRadarActive(!radarActive)}
        onOpenDeocAlert={() => setDeocModalOpen(true)}
        onRunInference={handleRunInference}
        isInferenceRunning={isInferenceRunning}
      />

      {/* Main Container below Header */}
      <main className="w-full pt-[52px] flex-1 flex flex-col bg-[#080e1d]">
        {/* 2. Pinned Operational Emergency Broadcast Indicator */}
        <EmergencyBanner
          currentBasin={currentBasin}
          hazardState={hazardState}
          surgeTimeMinutes={currentBasin.estSurgeToGorgeMin}
          onOpenDeocDispatch={() => setDeocModalOpen(true)}
        />

        {/* 3. Primary Split Command Center Workspace */}
        <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-0 bg-[#080e1d]">
          {/* Left Control Panel (Cols 1-4) */}
          <div className="xl:col-span-4">
            <ScenarioControlPanel
              currentBasin={currentBasin}
              selectedSectorId={selectedSectorId}
              onSelectSector={(sector: AffectedSector) => setSelectedSectorId(sector.id)}
              telemetry={telemetry}
              onChangeTelemetry={handleChangeTelemetry}
              timelinePhase={timelinePhase}
              onSelectTimeline={handleSelectTimeline}
              hazardState={hazardState}
              onChangeHazardState={setHazardState}
              surgeEtaMinutes={surgeEtaMinutes}
            />
          </div>

          {/* Large GIS Map (Cols 5-12) */}
          <div className="xl:col-span-8">
            <TacticalMap
              currentBasin={currentBasin}
              onSelectSector={(sector: AffectedSector) => setSelectedSectorId(sector.id)}
              radarActive={radarActive}
              onToggleRadar={() => setRadarActive(!radarActive)}
              timelinePhase={timelinePhase}
            />
          </div>
        </div>

        {/* 4. Section 3: Mandakini River Transect Profile & Flood Surge Hydrograph */}
        <HydrographPanel
          currentBasin={currentBasin}
          predictedRainfall={telemetry.predictedRainfall}
          timelinePhase={timelinePhase}
        />

        {/* 5. Section 4: Secondary Technical Inspector & Inference Pipeline */}
        <PipelineAndTerminal
          logs={terminalLogs}
          isInferenceRunning={isInferenceRunning}
          activeStageIndex={activeStageIndex}
        />
      </main>

      {/* 6. Section 5: District Emergency Operations Center (DEOC) Alert Modal */}
      <DeocModal
        isOpen={deocModalOpen}
        onClose={() => setDeocModalOpen(false)}
        currentBasin={currentBasin}
        predictedRainfall={telemetry.predictedRainfall}
        surgeEtaMinutes={surgeEtaMinutes}
      />
    </div>
  );
}
