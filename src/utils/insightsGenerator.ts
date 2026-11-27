import type {
  AirQualitySnapshot,
  AqiStandard,
  InsightItem,
} from '../types/airQuality';
import {
  formatPollutantValue,
  getAqiMeta,
  getStandardLabel,
  getStandardShortLabel,
} from './aqiHelpers';

/**
 * Generates grounded, deterministic insights directly from a real Open-Meteo
 * AirQualitySnapshot (never fabricated AI prose or static demo readings).
 */
export function buildDataDrivenInsights(
  snapshot: AirQualitySnapshot,
  standard: AqiStandard
): InsightItem[] {
  const insights: InsightItem[] = [];
  const standardShort = getStandardShortLabel(standard);
  const standardFull = getStandardLabel(standard);
  const currentAqi =
    standard === 'european' ? snapshot.europeanAqi : snapshot.usAqi;
  const currentCategory =
    standard === 'european' ? snapshot.europeanCategory : snapshot.usCategory;
  const currentMeta = getAqiMeta(currentCategory, standard);

  // 1. Lowest vs Peak 24-hour window from real hourly forecast
  const validHours = snapshot.hourlyForecast
    .map((slot) => ({
      slot,
      aqi: standard === 'european' ? slot.europeanAqi : slot.usAqi,
    }))
    .filter((entry): entry is { slot: typeof entry.slot; aqi: number } =>
      typeof entry.aqi === 'number'
    );

  if (validHours.length > 0) {
    const cleanest = validHours.reduce((best, curr) =>
      curr.aqi < best.aqi ? curr : best
    );
    const peak = validHours.reduce((worst, curr) =>
      curr.aqi > worst.aqi ? curr : worst
    );

    insights.push({
      id: 'insight-24h-window',
      title: `Lowest modeled ${standardShort} window in ${snapshot.location.name}`,
      category: 'planning',
      categoryLabel: 'Planning',
      summary: `Across the next ${validHours.length} modeled hours, ${standardShort} ranges from ${cleanest.aqi} (${cleanest.slot.timeLabel}) up to ${peak.aqi} (${peak.slot.timeLabel}).`,
      referenceLabel: 'Lowest modeled hour',
      referenceValue: `${cleanest.slot.timeLabel} · ${cleanest.aqi} ${standardShort}`,
      actionGuidance:
        cleanest.aqi === peak.aqi
          ? 'Modeled levels remain relatively steady across the next 24 hours.'
          : `Schedule longer outdoor exertion or natural cross-ventilation closer to ${cleanest.slot.timeLabel} when modeled concentrations ease.`,
    });

    insights.push({
      id: 'insight-24h-peak',
      title: `Projected peak ${standardShort} window over the next 24 hours`,
      category: 'drivers',
      categoryLabel: 'Pollutant Drivers',
      summary: `Open-Meteo forecasts the highest composite ${standardShort} reading around ${peak.slot.timeLabel} (${peak.slot.dateLabel}), reaching ${peak.aqi} (${getAqiMeta(
        standard === 'european' ? peak.slot.europeanCategory : peak.slot.usCategory,
        standard
      ).label}).`,
      referenceLabel: 'Peak modeled hour',
      referenceValue: `${peak.slot.timeLabel} · ${peak.aqi} ${standardShort}`,
      actionGuidance: peak.slot.dominantPollutant
        ? `${peak.slot.dominantPollutant} shows the highest relative ratio against WHO guidelines during that hour.`
        : 'Monitor hourly breakdown as the peak window approaches.',
    });
  }

  // 2. WHO Guideline Exceedance Summary from real current pollutant measurements
  const availablePollutants = snapshot.pollutants.filter(
    (p) => p.value !== null
  );
  const elevatedPollutants = availablePollutants.filter(
    (p) => (p.value as number) > p.guidelineLimit
  );

  if (availablePollutants.length > 0) {
    const highest = availablePollutants.reduce((top, curr) =>
      (curr.value as number) / curr.guidelineLimit >
      (top.value as number) / top.guidelineLimit
        ? curr
        : top
    );

    insights.push({
      id: 'insight-who-comparison',
      title:
        elevatedPollutants.length > 0
          ? `${elevatedPollutants.length} of ${availablePollutants.length} measured pollutants exceed WHO reference limits`
          : `All ${availablePollutants.length} available pollutants are within WHO reference limits`,
      category: 'health',
      categoryLabel: 'Health & Exposure',
      summary: `${highest.symbol} (${formatPollutantValue(highest.value)} ${highest.unit}) is currently the highest concentration relative to its reference threshold (${highest.guidelineLabel}).`,
      referenceLabel: 'Highest relative pollutant',
      referenceValue: `${highest.symbol} · ${formatPollutantValue(highest.value)} ${highest.unit}`,
      actionGuidance: highest.healthContext,
    });
  }

  // 3. Particulate (PM2.5) vs Ozone (O3) balance
  const pm25 = snapshot.pollutants.find((p) => p.id === 'pm25');
  const o3 = snapshot.pollutants.find((p) => p.id === 'o3');
  if (pm25 && o3 && (pm25.value !== null || o3.value !== null)) {
    const pmRatio =
      pm25.value !== null ? pm25.value / pm25.guidelineLimit : -1;
    const o3Ratio = o3.value !== null ? o3.value / o3.guidelineLimit : -1;
    const isPmLed = pmRatio >= o3Ratio;

    insights.push({
      id: 'insight-pm-o3-balance',
      title: isPmLed
        ? 'Fine particulates (PM2.5) dominate over ground-level ozone'
        : 'Photochemical ozone (O₃) leads over fine particulate matter',
      category: 'drivers',
      categoryLabel: 'Pollutant Drivers',
      summary: `Current model snapshot shows PM2.5 at ${formatPollutantValue(pm25.value)} ${pm25.unit} versus O₃ at ${formatPollutantValue(o3.value)} ${o3.unit}.`,
      referenceLabel: 'PM2.5 / O₃ snapshot',
      referenceValue: `${formatPollutantValue(pm25.value)} / ${formatPollutantValue(o3.value)} ${pm25.unit}`,
      actionGuidance: isPmLed
        ? 'Fine particles respond well to indoor HEPA / MERV-13 filtration and well-fitted particulate masks outdoors.'
        : 'Ground-level ozone typically rises during sunny afternoon hours and drops indoors; plan strenuous runs earlier or later in the day.',
    });
  }

  // 4. 5-Day Forecast Trajectory Summary
  const validDays = snapshot.dailyForecast.filter((day) =>
    standard === 'european'
      ? day.europeanMaxAqi !== null
      : day.usMaxAqi !== null
  );

  if (validDays.length >= 2) {
    const cleanestDay = validDays.reduce((best, curr) => {
      const bestVal =
        standard === 'european'
          ? (best.europeanMaxAqi as number)
          : (best.usMaxAqi as number);
      const currVal =
        standard === 'european'
          ? (curr.europeanMaxAqi as number)
          : (curr.usMaxAqi as number);
      return currVal < bestVal ? curr : best;
    });

    const cleanestPeak =
      standard === 'european'
        ? cleanestDay.europeanMaxAqi
        : cleanestDay.usMaxAqi;

    insights.push({
      id: 'insight-5d-outlook',
      title: `Multi-day outlook across ${validDays.length} forecasted days`,
      category: 'planning',
      categoryLabel: 'Planning',
      summary: `${cleanestDay.dayLabel} (${cleanestDay.dateLabel}) shows the lowest projected daily peak at ${cleanestPeak} ${standardShort} across the current ${validDays.length}-day Open-Meteo model horizon.`,
      referenceLabel: 'Best forecasted day',
      referenceValue: `${cleanestDay.dayLabel} · Max ${cleanestPeak} ${standardShort}`,
      actionGuidance:
        'Model-based multi-day air quality forecasts carry greater uncertainty beyond 48 hours; re-check before scheduling prolonged outdoor events.',
    });
  }

  // 5. Data Provenance & Standard Transparency Card (always included)
  insights.push({
    id: 'insight-model-provenance',
    title: `Interpreting ${standardFull} model estimates`,
    category: 'health',
    categoryLabel: 'Health & Exposure',
    summary:
      snapshot.missingPollutantCount > 0
        ? `Open-Meteo returned atmospheric model values with ${snapshot.missingPollutantCount} missing pollutant field(s) marked Unavailable. Current ${standardShort} is ${currentAqi ?? 'Unavailable'} (${currentMeta.label}).`
        : `Open-Meteo blends atmospheric composition models (CAMS & regional grids) rather than physical CPCB or street-level sensors. Current ${standardShort} is ${currentAqi ?? 'Unavailable'} (${currentMeta.label}).`,
    referenceLabel: 'Active standard',
    referenceValue: `${standardShort} · Model-based`,
    actionGuidance:
      'Use model-based estimates for regional trends and hourly planning while keeping in mind hyper-local traffic corridors can differ from grid averages.',
  });

  return insights;
}
