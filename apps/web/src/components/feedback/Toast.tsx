import { Snackbar, Alert, type AlertColor, Slide, styled, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useState, useCallback, createContext, useContext, type ReactNode, useMemo } from 'react';
import type { TransitionProps } from '@mui/material/transitions';

function SlideTransition(props: TransitionProps & { children: React.ReactElement }) {
  return <Slide {...props} direction="up" />;
}

export interface ToastOptions {
  message: string;
  severity?: AlertColor;
  duration?: number;
  id?: string;
}

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
  duration: number;
  id: string;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  showSuccess: (message: string, options?: Partial<ToastOptions>) => void;
  showError: (message: string, options?: Partial<ToastOptions>) => void;
  showWarning: (message: string, options?: Partial<ToastOptions>) => void;
  showInfo: (message: string, options?: Partial<ToastOptions>) => void;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
  toasts: ToastState[];
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ToastAlert = styled(Alert)(({ theme, severity }) => ({
  borderRadius: 12,
  boxShadow: theme.shadows[6],
  alignItems: 'center',
  minWidth: 300,
  maxWidth: 480,
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

const ToastContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  pointerEvents: 'none',
  '& > *': {
    pointerEvents: 'auto',
  },
}));

const generateId = () => Math.random().toString(36).substring(2, 9);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = options.id || generateId();
      const newToast: ToastState = {
        open: true,
        message: options.message,
        severity: options.severity || 'info',
        duration: options.duration || 5000,
        id,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto-hide after duration
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          hideToast(id);
        }, newToast.duration);
      }
    },
    [hideToast],
  );

  const showSuccess = useCallback(
    (message: string, options?: Partial<ToastOptions>) => {
      showToast({ message, severity: 'success', ...options });
    },
    [showToast],
  );

  const showError = useCallback(
    (message: string, options?: Partial<ToastOptions>) => {
      showToast({ message, severity: 'error', duration: 7000, ...options });
    },
    [showToast],
  );

  const showWarning = useCallback(
    (message: string, options?: Partial<ToastOptions>) => {
      showToast({ message, severity: 'warning', ...options });
    },
    [showToast],
  );

  const showInfo = useCallback(
    (message: string, options?: Partial<ToastOptions>) => {
      showToast({ message, severity: 'info', ...options });
    },
    [showToast],
  );

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      hideToast,
      hideAllToasts,
      toasts,
    }),
    [showToast, showSuccess, showError, showWarning, showInfo, hideToast, hideAllToasts, toasts],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer>
        {toasts.map((toast) => (
          <Snackbar
            key={toast.id}
            open={toast.open}
            autoHideDuration={toast.duration || 5000}
            onClose={() => hideToast(toast.id)}
            TransitionComponent={SlideTransition}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <ToastAlert
              severity={toast.severity}
              onClose={() => hideToast(toast.id)}
              variant="filled"
              action={
                <IconButton size="small" color="inherit" onClick={() => hideToast(toast.id)}>
                  <Close fontSize="small" />
                </IconButton>
              }
            >
              {toast.message}
            </ToastAlert>
          </Snackbar>
        ))}
      </ToastContainer>
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
