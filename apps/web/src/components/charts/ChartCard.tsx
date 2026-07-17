import type { ReactNode } from 'react';
import { Box, Typography, Paper, styled, Skeleton, type PaperProps } from '@mui/material';

// ── Styled Wrapper ─────────────────────────────────

const StyledChartCard = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  },
  height: '100%',
}));

const ChartTitleRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 8,
});

// ── Props ──────────────────────────────────────────

export interface ChartCardProps extends PaperProps {
  title?: string;
  subtitle?: string;
  /** Rendered in the top-right corner (e.g. date range label, action button) */
  action?: ReactNode;
  children?: ReactNode;
}

// ── Component ──────────────────────────────────────

export function ChartCard({ title, subtitle, action, children, sx, ...rest }: ChartCardProps) {
  return (
    <StyledChartCard sx={sx} {...rest}>
      {(title || subtitle || action) && (
        <ChartTitleRow>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            {title && (
              <Typography variant="h6" fontWeight={600}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
        </ChartTitleRow>
      )}
      {children}
    </StyledChartCard>
  );
}

// ── Loading Skeleton ────────────────────────────────

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2, mt: 1 }} />;
}

// ── Empty State ─────────────────────────────────────

export function EmptyChart({ height = 280, message }: { height?: number; message?: string }) {
  return (
    <Box
      sx={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.secondary',
      }}
    >
      <Typography variant="body2">{message ?? 'No activity in this period'}</Typography>
    </Box>
  );
}
