import type { JSX, ReactNode } from "react";

import { Badge, IconButton, Tooltip } from "@mui/material";

import { colors } from "../../theme/tokens";

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
  badgeColor = colors.error,
  badgeTextColor = "#FFFFFF",
  onClick,
  disabled = false,
}: HeaderIconButtonProps): JSX.Element {
  const content =
    badgeContent !== undefined ? (
      <Badge
        badgeContent={badgeContent}
        overlap="circular"
        sx={{
          "& .MuiBadge-badge": {
            bgcolor: badgeColor,
            color: badgeTextColor,
            fontSize: 9,
            fontWeight: 700,
            minWidth: 18,
            height: 18,
            borderRadius: "999px",
            border: `2px solid ${colors.sidebar}`,
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
            borderRadius: "12px",
            color: colors.secondary,
            transition: "all .2s ease",
            "&:hover": {
              bgcolor: "rgba(255,255,255,.05)",
              color: colors.text,
            },
            "&:active": {
              transform: "scale(.96)",
            },
          }}
        >
          {content}
        </IconButton>
      </span>
    </Tooltip>
  );
}
