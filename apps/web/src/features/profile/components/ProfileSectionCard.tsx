import type { ReactNode } from 'react';
import { Box, useTheme, alpha, type SxProps, type Theme } from '@mui/material';
import { Card } from '../../../components/ui/Card';

interface ProfileSectionCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * Consistent card shell used across profile tab sections: a titled header
 * (with optional action slot) and padded body.
 */
export function ProfileSectionCard({
  title,
  description,
  action,
  children,
  sx,
}: ProfileSectionCardProps) {
  const theme = useTheme();
  const { text } = theme.palette;

  return (
    <Card sx={{ mb: 3, ...sx }}>
      <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            mb: description ? 0.5 : 2.5,
          }}
        >
          <Box component="h2" sx={{ fontWeight: 700, color: text.primary, fontSize: 16, m: 0 }}>
            {title}
          </Box>
          {action}
        </Box>
        {description && (
          <Box component="p" sx={{ color: text.secondary, fontSize: 13, m: 0, mb: 2.5 }}>
            {description}
          </Box>
        )}
        {description ? children : <Box sx={{ pt: 0 }}>{children}</Box>}
      </Box>
    </Card>
  );
}

/** Shared MUI text-field styling that respects the dark-luxury theme. */
export function useProfileFieldSx(): SxProps<Theme> {
  const theme = useTheme();
  const { text, divider, primary, background } = theme.palette;
  return {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      bgcolor: background.paper,
      color: text.primary,
      '& fieldset': { borderColor: divider },
      '&:hover fieldset': { borderColor: primary.main },
      '&.Mui-focused fieldset': { borderColor: primary.main, borderWidth: 1.5 },
    },
    '& .MuiInputLabel-root': { color: text.secondary },
    '& .MuiInputLabel-root.Mui-focused': { color: primary.main },
    '& .MuiFormHelperText-root': { color: text.disabled },
    '& .Mui-disabled': {
      '& .MuiOutlinedInput-notchedOutline': { borderColor: `${divider} !important` },
      '& .MuiOutlinedInput-input': { color: text.disabled },
    },
  };
}

/** Gold accent used to tint status chips/badges across the profile module. */
export function useGold() {
  const theme = useTheme();
  return {
    gold: theme.palette.primary.main,
    goldSoft: alpha(theme.palette.primary.main, 0.12),
    goldBorder: alpha(theme.palette.primary.main, 0.25),
  };
}
