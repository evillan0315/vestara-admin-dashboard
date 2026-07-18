import { apiClient } from './client';

export interface SystemMetrics {
  percentiles: {
    p50: number;
    p95: number;
    p99: number;
    avgMs: number;
    totalRequests: number;
    totalErrors: number;
    errorRate: number;
    requestsPerSecond: number;
  };
  routes: Array<{
    route: string;
    count: number;
    avgMs: number;
    errorRate: number;
    statusCodes: Record<number, number>;
  }>;
  system: {
    memory: { heapUsed: number; heapTotal: number; rss: number; external: number; arrayBuffers: number };
    memoryFormatted: { heapUsed: string; heapTotal: string; rss: string; external: string };
    cpu: { user: number; system: number };
    uptime: number;
    pid: number;
    nodeVersion: string;
    platform: string;
  };
  activeWsConnections: number;
  timestamp: string;
}

export interface HealthDeep {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  checks: Record<string, { status: string; latencyMs?: number; error?: string }>;
  metrics: {
    p50: number;
    p95: number;
    p99: number;
    avgMs: number;
    totalRequests: number;
    errorRate: number;
    requestsPerSecond: number;
    activeWsConnections: number;
  };
  system: {
    heapUsed: string;
    heapTotal: string;
    rss: string;
    heapUsedPercent: string;
    nodeVersion: string;
    pid: number;
  };
}

export const monitoringApi = {
  getMetrics: () => apiClient.get<SystemMetrics>('/metrics/json'),
  getHealth: () => apiClient.get<HealthDeep>('/health/deep'),
};
