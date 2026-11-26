import {
  DEMO_MONITORING_ZONES,
  DEMO_SNAPSHOTS_BY_ZONE,
} from '../data/demonstrationData';
import type {
  AirQualitySnapshot,
  AssistantThreadEntry,
  MonitoringZone,
  PlannedAssistantRequest,
} from '../types/airQuality';

/**
 * SERVICE ADAPTER LAYER (STAGE 1 -> STAGE 2 READY)
 * ------------------------------------------------
 * Stage 1 intentionally keeps all data local to clearly labeled demonstration fixtures
 * and NEVER exposes API keys or fabricates live telemetry / AI answers.
 *
 * Stage 2 Integration Points:
 * 1. `getAirQualitySnapshot(zoneId)` -> GET `/api/air-quality?zoneId=...` (server proxy to OpenAQ / AirNow / Google Air Quality API)
 * 2. `getMonitoringZones()` -> GET `/api/monitoring-zones`
 * 3. `buildAssistantRequestEntry(question, snapshot)` -> POST `/api/assistant` (server-side Gemini API with grounded snapshot context)
 */

export const STAGE_2_ENDPOINTS = {
  airQuality: '/api/air-quality',
  monitoringZones: '/api/monitoring-zones',
  assistant: '/api/assistant',
} as const;

export function getMonitoringZones(): MonitoringZone[] {
  return DEMO_MONITORING_ZONES;
}

export function getAirQualitySnapshot(zoneId: string): AirQualitySnapshot {
  const matched = DEMO_SNAPSHOTS_BY_ZONE[zoneId];
  if (matched) {
    return matched;
  }

  // Fallback for additional map zones that share the central baseline structure
  const zone = DEMO_MONITORING_ZONES.find((item) => item.id === zoneId);
  const base = DEMO_SNAPSHOTS_BY_ZONE['metro-central'];

  if (!zone) {
    return base;
  }

  return {
    ...base,
    zoneId: zone.id,
    zoneName: zone.name,
    district: zone.district,
    regionLabel: zone.regionLabel,
    demoAqi: zone.demoAqi,
    category: zone.category,
    dominantPollutant: zone.dominantPollutant,
    advisorySummary: `Demonstration layout: Sample ${zone.category.toLowerCase()} fixture for ${zone.name} (${zone.environmentType.toLowerCase()}).`,
    pollutants: base.pollutants.map((pollutant) => {
      if (pollutant.id === 'pm25') {
        return { ...pollutant, demoValue: zone.demoPm25, category: zone.category };
      }
      if (pollutant.id === 'no2') {
        return { ...pollutant, demoValue: zone.demoNo2 };
      }
      if (pollutant.id === 'o3') {
        return { ...pollutant, demoValue: zone.demoO3 };
      }
      return pollutant;
    }),
  };
}

/**
 * Builds an honest Stage 1 thread entry without fabricating an AI response.
 * Shows the exact structured request payload ready to send to `POST /api/assistant`
 * once the secure server-side Gemini route is enabled in Stage 2.
 */
export function buildPlannedAssistantEntry(
  question: string,
  snapshot: AirQualitySnapshot | null
): AssistantThreadEntry {
  const trimmed = question.trim();
  const plannedRequest: PlannedAssistantRequest = {
    endpoint: STAGE_2_ENDPOINTS.assistant,
    method: 'POST',
    payload: {
      question: trimmed,
      zoneId: snapshot?.zoneId ?? 'none-selected',
      zoneName: snapshot?.zoneName ?? 'No station connected',
      contextMode: snapshot ? 'demonstration_fixture' : 'unconnected',
      ...(snapshot
        ? {
            attachedSnapshot: {
              demoAqi: snapshot.demoAqi,
              category: snapshot.category,
              dominantPollutant: snapshot.dominantPollutant,
              pollutantSymbols: snapshot.pollutants.map((p) => p.symbol),
            },
          }
        : {}),
    },
  };

  return {
    id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    question: trimmed,
    createdAtLabel: 'Stage 1 preview',
    backendStatus: 'pending_integration',
    noticeTitle: 'AI backend not connected in Stage 1',
    noticeBody:
      'No simulated answer is generated. Once the server-side Gemini endpoint (/api/assistant) and live AQI provider are connected in Stage 2, this prompt and grounded station context will be processed securely on the server without exposing API keys.',
    plannedRequest,
  };
}
