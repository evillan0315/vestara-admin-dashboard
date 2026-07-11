import { Controller, type ControllerProps, type FieldPath, type FieldValues, type ControllerRenderProps } from 'react-hook-form';
import { FormControl, FormLabel, FormHelperText, styled, type SxProps, type Theme } from '@mui/material';
import type { ReactNode } from 'react';

export interface FormFieldProps<T extends FieldValues> extends Omit<ControllerProps<T>, 'render' | 'control' | 'name'> {
  name: FieldPath<T>;
  label?: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  sx?: SxProps<Theme>;
  children: (field: ControllerRenderProps<T>) => ReactNode;
}

const StyledFormControl = styled(FormControl)(({ theme, error }) => ({
  width: '100%',
  '& .MuiInputBase-root': {
    borderRadius: theme.shape.borderRadius,
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderWidth: 2,
      borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
    },
    '&.Mui-error .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.error.main,
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
    '&.Mui-focused': {
      color: error ? theme.palette.error.main : theme.palette.primary.main,
    },
  },
}));

export function FormField<T extends FieldValues>({
  name,
  label,
  error,
  helperText,
  required,
  sx,
  children,
  control,
  rules,
  defaultValue,
}: FormFieldProps<T> & { control: ControllerProps<T>['control'] }) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => (
        <StyledFormControl
          error={error || !!fieldState.error}
          sx={sx}
        >
          {label && (
            <FormLabel
              component="legend"
              required={required}
              sx={{ mb: 0.75, fontSize: '0.875rem' }}
            >
              {label}
            </FormLabel>
          )}
          {children(field)}
          {(helperText || fieldState.error) && (
            <FormHelperText id={`${name}-helper-text`} sx={{ mt: 0.5 }}>
              {fieldState.error?.message || helperText}
            </FormHelperText>
          )}
        </StyledFormControl>
      )}
    />
  );
}

export default FormField;