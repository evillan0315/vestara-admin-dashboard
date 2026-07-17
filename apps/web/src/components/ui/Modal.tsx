import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Box,
  Typography,
  styled,
  type DialogProps,
  type BackdropProps,
} from '@mui/material';
import { Close, CheckCircle, Error, Warning, Info } from '@mui/icons-material';
import { type ReactNode, forwardRef, type ElementType } from 'react';

export interface ModalProps extends Omit<
  DialogProps,
  'open' | 'onClose' | 'children' | 'BackdropComponent' | 'fullScreen'
> {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Title of the modal */
  title?: string;
  /** Modal content */
  children: ReactNode;
  /** Action buttons */
  actions?: ReactNode;
  /** Maximum width of the modal */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  /** Whether to show in fullscreen on mobile */
  fullScreen?: boolean | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to disable backdrop click to close */
  disableBackdropClick?: boolean;
  /** Whether to disable escape key to close */
  disableEscapeKeyDown?: boolean;
  /** Whether to disable portal rendering */
  disablePortal?: boolean;
  /** Whether to disable auto focus */
  disableAutoFocus?: boolean;
  /** Whether to disable enforce focus */
  disableEnforceFocus?: boolean;
  /** Whether to hide backdrop */
  hideBackdrop?: boolean;
  /** Custom backdrop component */
  BackdropComponent?: ElementType<BackdropProps>;
  /** Custom backdrop props */
  BackdropProps?: Partial<BackdropProps>;
  /** Scroll behavior */
  scroll?: 'paper' | 'body';
  /** Whether to show close button in title bar */
  showCloseButton?: boolean;
  /** Custom close button aria-label */
  closeButtonAriaLabel?: string;
  /** Callback when escape key is pressed */
  onEscapeKeyDown?: () => void;
  /** Callback when backdrop is clicked */
  onBackdropClick?: () => void;
  /** Custom header content (replaces title) */
  header?: ReactNode;
  /** Whether content should be scrollable */
  scrollable?: boolean;
  /** Size variant for responsive fullscreen */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const StyledDialog = styled(Dialog)`
  & .MuiDialog-paper {
    border-radius: 16px;
    box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.25),
      0 8px 16px -8px rgba(0, 0, 0, 0.15);
    max-height: 90vh;
    outline: none;
  }

  & .MuiDialog-paperScrollPaper {
    max-height: 90vh;
  }

  & .MuiDialog-paperScrollBody {
    max-height: 100%;
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

  & .MuiDialogContent-dividers {
    border-top: 1px solid ${({ theme }) => theme.palette.divider};
    border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  }

  & .MuiDialogActions-root {
    padding: 16px 24px 24px;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
  }

  /* Fullscreen styles */
  &.MuiDialog-fullScreen .MuiDialog-paper {
    border-radius: 0;
    max-height: 100%;
    height: 100%;
    max-width: 100%;
    width: 100%;
    margin: 0;
  }

  &.MuiDialog-fullScreen .MuiDialogTitle-root {
    padding: 16px 24px;
    border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  }

  &.MuiDialog-fullScreen .MuiDialogContent-root {
    flex: 1;
    overflow: auto;
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

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open,
      onClose,
      title,
      children,
      actions,
      maxWidth = 'md',
      fullScreen = false,
      disableBackdropClick = false,
      disableEscapeKeyDown = false,
      disablePortal = false,
      disableAutoFocus = false,
      disableEnforceFocus = false,
      hideBackdrop = false,
      BackdropComponent,
      BackdropProps,
      scroll = 'paper',
      showCloseButton = false,
      closeButtonAriaLabel = 'Close dialog',
      onEscapeKeyDown,
      onBackdropClick,
      header,
      scrollable = true,
      size,
      sx,
      ...props
    },
    ref,
  ) => {
    // Handle responsive fullscreen
    const isFullScreen =
      typeof fullScreen === 'string'
        ? false // Will be handled by useMediaQuery in parent if needed
        : fullScreen || size === 'full';

    const handleClose = (event: React.SyntheticEvent, reason: string) => {
      if (disableBackdropClick && reason === 'backdropClick') {
        return;
      }
      if (reason === 'escapeKeyDown' && disableEscapeKeyDown) {
        return;
      }
      onClose();
      if (reason === 'escapeKeyDown') {
        onEscapeKeyDown?.();
      }
      if (reason === 'backdropClick') {
        onBackdropClick?.();
      }
    };

    const computedMaxWidth = size === 'full' ? false : maxWidth;

    return (
      <StyledDialog
        ref={ref}
        open={open}
        onClose={handleClose}
        maxWidth={computedMaxWidth as false}
        fullScreen={isFullScreen}
        disableEscapeKeyDown={disableEscapeKeyDown}
        disablePortal={disablePortal}
        disableAutoFocus={disableAutoFocus}
        disableEnforceFocus={disableEnforceFocus}
        hideBackdrop={hideBackdrop}
        BackdropComponent={BackdropComponent}
        BackdropProps={BackdropProps}
        scroll={scroll}
        sx={{
          '& .MuiDialog-container': {
            alignItems: scroll === 'body' ? 'center' : 'center',
          },
          ...sx,
        }}
        {...props}
      >
        {(title || header || showCloseButton) && (
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingRight: showCloseButton ? 8 : 24,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {header ||
                (title && (
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                    {title}
                  </Typography>
                ))}
            </Box>
            {showCloseButton && (
              <CloseButton onClick={onClose} aria-label={closeButtonAriaLabel} size="small">
                <Close fontSize="medium" />
              </CloseButton>
            )}
          </DialogTitle>
        )}
        <DialogContent
          dividers={!!(title || header)}
          sx={{ overflow: scrollable ? 'auto' : 'visible' }}
        >
          {typeof children === 'string' ? (
            <DialogContentText>{children}</DialogContentText>
          ) : (
            children
          )}
        </DialogContent>
        {actions && <DialogActions>{actions}</DialogActions>}
      </StyledDialog>
    );
  },
);

Modal.displayName = 'Modal';

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
    <Modal
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
    </Modal>
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

export const AlertDialog = ({
  open,
  onClose,
  title,
  message,
  severity = 'info',
  confirmText = 'OK',
  icon,
}: AlertDialogProps) => {
  const severityColors = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info',
  } as const;

  const defaultIcons = {
    success: <CheckCircle fontSize="large" color="success" />,
    error: <Error fontSize="large" color="error" />,
    warning: <Warning fontSize="large" color="warning" />,
    info: <Info fontSize="large" color="info" />,
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      disableBackdropClick
      disableEscapeKeyDown
      showCloseButton
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Box sx={{ flexShrink: 0, marginTop: 0.5 }}>{icon || defaultIcons[severity]}</Box>
        <Typography variant="body1" color="text.secondary" paragraph>
          {message}
        </Typography>
      </Box>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color={severityColors[severity]}>
          {confirmText}
        </Button>
      </DialogActions>
    </Modal>
  );
};

export default Modal;
