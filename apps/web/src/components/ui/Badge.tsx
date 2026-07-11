import {
  Badge as MuiBadge,
  styled,
  type BadgeProps as MuiBadgeProps,
} from '@mui/material';
import { type FC, type ReactNode } from 'react';

export interface BadgeProps extends MuiBadgeProps {
  variant?: 'standard' | 'dot';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  max?: number;
  showZero?: boolean;
  invisible?: boolean;
  badgeContent?: ReactNode;
  children?: ReactNode;
}

const StyledBadge = styled(MuiBadge)`
  & .MuiBadge-badge {
    font-weight: 600;
    font-size: 0.6875rem;
    height: 20px;
    min-width: 20px;
    padding: 0 6px;
  }
`;

export const Badge: FC<BadgeProps> = ({
  variant = 'standard',
  color = 'primary',
  max = 99,
  showZero = false,
  invisible = false,
  badgeContent,
  children,
  ...props
}) => {
  return (
    <StyledBadge
      variant={variant}
      color={color}
      max={max}
      showZero={showZero}
      invisible={invisible}
      badgeContent={badgeContent}
      {...props}
    >
      {children}
    </StyledBadge>
  );
};

Badge.displayName = 'Badge';

export default Badge;
