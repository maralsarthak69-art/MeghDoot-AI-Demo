import React from 'react';
import {
  BasinScenario,
  AffectedSector,
  AtmosphericTelemetry,
  TimelinePhase,
  HazardState,
} from '../types/telemetry';

interface ScenarioControlPanelProps {
  currentBasin: BasinScenario;
  selectedSectorId: string | null;
  onSelectSector: (sector: AffectedSector) => void;
  telemetry: AtmosphericTelemetry;
  onChangeTelemetry: (updated: Partial<AtmosphericTelemetry>) => void;
  timelinePhase: TimelinePhase;
  onSelectTimeline: (phase: TimelinePhase) => void;
  hazardState: HazardState;
  onChangeHazardState: (state: HazardState) => void;
  surgeEtaMinutes: number;
}

export const ScenarioControlPanel: React.FC<ScenarioControlPanelProps> = ({
  currentBasin,
  selectedSectorId,
  onSelectSector,
  telemetry,
  onChangeTelemetry,
  timelinePhase,
  onSelectTimeline,
  hazardState,
  onChangeHazardState,
  surgeEtaMinutes,
}) => {
  // Moisture convergence percentage in [10, 90]
  const moisturePct = Math.min(100, Math.max(0, ((telemetry.moistureConvergence - 10) / 80) * 100));
  // CTT Drop Rate percentage in [0, 30]
  const cttPct = Math.min(100, Math.max(0, (telemetry.cttDropRate / 30) * 100));
  // Orographic Uplift in [0.5, 10.0]
  const upliftPct = Math.min(100, Math.max(0, ((telemetry.orographicUplift - 0.5) / 9.5) * 100));

  const isCritical = hazardState === 'CRITICAL';
  const isWarn = hazardState === 'WARN';

  return (
    <div className="w-full flex flex-col bg-[#151b2b] border-r border-[#3d494c]/30 p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto max-h-[calc(100vh-84px)] select-none">
      {/* 1. SCENARIO SPECIFICATION */}
      <div className="bg-[#191f2f] p-3 rounded border border-[#3d494c]/40 flex flex-col gap-1.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#869397] uppercase tracking-wider font-semibold">
            SCENARIO SPECIFICATION
          </span>
          <span className="font-mono text-xs text-[#4cd7f6] font-semibold">{currentBasin.code}</span>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base sm:text-lg text-[#dde2f8] font-bold tracking-tight">
            {currentBasin.name}
          </h2>
          <span className="font-mono text-[11px] text-[#ffb3ad] font-semibold tracking-wide">
            {currentBasin.riskLevel}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[#bcc9cd] font-mono text-xs">
          <span className="material-symbols-outlined text-[14px] text-[#4cd7f6]">my_location</span>
          <span>
            {currentBasin.locationName} ({currentBasin.lat.toFixed(4)}° N, {currentBasin.lng.toFixed(4)}° E)
          </span>
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-[#869397] pt-1.5 border-t border-[#3d494c]/30">
          <span>ELEVATION TRANSECT</span>
          <span className="text-[#dde2f8] font-semibold">
            {currentBasin.elevationHigh.toLocaleString()} m down to {currentBasin.elevationLow.toLocaleString()} m
          </span>
        </div>
      </div>

      {/* 2. HAZARD STATE MONITOR (High Hierarchy) */}
      <div
        className={`p-3 rounded border-l-4 relative overflow-hidden transition-all ${
          isCritical
            ? 'bg-[#242a3a] border-l-[#ef4444] border border-[#3d494c]/60'
            : isWarn
            ? 'bg-[#242a3a] border-l-[#f59e0b] border border-[#3d494c]/60'
            : 'bg-[#191f2f] border-l-emerald-500 border border-[#3d494c]/40'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] text-[#869397] uppercase tracking-wider font-bold">
            HAZARD STATE MONITOR
          </span>

          {/* Interactive State Selector */}
          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#080e1d] border border-[#3d494c]/40 font-mono text-[10px]">
            <button
              type="button"
              onClick={() => onChangeHazardState('NORMAL')}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                hazardState === 'NORMAL'
                  ? 'bg-emerald-950/60 text-emerald-400 font-bold'
                  : 'text-[#869397] hover:text-[#dde2f8]'
              }`}
            >
              NORMAL
            </button>
            <button
              type="button"
              onClick={() => onChangeHazardState('WARN')}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                hazardState === 'WARN'
                  ? 'bg-[#e79400]/40 text-[#ffb95f] font-bold'
                  : 'text-[#869397] hover:text-[#dde2f8]'
              }`}
            >
              WARN
            </button>
            <button
              type="button"
              onClick={() => onChangeHazardState('CRITICAL')}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                hazardState === 'CRITICAL'
                  ? 'bg-[#93000a]/70 text-[#ffb4ab] font-bold ring-1 ring-[#ef4444]/60'
                  : 'text-[#869397] hover:text-[#dde2f8]'
              }`}
            >
              CRITICAL (ACTIVE)
            </button>
          </div>
        </div>

        {/* Hazard Title */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`w-3 h-3 rounded-full flex-shrink-0 ${
              isCritical
                ? 'bg-[#ef4444] animate-pulse'
                : isWarn
                ? 'bg-[#f59e0b]'
                : 'bg-emerald-400'
            }`}
          />
          <h3
            className={`text-lg sm:text-xl font-bold tracking-tight ${
              isCritical
                ? 'text-[#ffb4ab]'
                : isWarn
                ? 'text-[#ffb95f]'
                : 'text-emerald-400'
            }`}
          >
            {isCritical
              ? 'CLOUDBURST DETECTED'
              : isWarn
              ? 'OROGRAPHIC INTENSIFICATION'
              : 'CONDITIONS NOMINAL'}
          </h3>
        </div>

        {/* Metric Pair */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-[#080e1d] p-2.5 rounded border border-[#3d494c]/40 flex flex-col">
            <span className="font-mono text-[10px] text-[#869397] uppercase font-medium">
              Rainfall Intensity
            </span>
            <div className="font-mono text-2xl font-bold text-[#ffb4ab] tracking-tight">
              {Math.round(telemetry.predictedRainfall)}{' '}
              <span className="text-xs text-[#bcc9cd] font-normal">mm/hr</span>
            </div>
            <span className="font-mono text-[10px] text-[#ffb4ab] mt-0.5 tracking-wider font-semibold">
              PEAK CHORABARI
            </span>
          </div>

          <div className="bg-[#080e1d] p-2.5 rounded border border-[#3d494c]/40 flex flex-col">
            <span className="font-mono text-[10px] text-[#869397] uppercase font-medium">
              Live Model ETA
            </span>
            <div className="font-mono text-2xl font-bold text-[#4cd7f6] tracking-tight">
              {surgeEtaMinutes}{' '}
              <span className="text-xs text-[#bcc9cd] font-normal">MIN</span>
            </div>
            <span className="font-mono text-[10px] text-[#4cd7f6] mt-0.5 tracking-wider font-semibold">
              AI NOWCAST ESTIMATE
            </span>
          </div>
        </div>

        {/* Evacuation Directive Box */}
        <div
          className={`rounded p-2.5 border flex items-start gap-2 ${
            isCritical
              ? 'bg-[#93000a]/20 border-[#ef4444]/40 text-[#dde2f8]'
              : isWarn
              ? 'bg-[#e79400]/20 border-[#f59e0b]/40 text-[#dde2f8]'
              : 'bg-emerald-950/20 border-emerald-500/40 text-[#dde2f8]'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0 ${
              isCritical ? 'text-[#ffb4ab]' : isWarn ? 'text-[#ffb95f]' : 'text-emerald-400'
            }`}
          >
            e911_emergency
          </span>
          <div className="flex flex-col">
            <span
              className={`font-mono text-[11px] font-bold uppercase tracking-wider ${
                isCritical ? 'text-[#ffb4ab]' : isWarn ? 'text-[#ffb95f]' : 'text-emerald-400'
              }`}
            >
              Operational Directive
            </span>
            <p className="text-xs text-[#dde2f8] mt-0.5 leading-snug">
              {isCritical
                ? 'Evacuate to designated high-ground ridges. Avoid riverbanks.'
                : isWarn
                ? 'Issue pre-alert to transit camps. Restrict low-lying bridge crossings.'
                : 'Standard hydromet surveillance active. No evacuation required.'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. TIMELINE REPLAY */}
      <div className="bg-[#191f2f] p-3 rounded border border-[#3d494c]/40 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#869397] uppercase tracking-wider font-semibold">
            EVENT TIMELINE REPLAY
          </span>
          <span className="font-mono text-xs text-[#bcc9cd]">UTC+05:30</span>
        </div>

        <div className="grid grid-cols-4 gap-1 p-1 bg-[#080e1d] rounded border border-[#3d494c]/30 text-center font-mono text-xs">
          {(['T-30m', 'T-15m', 'T+0m', 'T+30m'] as TimelinePhase[]).map((phase) => {
            const labels: Record<TimelinePhase, string> = {
              'T-30m': 'Convective',
              'T-15m': 'Intensify',
              'T+0m': 'Cloudburst',
              'T+30m': 'Peak Surge',
            };
            const isActive = timelinePhase === phase;

            return (
              <button
                key={phase}
                type="button"
                onClick={() => onSelectTimeline(phase)}
                className={`py-1.5 px-1 rounded transition-colors flex flex-col items-center cursor-pointer ${
                  isActive
                    ? 'bg-[#242a3a] border border-[#4cd7f6] text-[#4cd7f6] font-bold shadow'
                    : 'text-[#bcc9cd] hover:bg-[#33394a] hover:text-[#dde2f8]'
                }`}
              >
                <span className="font-bold text-[11px]">{phase}</span>
                <span className={`text-[9px] truncate w-full ${isActive ? 'text-[#4cd7f6]' : 'text-[#869397]'}`}>
                  {labels[phase]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. ATMOSPHERIC TELEMETRY (Interactive Sliders) */}
      <div className="bg-[#191f2f] p-3 rounded border border-[#3d494c]/40 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[#3d494c]/30 pb-1.5">
          <span className="font-mono text-[10px] text-[#869397] uppercase tracking-wider font-bold">
            ATMOSPHERIC TELEMETRY
          </span>
          <span className="font-mono text-xs text-[#4cd7f6] font-semibold">SATELLITE DERIVED</span>
        </div>

        {/* Moisture Convergence */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-[#dde2f8]">Moisture Convergence</span>
            <span className="text-[#4cd7f6] font-semibold">
              {telemetry.moistureConvergence.toFixed(1)} g/kg
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={90}
            step={0.5}
            value={telemetry.moistureConvergence}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              // Pass only the raw sensor value; App.tsx recalculates rainfall via calculatePredictedIntensity
              onChangeTelemetry({ moistureConvergence: val });
            }}
            className="w-full h-2 bg-[#080e1d] rounded-lg appearance-none cursor-pointer accent-[#4cd7f6]"
          />
          <div className="flex justify-between text-[10px] font-mono text-[#869397]">
            <span>10.0</span>
            <span>90.0</span>
          </div>
        </div>

        {/* CTT Drop Rate */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-[#dde2f8]">CTT Drop Rate</span>
            <span className="text-[#ffb95f] font-semibold">
              {telemetry.cttDropRate.toFixed(1)} °C/hr
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={30}
            step={0.2}
            value={telemetry.cttDropRate}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onChangeTelemetry({ cttDropRate: val });
            }}
            className="w-full h-2 bg-[#080e1d] rounded-lg appearance-none cursor-pointer accent-[#ffb95f]"
          />
          <div className="flex justify-between text-[10px] font-mono text-[#869397]">
            <span>0.0</span>
            <span>30.0</span>
          </div>
        </div>

        {/* Orographic Uplift */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-[#dde2f8]">Orographic Uplift</span>
            <span className="text-[#ffb4ab] font-semibold">
              {telemetry.orographicUplift.toFixed(1)} m/s
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={10.0}
            step={0.1}
            value={telemetry.orographicUplift}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              // Pass only the raw sensor value; App.tsx recalculates rainfall via calculatePredictedIntensity
              onChangeTelemetry({ orographicUplift: val });
            }}
            className="w-full h-2 bg-[#080e1d] rounded-lg appearance-none cursor-pointer accent-[#ffb4ab]"
          />
          <div className="flex justify-between text-[10px] font-mono text-[#869397]">
            <span>0.5</span>
            <span>10.0</span>
          </div>
        </div>

        {/* Output Forecast Indicator */}
        <div className="flex items-center justify-between p-2 rounded bg-[#080e1d] border border-[#3d494c]/30 mt-1">
          <span className="font-mono text-[10px] text-[#869397] uppercase font-bold">
            PREDICTED RAINFALL
          </span>
          <span className="font-mono text-base font-bold text-[#ffb4ab]">
            {Math.round(telemetry.predictedRainfall)} mm/hr
          </span>
        </div>
      </div>

      {/* 5. AFFECTED SECTOR INVENTORY */}
      <div className="bg-[#191f2f] p-3 rounded border border-[#3d494c]/40 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#869397] uppercase tracking-wider font-bold">
            AFFECTED SECTOR INVENTORY
          </span>
          <span className="font-mono text-xs text-[#869397] font-semibold">
            {currentBasin.sectors.length} ZONES MAPPED
          </span>
        </div>

        <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-0.5">
          {currentBasin.sectors.map((sector) => {
            const isSelected = selectedSectorId === sector.id;
            const severityBorder =
              sector.severity === 'CRITICAL'
                ? 'border-l-[#ef4444]'
                : sector.severity === 'EXTREME'
                ? 'border-l-[#ffb3ad]'
                : sector.severity === 'HIGH'
                ? 'border-l-[#ffb95f]'
                : 'border-l-[#4cd7f6]';

            const badgeStyle =
              sector.severity === 'CRITICAL'
                ? 'bg-[#93000a]/40 text-[#ffb4ab]'
                : sector.severity === 'EXTREME'
                ? 'bg-[#a40217]/30 text-[#ffb3ad]'
                : sector.severity === 'HIGH'
                ? 'bg-[#e79400]/30 text-[#ffb95f]'
                : 'bg-[#33394a] text-[#4cd7f6]';

            return (
              <div
                key={sector.id}
                onClick={() => onSelectSector(sector)}
                className={`p-2.5 rounded bg-[#080e1d] border-l-2 ${severityBorder} border border-[#3d494c]/30 flex flex-col gap-1 cursor-pointer transition-all hover:bg-[#151b2b] ${
                  isSelected ? 'ring-1 ring-[#4cd7f6] bg-[#151b2b]' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-[#dde2f8] truncate">
                    {sector.name}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold ${badgeStyle}`}>
                    {sector.severity}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 font-mono text-[10px] text-[#bcc9cd]">
                  <div>
                    Elev: <span className="text-[#dde2f8]">{sector.elevation} m</span>
                  </div>
                  <div>
                    Surge: <span className="text-[#ffb4ab] font-bold">{sector.surgeEtaRange || `${sector.surgeEtaMinutes} min`}</span>
                  </div>
                  <div>
                    Depth: <span className="text-[#ffb4ab] font-bold">{sector.surgeDepthMeters.toFixed(1)} m</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#869397] pt-1 border-t border-[#3d494c]/20">
                  <span>
                    Pop: <span className="text-[#dde2f8] font-mono">{sector.population.toLocaleString()}</span>
                  </span>
                  <span className="truncate text-[#ffb3ad] max-w-[170px] text-right">
                    {sector.hazardDescription}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
