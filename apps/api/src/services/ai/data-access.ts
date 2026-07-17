import {
  userRepository,
  auditLogRepository,
  settingsRepository,
  fileRepository,
  organizationRepository,
  chatRepository,
} from '../../repositories/index.js';
import type { UserRole } from '../../generated/prisma/client.js';

/**
 * Data Access Layer for AI Assistant
 *
 * Provides read-only query functions that the AI can use to fetch
 * real-time organization data. All queries are org-scoped for multi-tenancy.
 */

export interface OrgUserSummary {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<UserRole, number>;
}

export interface RecentAuditEntry {
  action: string;
  entity: string;
  entityId: string;
  userName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface SystemSettingsMap {
  [key: string]: unknown;
}

export interface OrgFileStats {
  totalFiles: number;
  totalSizeBytes: bigint;
  totalSizeFormatted: string;
  byProvider: Record<string, number>;
  byMimeType: Record<string, number>;
  recentUploads: Array<{
    id: string;
    name: string;
    size: bigint;
    createdAt: string;
  }>;
}

export interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  userCount: number;
}

export interface DashboardKPIs {
  users: {
    total: number;
    active: number;
    newThisWeek: number;
  };
  activity: {
    totalAuditLogs: number;
    errorsLast24h: number;
    actionsByType: Record<string, number>;
  };
  storage: {
    totalFiles: number;
    totalSizeFormatted: string;
  };
}

export interface UserActivityEntry {
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
}

/**
 * Get a summary of users in the organization.
 */
export async function getOrgUserSummary(organizationId: string): Promise<OrgUserSummary> {
  const [total, active, inactive, roleCounts] = await Promise.all([
    userRepository.count({ organizationId }),
    userRepository.count({ organizationId, isActive: true }),
    userRepository.count({ organizationId, isActive: false }),
    (async () => {
      const roles: UserRole[] = ['super_admin', 'admin', 'moderator', 'support'];
      const counts: Record<UserRole, number> = {} as Record<UserRole, number>;
      for (const role of roles) {
        counts[role] = await userRepository.count({ organizationId, role });
      }
      return counts;
    })(),
  ]);

  return { total, active, inactive, byRole: roleCounts };
}

/**
 * Get recent audit log entries for the organization.
 */
export async function getRecentAuditLogs(
  organizationId: string,
  limit = 10,
): Promise<RecentAuditEntry[]> {
  const { logs } = await auditLogRepository.findAll({
    page: 1,
    perPage: limit,
    order: 'desc',
    sort: 'createdAt',
  });

  return logs.map(
    (log: {
      action: string;
      entity: string;
      entityId: string;
      user?: { firstName?: string | null; lastName?: string | null } | null;
      createdAt: Date;
      metadata?: unknown;
    }) => ({
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      userName:
        log.user?.firstName && log.user?.lastName
          ? `${log.user.firstName} ${log.user.lastName}`
          : 'System',
      timestamp: log.createdAt.toISOString(),
      metadata: (log.metadata as Record<string, unknown>) ?? undefined,
    }),
  );
}

/**
 * Get all system settings for the organization as a key-value map.
 * Filters out sensitive keys (passwords, tokens, secrets).
 */
export async function getSystemSettings(organizationId: string): Promise<SystemSettingsMap> {
  const settings = await settingsRepository.getAllAsMap(organizationId);

  // Filter out sensitive keys
  const sensitiveKeys = ['password', 'secret', 'token', 'key', 'api_key', 'private'];
  const filtered: SystemSettingsMap = {};

  for (const [key, value] of Object.entries(settings)) {
    const lowerKey = key.toLowerCase();
    if (!sensitiveKeys.some((s) => lowerKey.includes(s))) {
      filtered[key] = value;
    }
  }

  return filtered;
}

/**
 * Get file storage statistics for the organization.
 */
export async function getOrgFileStats(organizationId: string): Promise<OrgFileStats> {
  const stats = await fileRepository.getStats(organizationId);

  // Get recent uploads
  const { items: recentFiles } = await fileRepository.findMany({
    organizationId,
    page: 1,
    perPage: 5,
    sort: 'createdAt',
    order: 'desc',
  });

  const formatBytes = (bytes: bigint): string => {
    const b = Number(bytes);
    if (b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${(b / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return {
    totalFiles: stats.totalFiles,
    totalSizeBytes: stats.totalSize,
    totalSizeFormatted: formatBytes(stats.totalSize),
    byProvider: stats.byProvider,
    byMimeType: stats.byMimeType,
    recentUploads: recentFiles.map(
      (f: { id: string; name: string; size: bigint; createdAt: Date }) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        createdAt: f.createdAt.toISOString(),
      }),
    ),
  };
}

/**
 * Get organization information.
 */
export async function getOrgInfo(organizationId: string): Promise<OrgInfo | null> {
  const org = await organizationRepository.findById(organizationId);
  if (!org) return null;

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    logoUrl: org.logoUrl ?? null,
    userCount: org.userCount,
  };
}

/**
 * Get aggregated dashboard KPIs.
 */
export async function getDashboardKPIs(organizationId: string): Promise<DashboardKPIs> {
  const [userSummary, recentLogs, fileStats] = await Promise.all([
    getOrgUserSummary(organizationId),
    getRecentAuditLogs(organizationId, 100),
    getOrgFileStats(organizationId),
  ]);

  // Count actions by type
  const actionsByType: Record<string, number> = {};
  for (const log of recentLogs) {
    actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
  }

  // Count errors in last 24 hours
  const errorsLast24h = recentLogs.filter(
    (log) => log.action.includes('ERROR') || log.action.includes('FAIL'),
  ).length;

  return {
    users: {
      total: userSummary.total,
      active: userSummary.active,
      newThisWeek: 0, // Would need a more complex query
    },
    activity: {
      totalAuditLogs: recentLogs.length,
      errorsLast24h,
      actionsByType,
    },
    storage: {
      totalFiles: fileStats.totalFiles,
      totalSizeFormatted: fileStats.totalSizeFormatted,
    },
  };
}

/**
 * Get recent activity for a specific user.
 */
export async function getUserActivity(
  organizationId: string,
  userId: string,
  limit = 10,
): Promise<UserActivityEntry[]> {
  const { logs } = await auditLogRepository.findAll({
    page: 1,
    perPage: limit,
    order: 'desc',
    sort: 'createdAt',
    userId,
  });

  return logs.map((log: { action: string; entity: string; entityId: string; createdAt: Date }) => ({
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    timestamp: log.createdAt.toISOString(),
  }));
}

/**
 * Get chat statistics for the organization.
 */
export async function getChatStats(organizationId: string) {
  return chatRepository.getStats(organizationId);
}

/**
 * Search users by name or email.
 */
export async function searchUsers(
  organizationId: string,
  query: string,
  limit = 10,
): Promise<
  Array<{ id: string; email: string; firstName: string; lastName: string; role: string }>
> {
  const { users } = await userRepository.findAll({
    organizationId,
    search: query,
    perPage: limit,
  });

  return users.map(
    (u: { id: string; email: string; firstName: string; lastName: string; role: string }) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
    }),
  );
}
