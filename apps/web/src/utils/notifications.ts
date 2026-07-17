import type { AuditLogDTO } from '@vestara/types';
import type { Notification } from '../components/header/types';
import { AuditAction, EntityType } from '@vestara/types';

/**
 * Convert AuditLogDTO to Notification type for the notification popover
 */
export function auditLogsToNotifications(logs: AuditLogDTO[]): Notification[] {
  return logs.map((log) => ({
    id: log.id,
    title: getNotificationTitle(log),
    description: getNotificationDescription(log),
    type: getNotificationType(log),
    timestamp: log.createdAt,
    unread: true, // All notifications are initially unread
  }));
}

/**
 * Get unread count from notifications
 */
export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => n.unread).length;
}

function getNotificationTitle(log: AuditLogDTO): string {
  const action = getActionLabel(log.action);
  const entity = getEntityLabel(log.entity);
  return `${action} ${entity}`;
}

function getNotificationDescription(log: AuditLogDTO): string {
  const userName = log.userName || 'System';
  const action = getActionVerb(log.action);
  const entity = getEntityLabel(log.entity).toLowerCase();
  return `${userName} ${action} a ${entity}`;
}

function getNotificationType(log: AuditLogDTO): Notification['type'] {
  switch (log.entity) {
    case EntityType.USER:
      return 'system';
    case EntityType.SETTING:
      return 'system';
    case EntityType.AUDIT_LOG:
      return 'system';
    case EntityType.ROLE:
      return 'security';
    default:
      return 'system';
  }
}

function getActionLabel(action: AuditAction): string {
  switch (action) {
    case AuditAction.LOGIN:
      return 'Login';
    case AuditAction.LOGOUT:
      return 'Logout';
    case AuditAction.CREATE:
      return 'Created';
    case AuditAction.UPDATE:
      return 'Updated';
    case AuditAction.DELETE:
      return 'Deleted';
    case AuditAction.APPROVE:
      return 'Approved';
    case AuditAction.REJECT:
      return 'Rejected';
    case AuditAction.SUSPEND:
      return 'Suspended';
    case AuditAction.ACTIVATE:
      return 'Activated';
    case AuditAction.PASSWORD_CHANGE:
      return 'Password changed';
    case AuditAction.SETTINGS_UPDATE:
      return 'Setting updated';
    case AuditAction.SETTINGS_DELETE:
      return 'Setting deleted';
    case AuditAction.ERROR:
      return 'Error';
    default:
      return 'Action';
  }
}

function getActionVerb(action: AuditAction): string {
  switch (action) {
    case AuditAction.LOGIN:
      return 'logged into';
    case AuditAction.LOGOUT:
      return 'logged out of';
    case AuditAction.CREATE:
      return 'created';
    case AuditAction.UPDATE:
      return 'updated';
    case AuditAction.DELETE:
      return 'deleted';
    case AuditAction.APPROVE:
      return 'approved';
    case AuditAction.REJECT:
      return 'rejected';
    case AuditAction.SUSPEND:
      return 'suspended';
    case AuditAction.ACTIVATE:
      return 'activated';
    case AuditAction.PASSWORD_CHANGE:
      return 'changed password for';
    case AuditAction.SETTINGS_UPDATE:
      return 'updated setting for';
    case AuditAction.SETTINGS_DELETE:
      return 'deleted setting for';
    case AuditAction.ERROR:
      return 'encountered error in';
    default:
      return 'performed action on';
  }
}

function getEntityLabel(entity: EntityType): string {
  switch (entity) {
    case EntityType.USER:
      return 'User';
    case EntityType.ROLE:
      return 'Role';
    case EntityType.SETTING:
      return 'Setting';
    case EntityType.AUDIT_LOG:
      return 'Audit Log';
    default:
      return 'Record';
  }
}
