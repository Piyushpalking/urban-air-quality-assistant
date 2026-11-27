import type {
  AirQualitySnapshot,
  AqiStandard,
  AssistantApiErrorResponse,
  AssistantApiRequest,
  AssistantApiSuccessResponse,
} from '../types/airQuality';

export const ASSISTANT_API_ENDPOINT = '/api/assistant';
const ASSISTANT_CLIENT_TIMEOUT_MS = 30_000;

export class AssistantClientError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    code: string,
    status?: number,
    retryAfterSeconds?: number
  ) {
    super(message);
    this.name = 'AssistantClientError';
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function buildAssistantRequestPayload(
  question: string,
  snapshot: AirQualitySnapshot,
  aqiStandard: AqiStandard
): AssistantApiRequest {
  return {
    question: question.trim(),
    aqiStandard,
    location: {
      name: snapshot.location.name,
      admin1: snapshot.location.admin1,
      country: snapshot.location.country,
      latitude: snapshot.location.latitude,
      longitude: snapshot.location.longitude,
    },
    snapshot: {
      dataSource: snapshot.dataSource,
      isModelBased: true,
      modelTimeIso: snapshot.modelTimeIso,
      timezone: snapshot.timezone,
      timezoneAbbreviation: snapshot.timezoneAbbreviation,
      fetchedAtIso: snapshot.fetchedAtIso,
      usAqi: snapshot.usAqi,
      europeanAqi: snapshot.europeanAqi,
      dominantPollutant: snapshot.dominantPollutant,
      pollutants: snapshot.pollutants.map((pollutant) => ({
        symbol: pollutant.symbol,
        name: pollutant.name,
        value: pollutant.value,
        unit: pollutant.unit,
        guidelineLimit: pollutant.guidelineLimit,
        guidelineLabel: pollutant.guidelineLabel,
      })),
      hourlyForecast24h: snapshot.hourlyForecast.map((slot) => ({
        timeLabel: slot.timeLabel,
        dateLabel: slot.dateLabel,
        usAqi: slot.usAqi,
        europeanAqi: slot.europeanAqi,
        dominantPollutant: slot.dominantPollutant,
      })),
      dailyForecast5d: snapshot.dailyForecast.map((day) => ({
        dayLabel: day.dayLabel,
        dateLabel: day.dateLabel,
        usMinAqi: day.usMinAqi,
        usMaxAqi: day.usMaxAqi,
        europeanMinAqi: day.europeanMinAqi,
        europeanMaxAqi: day.europeanMaxAqi,
        dominantPollutant: day.dominantPollutant,
      })),
    },
  };
}

/**
 * Calls the server-side `/api/assistant` endpoint (Netlify Function in production / Express in dev).
 * Never accesses or transmits a Gemini API key from the browser.
 * Never fabricates fallback responses when the backend is unavailable or returns an error.
 */
export async function askAirQualityAssistant(
  payload: AssistantApiRequest,
  options: { signal?: AbortSignal } = {}
): Promise<AssistantApiSuccessResponse> {
  const controller = new AbortController();
  let didTimeout = false;

  const timeoutId = window.setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, ASSISTANT_CLIENT_TIMEOUT_MS);

  const onExternalAbort = () => controller.abort();
  if (options.signal) {
    if (options.signal.aborted) {
      window.clearTimeout(timeoutId);
      throw new AssistantClientError('Request cancelled.', 'ABORTED');
    }
    options.signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    const response = await fetch(ASSISTANT_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const body = isJson
      ? ((await response.json()) as
          | AssistantApiSuccessResponse
          | AssistantApiErrorResponse)
      : null;

    if (!response.ok) {
      const apiError =
        body && 'error' in body && body.error ? body.error : null;
      const retryHeader = response.headers.get('retry-after');
      const retryAfterSeconds =
        apiError?.retryAfterSeconds ??
        (retryHeader ? Number.parseInt(retryHeader, 10) || undefined : undefined);

      throw new AssistantClientError(
        apiError?.message ||
          `Assistant backend returned HTTP ${response.status}.`,
        apiError?.code || 'HTTP_ERROR',
        response.status,
        retryAfterSeconds
      );
    }

    if (
      !body ||
      !('answer' in body) ||
      typeof body.answer !== 'string' ||
      body.answer.trim().length === 0
    ) {
      throw new AssistantClientError(
        'Assistant backend returned an unexpected empty response.',
        'INVALID_RESPONSE',
        response.status
      );
    }

    return body;
  } catch (error) {
    if (error instanceof AssistantClientError) {
      throw error;
    }
    if (
      (error instanceof DOMException || error instanceof Error) &&
      error.name === 'AbortError'
    ) {
      if (didTimeout) {
        throw new AssistantClientError(
          'Assistant request timed out after 30 seconds. Please try again.',
          'CLIENT_TIMEOUT'
        );
      }
      throw new AssistantClientError('Request cancelled.', 'ABORTED');
    }

    throw new AssistantClientError(
      'Unable to reach /api/assistant. Verify the backend server or Netlify Function is running and retry.',
      'NETWORK_ERROR'
    );
  } finally {
    window.clearTimeout(timeoutId);
    if (options.signal) {
      options.signal.removeEventListener('abort', onExternalAbort);
    }
  }
}
