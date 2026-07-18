import { Router, type Request, type Response } from 'express';
import {
  getPercentiles,
  getRouteStats,
  getSystemMetrics,
  getActiveWsConnections,
  formatBytes,
} from '../utils/metrics.js';
import { sendSuccess } from '../utils/response.js';
import { requireRole } from '../middleware/authenticate.js';
import { UserRole } from '@vestara/types';

const router = Router();

/**
 * GET /metrics — Prometheus-compatible metrics endpoint.
 * Returns system metrics, request percentiles, and route breakdown.
 * Accessible to authenticated ADMIN/SUPER_ADMIN users.
 */
router.get('/metrics', requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), (_req: Request, res: Response) => {
  const percentiles = getPercentiles(5);
  const routes = getRouteStats(5);
  const system = getSystemMetrics();

  // Prometheus text format
  const lines: string[] = [
    '# HELP vestara_http_requests_total Total number of HTTP requests',
    '# TYPE vestara_http_requests_total counter',
    `vestara_http_requests_total ${percentiles.totalRequests}`,
    '',
    '# HELP vestara_http_errors_total Total number of HTTP errors (4xx + 5xx)',
    '# TYPE vestara_http_errors_total counter',
    `vestara_http_errors_total ${percentiles.totalErrors}`,
    '',
    '# HELP vestara_http_error_rate Percentage of requests that resulted in errors',
    '# TYPE vestara_http_error_rate gauge',
    `vestara_http_error_rate ${percentiles.errorRate}`,
    '',
    '# HELP vestara_http_request_duration_ms Request duration percentiles',
    '# TYPE vestara_http_request_duration_ms gauge',
    `vestara_http_request_duration_ms{quantile="0.5"} ${percentiles.p50}`,
    `vestara_http_request_duration_ms{quantile="0.95"} ${percentiles.p95}`,
    `vestara_http_request_duration_ms{quantile="0.99"} ${percentiles.p99}`,
    `vestara_http_request_duration_ms{quantile="avg"} ${percentiles.avgMs}`,
    '',
    '# HELP vestara_http_requests_per_second Current request throughput',
    '# TYPE vestara_http_requests_per_second gauge',
    `vestara_http_requests_per_second ${percentiles.requestsPerSecond}`,
    '',
    '# HELP vestara_ws_active_connections Active WebSocket connections',
    '# TYPE vestara_ws_active_connections gauge',
    `vestara_ws_active_connections ${getActiveWsConnections()}`,
    '',
    '# HELP vestara_process_uptime_seconds Process uptime in seconds',
    '# TYPE vestara_process_uptime_seconds gauge',
    `vestara_process_uptime_seconds ${system.uptime}`,
    '',
    '# HELP vestara_process_memory_bytes Process memory usage',
    '# TYPE vestara_process_memory_bytes gauge',
    `vestara_process_memory_bytes{type="heapUsed"} ${system.memory.heapUsed}`,
    `vestara_process_memory_bytes{type="heapTotal"} ${system.memory.heapTotal}`,
    `vestara_process_memory_bytes{type="rss"} ${system.memory.rss}`,
    `vestara_process_memory_bytes{type="external"} ${system.memory.external}`,
    '',
  ];

  // Per-route metrics
  lines.push('# HELP vestara_route_requests_total Requests per route');
  lines.push('# TYPE vestara_route_requests_total counter');
  for (const route of routes) {
    const escapedRoute = route.route.replace(/"/g, '\\"');
    lines.push(`vestara_route_requests_total{route="${escapedRoute}"} ${route.count}`);
  }
  lines.push('');

  lines.push('# HELP vestara_route_duration_ms Average duration per route');
  lines.push('# TYPE vestara_route_duration_ms gauge');
  for (const route of routes) {
    const escapedRoute = route.route.replace(/"/g, '\\"');
    lines.push(`vestara_route_duration_ms{route="${escapedRoute}"} ${route.avgMs}`);
  }
  lines.push('');

  lines.push('# HELP vestara_route_error_rate Error rate per route');
  lines.push('# TYPE vestara_route_error_rate gauge');
  for (const route of routes) {
    const escapedRoute = route.route.replace(/"/g, '\\"');
    lines.push(`vestara_route_error_rate{route="${escapedRoute}"} ${route.errorRate}`);
  }

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(lines.join('\n'));
});

/**
 * GET /metrics/json — JSON format for the frontend dashboard.
 */
router.get(
  '/metrics/json',
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  (_req: Request, res: Response) => {
    const percentiles = getPercentiles(5);
    const routes = getRouteStats(5);
    const system = getSystemMetrics();

    sendSuccess(res, {
      percentiles,
      routes,
      system: {
        ...system,
        memoryFormatted: {
          heapUsed: formatBytes(system.memory.heapUsed),
          heapTotal: formatBytes(system.memory.heapTotal),
          rss: formatBytes(system.memory.rss),
          external: formatBytes(system.memory.external),
        },
      },
      activeWsConnections: getActiveWsConnections(),
      timestamp: new Date().toISOString(),
    });
  },
);

export default router;
