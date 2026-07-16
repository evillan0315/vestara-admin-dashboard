/**
 * Calendar Popover Launcher
 *
 * Header-facing control that displays the currently-selected dashboard date
 * range and opens a {@link CalendarDatePicker} popover. Selection writes back
 * to the global {@link DateRangeContext}, so the Dashboard page reacts live.
 */

import { useMemo, useState, type JSX } from 'react';
import { Box, Button, Popover, useTheme, alpha } from '@mui/material';
import { Calendar, ChevronDown } from 'lucide-react';
import { useDateRange, MAX_RANGE_DAYS } from './DateRangeContext';
import CalendarDatePicker from './CalendarDatePicker';

export interface CalendarPopoverProps {
  /** Hide the control on small screens. */
  hideOnMobile?: boolean;
}

export default function CalendarPopover({
  hideOnMobile = true,
}: CalendarPopoverProps): JSX.Element {
  const theme = useTheme();
  const { primary, text, divider, background } = theme.palette;
  const { range, label, setRange, rangeDays } = useDateRange();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const displayLabel = useMemo(
    () => (rangeDays > 1 ? `${label} · ${rangeDays}d` : label),
    [label, rangeDays],
  );

  return (
    <>
      <Button
        disableElevation
        onClick={handleOpen}
        startIcon={<Calendar size={16} />}
        endIcon={<ChevronDown size={16} />}
        sx={{
          height: 40,
          px: 1.75,
          borderRadius: '10px',
          textTransform: 'none',
          fontSize: 12.5,
          fontWeight: 600,
          color: text.primary,
          bgcolor: background.paper,
          border: `1px solid ${divider}`,
          whiteSpace: 'nowrap',
          transition: 'all .2s ease',
          display: hideOnMobile ? { xs: 'none', lg: 'inline-flex' } : 'inline-flex',
          '&:hover': {
            bgcolor: alpha(primary.main, 0.08),
            borderColor: primary.main,
          },
          '&:active': {
            transform: 'scale(.98)',
          },
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {displayLabel}
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: '14px',
              border: `1px solid ${divider}`,
              bgcolor: background.paper,
              boxShadow: theme.shadows[8],
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box sx={{ p: 0.5 }}>
          <CalendarDatePicker value={range} onChange={setRange} maxDays={MAX_RANGE_DAYS} />
        </Box>
      </Popover>
    </>
  );
}
