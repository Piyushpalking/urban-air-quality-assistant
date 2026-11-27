export type NavView = 'dashboard' | 'map' | 'assistant' | 'insights';

export type AqiStandard = 'us' | 'european';

export type UsAqiCategory =
  | 'Good'
  | 'Moderate'
  | 'Sensitive'
  | 'Unhealthy'
  | 'Very Unhealthy'
  | 'Hazardous';

export type EuropeanAqiCategory =
  | 'Good'
  | 'Fair'
  | 'Moderate'
  | 'Poor'
  | 'Very Poor'
  | 'Extremely Poor';

export type AqiCategory = UsAqiCategory | EuropeanAqiCategory | 'Unavailable';

export type MapLayerId = 'aqi' | 'pm25' | 'no2' | 'o3';

export type InsightCategory = 'all' | 'health' | 'drivers' | 'planning';

export interface CityLocation {
  id: string;
  name: string;
  admin1?: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  population?: number;
}

export interface PollutantMetric {
  id: 'pm25' | 'pm10' | 'no2' | 'o3' | 'so2' | 'co';
  symbol: string;
  name: string;
  unit: string;
  /** Real model-based value from Open-Meteo, or null when unavailable */
  value: number | null;
  guidelineLimit: number;
  guidelineLabel: string;
  category: AqiCategory;
  shortNote: string;
  healthContext: string;
  primarySources: string;
}

export interface HourlyForecastSlot {
  id: string;
  isoTime: string;
  timeLabel: string;
  dateLabel: string;
  usAqi: number | null;
  europeanAqi: number | null;
  usCategory: AqiCategory;
  europeanCategory: AqiCategory;
  dominantPollutant: string | null;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  o3: number | null;
  so2: number | null;
  co: number | null;
}

export interface DailyForecastSlot {
  id: string;
  dateIso: string;
  dayLabel: string;
  dateLabel: string;
  usMinAqi: number | null;
  usMaxAqi: number | null;
  europeanMinAqi: number | null;
  europeanMaxAqi: number | null;
  usCategory: AqiCategory;
  europeanCategory: AqiCategory;
  dominantPollutant: string | null;
  validHoursCount: number;
  summary: string;
}

export interface CityMapPoint {
  location: CityLocation;
  modelTimeIso: string | null;
  fetchedAtIso: string;
  usAqi: number | null;
  europeanAqi: number | null;
  usCategory: AqiCategory;
  europeanCategory: AqiCategory;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  o3: number | null;
  so2: number | null;
  co: number | null;
  dominantPollutant: string | null;
  units: {
    pm25: string;
    pm10: string;
    no2: string;
    o3: string;
    so2: string;
    co: string;
  };
}

export interface AirQualitySnapshot {
  location: CityLocation;
  dataSource: 'open-meteo-air-quality';
  dataSourceLabel: string;
  isModelBased: true;
  modelTimeIso: string | null;
  timezone: string;
  timezoneAbbreviation: string;
  fetchedAtIso: string;
  usAqi: number | null;
  europeanAqi: number | null;
  usCategory: AqiCategory;
  europeanCategory: AqiCategory;
  dominantPollutant: string | null;
  advisorySummary: string;
  pollutants: PollutantMetric[];
  hourlyForecast: HourlyForecastSlot[];
  dailyForecast: DailyForecastSlot[];
  missingPollutantCount: number;
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

export interface AssistantApiRequest {
  question: string;
  aqiStandard: AqiStandard;
  location: {
    name: string;
    admin1?: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  snapshot: {
    dataSource: 'open-meteo-air-quality';
    isModelBased: true;
    modelTimeIso: string | null;
    timezone: string;
    timezoneAbbreviation: string;
    fetchedAtIso: string | null;
    usAqi: number | null;
    europeanAqi: number | null;
    dominantPollutant: string | null;
    pollutants: Array<{
      symbol: string;
      name: string;
      value: number | null;
      unit: string;
      guidelineLimit: number;
      guidelineLabel: string;
    }>;
    hourlyForecast24h: Array<{
      timeLabel: string;
      dateLabel: string;
      usAqi: number | null;
      europeanAqi: number | null;
      dominantPollutant: string | null;
    }>;
    dailyForecast5d: Array<{
      dayLabel: string;
      dateLabel: string;
      usMinAqi: number | null;
      usMaxAqi: number | null;
      europeanMinAqi: number | null;
      europeanMaxAqi: number | null;
      dominantPollutant: string | null;
    }>;
  };
}

export interface AssistantApiSuccessResponse {
  answer: string;
  model: string;
  generatedAtIso: string;
  groundedContext: {
    city: string;
    country: string;
    aqiStandard: AqiStandard;
    modelTimeIso: string | null;
    timezoneAbbreviation: string;
    isModelBased: true;
    dataSource: 'open-meteo-air-quality';
  };
}

export interface AssistantApiErrorResponse {
  error: {
    code: string;
    message: string;
    retryAfterSeconds?: number;
  };
}

export interface AssistantThreadEntry {
  id: string;
  question: string;
  createdAtIso: string;
  status: 'loading' | 'success' | 'error';
  requestPayload: AssistantApiRequest;
  answer?: string;
  model?: string;
  generatedAtIso?: string;
  errorCode?: string;
  errorMessage?: string;
  retryAfterSeconds?: number;
}

/** Raw Open-Meteo Air Quality API response shape */
export interface OpenMeteoAirQualityResponse {
  latitude: number;
  longitude: number;
  generationtime_ms?: number;
  utc_offset_seconds?: number;
  timezone?: string;
  timezone_abbreviation?: string;
  elevation?: number;
  current_units?: Record<string, string>;
  current?: {
    time?: string;
    interval?: number;
    pm2_5?: number | null;
    pm10?: number | null;
    nitrogen_dioxide?: number | null;
    sulphur_dioxide?: number | null;
    ozone?: number | null;
    carbon_monoxide?: number | null;
    european_aqi?: number | null;
    us_aqi?: number | null;
  };
  hourly_units?: Record<string, string>;
  hourly?: {
    time?: string[];
    pm2_5?: Array<number | null>;
    pm10?: Array<number | null>;
    nitrogen_dioxide?: Array<number | null>;
    sulphur_dioxide?: Array<number | null>;
    ozone?: Array<number | null>;
    carbon_monoxide?: Array<number | null>;
    european_aqi?: Array<number | null>;
    us_aqi?: Array<number | null>;
  };
  error?: boolean;
  reason?: string;
}

/** Raw Open-Meteo Geocoding API response shape */
export interface OpenMeteoGeocodingResponse {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    country_code?: string;
    admin1?: string;
    timezone?: string;
    population?: number;
  }>;
  error?: boolean;
  reason?: string;
}
