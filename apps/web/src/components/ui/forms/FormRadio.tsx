import {
  FormControl,
  FormGroup,
  FormLabel,
  FormControlLabel,
  Radio as MuiRadio,
  FormHelperText,
  styled,
  type SxProps,
  type Theme,
} from '@mui/material';
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import type { ReactNode } from 'react';

import type { RadioOption } from './FormRadioGroup';

export interface FormRadioProps<T extends FieldValues> extends Omit<
  ControllerProps<T>,
  'render' | 'control' | 'name'
> {
  name: FieldPath<T>;
  label?: ReactNode;
  options: RadioOption[];
  direction?: 'row' | 'column';
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  error?: boolean;
}

const StyledRadio = styled(MuiRadio)<{ $hasError?: boolean }>(({ theme, $hasError }) => ({
  color: theme.palette.text.secondary,
  '&.Mui-checked': {
    color: $hasError ? theme.palette.error.main : theme.palette.primary.main,
  },
  '&.Mui-disabled': {
    opacity: 0.5,
  },
}));

interface FormRadioComponentProps<T extends FieldValues> extends FormRadioProps<T> {
  control: ControllerProps<T>['control'];
}

export function FormRadio<T extends FieldValues>({
  name,
  label,
  options,
  direction = 'column',
  size = 'medium',
  sx,
  control,
  rules,
  defaultValue,
  required,
  disabled,
  helperText,
  error,
  ...props
}: FormRadioComponentProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => {
        const hasError = error || !!fieldState.error;
        return (
          <FormControl component="fieldset" error={hasError} disabled={disabled} sx={sx}>
            {label && (
              <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 500 }}>
                {label}
                {required && (
                  <span style={{ color: 'var(--mui-palette-error-main)', marginLeft: 4 }}>*</span>
                )}
              </FormLabel>
            )}
            <FormGroup row={direction === 'row'}>
              {options.map((option) => (
                <FormControlLabel
                  key={String(option.value)}
                  value={option.value}
                  control={
                    <StyledRadio
                      $hasError={hasError}
                      size={size}
                      checked={field.value === option.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={disabled || option.disabled}
                      {...props}
                    />
                  }
                  label={option.label}
                  labelPlacement={direction === 'row' ? 'end' : 'end'}
                />
              ))}
            </FormGroup>
            {(helperText || fieldState.error) && (
              <FormHelperText sx={{ mt: 0.5 }}>
                {fieldState.error?.message || helperText}
              </FormHelperText>
            )}
          </FormControl>
        );
      }}
    />
  );
}

export default FormRadio;
