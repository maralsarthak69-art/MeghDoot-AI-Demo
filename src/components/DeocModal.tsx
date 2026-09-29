import React, { useState } from 'react';
import { BasinScenario } from '../types/telemetry';
import { generateCAPAlertPayload } from '../services/eoc';

interface DeocModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBasin: BasinScenario;
  predictedRainfall: number;
  surgeEtaMinutes: number;
}

export const DeocModal: React.FC<DeocModalProps> = ({
  isOpen,
  onClose,
  currentBasin,
  predictedRainfall,
  surgeEtaMinutes,
}) => {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmittedSuccess, setTransmittedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const capPayload = generateCAPAlertPayload(predictedRainfall, surgeEtaMinutes);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(capPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTransmit = () => {
    setIsTransmitting(true);
    setTimeout(() => {
      setIsTransmitting(false);
      setTransmittedSuccess(true);
      setTimeout(() => {
        setTransmittedSuccess(false);
        onClose();
      }, 1600);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#191f2f] rounded border border-[#ef4444] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#080e1d] px-4 py-3 border-b border-[#3d494c]/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#ef4444] text-[24px]">crisis_alert</span>
            <div>
              <h4 className="text-sm sm:text-base text-[#dde2f8] font-bold tracking-tight">
                DISTRICT EMERGENCY OPERATIONS CENTER
              </h4>
              <span className="font-mono text-[10px] text-[#ffb3ad] tracking-widest uppercase font-semibold">
                SIMULATED DISPATCH TERMINAL
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center text-[#869397] hover:text-[#dde2f8] hover:bg-[#33394a] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex flex-col gap-3.5 max-h-[75vh] overflow-y-auto">
          {/* Incident Reference Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#080e1d] p-3 rounded border border-[#3d494c]/40 font-mono text-xs">
            <div>
              <span className="text-[#869397] block text-[10px]">INCIDENT REF</span>
              <span className="text-[#4cd7f6] font-bold">{currentBasin.incidentRef}</span>
            </div>
            <div>
              <span className="text-[#869397] block text-[10px]">SEVERITY</span>
              <span className="text-[#ffb4ab] font-bold">Extreme</span>
            </div>
            <div>
              <span className="text-[#869397] block text-[10px]">URGENCY</span>
              <span className="text-[#ffb4ab] font-bold">Immediate</span>
            </div>
            <div>
              <span className="text-[#869397] block text-[10px]">CERTAINTY</span>
              <span className="text-[#dde2f8] font-bold">Observed</span>
            </div>
          </div>

          {/* Description Details */}
          <div className="flex flex-col gap-1 text-xs">
            <div className="text-[#dde2f8]">
              <span className="font-semibold text-[#869397]">Event:</span> Flash Flood Surge (Cloudburst Triggered)
            </div>
            <div className="text-[#dde2f8]">
              <span className="font-semibold text-[#869397]">Affected Area:</span> {currentBasin.corridorName}
            </div>
            <div className="text-[#dde2f8]">
              <span className="font-semibold text-[#869397]">Hydrologic Impact:</span> Predicted Rainfall{' '}
              <span className="font-mono text-[#ffb4ab] font-bold">{Math.round(predictedRainfall)} mm/hr</span> | Surge ETA{' '}
              <span className="font-mono text-[#4cd7f6] font-bold">{surgeEtaMinutes} min</span>
            </div>
          </div>

          {/* Evacuation Directive */}
          <div className="bg-[#93000a]/20 border border-[#ef4444]/40 p-3 rounded flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[#ffb4ab] text-[20px] mt-0.5 flex-shrink-0">
              notification_important
            </span>
            <div className="text-xs text-[#dde2f8]">
              <span className="font-bold text-[#ffb4ab] uppercase block mb-0.5">
                Civil Protection Instruction:
              </span>
              Evacuate immediately to designated high-ground ridges. Do not remain near riverbanks or in narrow transit gorges.
            </div>
          </div>

          {/* CAP-style JSON Payload */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#869397] uppercase font-bold">
                Common Alerting Protocol (CAP) v1.2 JSON Payload
              </span>
              <button
                type="button"
                onClick={handleCopyJson}
                className="font-mono text-[10px] text-[#4cd7f6] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[12px]">content_copy</span>
                <span>{copied ? 'COPIED!' : 'COPY PAYLOAD'}</span>
              </button>
            </div>
            <pre className="bg-[#080e1d] p-3 rounded border border-[#3d494c]/40 font-mono text-[11px] text-[#4cd7f6] overflow-x-auto leading-relaxed max-h-40">
              <code>{JSON.stringify(capPayload, null, 2)}</code>
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#151b2b] px-4 py-3 border-t border-[#3d494c]/30 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#080e1d] border border-[#3d494c]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffb3ad]" />
            <span className="font-mono text-[10px] text-[#ffb3ad]">SIMULATED ENVIRONMENT ONLY</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-[#242a3a] hover:bg-[#33394a] text-[#bcc9cd] font-mono text-xs transition-colors cursor-pointer"
            >
              DISMISS
            </button>
            <button
              type="button"
              onClick={handleTransmit}
              disabled={isTransmitting || transmittedSuccess}
              className={`px-3.5 py-1.5 rounded font-mono text-xs font-bold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow ${
                transmittedSuccess
                  ? 'bg-emerald-500 text-[#070b14]'
                  : 'bg-[#ef4444] text-[#070b14] hover:bg-[#ffb4ab]'
              }`}
            >
              <span className={`material-symbols-outlined text-[16px] ${isTransmitting ? 'animate-spin' : ''}`}>
                {isTransmitting ? 'sync' : transmittedSuccess ? 'check_circle' : 'send'}
              </span>
              <span>
                {isTransmitting
                  ? 'TRANSMITTING SATELLITE PACKET...'
                  : transmittedSuccess
                  ? 'DISPATCHED (SIMULATED)'
                  : 'TRANSMIT SIMULATED SATELLITE ALERT'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
