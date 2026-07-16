import type { JSX } from "react";

import { Button, useTheme, alpha } from "@mui/material";
import { Calendar, ChevronDown } from "lucide-react";

export interface DateRangeButtonProps {
  /**
   * Label displayed in the button.
   */
  label: string;

  /**
   * Click handler.
   */
  onClick?: () => void;

  /**
   * Disable the control.
   */
  disabled?: boolean;
}

export default function DateRangeButton({
  label,
  onClick,
  disabled = false,
}: DateRangeButtonProps): JSX.Element {
  const theme = useTheme();
  const { primary, text, divider, background } = theme.palette;

  return (
    <Button
      disableElevation
      disabled={disabled}
      onClick={onClick}
      startIcon={<Calendar size={16} />}
      endIcon={<ChevronDown size={16} />}
      sx={{
        height: 40,
        px: 1.75,
        borderRadius: "10px",
        textTransform: "none",
        fontSize: 12.5,
        fontWeight: 600,
        color: text.primary,
        bgcolor: background.paper,
        border: `1px solid ${divider}`,
        whiteSpace: "nowrap",
        transition: "all .2s ease",
        "&:hover": {
          bgcolor: alpha(primary.main, 0.08),
          borderColor: primary.main,
        },
        "&:active": {
          transform: "scale(.98)",
        },
      }}
    >
      {label}
    </Button>
  );
}
