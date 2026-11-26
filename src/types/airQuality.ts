export type NavView = 'dashboard' | 'map' | 'assistant' | 'insights';

export type DataViewState = 'demo' | 'loading' | 'empty' | 'error';

export type AqiCategory =
  | 'Good'
  | 'Moderate'
  | 'Sensitive'
  | 'Unhealthy'
  | 'Very Unhealthy'
  | 'Hazardous';

export type MapLayerId = 'aqi' | 'pm25' | 'no2' | 'o3';

export type InsightCategory = 'all' | 'health' | 'drivers' | 'planning';

export interface PollutantMetric {
  id: string;
  symbol: string;
  name: string;
  unit: string;
  /** Static demonstration sample value — never presented as live telemetry */
  demoValue: number;
  guidelineLimit: number;
  guidelineLabel: string;
  category: AqiCategory;
  shortNote: string;
  healthContext: string;
  primarySources: string;
}

export interface HourlyForecastSlot {
  id: string;
  timeLabel: string;
  periodLabel: string;
  demoAqi: number;
  category: AqiCategory;
  dominantPollutant: string;
  windDispersion: string;
  humidityPercent: number;
}

export interface DailyForecastSlot {
  id: string;
  dayLabel: string;
  dateLabel: string;
  demoMinAqi: number;
  demoMaxAqi: number;
  category: AqiCategory;
  dominantPollutant: string;
  summary: string;
}

export interface MeteorologicalContext {
  windLabel: string;
  humidityLabel: string;
  dispersionNote: string;
}

export interface MonitoringZone {
  id: string;
  name: string;
  district: string;
  regionLabel: string;
  coordinatesLabel: string;
  /** Relative map coordinates (0-100%) on the urban demonstration basemap */
  xPercent: number;
  yPercent: number;
  demoAqi: number;
  demoPm25: number;
  demoNo2: number;
  demoO3: number;
  category: AqiCategory;
  dominantPollutant: string;
  environmentType: string;
  primarySource: string;
}

export interface AirQualitySnapshot {
  zoneId: string;
  zoneName: string;
  district: string;
  regionLabel: string;
  isDemonstrationData: true;
  demoAqi: number;
  category: AqiCategory;
  dominantPollutant: string;
  advisorySummary: string;
  meteorology: MeteorologicalContext;
  pollutants: PollutantMetric[];
  hourlyForecast: HourlyForecastSlot[];
  dailyForecast: DailyForecastSlot[];
}

export interface InsightItem {
  id: string;
  title: string;
  category: Exclude<InsightCategory, 'all'>;
  categoryLabel: string;
  summary: string;
  referenceLabel: string;
  referenceValue: string;
  actionGuidance: string;
}

export interface AssistantPromptTemplate {
  id: string;
  category: string;
  label: string;
  prompt: string;
}

export interface PlannedAssistantRequest {
  endpoint: string;
  method: 'POST';
  payload: {
    question: string;
    zoneId: string;
    zoneName: string;
    contextMode: 'demonstration_fixture' | 'unconnected';
    attachedSnapshot?: {
      demoAqi: number;
      category: AqiCategory;
      dominantPollutant: string;
      pollutantSymbols: string[];
    };
  };
}

export interface AssistantThreadEntry {
  id: string;
  question: string;
  createdAtLabel: string;
  backendStatus: 'pending_integration';
  noticeTitle: string;
  noticeBody: string;
  plannedRequest: PlannedAssistantRequest;
}
