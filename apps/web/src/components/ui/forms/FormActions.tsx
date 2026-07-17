import { Box, Button, type ButtonProps, type SxProps, type Theme, styled } from '@mui/material';
import type { ReactNode } from 'react';

export interface FormActionsProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
  fullWidth?: boolean;
  spacing?: number;
  align?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
}

const ActionsContainer = styled(Box)<{
  $fullWidth?: boolean;
  $align?: FormActionsProps['align'];
  $spacing?: number;
}>(({ theme, $fullWidth, $align = 'flex-end', $spacing = 2 }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing($spacing),
  justifyContent: $align,
  width: $fullWidth ? '100%' : 'auto',
  mt: 3,
  pt: 2,
  borderTop: `1px solid ${theme.palette.divider}`,
}));

export function FormActions({
  children,
  sx,
  fullWidth = true,
  spacing = 2,
  align = 'flex-end',
}: FormActionsProps) {
  return (
    <ActionsContainer $fullWidth={fullWidth} $align={align} $spacing={spacing} sx={sx}>
      {children}
    </ActionsContainer>
  );
}

export interface FormSubmitProps extends Omit<ButtonProps, 'type' | 'children'> {
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

export function FormSubmit({
  children,
  loading = false,
  loadingText = 'Saving...',
  disabled = false,
  sx,
  startIcon,
  endIcon,
  ...props
}: FormSubmitProps) {
  return (
    <Button
      type="submit"
      variant="contained"
      disabled={disabled || loading}
      startIcon={loading ? undefined : startIcon}
      endIcon={loading ? undefined : endIcon}
      sx={{
        minWidth: 140,
        ...sx,
      }}
      {...props}
    >
      {loading ? loadingText : children}
    </Button>
  );
}

export interface FormCancelProps extends Omit<ButtonProps, 'children' | 'onClick'> {
  children: ReactNode;
  onClick: () => void;
  variant?: 'text' | 'outlined';
  sx?: SxProps<Theme>;
}

export function FormCancel({
  children,
  onClick,
  variant = 'outlined',
  sx,
  ...props
}: FormCancelProps) {
  return (
    <Button
      type="button"
      variant={variant}
      onClick={onClick}
      sx={{
        minWidth: 140,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

export default FormActions;
