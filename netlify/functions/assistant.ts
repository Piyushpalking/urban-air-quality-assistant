import {
  buildCorsHeaders,
  handleAssistantRequest,
  verifyRequestOrigin,
} from '../../server/assistantCore.js';

const MAX_BODY_BYTES = 32_768;

function extractClientIp(request: Request): string {
  // Prefer Netlify's authoritative client IP header (cannot be spoofed by callers)
  const netlifyIp = request.headers.get('x-nf-client-connection-ip');
  if (netlifyIp) return netlifyIp.trim();

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  return 'unknown-client';
}

function extractRequestHost(request: Request): string | null {
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (forwardedHost) return forwardedHost;
  const hostHeader = request.headers.get('host');
  if (hostHeader) return hostHeader;
  try {
    return new URL(request.url).host;
  } catch {
    return null;
  }
}

function jsonResponse(
  status: number,
  body: unknown,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      ...extraHeaders,
    },
  });
}

/**
 * Netlify Serverless Function (Functions 2.0 Web Request/Response handler)
 * Mapped from `/api/assistant` via `netlify.toml`.
 * Enforces Origin/CORS allowlisting, JSON Content-Type, payload bounds,
 * input validation, rate limiting, and server-only GEMINI_API_KEY access.
 */
export default async function handler(request: Request): Promise<Response> {
  try {
    const originCheck = verifyRequestOrigin({
      origin: request.headers.get('origin'),
      requestHost: extractRequestHost(request),
    });

    if (!originCheck.allowed) {
      return jsonResponse(
        403,
        {
          error: {
            code: 'ORIGIN_NOT_ALLOWED',
            message: 'Cross-origin requests from this origin are not permitted.',
          },
        },
        { Vary: 'Origin' }
      );
    }

    const corsHeaders = buildCorsHeaders(originCheck.corsOrigin);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-store',
        },
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse(
        405,
        {
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: 'Only POST requests are supported on /api/assistant.',
          },
        },
        {
          ...corsHeaders,
          Allow: 'POST, OPTIONS',
        }
      );
    }

    const contentType = (request.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('application/json')) {
      return jsonResponse(
        415,
        {
          error: {
            code: 'UNSUPPORTED_MEDIA_TYPE',
            message: 'Content-Type must be application/json.',
          },
        },
        corsHeaders
      );
    }

    const contentLengthHeader = request.headers.get('content-length');
    if (contentLengthHeader) {
      const length = Number.parseInt(contentLengthHeader, 10);
      if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
        return jsonResponse(
          413,
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Request payload is too large.',
            },
          },
          corsHeaders
        );
      }
    }

    let parsedBody: unknown;
    try {
      const rawText = await request.text();
      if (rawText.length > MAX_BODY_BYTES) {
        return jsonResponse(
          413,
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Request payload exceeds maximum allowed size.',
            },
          },
          corsHeaders
        );
      }
      parsedBody = JSON.parse(rawText);
    } catch {
      return jsonResponse(
        400,
        {
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must contain valid JSON.',
          },
        },
        corsHeaders
      );
    }

    const clientIp = extractClientIp(request);
    const result = await handleAssistantRequest(parsedBody, clientIp, {
      corsOrigin: originCheck.corsOrigin,
    });

    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: result.headers,
    });
  } catch {
    return jsonResponse(500, {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected server error occurred. Please try again shortly.',
      },
    });
  }
}
