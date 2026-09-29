import React from 'react';
import { BasinScenario, HazardState } from '../types/telemetry';

interface EmergencyBannerProps {
  currentBasin: BasinScenario;
  hazardState: HazardState;
  surgeTimeMinutes: number;
  onOpenDeocDispatch: () => void;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  currentBasin,
  hazardState,
  surgeTimeMinutes,
  onOpenDeocDispatch,
}) => {
  const isCritical = hazardState === 'CRITICAL';
  const isWarn = hazardState === 'WARN';

  return (
    <div className="w-full bg-[#151b2b] border-b border-[#3d494c]/30 px-3 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[#dde2f8]">
      {/* Left indicator & incident */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-xs uppercase font-semibold transition-colors ${
            isCritical
              ? 'bg-[#93000a]/40 text-[#ffb4ab]'
              : isWarn
              ? 'bg-[#e79400]/30 text-[#ffb95f]'
              : 'bg-emerald-950/40 text-emerald-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isCritical
                ? 'bg-[#ef4444] animate-ping'
                : isWarn
                ? 'bg-[#f59e0b] animate-pulse'
                : 'bg-emerald-400'
            }`}
          />
          {isCritical ? 'CRITICAL EVENT ACTIVE' : isWarn ? 'ELEVATED ADVISORY ACTIVE' : 'NOMINAL MONITORING'}
        </span>

        <span className="font-mono text-xs text-[#4cd7f6] tracking-wider font-semibold">
          {currentBasin.incidentRef}
        </span>
        <span className="text-[#869397] text-xs hidden md:inline">|</span>
        <span className="text-xs text-[#bcc9cd] hidden md:inline tracking-tight font-medium">
          {currentBasin.corridorName}
        </span>
      </div>

      {/* Right surge ETA & Dispatch button */}
      <div className="flex items-center gap-3 sm:gap-4 ml-auto">
        <div className="flex items-center gap-1 text-[#bcc9cd] font-mono text-xs">
          <span className="hidden sm:inline">CORRIDOR ETA TO {currentBasin.primaryGorge}:</span>
          <span className="sm:hidden">CORRIDOR ETA:</span>
          <span
            className={`font-bold text-sm tracking-wider ${
              isCritical ? 'text-[#ffb4ab] animate-pulse' : 'text-[#4cd7f6]'
            }`}
          >
            {surgeTimeMinutes} MIN
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenDeocDispatch}
          className="px-2.5 py-0.5 bg-[#ef4444] text-[#070b14] hover:bg-[#ffb4ab] font-mono text-xs font-bold rounded transition-colors flex items-center gap-1 shadow cursor-pointer active:scale-95"
          title="Open DEOC Satellite Broadcast Dispatch Terminal"
        >
          <span className="material-symbols-outlined text-[13px]">emergency_share</span>
          <span>DEOC DISPATCH</span>
        </button>
      </div>
    </div>
  );
};
