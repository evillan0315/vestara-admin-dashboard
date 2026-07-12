import { AuditAction, EntityType } from '@vestara/types';
import type { AuditLogDTO } from '@vestara/types';
import type { Notification, NotificationType } from '../../components/header/types';

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function actionVerb(action: AuditAction): string {
  switch (action) {
    case AuditAction.LOGIN:
      return 'logged in';
    case AuditAction.LOGOUT:
      return 'logged out';
    case AuditAction.CREATE:
      return 'created a';
    case AuditAction.UPDATE:
      return 'updated a';
    case AuditAction.DELETE:
      return 'deleted a';
    case AuditAction.APPROVE:
      return 'approved a';
    case AuditAction.REJECT:
      return 'rejected a';
    case AuditAction.SUSPEND:
      return 'suspended a';
    case AuditAction.ACTIVATE:
      return 'activated a';
    case AuditAction.PASSWORD_CHANGE:
      return 'changed their password';
    case AuditAction.EMAIL_CHANGE:
      return 'changed their email';
    case AuditAction.ACCOUNT_DELETION:
      return 'deleted their account';
    case AuditAction.SETTINGS_UPDATE:
      return 'updated a setting';
    case AuditAction.SETTINGS_DELETE:
      return 'deleted a setting';
    case AuditAction.SETTINGS_IMPORT:
      return 'imported settings';
    default:
      return 'performed an action on a';
  }
}

function entityLabel(entity: EntityType): string {
  switch (entity) {
    case EntityType.USER:
      return 'user';
    case EntityType.ROLE:
      return 'role';
    case EntityType.SETTING:
      return 'setting';
    case EntityType.AUDIT_LOG:
      return 'audit log';
    default:
      return 'record';
  }
}

function actionTitle(action: AuditAction, entity: EntityType): string {
  const entityName = entityLabel(entity);
  const map: Partial<Record<AuditAction, string>> = {
    [AuditAction.LOGIN]: 'New sign-in',
    [AuditAction.LOGOUT]: 'Sign-out',
    [AuditAction.CREATE]: `New ${entityName} created`,
    [AuditAction.UPDATE]: `${entityName} updated`,
    [AuditAction.DELETE]: `${entityName} deleted`,
    [AuditAction.APPROVE]: `${entityName} approved`,
    [AuditAction.REJECT]: `${entityName} rejected`,
    [AuditAction.SUSPEND]: `${entityName} suspended`,
    [AuditAction.ACTIVATE]: `${entityName} activated`,
    [AuditAction.PASSWORD_CHANGE]: 'Password changed',
    [AuditAction.EMAIL_CHANGE]: 'Email changed',
    [AuditAction.ACCOUNT_DELETION]: 'Account deleted',
    [AuditAction.SETTINGS_UPDATE]: 'Setting updated',
    [AuditAction.SETTINGS_DELETE]: 'Setting deleted',
    [AuditAction.SETTINGS_IMPORT]: 'Settings imported',
    [AuditAction.ERROR]: 'System error',
  };
  return map[action] ?? 'Activity';
}

function toType(action: AuditAction, entity: EntityType): NotificationType {
  if (action === AuditAction.LOGIN || action === AuditAction.LOGOUT) return 'auth';
  if (
    action === AuditAction.PASSWORD_CHANGE ||
    action === AuditAction.EMAIL_CHANGE ||
    action === AuditAction.ACCOUNT_DELETION ||
    action === AuditAction.ERROR
  ) {
    return 'security';
  }
  if (
    entity === EntityType.SETTING ||
    action === AuditAction.SETTINGS_UPDATE ||
    action === AuditAction.SETTINGS_DELETE ||
    action === AuditAction.SETTINGS_IMPORT
  ) {
    return 'setting';
  }
  if (entity === EntityType.USER) return 'user';
  return 'activity';
}

/**
 * Map a server audit log into a header Notification. Incoming WebSocket
 * events reuse this with `unread: true` so they stand out in the feed.
 */
export function auditToNotification(log: AuditLogDTO, unread = false): Notification {
  const name = log.userName?.trim() || 'System';
  const verb = actionVerb(log.action);
  const actionText =
    verb === 'changed their password' ||
    verb === 'changed their email' ||
    verb === 'deleted their account'
      ? verb
      : `${verb} ${entityLabel(log.entity)}`;

  return {
    id: log.id,
    title: actionTitle(log.action, log.entity),
    description: `${name} ${actionText}`,
    type: toType(log.action, log.entity),
    timestamp: relativeTime(log.createdAt),
    unread,
  };
}
