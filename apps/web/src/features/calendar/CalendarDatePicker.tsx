/**
 * Calendar Date Picker
 *
 * A self-contained, dependency-free month calendar that lets the user select a
 * date range (start + end). Designed in the Vestara dark-luxury / gold-accent
 * style using only MUI primitives so it reuses the existing theme palette.
 *
 * Behaviour:
 *  - Click a day to set the start; click a second day to set the end.
 *  - A second start-click after a completed range restarts selection.
 *  - Hovering previews the range (desktop pointer devices only).
 *  - Month navigation via chevrons; "Today" and "Reset" quick actions.
 */

import { useMemo, useState, type JSX } from 'react';
import { Box, Button, IconButton, Typography, useTheme, alpha } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DateRangeValue } from './DateRangeContext';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBetween(day: Date, start: Date, end: Date): boolean {
  const t = startOfDay(day).getTime();
  return t > startOfDay(start).getTime() && t < startOfDay(end).getTime();
}

export interface CalendarDatePickerProps {
  /** Current selection. */
  value: DateRangeValue;
  /** Called with an updated range when the user completes a selection. */
  onChange: (range: DateRangeValue) => void;
  /** Max days allowed in a selection (selection is clamped to this). */
  maxDays?: number;
}

export default function CalendarDatePicker({
  value,
  onChange,
  maxDays = 180,
}: CalendarDatePickerProps): JSX.Element {
  const theme = useTheme();
  const { primary, text, divider } = theme.palette;

  const start = new Date(value.startDate);
  const end = new Date(value.endDate);

  // Anchor month: follow the selection's start month when present.
  const [viewMonth, setViewMonth] = useState(
    () => new Date(start.getFullYear(), start.getMonth(), 1),
  );
  const [hoverDay, setHoverDay] = useState<Date | null>(null);
  const [draftStart, setDraftStart] = useState<Date | null>(null);

  const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const leadingBlanks = firstOfMonth.getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();

  // Active range end used for preview (hover) while picking the end day.
  const previewEnd = draftStart && hoverDay ? hoverDay : end;

  const cells = useMemo(() => {
    const arr: (Date | null)[] = [];
    for (let i = 0; i < leadingBlanks; i += 1) arr.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      arr.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    }
    return arr;
  }, [leadingBlanks, daysInMonth, viewMonth]);

  const handleDayClick = (day: Date) => {
    const picked = startOfDay(day);
    // No draft yet, or a completed range → start fresh.
    if (!draftStart) {
      setDraftStart(picked);
      onChange({ startDate: picked.toISOString(), endDate: endOfDay(picked).toISOString() });
      return;
    }
    // Completing the range.
    let s = draftStart;
    let e = picked;
    if (s.getTime() > e.getTime()) {
      [s, e] = [e, s];
    }
    // Clamp to maxDays by shifting the start forward.
    const spanDays =
      Math.round((startOfDay(e).getTime() - startOfDay(s).getTime()) / 86_400_000) + 1;
    if (spanDays > maxDays) {
      s = startOfDay(e);
      s.setDate(s.getDate() - (maxDays - 1));
    }
    setDraftStart(null);
    setHoverDay(null);
    onChange({ startDate: s.toISOString(), endDate: endOfDay(e).toISOString() });
  };

  const handleReset = () => {
    setDraftStart(null);
    setHoverDay(null);
    onChange({
      startDate: startOfDay(new Date()).toISOString(),
      endDate: endOfDay(new Date()).toISOString(),
    });
  };

  const today = startOfDay(new Date());

  const dayCellStyle = (day: Date) => {
    const isStart = draftStart ? sameDay(day, draftStart) : sameDay(day, start);
    const isEnd = !draftStart && sameDay(day, end);
    const inRange = draftStart
      ? isBetween(day, draftStart, previewEnd)
      : isBetween(day, start, end);
    const selected =
      isStart ||
      isEnd ||
      (draftStart && sameDay(day, previewEnd) && draftStart.getTime() !== previewEnd.getTime());

    let bgcolor = 'transparent';
    if (selected) bgcolor = primary.main;
    else if (inRange) bgcolor = alpha(primary.main, 0.16);

    return {
      width: 36,
      height: 36,
      borderRadius: '9px',
      margin: '2px',
      cursor: 'pointer',
      border: 'none',
      color: selected ? primary.contrastText : text.primary,
      bgcolor,
      fontWeight: selected ? 700 : 500,
      fontSize: 13,
      fontFamily: 'inherit',
      transition: 'background-color .12s ease, color .12s ease',
      '&:hover': {
        bgcolor: selected ? primary.main : alpha(primary.main, 0.28),
      },
    } as const;
  };

  return (
    <Box sx={{ width: 280, p: 1.5, userSelect: 'none' }}>
      {/* Header: month + nav */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <IconButton
          size="small"
          aria-label="Previous month"
          onClick={() =>
            setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
          }
          sx={{ color: text.primary }}
        >
          <ChevronLeft size={18} />
        </IconButton>
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: text.primary }}>
          {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </Typography>
        <IconButton
          size="small"
          aria-label="Next month"
          onClick={() =>
            setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
          }
          sx={{ color: text.primary }}
        >
          <ChevronRight size={18} />
        </IconButton>
      </Box>

      {/* Weekday labels */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
        {WEEKDAYS.map((wd) => (
          <Box
            key={wd}
            sx={{
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: text.secondary,
              py: 0.5,
            }}
          >
            {wd}
          </Box>
        ))}
      </Box>

      {/* Day grid */}
      <Box
        sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}
        onMouseLeave={() => setHoverDay(null)}
      >
        {cells.map((day, idx) => {
          if (!day) return <Box key={`b-${idx}`} sx={{ width: 36, height: 36, margin: '2px' }} />;
          const isToday = sameDay(day, today);
          const style = dayCellStyle(day);
          return (
            <Box key={day.toISOString()} sx={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => setHoverDay(day)}
                style={style}
                aria-label={day.toDateString()}
              >
                {day.getDate()}
                {isToday && !style.color && (
                  <Box
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      bgcolor: primary.main,
                    }}
                  />
                )}
              </button>
            </Box>
          );
        })}
      </Box>

      {/* Footer actions */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mt: 1.5,
          pt: 1,
          borderTop: `1px solid ${divider}`,
        }}
      >
        <Button
          size="small"
          onClick={() => setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
          sx={{ textTransform: 'none', color: text.secondary, fontSize: 12 }}
        >
          Today
        </Button>
        <Button
          size="small"
          onClick={handleReset}
          sx={{ textTransform: 'none', color: primary.main, fontWeight: 600, fontSize: 12 }}
        >
          Reset
        </Button>
      </Box>
    </Box>
  );
}
