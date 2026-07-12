import {
  Alert as MuiAlert,
  AlertTitle,
  IconButton,
  styled,
  type AlertColor,
  type AlertProps as MuiAlertProps,
} from '@mui/material';
import {
  Close,
  CheckCircle,
  Error,
  Warning,
  Info,
} from '@mui/icons-material';
import { type ReactNode, forwardRef } from 'react';

export interface AlertProps extends Omit<MuiAlertProps, 'severity' | 'icon' | 'action'> {
  /** The severity of the alert */
  severity?: AlertColor;
  /** Custom title */
  title?: string;
  /** Custom icon */
  icon?: ReactNode;
  /** Whether the alert is dismissible */
  dismissible?: boolean;
  /** Callback when alert is dismissed */
  onDismiss?: () => void;
  /** Whether to show icon */
  showIcon?: boolean;
  /** Variant style */
  variant?: 'standard' | 'filled' | 'outlined';
  /** Additional action element */
  action?: ReactNode;
}

const severityIcons: Record<AlertColor, ReactNode> = {
  success: <CheckCircle fontSize="inherit" />,
  error: <Error fontSize="inherit" />,
  warning: <Warning fontSize="inherit" />,
  info: <Info fontSize="inherit" />,
};

const StyledAlert = styled(MuiAlert, {
  shouldForwardProp: (prop) =>
    prop !== 'severity' &&
    prop !== 'variant' &&
    prop !== 'dismissible' &&
    prop !== 'showIcon',
})<{
  severity?: AlertColor;
  variant?: 'standard' | 'filled' | 'outlined';
  dismissible?: boolean;
  showIcon?: boolean;
}>(({ theme, severity = 'info', variant = 'standard', dismissible, showIcon = true }) => {
  const baseStyles = {
    borderRadius: 12,
    padding: theme.spacing(1.5, 2),
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1.5),
    minWidth: 0,
  };

  const variantStyles = {
    standard: {
      backgroundColor: `${theme.palette[severity].light}20`,
      color: theme.palette[severity].dark,
      border: `1px solid ${theme.palette[severity].light}60`,
    },
    filled: {
      backgroundColor: theme.palette[severity].main,
      color: theme.palette[severity].contrastText,
      border: 'none',
    },
    outlined: {
      backgroundColor: 'transparent',
      color: theme.palette[severity].main,
      border: `2px solid ${theme.palette[severity].main}`,
    },
  };

  const iconStyles = {
    flexShrink: 0,
    marginTop: 2,
    color: variant === 'filled' ? theme.palette[severity].contrastText : theme.palette[severity].main,
  };

  return {
    ...baseStyles,
    ...variantStyles[variant],
    '& .MuiAlert-icon': {
      ...iconStyles,
    },
    '& .MuiAlert-message': {
      flex: 1,
      minWidth: 0,
      padding: 0,
    },
    '& .MuiAlert-action': {
      marginLeft: theme.spacing(1),
      padding: 0,
      '& .MuiIconButton-root': {
        padding: theme.spacing(0.5),
        color: variant === 'filled' ? theme.palette[severity].contrastText : theme.palette[severity].main,
        '&:hover': {
          backgroundColor: variant === 'filled'
            ? `${theme.palette[severity].contrastText}15`
            : `${theme.palette[severity].main}15`,
        },
      },
    },
    ...(dismissible && {
      paddingRight: theme.spacing(1),
    }),
    ...(!showIcon && {
      '& .MuiAlert-icon': {
        display: 'none',
      },
    }),
  };
});

const StyledAlertTitle = styled(AlertTitle)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1rem',
  lineHeight: 1.4,
  marginBottom: theme.spacing(0.5),
  display: 'block',
}));

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      severity = 'info',
      title,
      children,
      icon,
      dismissible = false,
      onDismiss,
      showIcon = true,
      variant = 'standard',
      action,
      className,
      sx,
      ...props
    },
    ref
  ) => {
    const handleDismiss = () => {
      onDismiss?.();
    };

    return (
      <StyledAlert
        ref={ref}
        severity={severity}
        variant={variant}
        dismissible={dismissible}
        showIcon={showIcon}
        action={
          dismissible ? (
            <IconButton
              size="small"
              onClick={handleDismiss}
              aria-label="Dismiss alert"
              edge="end"
            >
              <Close fontSize="small" />
            </IconButton>
          ) : action
        }
        className={className}
        sx={{
          ...sx,
          ...(action && !dismissible && {
            '& .MuiAlert-action': {
              marginLeft: 'auto',
            },
          }),
        }}
        {...props}
      >
        {showIcon && (icon || severityIcons[severity])}
        <div style={{ flex: 1, minWidth: 0 }}>
          {title && <StyledAlertTitle>{title}</StyledAlertTitle>}
          {children}
        </div>
      </StyledAlert>
    );
  }
);

Alert.displayName = 'Alert';

export interface InlineAlertProps extends AlertProps {
  /** Whether the alert is visible */
  open?: boolean;
}

export const InlineAlert = ({
  open = true,
  onDismiss,
  ...props
}: InlineAlertProps) => {
  if (!open) return null;

  return <Alert onDismiss={onDismiss} {...props} />;
};

export default Alert;