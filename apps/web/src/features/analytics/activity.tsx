import type { ReactNode } from 'react';
import {
  Login as LoginIcon,
  Logout as LogoutIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  Lock as LockIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { AuditAction, EntityType, type AuditLogDTO } from '@vestara/types';
import type { ActivityItem } from '../../components/data/ActivityFeed';

export type ActivityColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info';

export function actionVerb(action: AuditAction): string {
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
    case AuditAction.SETTINGS_UPDATE:
      return 'updated a setting';
    case AuditAction.SETTINGS_DELETE:
      return 'deleted a setting';
    default:
      return 'performed an action on a';
  }
}

export function entityLabel(entity: EntityType): string {
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

export function actionColor(action: AuditAction): ActivityColor {
  switch (action) {
    case AuditAction.LOGIN:
    case AuditAction.LOGOUT:
      return 'info';
    case AuditAction.CREATE:
    case AuditAction.APPROVE:
    case AuditAction.ACTIVATE:
      return 'success';
    case AuditAction.UPDATE:
    case AuditAction.SETTINGS_UPDATE:
    case AuditAction.PASSWORD_CHANGE:
      return 'warning';
    case AuditAction.DELETE:
    case AuditAction.REJECT:
    case AuditAction.SUSPEND:
    case AuditAction.SETTINGS_DELETE:
      return 'error';
    default:
      return 'primary';
  }
}

export function actionIcon(action: AuditAction): ReactNode {
  switch (action) {
    case AuditAction.LOGIN:
      return <LoginIcon />;
    case AuditAction.LOGOUT:
      return <LogoutIcon />;
    case AuditAction.CREATE:
      return <PersonAddIcon />;
    case AuditAction.UPDATE:
      return <EditIcon />;
    case AuditAction.DELETE:
    case AuditAction.SETTINGS_DELETE:
      return <DeleteIcon />;
    case AuditAction.APPROVE:
    case AuditAction.ACTIVATE:
      return <CheckCircleIcon />;
    case AuditAction.REJECT:
      return <CancelIcon />;
    case AuditAction.SUSPEND:
      return <BlockIcon />;
    case AuditAction.PASSWORD_CHANGE:
      return <LockIcon />;
    case AuditAction.SETTINGS_UPDATE:
      return <SettingsIcon />;
    default:
      return undefined;
  }
}

export function initialsOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.round(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

export function toActivityItem(log: AuditLogDTO): ActivityItem {
  const name = log.userName?.trim() || 'System';
  const actionText =
    log.action === AuditAction.PASSWORD_CHANGE
      ? 'changed their password'
      : `${actionVerb(log.action)} ${entityLabel(log.entity)}`;
  return {
    id: log.id,
    user: { name, initials: initialsOf(name) },
    action: actionText,
    timestamp: formatRelativeTime(log.createdAt),
    icon: actionIcon(log.action),
    iconColor: actionColor(log.action),
  };
}
