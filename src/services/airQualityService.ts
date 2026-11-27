import type {
  AirQualitySnapshot,
  CityLocation,
  CityMapPoint,
  OpenMeteoAirQualityResponse,
  OpenMeteoGeocodingResponse,
} from '../types/airQuality';
import {
  mapOpenMeteoGeocodingResults,
  mapOpenMeteoToSnapshot,
  mapSnapshotToCityMapPoint,
} from './airQualityMapper';

/**
 * STAGE 2A REAL AIR QUALITY & GEOCODING SERVICE
 * ---------------------------------------------
 * Connects directly to:
 * - Open-Meteo Air Quality API: https://air-quality-api.open-meteo.com/v1/air-quality
 * - Open-Meteo Geocoding API:   https://geocoding-api.open-meteo.com/v1/search
 *
 * All returned air quality values are atmospheric model-based estimates (CAMS & regional models)
 * and are explicitly labeled as such—never presented as physical ground monitoring stations or CPCB feeds.
 */

export const OPEN_METEO_AIR_QUALITY_URL =
  'https://air-quality-api.open-meteo.com/v1/air-quality';

export const OPEN_METEO_GEOCODING_URL =
  'https://geocoding-api.open-meteo.com/v1/search';

export const STAGE_2_ENDPOINTS = {
  airQuality: OPEN_METEO_AIR_QUALITY_URL,
  geocoding: OPEN_METEO_GEOCODING_URL,
  assistant: '/api/assistant',
} as const;

export const AIR_QUALITY_VARIABLES = [
  'pm2_5',
  'pm10',
  'nitrogen_dioxide',
  'sulphur_dioxide',
  'ozone',
  'carbon_monoxide',
  'european_aqi',
  'us_aqi',
] as const;

const AIR_QUALITY_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const GEOCODING_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const AIR_QUALITY_TIMEOUT_MS = 10_000;
const GEOCODING_TIMEOUT_MS = 8_000;

/** Curated default real cities with accurate coordinates for immediate live model lookup */
export const DEFAULT_CITIES: CityLocation[] = [
  {
    id: 'city-delhi',
    name: 'New Delhi',
    admin1: 'Delhi',
    country: 'India',
    countryCode: 'IN',
    latitude: 28.6139,
    longitude: 77.209,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 'city-bengaluru',
    name: 'Bengaluru',
    admin1: 'Karnataka',
    country: 'India',
    countryCode: 'IN',
    latitude: 12.9716,
    longitude: 77.5946,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 'city-london',
    name: 'London',
    admin1: 'England',
    country: 'United Kingdom',
    countryCode: 'GB',
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 'Europe/London',
  },
  {
    id: 'city-new-york',
    name: 'New York',
    admin1: 'New York',
    country: 'United States',
    countryCode: 'US',
    latitude: 40.7128,
    longitude: -74.006,
    timezone: 'America/New_York',
  },
  {
    id: 'city-tokyo',
    name: 'Tokyo',
    admin1: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo',
  },
  {
    id: 'city-zurich',
    name: 'Zurich',
    admin1: 'Zurich',
    country: 'Switzerland',
    countryCode: 'CH',
    latitude: 47.3769,
    longitude: 8.5417,
    timezone: 'Europe/Zurich',
  },
];

export type AirQualityErrorCode =
  | 'TIMEOUT'
  | 'ABORTED'
  | 'NETWORK_ERROR'
  | 'HTTP_ERROR'
  | 'API_ERROR'
  | 'INVALID_RESPONSE';

export class AirQualityServiceError extends Error {
  readonly code: AirQualityErrorCode;
  readonly status?: number;

  constructor(message: string, code: AirQualityErrorCode, status?: number) {
    super(message);
    this.name = 'AirQualityServiceError';
    this.code = code;
    this.status = status;
  }
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const snapshotCache = new Map<string, CacheEntry<AirQualitySnapshot>>();
const inFlightSnapshots = new Map<string, Promise<AirQualitySnapshot>>();
const geocodingCache = new Map<string, CacheEntry<CityLocation[]>>();

export function getCoordinateCacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

export function clearAirQualityCache(): void {
  snapshotCache.clear();
  inFlightSnapshots.clear();
  geocodingCache.clear();
}

export function getCachedSnapshot(
  location: CityLocation
): AirQualitySnapshot | null {
  const key = getCoordinateCacheKey(location.latitude, location.longitude);
  const entry = snapshotCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    snapshotCache.delete(key);
    return null;
  }
  return entry.value;
}

async function fetchJsonWithTimeout<T>(
  url: string,
  timeoutMs: number,
  externalSignal?: AbortSignal
): Promise<T> {
  const controller = new AbortController();
  let didTimeout = false;

  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => {
    controller.abort();
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
      throw new AirQualityServiceError('Request cancelled.', 'ABORTED');
    }
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AirQualityServiceError(
        `Open-Meteo returned HTTP ${response.status}.`,
        'HTTP_ERROR',
        response.status
      );
    }

    const data = (await response.json()) as T;
    if (!data || typeof data !== 'object') {
      throw new AirQualityServiceError(
        'Open-Meteo returned an unexpected empty payload.',
        'INVALID_RESPONSE'
      );
    }
    return data;
  } catch (error) {
    if (error instanceof AirQualityServiceError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (didTimeout) {
        throw new AirQualityServiceError(
          `Request timed out after ${Math.round(timeoutMs / 1000)} seconds.`,
          'TIMEOUT'
        );
      }
      throw new AirQualityServiceError('Request cancelled.', 'ABORTED');
    }
    if (error instanceof Error && error.name === 'AbortError') {
      if (didTimeout) {
        throw new AirQualityServiceError(
          `Request timed out after ${Math.round(timeoutMs / 1000)} seconds.`,
          'TIMEOUT'
        );
      }
      throw new AirQualityServiceError('Request cancelled.', 'ABORTED');
    }
    throw new AirQualityServiceError(
      'Unable to reach Open-Meteo. Check network connectivity and retry.',
      'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

export function buildAirQualityRequestUrl(
  latitudes: number[],
  longitudes: number[],
  forecastDays = 5
): string {
  const vars = AIR_QUALITY_VARIABLES.join(',');
  const params = new URLSearchParams({
    latitude: latitudes.map((n) => n.toFixed(4)).join(','),
    longitude: longitudes.map((n) => n.toFixed(4)).join(','),
    current: vars,
    hourly: vars,
    forecast_days: String(forecastDays),
    timezone: 'auto',
  });
  return `${OPEN_METEO_AIR_QUALITY_URL}?${params.toString()}`;
}

export async function fetchAirQualityForLocation(
  location: CityLocation,
  options: { forceRefresh?: boolean; signal?: AbortSignal } = {}
): Promise<AirQualitySnapshot> {
  const { forceRefresh = false, signal } = options;
  const cacheKey = getCoordinateCacheKey(location.latitude, location.longitude);

  if (!forceRefresh) {
    const cached = getCachedSnapshot(location);
    if (cached) {
      return {
        ...cached,
        location: { ...cached.location, ...location },
      };
    }
  }

  const existingInFlight = inFlightSnapshots.get(cacheKey);
  if (!forceRefresh && existingInFlight) {
    return existingInFlight;
  }

  const requestPromise = (async () => {
    const url = buildAirQualityRequestUrl(
      [location.latitude],
      [location.longitude],
      5
    );
    const raw = await fetchJsonWithTimeout<OpenMeteoAirQualityResponse>(
      url,
      AIR_QUALITY_TIMEOUT_MS,
      signal
    );

    if (raw.error) {
      throw new AirQualityServiceError(
        raw.reason || 'Open-Meteo Air Quality API reported an error.',
        'API_ERROR'
      );
    }

    const snapshot = mapOpenMeteoToSnapshot(
      raw,
      location,
      new Date().toISOString()
    );

    snapshotCache.set(cacheKey, {
      value: snapshot,
      expiresAt: Date.now() + AIR_QUALITY_CACHE_TTL_MS,
    });

    return snapshot;
  })();

  inFlightSnapshots.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    if (inFlightSnapshots.get(cacheKey) === requestPromise) {
      inFlightSnapshots.delete(cacheKey);
    }
  }
}

/**
 * Loads real Open-Meteo air quality summaries for multiple tracked cities in a single
 * batch API request for any uncached coordinates, avoiding redundant calls.
 */
export async function fetchCityMapPoints(
  locations: CityLocation[],
  options: { forceRefresh?: boolean; signal?: AbortSignal } = {}
): Promise<CityMapPoint[]> {
  const { forceRefresh = false, signal } = options;
  if (locations.length === 0) return [];

  const pointsById = new Map<string, CityMapPoint>();
  const uncachedLocations: CityLocation[] = [];

  for (const location of locations) {
    if (!forceRefresh) {
      const cached = getCachedSnapshot(location);
      if (cached) {
        pointsById.set(location.id, mapSnapshotToCityMapPoint(cached));
        continue;
      }
    }
    uncachedLocations.push(location);
  }

  if (uncachedLocations.length > 0) {
    const url = buildAirQualityRequestUrl(
      uncachedLocations.map((loc) => loc.latitude),
      uncachedLocations.map((loc) => loc.longitude),
      5
    );

    const rawResponse = await fetchJsonWithTimeout<
      OpenMeteoAirQualityResponse | OpenMeteoAirQualityResponse[]
    >(url, AIR_QUALITY_TIMEOUT_MS, signal);

    const fetchedAtIso = new Date().toISOString();
    const list = Array.isArray(rawResponse) ? rawResponse : [rawResponse];

    uncachedLocations.forEach((location, idx) => {
      const rawItem = list[idx];
      if (!rawItem || rawItem.error) {
        return;
      }
      const snapshot = mapOpenMeteoToSnapshot(rawItem, location, fetchedAtIso);
      const cacheKey = getCoordinateCacheKey(
        location.latitude,
        location.longitude
      );
      snapshotCache.set(cacheKey, {
        value: snapshot,
        expiresAt: Date.now() + AIR_QUALITY_CACHE_TTL_MS,
      });
      pointsById.set(location.id, mapSnapshotToCityMapPoint(snapshot));
    });
  }

  return locations
    .map((loc) => pointsById.get(loc.id))
    .filter((point): point is CityMapPoint => Boolean(point));
}

/**
 * Searches real cities globally via the Open-Meteo Geocoding API with caching and timeouts.
 */
export async function searchCities(
  query: string,
  options: { signal?: AbortSignal; count?: number } = {}
): Promise<CityLocation[]> {
  const normalized = query.trim();
  if (normalized.length < 2) {
    return [];
  }

  const cacheKey = normalized.toLowerCase();
  const cached = geocodingCache.get(cacheKey);
  if (cached && Date.now() <= cached.expiresAt) {
    return cached.value;
  }

  const params = new URLSearchParams({
    name: normalized,
    count: String(options.count ?? 6),
    language: 'en',
    format: 'json',
  });

  const url = `${OPEN_METEO_GEOCODING_URL}?${params.toString()}`;
  const raw = await fetchJsonWithTimeout<OpenMeteoGeocodingResponse>(
    url,
    GEOCODING_TIMEOUT_MS,
    options.signal
  );

  if (raw.error) {
    throw new AirQualityServiceError(
      raw.reason || 'City search failed.',
      'API_ERROR'
    );
  }

  const results = mapOpenMeteoGeocodingResults(raw);
  geocodingCache.set(cacheKey, {
    value: results,
    expiresAt: Date.now() + GEOCODING_CACHE_TTL_MS,
  });

  return results;
}
