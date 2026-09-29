import React, { useState } from 'react';
import { BasinScenario } from '../types/telemetry';

interface HeaderProps {
  currentBasin: BasinScenario;
  basins: BasinScenario[];
  onSelectBasin: (basin: BasinScenario) => void;
  radarActive: boolean;
  onToggleRadar: () => void;
  onOpenDeocAlert: () => void;
  onRunInference: () => void;
  isInferenceRunning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentBasin,
  basins,
  onSelectBasin,
  radarActive,
  onToggleRadar,
  onOpenDeocAlert,
  onRunInference,
  isInferenceRunning,
}) => {
  const [basinDropdownOpen, setBasinDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#0a0f1d] border-b border-[#3d494c]/40 select-none">
      <div className="h-[52px] w-full px-3 sm:px-4 flex items-center justify-between gap-3">
        {/* Left: Brand & Basin Specifier */}
        <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden">
          <div className="flex items-center gap-2 flex-shrink-0">
            <img
              alt="Meghdoot AI Vector Mark"
              className="h-7 w-auto object-contain flex-shrink-0"
              src="https://lh3.googleusercontent.com/aida/AEtjO1WnEAria75EsrL8y5XdVW492GJACun_0RuyeZ73pXJo8ZrZQ4OkktVthYseFstCsK6juTPWFM9rTrbcjS94ceQq8m8KciwQkGXZBenNAN1y5Koo6kZLokmjH3p4LSXFHALBeaBYqo0tToDFXYpikfUMewGkHwDAJoLeoMxHRDAXPOuV3SYOXoQ7ybv4X5_p1vPYH16lfFcx-fjuhODMR4_R49s1LolI6L1_xic3C5-jRrdpyV5CpitG7Q0"
              onError={(e) => {
                // Fallback styled geometric mountain logo
                const target = e.currentTarget;
                target.style.display = 'none';
              }}
            />
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="font-semibold text-sm sm:text-base text-[#dde2f8] tracking-wider whitespace-nowrap">
                MEGHDOOT AI
              </span>
              <span className="text-[10px] sm:text-xs text-[#4cd7f6] tracking-widest uppercase opacity-90 hidden sm:inline whitespace-nowrap font-mono font-medium">
                ATMOSPHERIC INTELLIGENCE
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-[#3d494c]/60 hidden md:block mx-1" />

          {/* Basin Selector Dropdown */}
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setBasinDropdownOpen(!basinDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#151b2b] border border-[#3d494c]/50 text-[#bcc9cd] hover:text-[#4cd7f6] hover:border-[#4cd7f6]/60 transition-colors font-mono text-xs cursor-pointer"
              title="Switch River Basin"
            >
              <span className="material-symbols-outlined text-[14px] text-[#4cd7f6]">explore</span>
              <span className="font-medium text-[#dde2f8]">{currentBasin.name} · {currentBasin.locationName.split(',')[0]}</span>
              <span className="text-[#869397] text-[10px]">
                [{currentBasin.lat.toFixed(4)}° N, {currentBasin.lng.toFixed(4)}° E]
              </span>
              <span className="material-symbols-outlined text-[13px] text-[#869397]">
                {basinDropdownOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {basinDropdownOpen && (
              <div className="absolute left-0 mt-1 w-72 bg-[#191f2f] border border-[#3d494c] rounded shadow-2xl py-1 z-50">
                <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider text-[#869397] border-b border-[#3d494c]/40">
                  Select Hydrological Basin
                </div>
                {basins.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      onSelectBasin(b);
                      setBasinDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex flex-col gap-0.5 hover:bg-[#242a3a] transition-colors cursor-pointer ${
                      b.id === currentBasin.id ? 'bg-[#242a3a]/80 border-l-2 border-[#4cd7f6]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#dde2f8]">{b.name}</span>
                      <span className="text-[10px] font-mono text-[#4cd7f6]">{b.code}</span>
                    </div>
                    <span className="text-[11px] text-[#869397] truncate">{b.locationName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Status badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#151b2b] border border-[#3d494c]/40">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[10px] sm:text-xs font-semibold tracking-wider text-emerald-400">
              SYSTEM ONLINE
            </span>
          </div>

          {/* Radar Toggle */}
          <button
            type="button"
            onClick={onToggleRadar}
            className={`px-2.5 py-1 rounded border font-mono text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              radarActive
                ? 'border-[#4cd7f6] bg-[#06b6d4]/20 text-[#4cd7f6]'
                : 'border-[#3d494c]/70 bg-[#191f2f] text-[#bcc9cd] hover:text-[#4cd7f6]'
            }`}
            title="Toggle Doppler Radar Overlay"
          >
            <span className="material-symbols-outlined text-[13px]">radar</span>
            <span className="font-medium tracking-wide hidden sm:inline">RADAR</span>
          </button>

          {/* EOC Alert */}
          <button
            type="button"
            onClick={onOpenDeocAlert}
            className="px-2.5 py-1 rounded border border-[#a40217] bg-[#93000a]/30 hover:bg-[#93000a]/60 text-[#ffb4ab] font-mono text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Open District Emergency Operations Center Alert"
          >
            <span className="material-symbols-outlined text-[14px] text-[#ffb4ab]">warning</span>
            <span className="font-semibold tracking-wide">EOC ALERT</span>
          </button>

          {/* Run Inference */}
          <button
            type="button"
            onClick={onRunInference}
            disabled={isInferenceRunning}
            className="px-3 py-1 rounded bg-[#4cd7f6] text-[#003640] font-mono text-xs font-bold tracking-wider hover:bg-[#38bdf8] active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Execute Physics-Informed Cloudburst & Surge Inference"
          >
            <span className={`material-symbols-outlined text-[14px] ${isInferenceRunning ? 'animate-spin' : ''}`}>
              {isInferenceRunning ? 'sync' : 'play_arrow'}
            </span>
            <span className="hidden sm:inline">
              {isInferenceRunning ? 'INFERRING...' : 'RUN INFERENCE'}
            </span>
            <span className="sm:hidden">RUN</span>
          </button>

          {/* Profile Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileModalOpen(!profileModalOpen)}
              className="w-7 h-7 rounded-full bg-[#4cd7f6]/20 border border-[#4cd7f6]/40 flex items-center justify-center hover:bg-[#4cd7f6]/30 transition-colors cursor-pointer"
              title="Station Commander Details"
            >
              <span className="material-symbols-outlined text-[#4cd7f6] text-[16px]">person</span>
            </button>

            {profileModalOpen && (
              <div className="absolute right-0 mt-1 w-60 bg-[#191f2f] border border-[#3d494c] rounded shadow-2xl p-3 z-50 text-xs">
                <div className="flex items-center gap-2 border-b border-[#3d494c]/40 pb-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#4cd7f6]/20 flex items-center justify-center font-bold text-[#4cd7f6]">
                    MC
                  </div>
                  <div>
                    <div className="font-semibold text-[#dde2f8]">Mission Commander</div>
                    <div className="text-[10px] text-[#869397] font-mono">SECTOR-04 DEOC-CHAMOLI</div>
                  </div>
                </div>
                <div className="space-y-1 font-mono text-[10px] text-[#bcc9cd]">
                  <div>Auth Level: <span className="text-emerald-400">COMMANDER (CAP-V1.2)</span></div>
                  <div>Station Link: <span className="text-[#4cd7f6]">INSAT-3D HIGH-BW</span></div>
                  <div>Doppler Sync: <span className="text-emerald-400">ACTIVE (X-BAND)</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
