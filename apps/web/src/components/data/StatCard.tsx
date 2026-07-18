import {
  Box,
  Typography,
  Card,
  CardContent,
  styled,
  type SxProps,
  type Theme,
} from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';
import { memo, type ReactElement, type ReactNode } from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  iconColor?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  sx?: SxProps<Theme>;
  loading?: boolean;
}

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
  '&:hover': {
    boxShadow: theme.shadows[2],
    transform: 'translateY(-1px)',
  },
}));

const IconContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'iconColor',
})<{ iconColor: string }>(({ theme, iconColor }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: 10,
  [theme.breakpoints.up('sm')]: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  backgroundColor:
    iconColor === 'primary'
      ? `${theme.palette.primary.main}15`
      : iconColor === 'secondary'
        ? `${theme.palette.secondary.main}15`
        : iconColor === 'success'
          ? `${theme.palette.success.main}15`
          : iconColor === 'error'
            ? `${theme.palette.error.main}15`
            : iconColor === 'warning'
              ? `${theme.palette.warning.main}15`
              : `${theme.palette.info.main}15`,
  '& svg': {
    fontSize: 20,
    [theme.breakpoints.up('sm')]: {
      fontSize: 24,
    },
    color:
      iconColor === 'primary'
        ? theme.palette.primary.main
        : iconColor === 'secondary'
          ? theme.palette.secondary.main
          : iconColor === 'success'
            ? theme.palette.success.main
            : iconColor === 'error'
              ? theme.palette.error.main
              : iconColor === 'warning'
                ? theme.palette.warning.main
                : theme.palette.info.main,
  },
}));

const ChangeContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'positive',
})<{ positive: boolean | null }>(({ theme, positive }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 8px',
  borderRadius: 20,
  backgroundColor:
    positive === true
      ? `${theme.palette.success.main}15`
      : positive === false
        ? `${theme.palette.error.main}15`
        : `${theme.palette.grey[500]}15`,
  '& svg': {
    fontSize: 14,
    color:
      positive === true
        ? theme.palette.success.main
        : positive === false
          ? theme.palette.error.main
          : theme.palette.grey[500],
  },
}));

const ChangeText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'positive',
})<{ positive: boolean | null }>(({ theme, positive }) => ({
  fontSize: '0.75rem',
  fontWeight: 600,
  color:
    positive === true
      ? theme.palette.success.main
      : positive === false
        ? theme.palette.error.main
        : theme.palette.grey[500],
}));

export const StatCard = memo(
  ({
    title,
    value,
    change,
    changeLabel,
    icon,
    iconColor = 'primary',
    sx,
    loading = false,
  }: StatCardProps): ReactElement => {
    const isPositive = change !== undefined ? change > 0 : null;

    return (
      <StyledCard sx={sx}>
        <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                {loading ? '—' : value}
              </Typography>
            </Box>
            {icon && <IconContainer iconColor={iconColor}>{icon}</IconContainer>}
          </Box>
          {change !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <ChangeContainer positive={isPositive}>
                {isPositive === true ? (
                  <TrendingUp />
                ) : isPositive === false ? (
                  <TrendingDown />
                ) : (
                  <TrendingFlat />
                )}
                <ChangeText positive={isPositive}>
                  {isPositive ? '+' : ''}
                  {change}%
                </ChangeText>
              </ChangeContainer>
              {changeLabel && (
                <Typography variant="caption" color="text.secondary">
                  {changeLabel}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </StyledCard>
    );
  },
);

export default StatCard;
