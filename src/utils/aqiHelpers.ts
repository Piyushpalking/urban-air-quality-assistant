import type {
  AqiCategory,
  AqiStandard,
  CityLocation,
} from '../types/airQuality';

export interface AqiScaleMeta {
  category: AqiCategory;
  label: string;
  shortLabel: string;
  range: string;
  accentHex: string;
  textClass: string;
  barClass: string;
  borderClass: string;
  guidance: string;
}

export const UNAVAILABLE_AQI_META: AqiScaleMeta = {
  category: 'Unavailable',
  label: 'Unavailable',
  shortLabel: 'N/A',
  range: '—',
  accentHex: '#64748B',
  textClass: 'text-[#94A3B8]',
  barClass: 'bg-[#475569]',
  borderClass: 'border-[#334155]',
  guidance:
    'No valid model value was returned for this indicator at the current timestamp.',
};

export const US_EPA_AQI_BANDS: AqiScaleMeta[] = [
  {
    category: 'Good',
    label: 'Good',
    shortLabel: 'Good',
    range: '0–50',
    accentHex: '#22C55E',
    textClass: 'text-[#4ADE80]',
    barClass: 'bg-[#22C55E]',
    borderClass: 'border-[#22C55E]/40',
    guidance:
      'Air quality poses minimal risk for outdoor activity across general populations.',
  },
  {
    category: 'Moderate',
    label: 'Moderate',
    shortLabel: 'Moderate',
    range: '51–100',
    accentHex: '#EAB308',
    textClass: 'text-[#FACC15]',
    barClass: 'bg-[#EAB308]',
    borderClass: 'border-[#EAB308]/40',
    guidance:
      'Acceptable overall; unusually sensitive individuals may reduce prolonged heavy exertion.',
  },
  {
    category: 'Sensitive',
    label: 'Unhealthy for Sensitive Groups',
    shortLabel: 'Sensitive',
    range: '101–150',
    accentHex: '#F97316',
    textClass: 'text-[#FB923C]',
    barClass: 'bg-[#F97316]',
    borderClass: 'border-[#F97316]/40',
    guidance:
      'Sensitive groups (asthma, children, older adults) should limit prolonged outdoor exertion.',
  },
  {
    category: 'Unhealthy',
    label: 'Unhealthy',
    shortLabel: 'Unhealthy',
    range: '151–200',
    accentHex: '#EF4444',
    textClass: 'text-[#F87171]',
    barClass: 'bg-[#EF4444]',
    borderClass: 'border-[#EF4444]/40',
    guidance:
      'Everyone may experience effects; shift strenuous outdoor exercise indoors where possible.',
  },
  {
    category: 'Very Unhealthy',
    label: 'Very Unhealthy',
    shortLabel: 'Very Unhealthy',
    range: '201–300',
    accentHex: '#C084FC',
    textClass: 'text-[#D8B4FE]',
    barClass: 'bg-[#A855F7]',
    borderClass: 'border-[#A855F7]/40',
    guidance:
      'Health alert: significantly elevated risk for all groups; minimize outdoor exposure.',
  },
  {
    category: 'Hazardous',
    label: 'Hazardous',
    shortLabel: 'Hazardous',
    range: '301–500',
    accentHex: '#FB7185',
    textClass: 'text-[#FDA4AF]',
    barClass: 'bg-[#E11D48]',
    borderClass: 'border-[#E11D48]/40',
    guidance:
      'Emergency conditions: avoid outdoor activity and rely on filtered indoor air.',
  },
];

export const EUROPEAN_AQI_BANDS: AqiScaleMeta[] = [
  {
    category: 'Good',
    label: 'Good',
    shortLabel: 'Good',
    range: '0–20',
    accentHex: '#22C55E',
    textClass: 'text-[#4ADE80]',
    barClass: 'bg-[#22C55E]',
    borderClass: 'border-[#22C55E]/40',
    guidance: 'Good air quality suitable for normal outdoor activities.',
  },
  {
    category: 'Fair',
    label: 'Fair',
    shortLabel: 'Fair',
    range: '21–40',
    accentHex: '#14B8A6',
    textClass: 'text-[#2DD4BF]',
    barClass: 'bg-[#14B8A6]',
    borderClass: 'border-[#14B8A6]/40',
    guidance: 'Fair overall air quality with low risk for most people.',
  },
  {
    category: 'Moderate',
    label: 'Moderate',
    shortLabel: 'Moderate',
    range: '41–60',
    accentHex: '#EAB308',
    textClass: 'text-[#FACC15]',
    barClass: 'bg-[#EAB308]',
    borderClass: 'border-[#EAB308]/40',
    guidance:
      'Consider reducing prolonged vigorous outdoor activity if you experience respiratory symptoms.',
  },
  {
    category: 'Poor',
    label: 'Poor',
    shortLabel: 'Poor',
    range: '61–80',
    accentHex: '#F97316',
    textClass: 'text-[#FB923C]',
    barClass: 'bg-[#F97316]',
    borderClass: 'border-[#F97316]/40',
    guidance:
      'Sensitive groups should limit outdoor exertion; general population should pace intense activity.',
  },
  {
    category: 'Very Poor',
    label: 'Very Poor',
    shortLabel: 'Very Poor',
    range: '81–100',
    accentHex: '#EF4444',
    textClass: 'text-[#F87171]',
    barClass: 'bg-[#EF4444]',
    borderClass: 'border-[#EF4444]/40',
    guidance:
      'Avoid strenuous outdoor activities and keep indoor air filtered where feasible.',
  },
  {
    category: 'Extremely Poor',
    label: 'Extremely Poor',
    shortLabel: 'Extreme',
    range: '100+',
    accentHex: '#C084FC',
    textClass: 'text-[#D8B4FE]',
    barClass: 'bg-[#A855F7]',
    borderClass: 'border-[#A855F7]/40',
    guidance:
      'Severe modeled pollution level: avoid outdoor physical exertion and minimize exposure.',
  },
];

// Keep backwards-compatible alias
export const EPA_AQI_BANDS = US_EPA_AQI_BANDS;

export function getAqiBandsForStandard(standard: AqiStandard): AqiScaleMeta[] {
  return standard === 'european' ? EUROPEAN_AQI_BANDS : US_EPA_AQI_BANDS;
}

export function getStandardLabel(standard: AqiStandard): string {
  return standard === 'european' ? 'European AQI (EAQI)' : 'US EPA AQI';
}

export function getStandardShortLabel(standard: AqiStandard): string {
  return standard === 'european' ? 'EU AQI' : 'US AQI';
}

export function getStandardScaleRange(standard: AqiStandard): string {
  return standard === 'european' ? '0–100+' : '0–500';
}

export function classifyUsAqi(value: number | null | undefined): AqiCategory {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return 'Unavailable';
  }
  if (value <= 50) return 'Good';
  if (value <= 100) return 'Moderate';
  if (value <= 150) return 'Sensitive';
  if (value <= 200) return 'Unhealthy';
  if (value <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

export function classifyEuropeanAqi(
  value: number | null | undefined
): AqiCategory {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return 'Unavailable';
  }
  if (value <= 20) return 'Good';
  if (value <= 40) return 'Fair';
  if (value <= 60) return 'Moderate';
  if (value <= 80) return 'Poor';
  if (value <= 100) return 'Very Poor';
  return 'Extremely Poor';
}

export function getAqiMeta(
  category: AqiCategory,
  standard: AqiStandard = 'us'
): AqiScaleMeta {
  if (category === 'Unavailable') {
    return UNAVAILABLE_AQI_META;
  }
  const bands = getAqiBandsForStandard(standard);
  const direct = bands.find((band) => band.category === category);
  if (direct) return direct;

  const fallback =
    US_EPA_AQI_BANDS.find((band) => band.category === category) ??
    EUROPEAN_AQI_BANDS.find((band) => band.category === category);
  return fallback ?? UNAVAILABLE_AQI_META;
}

export function getAqiPercentOfScale(
  aqi: number | null,
  standard: AqiStandard = 'us'
): number {
  if (typeof aqi !== 'number' || !Number.isFinite(aqi) || aqi < 0) {
    return 0;
  }
  const refMax = standard === 'european' ? 120 : 300;
  const clamped = Math.max(0, Math.min(refMax, aqi));
  return Math.round((clamped / refMax) * 100);
}

export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}° ${latDir}, ${Math.abs(lon).toFixed(2)}° ${lonDir}`;
}

export function formatCitySubtitle(location: CityLocation): string {
  const parts = [location.admin1, location.country].filter(Boolean);
  return parts.join(', ');
}

export function formatModelTimestamp(
  isoTime: string | null,
  timezoneAbbreviation?: string
): string {
  if (!isoTime) {
    return 'Timestamp unavailable';
  }
  const [datePart, timePart] = isoTime.split('T');
  if (!datePart || !timePart) {
    return isoTime;
  }
  const cleanTime = timePart.slice(0, 5);
  return timezoneAbbreviation
    ? `${datePart} ${cleanTime} ${timezoneAbbreviation}`
    : `${datePart} ${cleanTime}`;
}

export function formatLastUpdated(isoTimestamp: string | null): string {
  if (!isoTimestamp) {
    return 'Not yet updated';
  }
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) {
    return isoTimestamp;
  }
  return parsed.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatPollutantValue(value: number | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '—';
  }
  if (value >= 100) {
    return value.toFixed(0);
  }
  return value.toFixed(1);
}
