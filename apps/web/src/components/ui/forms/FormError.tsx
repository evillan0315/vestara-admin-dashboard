import { Typography, Alert, styled, type SxProps, type Theme } from '@mui/material';
import type { ReactNode } from 'react';

export interface FormErrorProps {
  children?: ReactNode;
  message?: string;
  errors?: Record<string, string | string[]>;
  fieldName?: string;
  sx?: SxProps<Theme>;
  variant?: 'inline' | 'alert' | 'list';
}

const ErrorText = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.error.main,
  display: 'block',
  mt: 0.5,
}));

const ErrorAlert = styled(Alert)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  fontSize: '0.8125rem',
}));

const ErrorList = styled('ul')(({ theme }) => ({
  margin: 0,
  paddingLeft: theme.spacing(2),
  fontSize: '0.75rem',
  color: theme.palette.error.main,
  listStyle: 'disc',
}));

export function FormError({
  children,
  message,
  errors,
  fieldName,
  sx,
  variant = 'inline',
}: FormErrorProps) {
  const errorMessage = fieldName && errors ? errors[fieldName] : message || children;

  if (!errorMessage) return null;

  const messages = Array.isArray(errorMessage) ? errorMessage : [errorMessage];

  switch (variant) {
    case 'alert':
      return (
        <ErrorAlert severity="error" sx={sx}>
          {messages.map((msg, i) => (
            <div key={i}>{msg}</div>
          ))}
        </ErrorAlert>
      );
    case 'list':
      return (
        <ErrorList sx={sx}>
          {messages.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ErrorList>
      );
    default:
      return <ErrorText sx={sx}>{messages[0]}</ErrorText>;
  }
}

export default FormError;
