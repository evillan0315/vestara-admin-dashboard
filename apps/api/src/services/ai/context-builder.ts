import { getOrgUserSummary, getRecentAuditLogs, getSystemSettings, getOrgFileStats, getOrgInfo, getDashboardKPIs, getUserActivity } from './data-access.js';

/**
 * Context Builder Service
 *
 * Builds a structured text context from real-time organization data
 * that is injected into the AI's system prompt before each completion.
 */

interface ContextOptions {
  organizationId: string;
  userId?: string;
  maxTokens?: number;
}

interface ContextCacheEntry {
  context: string;
  timestamp: number;
}

const CONTEXT_CACHE = new Map<string, ContextCacheEntry>();
const CACHE_TTL_MS = 60_000; // 60 seconds

/**
 * Estimate token count for a string (rough approximation: 1 token ≈ 4 chars)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate context to fit within token budget
 */
function truncateContext(context: string, maxTokens: number): string {
  const estimatedTokens = estimateTokens(context);
  if (estimatedTokens <= maxTokens) return context;

  // Truncate proportionally
  const ratio = maxTokens / estimatedTokens;
  const targetLength = Math.floor(context.length * ratio * 0.9); // 10% safety margin
  return context.slice(0, targetLength) + '\n... [context truncated]';
}

/**
 * Build the organization context string
 */
export async function buildContext(options: ContextOptions): Promise<string> {
  const { organizationId, userId, maxTokens = 2000 } = options;

  // Check cache
  const cacheKey = `${organizationId}:${userId ?? 'global'}`;
  const cached = CONTEXT_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.context;
  }

  // Fetch all data in parallel
  const [
    orgInfo,
    userSummary,
    recentAuditLogs,
    systemSettings,
    fileStats,
    dashboardKPIs,
    userActivity,
  ] = await Promise.all([
    getOrgInfo(organizationId),
    getOrgUserSummary(organizationId),
    getRecentAuditLogs(organizationId, 10),
    getSystemSettings(organizationId),
    getOrgFileStats(organizationId),
    getDashboardKPIs(organizationId),
    userId ? getUserActivity(organizationId, userId, 5) : Promise.resolve([]),
  ]);

  // Build context sections
  const sections: string[] = [];

  // Organization Info
  if (orgInfo) {
    sections.push(`ORGANIZATION: ${orgInfo.name} (${orgInfo.slug})`);
    sections.push(`  Members: ${orgInfo.userCount}`);
  }

  // User Summary
  sections.push(`USERS: ${userSummary.total} total (${userSummary.active} active, ${userSummary.inactive} inactive)`);
  if (Object.keys(userSummary.byRole).length > 0) {
    const roleStr = Object.entries(userSummary.byRole)
      .filter(([, count]) => count > 0)
      .map(([role, count]) => `${role}: ${count}`)
      .join(', ');
    if (roleStr) sections.push(`  By Role: ${roleStr}`);
  }

  // Dashboard KPIs
  sections.push(`DASHBOARD KPIs:`);
  sections.push(`  Users: ${dashboardKPIs.users.total} total, ${dashboardKPIs.users.active} active`);
  sections.push(`  Activity: ${dashboardKPIs.activity.totalAuditLogs} recent audit events`);
  if (Object.keys(dashboardKPIs.activity.actionsByType).length > 0) {
    const actionStr = Object.entries(dashboardKPIs.activity.actionsByType)
      .map(([action, count]) => `${action}: ${count}`)
      .join(', ');
    sections.push(`  Action Types: ${actionStr}`);
  }
  sections.push(`  Errors (24h): ${dashboardKPIs.activity.errorsLast24h}`);
  sections.push(`  Storage: ${dashboardKPIs.storage.totalFiles} files, ${dashboardKPIs.storage.totalSizeFormatted}`);

  // Recent Audit Logs
  if (recentAuditLogs.length > 0) {
    sections.push(`RECENT ACTIVITY (last 10):`);
    for (const log of recentAuditLogs) {
      const time = new Date(log.timestamp).toLocaleTimeString();
      sections.push(`  [${time}] ${log.userName} - ${log.action} on ${log.entity}/${log.entityId}`);
    }
  }

  // System Settings (non-sensitive)
  const settingKeys = Object.keys(systemSettings);
  if (settingKeys.length > 0) {
    sections.push(`SYSTEM SETTINGS (${settingKeys.length} configured):`);
    for (const key of settingKeys.slice(0, 15)) { // Limit to first 15
      const value = systemSettings[key];
      const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      const truncated = displayValue.length > 80 ? displayValue.slice(0, 80) + '...' : displayValue;
      sections.push(`  ${key}: ${truncated}`);
    }
    if (settingKeys.length > 15) {
      sections.push(`  ... and ${settingKeys.length - 15} more settings`);
    }
  }

  // File Storage Stats
  sections.push(`FILE STORAGE:`);
  sections.push(`  Total: ${fileStats.totalFiles} files (${fileStats.totalSizeFormatted})`);
  if (Object.keys(fileStats.byProvider).length > 0) {
    const providerStr = Object.entries(fileStats.byProvider)
      .map(([p, c]) => `${p}: ${c}`)
      .join(', ');
    sections.push(`  By Provider: ${providerStr}`);
  }
  if (fileStats.recentUploads.length > 0) {
    sections.push(`  Recent Uploads:`);
    for (const f of fileStats.recentUploads.slice(0, 3)) {
      const size = Number(f.size);
      const formatted = size < 1024 ? `${size} B` : size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;
      sections.push(`    - ${f.name} (${formatted})`);
    }
  }

  // Current User Activity
  if (userActivity.length > 0) {
    sections.push(`YOUR RECENT ACTIVITY:`);
    for (const act of userActivity) {
      const time = new Date(act.timestamp).toLocaleTimeString();
      sections.push(`  [${time}] ${act.action} on ${act.entity}/${act.entityId}`);
    }
  }

  // Combine and truncate if needed
  let context = sections.join('\n');
  context = truncateContext(context, maxTokens);

  // Cache the result
  CONTEXT_CACHE.set(cacheKey, { context, timestamp: Date.now() });

  // Clean old cache entries periodically
  if (CONTEXT_CACHE.size > 100) {
    const now = Date.now();
    for (const [key, entry] of CONTEXT_CACHE.entries()) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        CONTEXT_CACHE.delete(key);
      }
    }
  }

  return context;
}

/**
 * Clear context cache for a specific organization (call after data changes)
 */
export function clearContextCache(organizationId: string, userId?: string): void {
  const key = `${organizationId}:${userId ?? 'global'}`;
  CONTEXT_CACHE.delete(key);
}

/**
 * Export for testing
 */
export { CONTEXT_CACHE, CACHE_TTL_MS };