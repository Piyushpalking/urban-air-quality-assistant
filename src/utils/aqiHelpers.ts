import type { AqiCategory } from '../types/airQuality';

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

export const EPA_AQI_BANDS: AqiScaleMeta[] = [
  {
    category: 'Good',
    label: 'Good',
    shortLabel: 'Good',
    range: '0–50',
    accentHex: '#22C55E',
    textClass: 'text-[#4ADE80]',
    barClass: 'bg-[#22C55E]',
    borderClass: 'border-[#22C55E]/40',
    guidance: 'Air quality poses minimal risk for outdoor activity across general populations.',
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
    guidance: 'Acceptable overall; unusually sensitive individuals may reduce prolonged heavy exertion.',
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
    guidance: 'Sensitive groups (asthma, children, older adults) should limit prolonged outdoor exertion.',
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
    guidance: 'Everyone may experience effects; shift strenuous outdoor exercise indoors where possible.',
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
    guidance: 'Health alert: significantly elevated risk for all groups; minimize outdoor exposure.',
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
    guidance: 'Emergency conditions: avoid outdoor activity and rely on filtered indoor air.',
  },
];

export function getAqiMeta(category: AqiCategory): AqiScaleMeta {
  return EPA_AQI_BANDS.find((band) => band.category === category) ?? EPA_AQI_BANDS[1];
}

export function getAqiPercentOfScale(aqi: number): number {
  const clamped = Math.max(0, Math.min(300, aqi));
  return Math.round((clamped / 300) * 100);
}
