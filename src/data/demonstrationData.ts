import type { AssistantPromptTemplate } from '../types/airQuality';

/**
 * Non-telemetry UI constants (starter prompt templates & basemap surface asset).
 * All air quality measurements and forecasts are fetched live from the
 * Open-Meteo Air Quality API via `src/services/airQualityService.ts`.
 */

export const BASEMAP_TEXTURE_URL =
  '/src/assets/images/urban_dark_basemap_1795710279041.jpg';

export const ASSISTANT_PROMPT_TEMPLATES: AssistantPromptTemplate[] = [
  {
    id: 'prompt-outdoor-window',
    category: 'Outdoor Activity',
    label: 'Best outdoor workout window',
    prompt:
      'Based on the Open-Meteo pollutant breakdown and 24-hour forecast, which time window has the lowest modeled air quality risk for a 45-minute outdoor run?',
  },
  {
    id: 'prompt-dominant-driver',
    category: 'Pollutant Drivers',
    label: 'Explain dominant pollutant',
    prompt:
      'What are the typical urban sources of the highest-ratio pollutant in this city, and how does the 24-hour trajectory shift through the day?',
  },
  {
    id: 'prompt-sensitive-guidance',
    category: 'Health Guidance',
    label: 'Sensitive group precautions',
    prompt:
      'Provide concise indoor ventilation and outdoor exertion precautions for someone with asthma under these modeled air quality conditions.',
  },
  {
    id: 'prompt-forecast-summary',
    category: 'Forecast Interpretation',
    label: '5-day outlook summary',
    prompt:
      'Summarize the 5-day Open-Meteo forecast trajectory and highlight any days where modeled AQI rises into elevated categories.',
  },
];
