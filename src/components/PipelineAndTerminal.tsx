import React, { useState } from 'react';
import { TerminalLogEntry } from '../types/telemetry';

interface PipelineAndTerminalProps {
  logs: TerminalLogEntry[];
  isInferenceRunning: boolean;
  activeStageIndex: number;
}

export const PipelineAndTerminal: React.FC<PipelineAndTerminalProps> = ({
  logs,
  isInferenceRunning,
  activeStageIndex,
}) => {
  const [selectedStageDetail, setSelectedStageDetail] = useState<number | null>(null);

  const stages = [
    {
      num: '01',
      title: 'ATMOSPHERIC DATA',
      sub: 'INSAT-3D TIR/WV',
      icon: 'satellite_alt',
      color: 'text-[#4cd7f6]',
      detail: 'Multi-spectral thermal infrared and water vapor radiances sampled at 15-min cadence from Indian geostationary satellite INSAT-3D/3DR.',
    },
    {
      num: '02',
      title: 'PHYSICS CONSTRAINTS',
      sub: 'Conservation Moisture',
      icon: 'tune',
      color: 'text-[#ffb3ad]',
      detail: 'Mass and thermal conservation penalty loss enforcing non-divergence of vapor flux along steep Himalayan orographic barriers.',
    },
    {
      num: '03',
      title: 'NOWCAST',
      sub: 'Swin-UNet / TensorRT',
      icon: 'neurology',
      color: 'text-[#4cd7f6]',
      isHighlighted: true,
      detail: 'Swin-Transformer UNet architecture accelerated via TensorRT FP16 quantization for micro-scale convective cloudburst emergence detection.',
    },
    {
      num: '04',
      title: 'HYDRO ROUTING',
      sub: 'PySheds / 2D Saint-Venant',
      icon: 'waterfall_chart',
      color: 'text-[#ffb95f]',
      detail: 'Nonlinear shallow water equations routing precipitation through 12.5m ALOS PALSAR DEM catchment with Manning roughness parameters.',
    },
    {
      num: '05',
      title: 'FLOOD SURGE',
      sub: 'ETA & Depth Inundation',
      icon: 'tsunami',
      color: 'text-[#ffb4ab]',
      isCritical: true,
      detail: 'Instantaneous Saint-Venant wave crest ETA propagation, peak discharge velocity (m/s), and cross-sectional breach heights for civilian transit zones.',
    },
  ];

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-0 border-t border-[#3d494c]/40 bg-[#191f2f] select-none">
      {/* 5-Stage Process Flow Representation */}
      <div className="lg:col-span-7 p-3 sm:p-4 border-r border-[#3d494c]/40 flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-[#3d494c]/20 pb-1.5">
          <span className="font-mono text-[10px] text-[#869397] uppercase font-bold tracking-wider">
            CLOUDBURST & FLOOD DYNAMICS PIPELINE
          </span>
          <span className="font-mono text-xs text-emerald-400 font-semibold">
            PHYSICS-INFORMED AI ENGINE
          </span>
        </div>

        {/* 5-Stage Process Flow Representation */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center mt-1">
          {stages.map((st, idx) => {
            const isCurrentlyExecuting = isInferenceRunning && activeStageIndex === idx;
            const isSelected = selectedStageDetail === idx;

            return (
              <div
                key={st.num}
                onClick={() => setSelectedStageDetail(selectedStageDetail === idx ? null : idx)}
                className={`p-2 rounded bg-[#080e1d] flex flex-col items-center justify-between h-24 border cursor-pointer transition-all ${
                  isCurrentlyExecuting
                    ? 'border-[#4cd7f6] ring-2 ring-[#4cd7f6]/50 bg-[#151b2b] scale-[1.02]'
                    : isSelected
                    ? 'border-[#4cd7f6] bg-[#151b2b]'
                    : st.isHighlighted
                    ? 'border-[#4cd7f6]/60 shadow'
                    : st.isCritical
                    ? 'border-[#ef4444]/60'
                    : 'border-[#3d494c]/30 hover:border-[#869397]'
                }`}
                title="Click to view stage architecture details"
              >
                <div className="w-full flex items-center justify-between">
                  <span
                    className={`font-mono text-[9px] font-bold ${
                      st.isHighlighted
                        ? 'text-[#4cd7f6]'
                        : st.isCritical
                        ? 'text-[#ffb4ab]'
                        : 'text-[#869397]'
                    }`}
                  >
                    STAGE {st.num}
                  </span>
                  {isCurrentlyExecuting && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-ping" />
                  )}
                </div>

                <span className={`material-symbols-outlined text-[20px] ${st.color}`}>
                  {st.icon}
                </span>

                <div className="flex flex-col">
                  <span
                    className={`font-mono text-[11px] font-bold leading-tight ${
                      st.isHighlighted
                        ? 'text-[#4cd7f6]'
                        : st.isCritical
                        ? 'text-[#ffb4ab]'
                        : 'text-[#dde2f8]'
                    }`}
                  >
                    {st.title}
                  </span>
                  <span className="font-mono text-[9px] text-[#869397] truncate max-w-[90px]">
                    {st.sub}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Stage Detail Drawer */}
        {selectedStageDetail !== null && (
          <div className="mt-1 p-2 rounded bg-[#080e1d] border border-[#4cd7f6]/40 text-xs font-mono text-[#bcc9cd] flex items-start gap-2 animate-in fade-in duration-150">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[16px] mt-0.5">info</span>
            <div>
              <span className="font-bold text-[#dde2f8]">
                {stages[selectedStageDetail].title} ({stages[selectedStageDetail].sub}):{' '}
              </span>
              <span>{stages[selectedStageDetail].detail}</span>
            </div>
          </div>
        )}
      </div>

      {/* Inference Terminal: Developer Diagnostic Logs */}
      <div className="lg:col-span-5 p-3 sm:p-4 flex flex-col gap-1.5 bg-[#080e1d]">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#869397] uppercase font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            DIAGNOSTIC INFERENCE TERMINAL
          </span>
          <span className="font-mono text-[10px] text-[#869397]">STDOUT: /dev/tty0</span>
        </div>

        <div className="w-full bg-[#050914] p-2.5 rounded border border-[#3d494c]/40 font-mono text-[11px] leading-relaxed text-[#dde2f8] flex flex-col min-h-[96px] justify-between">
          <div className="space-y-0.5 overflow-y-auto max-h-24">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between">
                <div className="text-[#bcc9cd]">
                  <span className="text-[#869397]">[{log.timestamp}]</span> {log.step}
                </div>
                <div className="font-bold">
                  {log.status === 'OK' && (
                    <span className="text-emerald-400">
                      OK {log.details ? <span className="font-normal">{log.details}</span> : ''}
                    </span>
                  )}
                  {log.status === 'CRITICAL' && (
                    <span className="text-[#ef4444] font-bold">{log.details || 'CRITICAL'}</span>
                  )}
                  {log.status === 'RUNNING' && (
                    <span className="text-[#4cd7f6] animate-pulse">RUNNING...</span>
                  )}
                  {log.status === 'WARN' && (
                    <span className="text-[#ffb95f]">{log.details || 'WARN'}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-[#869397] text-[10px] mt-1 pt-1 border-t border-[#3d494c]/20 tracking-wider">
            [MEGHDOOT AI — PHYSICS-INFORMED INFERENCE ENGINE v2.4]
          </div>
        </div>
      </div>
    </div>
  );
};
