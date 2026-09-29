/**
 * Simulated DEOC CAP alert payload generation.
 *
 * Faithful TypeScript port of meghdoot-original/src/eoc.js. This service only
 * creates the demo payload; dispatch remains a UI-only simulation.
 */

export interface CAPAlertPayload {
  identifier: string;
  sender: string;
  sent: string;
  status: 'Actual';
  msgType: 'Alert';
  scope: 'Public';
  info: {
    category: 'Met';
    event: string;
    urgency: 'Immediate';
    severity: 'Extreme' | 'Moderate';
    certainty: 'Observed / Predicted (AI Confidence 94.8%)';
    eventCode: 'FLW';
    expires: string;
    headline: string;
    description: string;
    instruction: string;
    area: {
      areaDesc: string;
      polygon: string;
    };
  };
}

/**
 * Generates the same simulated CAP payload as the original EOC service.
 */
export function generateCAPAlertPayload(
  intensity: number,
  surgeEta: number,
): CAPAlertPayload {
  const isCloudburst = intensity >= 100;
  const alertLevel = isCloudburst
    ? 'EMERGENCY_RED_ALERT'
    : intensity >= 50
      ? 'WARNING_AMBER'
      : 'ADVISORY_GREEN';
  const timestamp = new Date().toISOString();

  return {
    identifier: `MEGHDOOT-DEOC-UK-${Date.now()}`,
    sender: 'deoc-uttarakhand-alert@meghdoot.ai',
    sent: timestamp,
    status: 'Actual',
    msgType: 'Alert',
    scope: 'Public',
    info: {
      category: 'Met',
      event: isCloudburst ? 'Severe Himalayan Cloudburst Surge' : 'Heavy Convective Rainfall',
      urgency: 'Immediate',
      severity: isCloudburst ? 'Extreme' : 'Moderate',
      certainty: 'Observed / Predicted (AI Confidence 94.8%)',
      eventCode: 'FLW',
      expires: new Date(Date.now() + 3600000).toISOString(),
      headline: `MEGHDOOT AI: ${alertLevel} - Mandakini River Basin`,
      description: `AI Nowcast predicted rainfall intensity of ${intensity} mm/hr in Mandakini Catchment. Downstream flash flood surge arrival estimated at T+${surgeEta} minutes.`,
      instruction: isCloudburst
        ? 'MANDATORY EVACUATION: Move immediately to Zone-A Helipad (+48m high-ground ridge) or Bhim Shila elevated bedrock.'
        : 'Stay clear of riverbanks.',
      // This CAP-specific boundary is authored by the original eoc.js; it is
      // not the scenario's cloudburst-core GeoJSON polygon.
      area: {
        areaDesc: 'Kedarnath, Lincholi, Rambara, Gaurikund & Sonprayag',
        polygon: '30.755,79.040 30.758,79.085 30.725,79.095 30.715,79.055 30.755,79.040',
      },
    },
  };
}
