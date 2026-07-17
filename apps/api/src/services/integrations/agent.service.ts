/**
 * Agent Service — External REST Data Source connector.
 *
 * Manages org-scoped data source configurations, fetches external REST endpoints,
 * and analyzes the response into a visualization-ready structure (see analyzer.ts).
 */

import { Prisma } from '../../generated/prisma/client.js';
import prisma from '../../utils/prisma.js';
import { auditLogRepository } from '../../repositories/index.js';
import { NotFoundError } from '../../utils/errors.js';
import { fetchJson } from './http-client.js';
import { analyzeDataSource, type DataSourceAnalysis } from './analyzer.js';
import {
  AuditAction,
  type DataSourceDTO,
  type DataSourceFetchResultDTO,
  type DataSourceAuthType,
} from '@vestara/types';
import type { CreateDataSourceInput, UpdateDataSourceInput } from '@vestara/validation';

type DataSourceRow = NonNullable<Awaited<ReturnType<typeof prisma.dataSource.findUnique>>>;

function buildUrl(baseUrl: string, path: string): string {
  const b = baseUrl.replace(/\/+$/, '');
  const p = (path || '').replace(/^\/+/, '');
  return p ? `${b}/${p}` : b;
}

function applyAuth(
  url: string,
  headers: Record<string, string>,
  authType: string,
  authConfig?: Record<string, unknown>,
): string {
  if (!authConfig) return url;
  if (authType === 'bearer') {
    const token = String(authConfig.token ?? '');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } else if (authType === 'basic') {
    const username = String(authConfig.username ?? '');
    const password = String(authConfig.password ?? '');
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    headers['Authorization'] = `Basic ${encoded}`;
  } else if (authType === 'apiKey') {
    const key = String(authConfig.key ?? '');
    const value = String(authConfig.value ?? '');
    const addTo = authConfig.addTo === 'query' ? 'query' : 'header';
    if (key && value) {
      if (addTo === 'header') {
        headers[key] = value;
      } else {
        const u = new URL(url);
        u.searchParams.set(key, value);
        return u.toString();
      }
    }
  }
  return url;
}

function toDTO(row: DataSourceRow): DataSourceDTO {
  const headers = (row.headers as Record<string, string> | null) ?? {};
  const masked: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    masked[k] = k.toLowerCase() === 'authorization' ? '••••••••' : v;
  }
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    method: row.method as 'GET' | 'POST',
    baseUrl: row.baseUrl,
    path: row.path,
    authType: row.authType as DataSourceAuthType,
    hasAuthSecret: row.authType !== 'none',
    headers: masked,
    refreshInterval: row.refreshInterval ?? undefined,
    lastFetchedAt: row.lastFetchedAt ? row.lastFetchedAt.toISOString() : undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function jsonOrNull(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === undefined || value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

export class AgentService {
  async list(organizationId: string): Promise<DataSourceDTO[]> {
    const rows = await prisma.dataSource.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toDTO);
  }

  async get(organizationId: string, id: string): Promise<DataSourceDTO> {
    const row = await prisma.dataSource.findUnique({ where: { id, organizationId } });
    if (!row) throw new NotFoundError(`Data source '${id}' not found`);
    return toDTO(row);
  }

  async getLastResult(organizationId: string, id: string): Promise<DataSourceAnalysis | null> {
    const row = await prisma.dataSource.findUnique({
      where: { id, organizationId },
      select: { lastResult: true },
    });
    if (!row) throw new NotFoundError(`Data source '${id}' not found`);
    return (row.lastResult as DataSourceAnalysis | null) ?? null;
  }

  async create(
    organizationId: string,
    userId: string,
    data: CreateDataSourceInput,
  ): Promise<DataSourceDTO> {
    const row = await prisma.dataSource.create({
      data: {
        name: data.name,
        description: data.description,
        method: data.method,
        baseUrl: data.baseUrl,
        path: data.path ?? '',
        headers: jsonOrNull(data.headers),
        body: jsonOrNull(data.body),
        authType: data.authType,
        authConfig: jsonOrNull(data.authConfig),
        refreshInterval: data.refreshInterval,
        organizationId,
        createdBy: userId,
      },
    });
    await auditLogRepository.create({
      action: AuditAction.DATA_SOURCE_CREATE,
      entity: 'data_source',
      entityId: row.id,
      userId,
      organizationId,
      metadata: { name: row.name },
    });
    return toDTO(row);
  }

  async update(
    organizationId: string,
    userId: string,
    id: string,
    data: UpdateDataSourceInput,
  ): Promise<DataSourceDTO> {
    await this.get(organizationId, id);
    const row = await prisma.dataSource.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        method: data.method,
        baseUrl: data.baseUrl,
        path: data.path,
        headers: data.headers === undefined ? undefined : jsonOrNull(data.headers),
        body: data.body === undefined ? undefined : jsonOrNull(data.body),
        authType: data.authType,
        authConfig: data.authConfig === undefined ? undefined : jsonOrNull(data.authConfig),
        refreshInterval: data.refreshInterval,
      },
    });
    await auditLogRepository.create({
      action: AuditAction.DATA_SOURCE_UPDATE,
      entity: 'data_source',
      entityId: id,
      userId,
      organizationId,
      metadata: { name: row.name },
    });
    return toDTO(row);
  }

  async delete(organizationId: string, userId: string, id: string): Promise<void> {
    const existing = await this.get(organizationId, id);
    await prisma.dataSource.delete({ where: { id } });
    await auditLogRepository.create({
      action: AuditAction.DATA_SOURCE_DELETE,
      entity: 'data_source',
      entityId: id,
      userId,
      organizationId,
      metadata: { name: existing.name },
    });
  }

  async fetch(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<DataSourceFetchResultDTO> {
    const row = await prisma.dataSource.findUnique({ where: { id, organizationId } });
    if (!row) throw new NotFoundError(`Data source '${id}' not found`);

    const headers: Record<string, string> = {
      ...((row.headers as Record<string, string> | null) ?? {}),
    };
    const url = applyAuth(
      buildUrl(row.baseUrl, row.path),
      headers,
      row.authType,
      (row.authConfig as Record<string, unknown> | null) ?? undefined,
    );

    const json = await fetchJson(url, {
      method: row.method === 'POST' ? 'POST' : 'GET',
      headers,
      body: row.method === 'POST' ? (row.body as unknown) : undefined,
      timeoutMs: 15000,
    });

    const analysis = await analyzeDataSource(json);

    await prisma.dataSource.update({
      where: { id },
      data: {
        lastResult: analysis as unknown as Prisma.InputJsonValue,
        lastFetchedAt: new Date(),
      },
    });

    await auditLogRepository.create({
      action: AuditAction.DATA_SOURCE_FETCH,
      entity: 'data_source',
      entityId: id,
      userId,
      organizationId,
      metadata: { name: row.name, recordCount: analysis.recordCount },
    });

    return {
      dataSourceId: id,
      fetchedAt: new Date().toISOString(),
      ...analysis,
    };
  }
}

export const agentService = new AgentService();
export default agentService;
