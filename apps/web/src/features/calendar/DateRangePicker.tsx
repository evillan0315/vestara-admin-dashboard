import { useState } from 'react';
import { Box, Button, Popover, alpha } from '@mui/material';
import { Calendar as CalendarIcon, ChevronDown as ChevronDownIcon } from 'lucide-react';
import CalendarDatePicker from './CalendarDatePicker';
import type { DateRangeValue } from './DateRangeContext';

interface DateRangePickerProps {
  dateRange: DateRangeValue;
  onDateRangeChange: (range: DateRangeValue) => void;
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-US', { month: 'short' })} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const label = `${formatDate(dateRange.startDate)} – ${formatDate(dateRange.endDate)}`;

  return (
    <>
      <Button
        disableElevation
        onClick={(e) => setAnchorEl(e.currentTarget)}
        startIcon={<CalendarIcon size={16} />}
        endIcon={<ChevronDownIcon size={16} />}
        sx={{
          height: 40,
          px: 1.75,
          borderRadius: '10px',
          textTransform: 'none',
          fontSize: 12.5,
          fontWeight: 600,
          color: 'text.primary',
          bgcolor: 'background.paper',
          border: '1px solid divider',
          whiteSpace: 'nowrap',
          transition: 'all .2s ease',
          '&:hover': {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            borderColor: 'primary.main',
          },
          '&:active': {
            transform: 'scale(.98)',
          },
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {label}
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 1 }}
      >
        <Box sx={{ p: 0.5, minWidth: 280 }}>
          <CalendarDatePicker
            value={dateRange}
            onChange={(range) => {
              onDateRangeChange(range);
              // Don't close on every change — the calendar needs two clicks
              // to complete a range (start + end). The popover closes when
              // the user clicks outside or presses Escape.
            }}
          />
        </Box>
      </Popover>
    </>
  );
}

export default DateRangePicker;
