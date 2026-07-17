import { Box, type SxProps, type Theme } from '@mui/material';
import type { ReactNode } from 'react';

export interface FormLayoutProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
  className?: string;
  columns?: 1 | 2 | 3;
  gap?: number;
  fullWidth?: boolean;
}

export function FormLayout({
  children,
  sx,
  className,
  columns = 1,
  gap = 3,
  fullWidth = true,
}: FormLayoutProps) {
  const gridSx: SxProps<Theme> = {
    display: 'grid',
    gridTemplateColumns:
      columns === 1 ? '1fr' : columns === 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
    gap: gap,
    width: fullWidth ? '100%' : 'auto',
    ...sx,
  };

  return (
    <Box sx={gridSx} className={className}>
      {children}
    </Box>
  );
}

export default FormLayout;
