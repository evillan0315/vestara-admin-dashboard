import type { JSX } from "react";

import { CircularProgress, IconButton, Tooltip } from "@mui/material";

import { RotateCw } from "lucide-react";

import { colors } from "../../theme/tokens";

export interface RefreshButtonProps {
  /**
   * Invoked when the refresh button is clicked.
   */
  onClick?: () => void | Promise<void>;

  /**
   * Indicates an ongoing refresh.
   */
  loading?: boolean;

  /**
   * Disable the button.
   */
  disabled?: boolean;

  /**
   * Tooltip text.
   */
  tooltip?: string;
}

export default function RefreshButton({
  onClick,
  loading = false,
  disabled = false,
  tooltip = "Refresh dashboard",
}: RefreshButtonProps): JSX.Element {
  return (
    <Tooltip title={tooltip}>
      <span>
        <IconButton
          size="small"
          disabled={disabled || loading}
          onClick={onClick}
          sx={{
            width: 40,
            height: 40,
            borderRadius: "10px",
            bgcolor: colors.cardAlt,
            border: `1px solid ${colors.border}`,
            color: colors.text,
            transition: "all .2s ease",
            "&:hover": {
              bgcolor: "rgba(255,255,255,.05)",
              borderColor: colors.gold,
            },
            "&:active": {
              transform: "scale(.96)",
            },
          }}
        >
          {loading ? (
            <CircularProgress
              size={18}
              thickness={5}
              sx={{
                color: colors.gold,
              }}
            />
          ) : (
            <RotateCw
              size={16}
              style={{
                transition: "transform .3s ease",
              }}
            />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
}
