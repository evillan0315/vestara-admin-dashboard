import type { JSX } from "react";

import { Button } from "@mui/material";
import { Calendar, ChevronDown } from "lucide-react";

import { colors } from "../../theme/tokens";

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
        color: colors.text,
        bgcolor: colors.cardAlt,
        border: `1px solid ${colors.border}`,
        whiteSpace: "nowrap",
        transition: "all .2s ease",
        "&:hover": {
          bgcolor: "rgba(255,255,255,.05)",
          borderColor: colors.gold,
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
