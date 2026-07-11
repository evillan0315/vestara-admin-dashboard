import { TextareaAutosize, styled, type SxProps, type Theme } from '@mui/material';
import { Controller, type ControllerProps, type FieldPath, type FieldValues } from 'react-hook-form';
import type { ForwardedRef } from 'react';
import { forwardRef } from 'react';

export interface FormTextareaProps<T extends FieldValues> extends Omit<ControllerProps<T>, 'render' | 'control' | 'name'> {
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  rows?: number;
  minRows?: number;
  maxRows?: number;
  sx?: SxProps<Theme>;
  inputRef?: ForwardedRef<HTMLTextAreaElement>;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
}

const StyledTextarea = styled(TextareaAutosize)<{ $hasError?: boolean }>(({ theme, $hasError }) => ({
  width: '100%',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1.5, 2),
  fontSize: '0.875rem',
  fontFamily: 'inherit',
  backgroundColor: theme.palette.mode === 'light' ? theme.palette.background.paper : theme.palette.grey[900],
  border: `1px solid ${$hasError ? theme.palette.error.main : theme.palette.divider}`,
  transition: theme.transitions.create(['border-color', 'box-shadow'], { duration: 150 }),
  color: theme.palette.text.primary,
  '&:hover': {
    borderColor: $hasError ? theme.palette.error.main : theme.palette.primary.main,
  },
  '&:focus': {
    outline: 'none',
    borderColor: $hasError ? theme.palette.error.main : theme.palette.primary.main,
    borderWidth: 2,
    boxShadow: $hasError
      ? `0 0 0 3px ${theme.palette.error.light}40`
      : `0 0 0 3px ${theme.palette.primary.light}40`,
  },
  '&::placeholder': {
    color: theme.palette.text.disabled,
    opacity: 1,
  },
  '&:disabled': {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.text.disabled,
    borderColor: theme.palette.divider,
  },
}));

interface FormTextareaComponentProps<T extends FieldValues> extends FormTextareaProps<T> {
  control: ControllerProps<T>['control'];
}

const FormTextareaComponent = <T extends FieldValues>({
  name,
  label,
  placeholder,
  error,
  helperText,
  required,
  disabled,
  rows = 3,
  minRows,
  maxRows,
  sx,
  control,
  rules,
  defaultValue,
  inputRef,
  autoComplete,
  maxLength,
  minLength,
}: FormTextareaComponentProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => {
        const hasError = error || !!fieldState.error;
        return (
          <>
            {label && (
              <label
                style={{
                  display: 'block',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem',
                  color: 'inherit',
                }}
              >
                {label}
                {required && <span style={{ color: 'var(--mui-palette-error-main)', marginLeft: 4 }}>*</span>}
              </label>
            )}
            <StyledTextarea
              $hasError={hasError}
              placeholder={placeholder}
              disabled={disabled}
              minRows={minRows ?? rows}
              maxRows={maxRows}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={inputRef}
              autoComplete={autoComplete}
              maxLength={maxLength}
              minLength={minLength}
              sx={sx}
            />
            {(helperText || fieldState.error) && (
              <p
                style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: fieldState.error ? 'var(--mui-palette-error-main)' : 'var(--mui-palette-text-secondary)',
                }}
                id={`${name}-helper-text`}
              >
                {fieldState.error?.message || helperText}
              </p>
            )}
          </>
        );
      }}
    />
  );
};

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaComponentProps<FieldValues>>(
  (props, ref) => <FormTextareaComponent {...props} inputRef={ref} />
);

FormTextarea.displayName = 'FormTextarea';

export default FormTextarea;