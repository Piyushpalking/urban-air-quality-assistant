import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildCorsHeaders,
  handleAssistantRequest,
  verifyRequestOrigin,
} from './server/assistantCore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number.parseInt(process.env.PORT || '3000', 10);

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown-client';
}

function getRequestHost(req: express.Request): string | null {
  const forwardedHost = req.headers['x-forwarded-host'];
  if (typeof forwardedHost === 'string' && forwardedHost.trim().length > 0) {
    return forwardedHost;
  }
  if (typeof req.headers.host === 'string' && req.headers.host.trim().length > 0) {
    return req.headers.host;
  }
  return null;
}

export async function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Baseline security headers on all responses
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
    next();
  });

  app.use(express.json({ limit: '32kb' }));

  // Malformed JSON or oversized payload error handler (no stack traces leaked)
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      const errObj = err as { type?: string; status?: number } | null;
      if (errObj?.type === 'entity.too.large' || errObj?.status === 413) {
        res.status(413).set('Cache-Control', 'no-store').json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request payload exceeds maximum allowed size.',
          },
        });
        return;
      }
      if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).set('Cache-Control', 'no-store').json({
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must contain valid JSON.',
          },
        });
        return;
      }
      next(err);
    }
  );

  // Server-side AI Assistant endpoint (mirrors netlify/functions/assistant.ts)
  app.all('/api/assistant', async (req, res) => {
    try {
      const originCheck = verifyRequestOrigin({
        origin: typeof req.headers.origin === 'string' ? req.headers.origin : null,
        requestHost: getRequestHost(req),
      });

      if (!originCheck.allowed) {
        res
          .status(403)
          .set('Vary', 'Origin')
          .set('Cache-Control', 'no-store')
          .json({
            error: {
              code: 'ORIGIN_NOT_ALLOWED',
              message: 'Cross-origin requests from this origin are not permitted.',
            },
          });
        return;
      }

      const corsHeaders = buildCorsHeaders(originCheck.corsOrigin);
      for (const [k, v] of Object.entries(corsHeaders)) {
        res.setHeader(k, v);
      }

      if (req.method === 'OPTIONS') {
        res.status(204).set('Cache-Control', 'no-store').end();
        return;
      }

      if (req.method !== 'POST') {
        res
          .status(405)
          .set('Allow', 'POST, OPTIONS')
          .set('Cache-Control', 'no-store')
          .json({
            error: {
              code: 'METHOD_NOT_ALLOWED',
              message: 'Only POST requests are supported on /api/assistant.',
            },
          });
        return;
      }

      const contentType = (req.headers['content-type'] || '').toLowerCase();
      if (!contentType.includes('application/json')) {
        res.status(415).set('Cache-Control', 'no-store').json({
          error: {
            code: 'UNSUPPORTED_MEDIA_TYPE',
            message: 'Content-Type must be application/json.',
          },
        });
        return;
      }

      const result = await handleAssistantRequest(req.body, getClientIp(req), {
        corsOrigin: originCheck.corsOrigin,
      });

      for (const [headerName, headerValue] of Object.entries(result.headers)) {
        res.setHeader(headerName, headerValue);
      }
      res.status(result.status).json(result.body);
    } catch {
      res.status(500).set('Cache-Control', 'no-store').json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected server error occurred. Please try again shortly.',
        },
      });
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  // Final safe error handler ensuring no stack traces are ever returned
  app.use(
    (
      _err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      if (res.headersSent) return;
      res.status(500).set('Cache-Control', 'no-store').json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected server error occurred.',
        },
      });
    }
  );

  return app;
}

const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectExecution) {
  createApp()
    .then((app) => {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(
          `Urban Air Quality Assistant server running on http://0.0.0.0:${PORT}`
        );
      });
    })
    .catch((err) => {
      console.error(
        'Failed to start server:',
        err instanceof Error ? err.message : 'Unknown error'
      );
      process.exit(1);
    });
}
