import { Router, type Request, type Response } from 'express';
import { sendSuccess } from '../utils/response.js';
import { getPercentiles, getSystemMetrics, getActiveWsConnections } from '../utils/metrics.js';
import { prisma } from '../utils/prisma.js';

const router = Router();

/**
 * Basic health check — fast, no dependencies.
 * Used by load balancers / uptime monitors.
 */
router.get('/health', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * Deep health check — verifies DB connectivity, memory, and process state.
 * Returns 'healthy', 'degraded', or 'unhealthy'.
 */
router.get('/health/deep', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // ── Database check ──
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'healthy', latencyMs: Date.now() - dbStart };
  } catch (err) {
    checks.database = {
      status: 'unhealthy',
      latencyMs: Date.now() - dbStart,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
    overallStatus = 'unhealthy';
  }

  // ── Memory check ──
  const mem = process.memoryUsage();
  const heapUsedMB = mem.heapUsed / (1024 * 1024);
  const rssMB = mem.rss / (1024 * 1024);
  const heapUsedPercent = (mem.heapUsed / mem.heapTotal) * 100;

  checks.memory = {
    status: heapUsedPercent > 90 ? 'unhealthy' : heapUsedPercent > 75 ? 'degraded' : 'healthy',
    latencyMs: Math.round(heapUsedMB),
  };

  if (heapUsedPercent > 90 && overallStatus !== 'unhealthy') {
    overallStatus = 'degraded';
  }

  // ── Uptime check ──
  const uptimeSeconds = process.uptime();
  checks.uptime = {
    status: uptimeSeconds > 0 ? 'healthy' : 'unhealthy',
    latencyMs: Math.round(uptimeSeconds),
  };

  // ── Metrics summary ──
  const metrics = getPercentiles(5);

  sendSuccess(res, {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: uptimeSeconds,
    environment: process.env.NODE_ENV || 'development',
    checks,
    metrics: {
      p50: metrics.p50,
      p95: metrics.p95,
      p99: metrics.p99,
      avgMs: metrics.avgMs,
      totalRequests: metrics.totalRequests,
      errorRate: metrics.errorRate,
      requestsPerSecond: metrics.requestsPerSecond,
      activeWsConnections: getActiveWsConnections(),
    },
    system: {
      heapUsed: `${Math.round(heapUsedMB)} MB`,
      heapTotal: `${Math.round(mem.heapTotal / (1024 * 1024))} MB`,
      rss: `${Math.round(rssMB)} MB`,
      heapUsedPercent: `${Math.round(heapUsedPercent)}%`,
      nodeVersion: process.version,
      pid: process.pid,
    },
  });
});

export default router;
