import type {
  AirQualitySnapshot,
  AqiCategory,
  CityLocation,
  CityMapPoint,
  DailyForecastSlot,
  HourlyForecastSlot,
  OpenMeteoAirQualityResponse,
  OpenMeteoGeocodingResponse,
  PollutantMetric,
} from '../types/airQuality';
import {
  classifyEuropeanAqi,
  classifyUsAqi,
  getAqiMeta,
} from '../utils/aqiHelpers';

export const OPEN_METEO_DATA_SOURCE_LABEL =
  'Open-Meteo Air Quality API (Model-based)';

interface PollutantDefinition {
  id: PollutantMetric['id'];
  apiField:
    | 'pm2_5'
    | 'pm10'
    | 'nitrogen_dioxide'
    | 'ozone'
    | 'sulphur_dioxide'
    | 'carbon_monoxide';
  symbol: string;
  name: string;
  defaultUnit: string;
  guidelineLimit: number;
  guidelineLabel: string;
  healthContext: string;
  primarySources: string;
}

export const POLLUTANT_DEFINITIONS: PollutantDefinition[] = [
  {
    id: 'pm25',
    apiField: 'pm2_5',
    symbol: 'PM2.5',
    name: 'Fine Particulate Matter',
    defaultUnit: 'µg/m³',
    guidelineLimit: 15,
    guidelineLabel: 'WHO 24h ref: 15 µg/m³',
    healthContext:
      'Particles under 2.5 µm can penetrate deep into alveolar tissue and enter systemic circulation.',
    primarySources:
      'Combustion exhaust, biomass burning, secondary urban aerosols, and regional transport.',
  },
  {
    id: 'pm10',
    apiField: 'pm10',
    symbol: 'PM10',
    name: 'Coarse Particulate Matter',
    defaultUnit: 'µg/m³',
    guidelineLimit: 45,
    guidelineLabel: 'WHO 24h ref: 45 µg/m³',
    healthContext:
      'Inhalable coarse dust that primarily irritates upper airways, eyes, and nasal passages.',
    primarySources:
      'Road dust resuspension, construction activity, windblown soil, and pollen.',
  },
  {
    id: 'no2',
    apiField: 'nitrogen_dioxide',
    symbol: 'NO₂',
    name: 'Nitrogen Dioxide',
    defaultUnit: 'µg/m³',
    guidelineLimit: 25,
    guidelineLabel: 'WHO 24h ref: 25 µg/m³',
    healthContext:
      'Traffic-linked reactive gas that can increase airway inflammation, especially for asthma.',
    primarySources:
      'Internal combustion engines, urban freight corridors, and commercial fuel burning.',
  },
  {
    id: 'o3',
    apiField: 'ozone',
    symbol: 'O₃',
    name: 'Ground-Level Ozone',
    defaultUnit: 'µg/m³',
    guidelineLimit: 100,
    guidelineLabel: 'WHO 8h ref: 100 µg/m³',
    healthContext:
      'Photochemical oxidant that typically peaks on warm, sunny afternoons downwind of traffic.',
    primarySources:
      'Sunlight reacting with nitrogen oxides (NOx) and volatile organic compounds.',
  },
  {
    id: 'so2',
    apiField: 'sulphur_dioxide',
    symbol: 'SO₂',
    name: 'Sulphur Dioxide',
    defaultUnit: 'µg/m³',
    guidelineLimit: 40,
    guidelineLabel: 'WHO 24h ref: 40 µg/m³',
    healthContext:
      'Reactive industrial gas capable of triggering bronchoconstriction at elevated concentrations.',
    primarySources:
      'Industrial boilers, marine bunker fuel, refining, and coal/oil power generation.',
  },
  {
    id: 'co',
    apiField: 'carbon_monoxide',
    symbol: 'CO',
    name: 'Carbon Monoxide',
    defaultUnit: 'µg/m³',
    guidelineLimit: 4000,
    guidelineLabel: 'WHO 24h ref: 4000 µg/m³',
    healthContext:
      'Colorless combustion gas that reduces oxygen transport in blood at elevated exposure.',
    primarySources:
      'Incomplete fuel combustion in congested roadways, heating, and wildfire plumes.',
  },
];

/**
 * Safely normalizes numeric API readings.
 * Preserves null/undefined/NaN/negative noise as null rather than coercing to 0.
 */
export function sanitizeMetricValue(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

export function classifyPollutantAgainstGuideline(
  value: number | null,
  guidelineLimit: number
): { category: AqiCategory; shortNote: string } {
  if (value === null) {
    return {
      category: 'Unavailable',
      shortNote: 'Value unavailable from model',
    };
  }

  const ratio = value / guidelineLimit;
  if (ratio <= 0.8) {
    return { category: 'Good', shortNote: 'Within WHO reference' };
  }
  if (ratio <= 1.5) {
    return { category: 'Moderate', shortNote: 'Near or above WHO ref' };
  }
  if (ratio <= 2.5) {
    return { category: 'Sensitive', shortNote: 'Elevated vs. WHO ref' };
  }
  if (ratio <= 4.0) {
    return { category: 'Unhealthy', shortNote: 'High vs. WHO ref' };
  }
  return { category: 'Very Unhealthy', shortNote: 'Very high vs. WHO ref' };
}

/**
 * Estimates the most prominent pollutant by comparing each available reading
 * against its WHO reference guideline ratio. Returns null when all values are missing.
 */
export function deriveDominantPollutant(values: {
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  o3: number | null;
  so2: number | null;
  co: number | null;
}): string | null {
  const candidates: Array<{ symbol: string; ratio: number }> = [];

  for (const def of POLLUTANT_DEFINITIONS) {
    const val = values[def.id];
    if (val !== null) {
      candidates.push({ symbol: def.symbol, ratio: val / def.guidelineLimit });
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => b.ratio - a.ratio);
  return candidates[0].symbol;
}

function formatDayHeading(dateIso: string, index: number): {
  dayLabel: string;
  dateLabel: string;
} {
  const parts = dateIso.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return { dayLabel: `Day ${index + 1}`, dateLabel: dateIso };
  }
  const utcDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(utcDate);
  const shortDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(utcDate);

  return {
    dayLabel: index === 0 ? 'Today' : weekday,
    dateLabel: shortDate,
  };
}

function formatShortDate(dateIso: string): string {
  const parts = dateIso.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return dateIso;
  }
  const utcDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(utcDate);
}

/**
 * Extracts up to 24 upcoming hourly slots starting at or immediately after `currentTimeIso`.
 */
export function mapHourlyForecast24h(
  raw: OpenMeteoAirQualityResponse
): HourlyForecastSlot[] {
  const hourly = raw.hourly;
  if (!hourly || !Array.isArray(hourly.time) || hourly.time.length === 0) {
    return [];
  }

  const currentTime = raw.current?.time ?? null;
  let startIndex = 0;

  if (currentTime) {
    // Open-Meteo `current.time` uses YYYY-MM-DDTHH:MM in the local timezone; compare lexicographically
    const currentHourPrefix = currentTime.slice(0, 13);
    const exactMatch = hourly.time.findIndex((t) =>
      t.startsWith(currentHourPrefix)
    );
    if (exactMatch >= 0) {
      startIndex = exactMatch;
    } else {
      const nextAfter = hourly.time.findIndex((t) => t >= currentTime);
      startIndex = nextAfter >= 0 ? nextAfter : 0;
    }
  }

  const endIndex = Math.min(hourly.time.length, startIndex + 24);
  const slots: HourlyForecastSlot[] = [];

  for (let i = startIndex; i < endIndex; i += 1) {
    const isoTime = hourly.time[i];
    if (!isoTime) continue;

    const [datePart = '', timePart = ''] = isoTime.split('T');
    const usAqi = sanitizeMetricValue(hourly.us_aqi?.[i]);
    const europeanAqi = sanitizeMetricValue(hourly.european_aqi?.[i]);
    const pm25 = sanitizeMetricValue(hourly.pm2_5?.[i]);
    const pm10 = sanitizeMetricValue(hourly.pm10?.[i]);
    const no2 = sanitizeMetricValue(hourly.nitrogen_dioxide?.[i]);
    const o3 = sanitizeMetricValue(hourly.ozone?.[i]);
    const so2 = sanitizeMetricValue(hourly.sulphur_dioxide?.[i]);
    const co = sanitizeMetricValue(hourly.carbon_monoxide?.[i]);

    slots.push({
      id: `hr-${isoTime}`,
      isoTime,
      timeLabel: timePart.slice(0, 5) || isoTime,
      dateLabel: formatShortDate(datePart),
      usAqi: usAqi !== null ? Math.round(usAqi) : null,
      europeanAqi: europeanAqi !== null ? Math.round(europeanAqi) : null,
      usCategory: classifyUsAqi(usAqi),
      europeanCategory: classifyEuropeanAqi(europeanAqi),
      dominantPollutant: deriveDominantPollutant({
        pm25,
        pm10,
        no2,
        o3,
        so2,
        co,
      }),
      pm25,
      pm10,
      no2,
      o3,
      so2,
      co,
    });
  }

  return slots;
}

/**
 * Aggregates Open-Meteo hourly forecast series into up to 5 daily outlook rows.
 */
export function mapDailyForecast5d(
  raw: OpenMeteoAirQualityResponse
): DailyForecastSlot[] {
  const hourly = raw.hourly;
  if (!hourly || !Array.isArray(hourly.time) || hourly.time.length === 0) {
    return [];
  }

  const grouped = new Map<
    string,
    {
      usValues: number[];
      euValues: number[];
      pollutantTotals: Record<PollutantMetric['id'], { sum: number; count: number }>;
      hours: number;
    }
  >();

  for (let i = 0; i < hourly.time.length; i += 1) {
    const iso = hourly.time[i];
    if (!iso) continue;
    const dateIso = iso.slice(0, 10);
    if (!grouped.has(dateIso)) {
      if (grouped.size >= 5) {
        continue;
      }
      grouped.set(dateIso, {
        usValues: [],
        euValues: [],
        pollutantTotals: {
          pm25: { sum: 0, count: 0 },
          pm10: { sum: 0, count: 0 },
          no2: { sum: 0, count: 0 },
          o3: { sum: 0, count: 0 },
          so2: { sum: 0, count: 0 },
          co: { sum: 0, count: 0 },
        },
        hours: 0,
      });
    }

    const bucket = grouped.get(dateIso);
    if (!bucket) continue;
    bucket.hours += 1;

    const usVal = sanitizeMetricValue(hourly.us_aqi?.[i]);
    if (usVal !== null) bucket.usValues.push(Math.round(usVal));

    const euVal = sanitizeMetricValue(hourly.european_aqi?.[i]);
    if (euVal !== null) bucket.euValues.push(Math.round(euVal));

    const fieldMap: Array<[PollutantMetric['id'], unknown]> = [
      ['pm25', hourly.pm2_5?.[i]],
      ['pm10', hourly.pm10?.[i]],
      ['no2', hourly.nitrogen_dioxide?.[i]],
      ['o3', hourly.ozone?.[i]],
      ['so2', hourly.sulphur_dioxide?.[i]],
      ['co', hourly.carbon_monoxide?.[i]],
    ];

    for (const [id, rawVal] of fieldMap) {
      const sanitized = sanitizeMetricValue(rawVal);
      if (sanitized !== null) {
        bucket.pollutantTotals[id].sum += sanitized;
        bucket.pollutantTotals[id].count += 1;
      }
    }
  }

  const days: DailyForecastSlot[] = [];
  let index = 0;

  for (const [dateIso, bucket] of grouped.entries()) {
    const usMinAqi =
      bucket.usValues.length > 0 ? Math.min(...bucket.usValues) : null;
    const usMaxAqi =
      bucket.usValues.length > 0 ? Math.max(...bucket.usValues) : null;
    const europeanMinAqi =
      bucket.euValues.length > 0 ? Math.min(...bucket.euValues) : null;
    const europeanMaxAqi =
      bucket.euValues.length > 0 ? Math.max(...bucket.euValues) : null;

    const avgPollutants = {
      pm25:
        bucket.pollutantTotals.pm25.count > 0
          ? bucket.pollutantTotals.pm25.sum / bucket.pollutantTotals.pm25.count
          : null,
      pm10:
        bucket.pollutantTotals.pm10.count > 0
          ? bucket.pollutantTotals.pm10.sum / bucket.pollutantTotals.pm10.count
          : null,
      no2:
        bucket.pollutantTotals.no2.count > 0
          ? bucket.pollutantTotals.no2.sum / bucket.pollutantTotals.no2.count
          : null,
      o3:
        bucket.pollutantTotals.o3.count > 0
          ? bucket.pollutantTotals.o3.sum / bucket.pollutantTotals.o3.count
          : null,
      so2:
        bucket.pollutantTotals.so2.count > 0
          ? bucket.pollutantTotals.so2.sum / bucket.pollutantTotals.so2.count
          : null,
      co:
        bucket.pollutantTotals.co.count > 0
          ? bucket.pollutantTotals.co.sum / bucket.pollutantTotals.co.count
          : null,
    };

    const usCategory = classifyUsAqi(usMaxAqi);
    const europeanCategory = classifyEuropeanAqi(europeanMaxAqi);
    const dominantPollutant = deriveDominantPollutant(avgPollutants);
    const { dayLabel, dateLabel } = formatDayHeading(dateIso, index);

    const summary =
      usMaxAqi === null && europeanMaxAqi === null
        ? 'Model forecast values unavailable for this date.'
        : dominantPollutant
          ? `Peak modeled conditions led by ${dominantPollutant} across ${bucket.hours} hourly slots.`
          : `Aggregated from ${bucket.hours} hourly model slots.`;

    days.push({
      id: `day-${dateIso}`,
      dateIso,
      dayLabel,
      dateLabel,
      usMinAqi,
      usMaxAqi,
      europeanMinAqi,
      europeanMaxAqi,
      usCategory,
      europeanCategory,
      dominantPollutant,
      validHoursCount: Math.max(bucket.usValues.length, bucket.euValues.length),
      summary,
    });

    index += 1;
  }

  return days;
}

/**
 * Maps a raw Open-Meteo Air Quality API response into the app's normalized `AirQualitySnapshot`.
 */
export function mapOpenMeteoToSnapshot(
  raw: OpenMeteoAirQualityResponse,
  location: CityLocation,
  fetchedAtIso: string = new Date().toISOString()
): AirQualitySnapshot {
  const current = raw.current ?? {};
  const units = raw.current_units ?? raw.hourly_units ?? {};

  const usAqiRaw = sanitizeMetricValue(current.us_aqi);
  const euAqiRaw = sanitizeMetricValue(current.european_aqi);
  const usAqi = usAqiRaw !== null ? Math.round(usAqiRaw) : null;
  const europeanAqi = euAqiRaw !== null ? Math.round(euAqiRaw) : null;

  const usCategory = classifyUsAqi(usAqi);
  const europeanCategory = classifyEuropeanAqi(europeanAqi);

  const pollutants: PollutantMetric[] = POLLUTANT_DEFINITIONS.map((def) => {
    const val = sanitizeMetricValue(current[def.apiField]);
    const unit = units[def.apiField] || def.defaultUnit;
    const { category, shortNote } = classifyPollutantAgainstGuideline(
      val,
      def.guidelineLimit
    );

    return {
      id: def.id,
      symbol: def.symbol,
      name: def.name,
      unit,
      value: val,
      guidelineLimit: def.guidelineLimit,
      guidelineLabel: def.guidelineLabel,
      category,
      shortNote,
      healthContext: def.healthContext,
      primarySources: def.primarySources,
    };
  });

  const missingPollutantCount = pollutants.filter(
    (item) => item.value === null
  ).length;

  const dominantPollutant = deriveDominantPollutant({
    pm25: pollutants.find((p) => p.id === 'pm25')?.value ?? null,
    pm10: pollutants.find((p) => p.id === 'pm10')?.value ?? null,
    no2: pollutants.find((p) => p.id === 'no2')?.value ?? null,
    o3: pollutants.find((p) => p.id === 'o3')?.value ?? null,
    so2: pollutants.find((p) => p.id === 'so2')?.value ?? null,
    co: pollutants.find((p) => p.id === 'co')?.value ?? null,
  });

  const primaryMeta = getAqiMeta(usCategory, 'us');
  const advisorySummary =
    usAqi === null && europeanAqi === null
      ? 'Open-Meteo returned no current AQI composite index for these coordinates. Review individual pollutant concentrations or retry shortly.'
      : dominantPollutant
        ? `Model-based atmospheric estimate indicates ${primaryMeta.label.toLowerCase()} conditions on the US EPA scale with ${dominantPollutant} highest relative to WHO reference thresholds.`
        : primaryMeta.guidance;

  return {
    location: {
      ...location,
      timezone: raw.timezone || location.timezone,
    },
    dataSource: 'open-meteo-air-quality',
    dataSourceLabel: OPEN_METEO_DATA_SOURCE_LABEL,
    isModelBased: true,
    modelTimeIso: typeof current.time === 'string' ? current.time : null,
    timezone: raw.timezone || location.timezone || 'UTC',
    timezoneAbbreviation: raw.timezone_abbreviation || 'UTC',
    fetchedAtIso,
    usAqi,
    europeanAqi,
    usCategory,
    europeanCategory,
    dominantPollutant,
    advisorySummary,
    pollutants,
    hourlyForecast: mapHourlyForecast24h(raw),
    dailyForecast: mapDailyForecast5d(raw),
    missingPollutantCount,
  };
}

export function mapSnapshotToCityMapPoint(
  snapshot: AirQualitySnapshot
): CityMapPoint {
  const byId = new Map(snapshot.pollutants.map((p) => [p.id, p]));
  return {
    location: snapshot.location,
    modelTimeIso: snapshot.modelTimeIso,
    fetchedAtIso: snapshot.fetchedAtIso,
    usAqi: snapshot.usAqi,
    europeanAqi: snapshot.europeanAqi,
    usCategory: snapshot.usCategory,
    europeanCategory: snapshot.europeanCategory,
    pm25: byId.get('pm25')?.value ?? null,
    pm10: byId.get('pm10')?.value ?? null,
    no2: byId.get('no2')?.value ?? null,
    o3: byId.get('o3')?.value ?? null,
    so2: byId.get('so2')?.value ?? null,
    co: byId.get('co')?.value ?? null,
    dominantPollutant: snapshot.dominantPollutant,
    units: {
      pm25: byId.get('pm25')?.unit ?? 'µg/m³',
      pm10: byId.get('pm10')?.unit ?? 'µg/m³',
      no2: byId.get('no2')?.unit ?? 'µg/m³',
      o3: byId.get('o3')?.unit ?? 'µg/m³',
      so2: byId.get('so2')?.unit ?? 'µg/m³',
      co: byId.get('co')?.unit ?? 'µg/m³',
    },
  };
}

export function mapOpenMeteoGeocodingResults(
  raw: OpenMeteoGeocodingResponse
): CityLocation[] {
  if (!raw || !Array.isArray(raw.results)) {
    return [];
  }

  return raw.results
    .filter(
      (item) =>
        typeof item.name === 'string' &&
        typeof item.latitude === 'number' &&
        Number.isFinite(item.latitude) &&
        typeof item.longitude === 'number' &&
        Number.isFinite(item.longitude)
    )
    .map((item) => ({
      id: `om-${item.id}`,
      name: item.name,
      admin1: item.admin1,
      country: item.country || item.country_code || 'Unknown',
      countryCode: item.country_code,
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone,
      population: item.population,
    }));
}
