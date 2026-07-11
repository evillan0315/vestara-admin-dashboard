import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  styled,
} from '@mui/material';
import { type ReactNode, forwardRef } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullScreen?: boolean;
  disableBackdropClick?: boolean;
  disableEscapeKeyDown?: boolean;
}

const StyledDialog = styled(Dialog)`
  & .MuiDialog-paper {
    border-radius: 16px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    max-height: 90vh;
  }

  & .MuiDialogTitle-root {
    padding: 24px 24px 0;
    font-weight: 600;
    font-size: 1.25rem;
  }

  & .MuiDialogContent-root {
    padding: 24px;
  }

  & .MuiDialogActions-root {
    padding: 16px 24px 24px;
    justify-content: flex-end;
    gap: 8px;
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
    },
    ref
  ) => {
    return (
      <StyledDialog
        ref={ref}
        open={open}
        onClose={(event, reason) => {
          if (disableBackdropClick && reason === 'backdropClick') {
            return;
          }
          onClose();
        }}
        maxWidth={maxWidth as false}
        fullScreen={fullScreen}
        disableEscapeKeyDown={disableEscapeKeyDown}
      >
        {title && (
          <DialogTitle>{title}</DialogTitle>
        )}
        <DialogContent dividers>
          <DialogContentText>{children}</DialogContentText>
        </DialogContent>
        {actions && (
          <DialogActions>{actions}</DialogActions>
        )}
      </StyledDialog>
    );
  }
);

Modal.displayName = 'Modal';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
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
}: ConfirmDialogProps) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      disableBackdropClick
    >
      <DialogContentText>{message}</DialogContentText>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} variant="outlined">
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={variant === 'danger' ? 'error' : 'primary'}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Modal>
  );
};

export default Modal;