import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  CityLocation,
  OpenMeteoAirQualityResponse,
  OpenMeteoGeocodingResponse,
} from '../../types/airQuality';
import {
  classifyEuropeanAqi,
  classifyUsAqi,
} from '../../utils/aqiHelpers';
import { buildDataDrivenInsights } from '../../utils/insightsGenerator';
import {
  deriveDominantPollutant,
  mapDailyForecast5d,
  mapHourlyForecast24h,
  mapOpenMeteoGeocodingResults,
  mapOpenMeteoToSnapshot,
  sanitizeMetricValue,
} from '../airQualityMapper';

const SAMPLE_CITY: CityLocation = {
  id: 'city-london',
  name: 'London',
  admin1: 'England',
  country: 'United Kingdom',
  countryCode: 'GB',
  latitude: 51.5074,
  longitude: -0.1278,
  timezone: 'Europe/London',
};

function buildHourlyFixture(startDateIso: string, totalHours: number): OpenMeteoAirQualityResponse['hourly'] {
  const time: string[] = [];
  const pm2_5: Array<number | null> = [];
  const pm10: Array<number | null> = [];
  const nitrogen_dioxide: Array<number | null> = [];
  const sulphur_dioxide: Array<number | null> = [];
  const ozone: Array<number | null> = [];
  const carbon_monoxide: Array<number | null> = [];
  const european_aqi: Array<number | null> = [];
  const us_aqi: Array<number | null> = [];

  const startMs = Date.parse(`${startDateIso}T00:00:00Z`);
  for (let i = 0; i < totalHours; i += 1) {
    const dt = new Date(startMs + i * 3600 * 1000);
    const iso = dt.toISOString().slice(0, 16);
    time.push(iso);
    pm2_5.push(10 + (i % 12));
    pm10.push(20 + (i % 15));
    nitrogen_dioxide.push(18 + (i % 10));
    sulphur_dioxide.push(4 + (i % 3));
    ozone.push(45 + (i % 20));
    carbon_monoxide.push(250 + (i % 50));
    european_aqi.push(22 + (i % 30));
    us_aqi.push(42 + (i % 45));
  }

  return {
    time,
    pm2_5,
    pm10,
    nitrogen_dioxide,
    sulphur_dioxide,
    ozone,
    carbon_monoxide,
    european_aqi,
    us_aqi,
  };
}

describe('AQI standard classifiers', () => {
  it('classifies US EPA AQI boundaries accurately', () => {
    assert.equal(classifyUsAqi(0), 'Good');
    assert.equal(classifyUsAqi(50), 'Good');
    assert.equal(classifyUsAqi(51), 'Moderate');
    assert.equal(classifyUsAqi(100), 'Moderate');
    assert.equal(classifyUsAqi(101), 'Sensitive');
    assert.equal(classifyUsAqi(151), 'Unhealthy');
    assert.equal(classifyUsAqi(201), 'Very Unhealthy');
    assert.equal(classifyUsAqi(305), 'Hazardous');
    assert.equal(classifyUsAqi(null), 'Unavailable');
    assert.equal(classifyUsAqi(Number.NaN), 'Unavailable');
    assert.equal(classifyUsAqi(-5), 'Unavailable');
  });

  it('classifies European AQI boundaries accurately', () => {
    assert.equal(classifyEuropeanAqi(15), 'Good');
    assert.equal(classifyEuropeanAqi(25), 'Fair');
    assert.equal(classifyEuropeanAqi(55), 'Moderate');
    assert.equal(classifyEuropeanAqi(72), 'Poor');
    assert.equal(classifyEuropeanAqi(95), 'Very Poor');
    assert.equal(classifyEuropeanAqi(115), 'Extremely Poor');
    assert.equal(classifyEuropeanAqi(null), 'Unavailable');
    assert.equal(classifyEuropeanAqi(undefined), 'Unavailable');
  });
});

describe('Open-Meteo air quality data mapping', () => {
  it('maps complete Open-Meteo response with units, timestamps, 24h slice, and 5-day summary', () => {
    const raw: OpenMeteoAirQualityResponse = {
      latitude: 51.5,
      longitude: -0.12,
      timezone: 'Europe/London',
      timezone_abbreviation: 'GMT',
      current_units: {
        pm2_5: 'µg/m³',
        pm10: 'µg/m³',
        nitrogen_dioxide: 'µg/m³',
        sulphur_dioxide: 'µg/m³',
        ozone: 'µg/m³',
        carbon_monoxide: 'µg/m³',
      },
      current: {
        time: '2026-11-26T06:00',
        pm2_5: 24.5,
        pm10: 36.2,
        nitrogen_dioxide: 31.4,
        sulphur_dioxide: 6.1,
        ozone: 52.0,
        carbon_monoxide: 310.0,
        european_aqi: 44,
        us_aqi: 77,
      },
      hourly: buildHourlyFixture('2026-11-26', 120),
    };

    const snapshot = mapOpenMeteoToSnapshot(
      raw,
      SAMPLE_CITY,
      '2026-11-26T06:05:00.000Z'
    );

    assert.equal(snapshot.isModelBased, true);
    assert.equal(snapshot.dataSource, 'open-meteo-air-quality');
    assert.equal(snapshot.usAqi, 77);
    assert.equal(snapshot.usCategory, 'Moderate');
    assert.equal(snapshot.europeanAqi, 44);
    assert.equal(snapshot.europeanCategory, 'Moderate');
    assert.equal(snapshot.modelTimeIso, '2026-11-26T06:00');
    assert.equal(snapshot.timezoneAbbreviation, 'GMT');
    assert.equal(snapshot.missingPollutantCount, 0);
    assert.equal(snapshot.dominantPollutant, 'PM2.5');
    assert.equal(snapshot.pollutants.length, 6);
    assert.equal(snapshot.pollutants.find((p) => p.id === 'co')?.unit, 'µg/m³');

    // Next 24 hours starting at current.time (06:00)
    assert.equal(snapshot.hourlyForecast.length, 24);
    assert.equal(snapshot.hourlyForecast[0].timeLabel, '06:00');

    // 5-day outlook aggregated across 120 hourly slots
    assert.equal(snapshot.dailyForecast.length, 5);
    assert.equal(snapshot.dailyForecast[0].dayLabel, 'Today');
    assert.equal(snapshot.dailyForecast[0].dateIso, '2026-11-26');
    assert.ok(snapshot.dailyForecast[0].usMinAqi !== null);
    assert.ok(snapshot.dailyForecast[0].usMaxAqi !== null);
  });

  it('preserves missing/null/NaN pollutant values without coercing to zero', () => {
    assert.equal(sanitizeMetricValue(null), null);
    assert.equal(sanitizeMetricValue(undefined), null);
    assert.equal(sanitizeMetricValue(Number.NaN), null);
    assert.equal(sanitizeMetricValue(-1), null);
    assert.equal(sanitizeMetricValue(0), 0);

    const raw: OpenMeteoAirQualityResponse = {
      latitude: 51.5,
      longitude: -0.12,
      current: {
        time: '2026-11-26T08:00',
        pm2_5: null,
        pm10: undefined,
        nitrogen_dioxide: 28.0,
        sulphur_dioxide: null,
        ozone: Number.NaN,
        carbon_monoxide: -10,
        european_aqi: null,
        us_aqi: null,
      },
      hourly: {
        time: ['2026-11-26T08:00', '2026-11-26T09:00'],
        pm2_5: [null, null],
        pm10: [null, 15.0],
        nitrogen_dioxide: [28.0, null],
        sulphur_dioxide: [null, null],
        ozone: [null, null],
        carbon_monoxide: [null, null],
        european_aqi: [null, 30],
        us_aqi: [null, 55],
      },
    };

    const snapshot = mapOpenMeteoToSnapshot(raw, SAMPLE_CITY);

    assert.equal(snapshot.usAqi, null);
    assert.equal(snapshot.usCategory, 'Unavailable');
    assert.equal(snapshot.europeanAqi, null);
    assert.equal(snapshot.europeanCategory, 'Unavailable');
    assert.equal(snapshot.missingPollutantCount, 5);
    assert.equal(snapshot.dominantPollutant, 'NO₂');

    const pm25 = snapshot.pollutants.find((p) => p.id === 'pm25');
    assert.equal(pm25?.value, null);
    assert.equal(pm25?.category, 'Unavailable');

    // Hourly slot 0 has null AQI; slot 1 has valid values
    assert.equal(snapshot.hourlyForecast.length, 2);
    assert.equal(snapshot.hourlyForecast[0].usAqi, null);
    assert.equal(snapshot.hourlyForecast[0].usCategory, 'Unavailable');
    assert.equal(snapshot.hourlyForecast[1].usAqi, 55);
    assert.equal(snapshot.hourlyForecast[1].europeanAqi, 30);

    // Daily aggregation skips null values instead of turning them into 0
    assert.equal(snapshot.dailyForecast.length, 1);
    assert.equal(snapshot.dailyForecast[0].usMinAqi, 55);
    assert.equal(snapshot.dailyForecast[0].usMaxAqi, 55);
    assert.equal(snapshot.dailyForecast[0].europeanMinAqi, 30);

    // Data-driven insights remain resilient when values are missing
    const insights = buildDataDrivenInsights(snapshot, 'us');
    assert.ok(insights.length >= 2);
  });

  it('handles empty hourly arrays and all-null pollutants safely', () => {
    assert.equal(
      deriveDominantPollutant({
        pm25: null,
        pm10: null,
        no2: null,
        o3: null,
        so2: null,
        co: null,
      }),
      null
    );

    const emptyRaw: OpenMeteoAirQualityResponse = {
      latitude: 0,
      longitude: 0,
    };

    assert.deepEqual(mapHourlyForecast24h(emptyRaw), []);
    assert.deepEqual(mapDailyForecast5d(emptyRaw), []);
  });
});

describe('Open-Meteo geocoding result mapping', () => {
  it('normalizes valid geocoding entries and filters malformed results', () => {
    const raw: OpenMeteoGeocodingResponse = {
      results: [
        {
          id: 1273294,
          name: 'Delhi',
          latitude: 28.65195,
          longitude: 77.23149,
          country: 'India',
          country_code: 'IN',
          admin1: 'Delhi',
          timezone: 'Asia/Kolkata',
        },
        {
          id: 999,
          name: 'Broken Entry',
          latitude: Number.NaN,
          longitude: 10,
        },
      ],
    };

    const mapped = mapOpenMeteoGeocodingResults(raw);
    assert.equal(mapped.length, 1);
    assert.equal(mapped[0].id, 'om-1273294');
    assert.equal(mapped[0].name, 'Delhi');
    assert.equal(mapped[0].country, 'India');
    assert.equal(mapped[0].latitude, 28.65195);

    assert.deepEqual(mapOpenMeteoGeocodingResults({}), []);
  });
});
