import type { JSX, ReactNode } from 'react';

import { Badge, IconButton, Tooltip, useTheme, alpha } from '@mui/material';

export interface HeaderIconButtonProps {
  /**
   * Icon to render.
   */
  icon: ReactNode;

  /**
   * Tooltip text.
   */
  tooltip: string;

  /**
   * Badge value.
   */
  badgeContent?: number;

  /**
   * Badge color.
   */
  badgeColor?: string;

  /**
   * Badge text color.
   */
  badgeTextColor?: string;

  /**
   * Click handler.
   */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;

  /**
   * Disable the button.
   */
  disabled?: boolean;
}

export default function HeaderIconButton({
  icon,
  tooltip,
  badgeContent,
  badgeColor,
  badgeTextColor,
  onClick,
  disabled = false,
}: HeaderIconButtonProps): JSX.Element {
  const theme = useTheme();
  const { text, divider, error, background } = theme.palette;

  // Default badge color uses the theme error palette unless overridden.
  const resolvedBadgeColor = badgeColor ?? error.main;
  const resolvedBadgeText = badgeTextColor ?? '#FFFFFF';

  const content =
    badgeContent !== undefined ? (
      <Badge
        badgeContent={badgeContent}
        overlap="circular"
        sx={{
          '& .MuiBadge-badge': {
            bgcolor: resolvedBadgeColor,
            color: resolvedBadgeText,
            fontSize: 9,
            fontWeight: 700,
            minWidth: 18,
            height: 18,
            borderRadius: '999px',
            border: `2px solid ${background.paper}`,
          },
        }}
      >
        {icon}
      </Badge>
    ) : (
      icon
    );

  return (
    <Tooltip title={tooltip}>
      <span>
        <IconButton
          onClick={onClick}
          disabled={disabled}
          size="small"
          sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            color: text.secondary,
            border: `1px solid transparent`,
            transition: 'all .2s ease',
            '&:hover': {
              bgcolor: alpha(text.primary, 0.06),
              color: text.primary,
              borderColor: divider,
            },
            '&:active': {
              transform: 'scale(.96)',
            },
          }}
        >
          {content}
        </IconButton>
      </span>
    </Tooltip>
  );
}
