import { Snackbar, Alert, type AlertColor, Slide, styled, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import type { TransitionProps } from '@mui/material/transitions';

function SlideTransition(props: TransitionProps & { children: React.ReactElement }) {
  return <Slide {...props} direction="up" />;
}

export interface ToastOptions {
  message: string;
  severity?: AlertColor;
  duration?: number;
}

interface ToastState extends ToastOptions {
  open: boolean;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ToastAlert = styled(Alert)(({ theme, severity }) => ({
  borderRadius: 12,
  boxShadow: theme.shadows[6],
  alignItems: 'center',
  ...(severity === 'success' && {
    borderLeft: `4px solid ${theme.palette.success.main}`,
  }),
  ...(severity === 'error' && {
    borderLeft: `4px solid ${theme.palette.error.main}`,
  }),
  ...(severity === 'warning' && {
    borderLeft: `4px solid ${theme.palette.warning.main}`,
  }),
  ...(severity === 'info' && {
    borderLeft: `4px solid ${theme.palette.info.main}`,
  }),
}));

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      setToast({
        open: true,
        message: options.message,
        severity: options.severity || 'info',
        duration: options.duration,
      });
    },
    []
  );

  const showSuccess = useCallback(
    (message: string) => {
      showToast({ message, severity: 'success' });
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string) => {
      showToast({ message, severity: 'error' });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string) => {
      showToast({ message, severity: 'warning' });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string) => {
      showToast({ message, severity: 'info' });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ showToast, showSuccess, showError, showWarning, showInfo, hideToast }}
    >
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={toast.duration || 5000}
        onClose={hideToast}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <ToastAlert
          severity={toast.severity}
          onClose={hideToast}
          variant="filled"
          action={
            <IconButton size="small" color="inherit" onClick={hideToast}>
              <Close fontSize="small" />
            </IconButton>
          }
        >
          {toast.message}
        </ToastAlert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;