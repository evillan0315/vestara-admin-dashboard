import path from 'path';
import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/request-logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import routes from './routes/index.js';
import { API_PREFIX } from '@vestara/constants';

// ── BigInt JSON Serialization ──────────────────────────────────────────────
// Prisma returns `BigInt` for fields like File.size. Node's JSON.stringify
// throws "Do not know how to serialize a BigInt" by default. This polyfill
// converts BigInt to a number (or string for very large values) during
// serialization so Express's res.json() works with Prisma BigInt fields.
if (typeof (BigInt.prototype as unknown as Record<string, unknown>).toJSON !== 'function') {
  (BigInt.prototype as unknown as Record<string, unknown>).toJSON = function () {
    const n = BigInt(this as unknown as bigint);
    // For files, size in bytes fits well within Number.MAX_SAFE_INTEGER
    // (9 PB), so converting to number is safe. Fall back to string for
    // truly astronomical values.
    return n > Number.MAX_SAFE_INTEGER ? n.toString() : Number(n);
  };
}

export function createApp(): express.Application {
  const app = express();

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // CORS — allow known origins + any Vercel deployment
  const allowedOrigins = [
    process.env.CORS_ORIGIN,
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:5000',
  ].filter(Boolean) as string[];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (server-to-server, curl, etc.)
        if (!origin) return callback(null, true);

        // Allow any Vercel deployment
        if (origin.endsWith('.vercel.app')) return callback(null, true);

        // Allow configured origins
        if (allowedOrigins.some((o) => origin === o)) return callback(null, true);

        callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Serve local uploaded files at /api/files/ (used by LocalStorageProvider in dev)
  app.use(
    '/api/files',
    express.static(path.resolve(process.cwd(), 'uploads'), {
      maxAge: '1d',
      setHeaders: (res: express.Response) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      },
    }),
  );

  // Request logging
  app.use(requestLogger);

  // Routes
  app.use(API_PREFIX, routes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}

export default createApp;
