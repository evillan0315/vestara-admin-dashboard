import { AuditAction, EntityType } from '@vestara/types';

export const ACTION_LABELS: Record<AuditAction, string> = {
  [AuditAction.LOGIN]: 'Login',
  [AuditAction.LOGOUT]: 'Logout',
  [AuditAction.CREATE]: 'Create',
  [AuditAction.UPDATE]: 'Update',
  [AuditAction.DELETE]: 'Delete',
  [AuditAction.APPROVE]: 'Approve',
  [AuditAction.REJECT]: 'Reject',
  [AuditAction.SUSPEND]: 'Suspend',
  [AuditAction.ACTIVATE]: 'Activate',
  [AuditAction.PASSWORD_CHANGE]: 'Password',
  [AuditAction.EMAIL_CHANGE]: 'Email Change',
  [AuditAction.ACCOUNT_DELETION]: 'Account Deletion',
  [AuditAction.SETTINGS_UPDATE]: 'Setting Update',
  [AuditAction.SETTINGS_DELETE]: 'Setting Delete',
  [AuditAction.SETTINGS_IMPORT]: 'Setting Import',
  [AuditAction.DATA_SOURCE_CREATE]: 'Data Source Create',
  [AuditAction.DATA_SOURCE_UPDATE]: 'Data Source Update',
  [AuditAction.DATA_SOURCE_DELETE]: 'Data Source Delete',
  [AuditAction.DATA_SOURCE_FETCH]: 'Data Source Fetch',
  [AuditAction.ERROR]: 'Error',
};

export const ENTITY_LABELS: Record<EntityType, string> = {
  [EntityType.USER]: 'User',
  [EntityType.ROLE]: 'Role',
  [EntityType.SETTING]: 'Setting',
  [EntityType.AUDIT_LOG]: 'Audit Log',
};

export const RANGE_OPTIONS = [7, 14, 30, 90] as const;
export type RangeOption = (typeof RANGE_OPTIONS)[number];
