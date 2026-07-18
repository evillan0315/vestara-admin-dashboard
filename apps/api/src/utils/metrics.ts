/**
 * Lightweight in-process metrics collector.
 *
 * Tracks request counts, response times (with percentiles), error rates,
 * and active connections — no external dependencies required.
 *
 * Data is stored in memory and rotated every minute to prevent unbounded
 * growth. The `/metrics` endpoint exposes a Prometheus-compatible text
 * format; the `/health` deep probe uses the same data for status.
 */

// ── Histogram bucket boundaries (ms) ──────────────────────────────────────
const LATENCY_BUCKETS = [10, 25, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

interface RequestBucket {
  count: number;
  totalMs: number;
  /** Number of buckets that match LATENCY_BUCKETS */
  bucketCounts: number[];
  statusCodes: Record<number, number>;
}

interface MinuteSnapshot {
  timestamp: number;
  totalRequests: number;
  totalErrors: number;
  totalDurationMs: number;
  /** Per-route breakdown */
  routes: Map<string, RequestBucket>;
}

let currentMinute = createEmptySnapshot();
const history: MinuteSnapshot[] = [];
const MAX_HISTORY_MINUTES = 60;

/** Track active WebSocket connections */
let activeWsConnections = 0;

function createEmptySnapshot(): MinuteSnapshot {
  return {
    timestamp: Date.now(),
    totalRequests: 0,
    totalErrors: 0,
    totalDurationMs: 0,
    routes: new Map(),
  };
}

function getCurrentMinute(): MinuteSnapshot {
  const now = Date.now();
  const minuteAligned = Math.floor(now / 60_000) * 60_000;

  if (currentMinute.timestamp !== minuteAligned) {
    // Rotate current snapshot into history
    history.push(currentMinute);
    if (history.length > MAX_HISTORY_MINUTES) {
      history.shift();
    }
    currentMinute = { ...createEmptySnapshot(), timestamp: minuteAligned };
  }

  return currentMinute;
}

// ── Public API ─────────────────────────────────────────────────────────────

/** Record a completed request. */
export function recordRequest(
  method: string,
  route: string,
  statusCode: number,
  durationMs: number,
): void {
  const snapshot = getCurrentMinute();
  snapshot.totalRequests++;
  snapshot.totalDurationMs += durationMs;

  if (statusCode >= 400) {
    snapshot.totalErrors++;
  }

  // Normalize route: strip query strings and numeric IDs
  const normalizedRoute = normalizeRoute(method, route);
  let bucket = snapshot.routes.get(normalizedRoute);
  if (!bucket) {
    bucket = {
      count: 0,
      totalMs: 0,
      bucketCounts: new Array(LATENCY_BUCKETS.length).fill(0),
      statusCodes: {},
    };
    snapshot.routes.set(normalizedRoute, bucket);
  }

  bucket.count++;
  bucket.totalMs += durationMs;
  bucket.statusCodes[statusCode] = (bucket.statusCodes[statusCode] || 0) + 1;

  // Bucket the duration
  for (let i = 0; i < LATENCY_BUCKETS.length; i++) {
    if (durationMs <= LATENCY_BUCKETS[i]) {
      bucket.bucketCounts[i]++;
      break;
    }
    // If it exceeds all buckets, count in the last bucket
    if (i === LATENCY_BUCKETS.length - 1) {
      bucket.bucketCounts[i]++;
    }
  }
}

/** Track WebSocket connection count changes. */
export function trackWsConnection(delta: number): void {
  activeWsConnections = Math.max(0, activeWsConnections + delta);
}

/** Get the current active WebSocket connection count. */
export function getActiveWsConnections(): number {
  return activeWsConnections;
}

/** Calculate percentiles from the last N minutes of data. */
export function getPercentiles(minutes = 5): {
  p50: number;
  p95: number;
  p99: number;
  avgMs: number;
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  requestsPerSecond: number;
} {
  const slices = history.slice(-minutes);
  // Include current minute
  slices.push(currentMinute);

  let totalDuration = 0;
  let totalRequests = 0;
  let totalErrors = 0;
  const allDurations: number[] = [];

  for (const slice of slices) {
    totalDuration += slice.totalDurationMs;
    totalRequests += slice.totalRequests;
    totalErrors += slice.totalErrors;

    // Reconstruct approximate durations from buckets
    for (const [, bucket] of slice.routes) {
      for (let i = 0; i < bucket.bucketCounts.length; i++) {
        const count = bucket.bucketCounts[i];
        // Approximate: use bucket upper bound as representative value
        const representative = LATENCY_BUCKETS[i];
        for (let j = 0; j < count; j++) {
          allDurations.push(representative);
        }
      }
    }
  }

  allDurations.sort((a, b) => a - b);
  const len = allDurations.length;

  const elapsedSeconds = Math.max(1, (slices.length * 60));

  return {
    p50: len > 0 ? allDurations[Math.floor(len * 0.5)] : 0,
    p95: len > 0 ? allDurations[Math.floor(len * 0.95)] : 0,
    p99: len > 0 ? allDurations[Math.floor(len * 0.99)] : 0,
    avgMs: totalRequests > 0 ? Math.round(totalDuration / totalRequests) : 0,
    totalRequests,
    totalErrors,
    errorRate: totalRequests > 0 ? Math.round((totalErrors / totalRequests) * 10000) / 100 : 0,
    requestsPerSecond: Math.round((totalRequests / elapsedSeconds) * 100) / 100,
  };
}

/** Get per-route breakdown for the last N minutes. */
export function getRouteStats(minutes = 5): Array<{
  route: string;
  count: number;
  avgMs: number;
  errorRate: number;
  statusCodes: Record<number, number>;
}> {
  const slices = history.slice(-minutes);
  slices.push(currentMinute);

  const merged = new Map<string, { count: number; totalMs: number; errors: number; statusCodes: Record<number, number> }>();

  for (const slice of slices) {
    for (const [route, bucket] of slice.routes) {
      let entry = merged.get(route);
      if (!entry) {
        entry = { count: 0, totalMs: 0, errors: 0, statusCodes: {} };
        merged.set(route, entry);
      }
      entry.count += bucket.count;
      entry.totalMs += bucket.totalMs;
      for (const [code, count] of Object.entries(bucket.statusCodes)) {
        const c = Number(code);
        entry.statusCodes[c] = (entry.statusCodes[c] || 0) + count;
        if (c >= 400) entry.errors += count;
      }
    }
  }

  return Array.from(merged.entries())
    .map(([route, data]) => ({
      route,
      count: data.count,
      avgMs: data.count > 0 ? Math.round(data.totalMs / data.count) : 0,
      errorRate: data.count > 0 ? Math.round((data.errors / data.count) * 10000) / 100 : 0,
      statusCodes: data.statusCodes,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Get system resource usage. */
export function getSystemMetrics(): {
  memory: { heapUsed: number; heapTotal: number; rss: number; external: number; arrayBuffers: number };
  cpu: { user: number; system: number };
  uptime: number;
  pid: number;
  nodeVersion: string;
  platform: string;
} {
  const mem = process.memoryUsage();
  const cpu = process.cpuUsage();
  return {
    memory: {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
    },
    cpu: { user: cpu.user, system: cpu.system },
    uptime: process.uptime(),
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
  };
}

/** Format bytes to human-readable string. */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/** Format microseconds to milliseconds. */
export function formatMicros(micros: number): string {
  return `${(micros / 1000).toFixed(1)}ms`;
}

// ── Route normalization ────────────────────────────────────────────────────

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const NUMERIC_ID_RE = /\/\d+/g;

function normalizeRoute(method: string, route: string): string {
  // Strip query string
  const path = route.split('?')[0];
  // Replace UUIDs and numeric IDs with placeholders
  const normalized = path
    .replace(UUID_RE, ':id')
    .replace(NUMERIC_ID_RE, '/:id');
  return `${method} ${normalized}`;
}
