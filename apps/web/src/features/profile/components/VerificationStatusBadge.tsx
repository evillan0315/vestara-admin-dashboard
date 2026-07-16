import { Chip } from '@mui/material';
import { ShieldCheck, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import type { VerificationStatus } from '@vestara/types';

interface VerificationStatusBadgeProps {
  status: VerificationStatus;
  size?: 'small' | 'medium';
}

const STATUS_CONFIG: Record<
  VerificationStatus,
  { label: string; color: 'default' | 'warning' | 'success' | 'error'; icon: typeof ShieldCheck }
> = {
  unverified: { label: 'Unverified', color: 'default', icon: AlertCircle },
  pending: { label: 'Pending', color: 'warning', icon: Clock },
  verified: { label: 'Verified', color: 'success', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'error', icon: AlertCircle },
};

/**
 * Displays a verification status badge with icon and color coding.
 */
export function VerificationStatusBadge({ status, size = 'small' }: VerificationStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Chip
      size={size}
      icon={<Icon size={size === 'small' ? 12 : 14} />}
      label={config.label}
      color={config.color}
      sx={{
        height: size === 'small' ? 22 : 28,
        fontSize: size === 'small' ? 11 : 13,
        fontWeight: 600,
        '& .MuiChip-icon': {
          ml: 0.5,
        },
      }}
    />
  );
}
