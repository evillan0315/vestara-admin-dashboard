import type { JSX } from "react";

import { CircularProgress, IconButton, Tooltip, useTheme, alpha } from "@mui/material";

import { RotateCw } from "lucide-react";

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
  const theme = useTheme();
  const { primary, text, divider, background } = theme.palette;

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
            bgcolor: background.paper,
            border: `1px solid ${divider}`,
            color: text.primary,
            transition: "all .2s ease",
            "&:hover": {
              bgcolor: alpha(primary.main, 0.08),
              borderColor: primary.main,
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
                color: primary.main,
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
