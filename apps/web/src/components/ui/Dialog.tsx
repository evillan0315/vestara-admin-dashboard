import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  styled,
  Box,
  Typography,
} from '@mui/material';
import { type ReactNode, forwardRef } from 'react';
import { Close } from '@mui/icons-material';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
  disableBackdropClick?: boolean;
  disableEscapeKeyDown?: boolean;
  scroll?: 'paper' | 'body';
  showCloseButton?: boolean;
  closeButtonAriaLabel?: string;
  sx?: object;
}

const StyledDialog = styled(Dialog)`
  & .MuiDialog-paper {
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 8px 16px -8px rgba(0, 0, 0, 0.15);
    max-height: 90vh;
  }

  & .MuiDialogTitle-root {
    padding: 24px 24px 0;
    font-weight: 600;
    font-size: 1.25rem;
    line-height: 1.4;
  }

  & .MuiDialogContent-root {
    padding: 24px;
    overflow: auto;
  }

  & .MuiDialogContent-root:first-of-type {
    padding-top: 24px;
  }

  & .MuiDialogActions-root {
    padding: 16px 24px 24px;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
  }
`;

const CloseButton = styled(Button)`
  min-width: 36px;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
  color: ${({ theme }) => theme.palette.text.secondary};
  &:hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
    color: ${({ theme }) => theme.palette.text.primary};
  }
`;

export const SimpleDialog = forwardRef<HTMLDivElement, DialogProps>(
  (
    {
      open,
      onClose,
      title,
      children,
      actions,
      maxWidth = 'md',
      fullWidth = true,
      disableBackdropClick = false,
      disableEscapeKeyDown = false,
      scroll = 'paper',
      showCloseButton = false,
      closeButtonAriaLabel = 'Close dialog',
      sx,
      ...props
    },
    ref
  ) => {
    const handleClose = (event: React.SyntheticEvent, reason: string) => {
      if (disableBackdropClick && reason === 'backdropClick') {
        return;
      }
      if (reason === 'escapeKeyDown' && disableEscapeKeyDown) {
        return;
      }
      onClose();
    };

    return (
      <StyledDialog
        ref={ref}
        open={open}
        onClose={handleClose}
        maxWidth={maxWidth}
        fullWidth={fullWidth}
        disableEscapeKeyDown={disableEscapeKeyDown}
        scroll={scroll}
        sx={sx}
        {...props}
      >
        {(title || showCloseButton) && (
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingRight: showCloseButton ? 8 : 24,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {title && <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>{title}</Typography>}
            </Box>
            {showCloseButton && (
              <CloseButton
                onClick={onClose}
                aria-label={closeButtonAriaLabel}
                size="small"
              >
                <Close fontSize="medium" />
              </CloseButton>
            )}
          </DialogTitle>
        )}
        <DialogContent dividers={!!title}>
          {typeof children === 'string' ? <DialogContentText>{children}</DialogContentText> : children}
        </DialogContent>
        {actions && <DialogActions>{actions}</DialogActions>}
      </StyledDialog>
    );
  }
);

SimpleDialog.displayName = 'SimpleDialog';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  loading?: boolean;
  disableBackdropClick?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
  disableBackdropClick = true,
  maxWidth = 'sm',
}: ConfirmDialogProps) => {
  const handleConfirm = async () => {
    if (loading) return;
    await onConfirm();
  };

  return (
    <SimpleDialog
      open={open}
      onClose={onClose}
      title={title}
      maxWidth={maxWidth}
      disableBackdropClick={disableBackdropClick}
      disableEscapeKeyDown={disableBackdropClick}
      showCloseButton={!disableBackdropClick}
    >
      <Typography variant="body1" color="text.secondary" paragraph>
        {message}
      </Typography>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} variant="outlined">
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          color={variant === 'danger' ? 'error' : variant === 'warning' ? 'warning' : 'primary'}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </SimpleDialog>
  );
};

export interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  severity?: 'success' | 'error' | 'warning' | 'info';
  confirmText?: string;
  icon?: ReactNode;
}

const severityColors = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info',
} as const;

import { CheckCircle, Error, Warning, Info } from '@mui/icons-material';

const defaultIcons = {
  success: <CheckCircle fontSize="large" color="success" />,
  error: <Error fontSize="large" color="error" />,
  warning: <Warning fontSize="large" color="warning" />,
  info: <Info fontSize="large" color="info" />,
};

export const AlertDialog = ({
  open,
  onClose,
  title,
  message,
  severity = 'info',
  confirmText = 'OK',
  icon,
}: AlertDialogProps) => {
  return (
    <SimpleDialog
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      disableBackdropClick
      disableEscapeKeyDown
      showCloseButton
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Box sx={{ flexShrink: 0, marginTop: 0.5 }}>
          {icon || defaultIcons[severity]}
        </Box>
        <Typography variant="body1" color="text.secondary" paragraph>
          {message}
        </Typography>
      </Box>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
          color={severityColors[severity]}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </SimpleDialog>
  );
};

export default SimpleDialog;