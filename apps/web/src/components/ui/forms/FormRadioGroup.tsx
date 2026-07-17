import {
  Radio as MuiRadio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
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

export interface RadioOption {
  value: string | number;
  label: ReactNode;
  disabled?: boolean;
}

export interface FormRadioGroupProps<T extends FieldValues> extends Omit<
  ControllerProps<T>,
  'render' | 'control' | 'name'
> {
  name: FieldPath<T>;
  label?: ReactNode;
  options: RadioOption[];
  direction?: 'row' | 'column';
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
}

const StyledRadio = styled(MuiRadio)<{ $hasError?: boolean }>(({ theme, $hasError }) => ({
  color: theme.palette.text.secondary,
  '&.Mui-checked': {
    color: $hasError ? theme.palette.error.main : theme.palette.primary.main,
  },
  '&.Mui-disabled': {
    color: theme.palette.action.disabled,
  },
}));

interface FormRadioGroupComponentProps<T extends FieldValues> extends FormRadioGroupProps<T> {
  control: ControllerProps<T>['control'];
}

export function FormRadioGroup<T extends FieldValues>({
  name,
  label,
  options,
  direction = 'column',
  size = 'medium',
  sx,
  disabled,
  required,
  error,
  helperText,
  control,
  rules,
  defaultValue,
}: FormRadioGroupComponentProps<T>) {
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
                sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 500 }}
              >
                {label}
              </FormLabel>
            )}
            <RadioGroup
              name={name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              row={direction === 'row'}
              sx={{ display: 'flex', flexDirection: direction, gap: direction === 'row' ? 2 : 1.5 }}
            >
              {options.map((option) => (
                <FormControlLabel
                  key={String(option.value)}
                  value={option.value}
                  control={
                    <StyledRadio
                      $hasError={hasError}
                      size={size}
                      disabled={disabled || option.disabled}
                    />
                  }
                  label={option.label}
                  labelPlacement="end"
                />
              ))}
            </RadioGroup>
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

export default FormRadioGroup;
