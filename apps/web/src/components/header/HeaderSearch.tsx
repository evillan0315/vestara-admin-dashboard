import { type ChangeEvent, type JSX } from "react";

import {
  Box,
  CircularProgress,
  IconButton,
  InputBase,
  Tooltip,
} from "@mui/material";

import { Search, X } from "lucide-react";

import { colors } from "../../theme/tokens";

export interface HeaderSearchProps {
  /**
   * Current search value.
   */
  value: string;

  /**
   * Placeholder text.
   */
  placeholder?: string;

  /**
   * Called whenever the search changes.
   */
  onChange: (value: string) => void;

  /**
   * Called when Enter is pressed.
   */
  onSearch?: (value: string) => void;

  /**
   * Clears the search.
   */
  onClear?: () => void;

  /**
   * Loading indicator.
   */
  loading?: boolean;

  /**
   * Disable search.
   */
  disabled?: boolean;

  /**
   * Show Ctrl+K shortcut.
   */
  showShortcut?: boolean;

  /**
   * Autofocus input.
   */
  autoFocus?: boolean;
}

export default function HeaderSearch({
  value,
  placeholder = "Search bookings, companions, members...",
  onChange,
  onSearch,
  onClear,
  loading = false,
  disabled = false,
  showShortcut = true,
  autoFocus = false,
}: HeaderSearchProps): JSX.Element {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 520,
        height: 48,
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        px: 2,
        borderRadius: "12px",
        bgcolor: colors.cardAlt,
        border: `1px solid ${colors.border}`,
        transition: "all .2s ease",

        "&:hover": {
          borderColor: "rgba(216,164,65,.4)",
        },

        "&:focus-within": {
          borderColor: colors.gold,
          boxShadow: `0 0 0 3px rgba(216,164,65,.15)`,
        },
      }}
    >
      <Search size={18} color={colors.muted} />

      <InputBase
        autoFocus={autoFocus}
        disabled={disabled}
        value={value}
        onChange={handleChange}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onSearch?.(value);
          }
        }}
        placeholder={placeholder}
        sx={{
          flex: 1,
          fontSize: 13.5,
          color: colors.text,

          "& input::placeholder": {
            color: colors.muted,
            opacity: 1,
          },
        }}
      />

      {loading && (
        <CircularProgress
          size={18}
          sx={{
            color: colors.gold,
          }}
        />
      )}

      {!loading && value.length > 0 && (
        <Tooltip title="Clear">
          <IconButton
            size="small"
            onClick={() => {
              onClear?.();
              onChange("");
            }}
            sx={{
              color: colors.secondary,

              "&:hover": {
                color: colors.text,
              },
            }}
          >
            <X size={16} />
          </IconButton>
        </Tooltip>
      )}

      {showShortcut && (
        <Box
          sx={{
            px: 1,
            py: 0.35,
            borderRadius: "8px",
            border: `1px solid ${colors.border}`,
            bgcolor: "rgba(255,255,255,.02)",
            color: colors.muted,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".05em",
            userSelect: "none",
            flexShrink: 0,
          }}
        >
          Ctrl&nbsp;K
        </Box>
      )}
    </Box>
  );
}
