import {
  Checkbox as MuiCheckbox,
  FormControlLabel,
  FormGroup,
  FormControl,
  FormLabel,
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

export interface FormCheckboxProps<T extends FieldValues> extends Omit<
  ControllerProps<T>,
  'render' | 'control' | 'name'
> {
  name: FieldPath<T>;
  label?: ReactNode;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
}

const StyledCheckbox = styled(MuiCheckbox)<{ $hasError?: boolean }>(({ theme, $hasError }) => ({
  color: theme.palette.text.secondary,
  '&.Mui-checked': {
    color: $hasError ? theme.palette.error.main : theme.palette.primary.main,
  },
  '&.Mui-disabled': {
    color: theme.palette.action.disabled,
  },
}));

interface FormCheckboxComponentProps<T extends FieldValues> extends FormCheckboxProps<T> {
  control: ControllerProps<T>['control'];
}

export const FormCheckbox = <T extends FieldValues>({
  name,
  label,
  size = 'medium',
  sx,
  disabled,
  required,
  error,
  helperText,
  control,
  rules,
  defaultValue,
}: FormCheckboxComponentProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => {
        const hasError = error || !!fieldState.error;
        return (
          <FormControl component="fieldset" sx={sx}>
            {label && (
              <FormLabel
                component="legend"
                required={required}
                sx={{ mb: 0.75, fontSize: '0.875rem' }}
              >
                {label}
              </FormLabel>
            )}
            <FormGroup>
              <FormControlLabel
                control={
                  <StyledCheckbox
                    $hasError={hasError}
                    size={size}
                    checked={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={disabled}
                    inputProps={{ 'aria-invalid': hasError }}
                  />
                }
                label={label}
              />
            </FormGroup>
            {(helperText || fieldState.error) && (
              <p
                style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: fieldState.error
                    ? 'var(--mui-palette-error-main)'
                    : 'var(--mui-palette-text-secondary)',
                }}
                id={`${name}-helper-text`}
              >
                {fieldState.error?.message || helperText}
              </p>
            )}
          </FormControl>
        );
      }}
    />
  );
};

export default FormCheckbox;
