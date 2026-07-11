import { Switch as MuiSwitch, FormControlLabel, FormControl, FormLabel, FormHelperText, styled, type SxProps, type Theme } from '@mui/material';
import { Controller, type ControllerProps, type FieldPath, type FieldValues, type PathValue } from 'react-hook-form';
import type { ReactNode } from 'react';

export interface FormSwitchProps<T extends FieldValues> {
  name: FieldPath<T>;
  label?: ReactNode;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  checkedIcon?: ReactNode;
  defaultValue?: PathValue<T, FieldPath<T>>;
  rules?: ControllerProps<T>['rules'];
}

const StyledSwitch = styled(MuiSwitch)<{ $hasError?: boolean }>(({ theme, $hasError }) => ({
  '& .MuiSwitch-track': {
    opacity: 0.5,
  },
  '& .MuiSwitch-thumb': {
    boxShadow: theme.shadows[2],
  },
  '&.Mui-checked .MuiSwitch-track': {
    opacity: 1,
    backgroundColor: $hasError ? theme.palette.error.main : theme.palette.primary.main,
  },
  '&.Mui-disabled': {
    opacity: 0.5,
  },
}));

interface FormSwitchComponentProps<T extends FieldValues> extends FormSwitchProps<T> {
  control: ControllerProps<T>['control'];
}

export function FormSwitch<T extends FieldValues>({
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
  defaultValue = false as PathValue<T, FieldPath<T>>,
  checkedIcon,
}: FormSwitchComponentProps<T>) {
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
              <FormLabel component="legend" required={required} sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 500 }}>
                {label}
              </FormLabel>
            )}
            <FormControlLabel
              control={
                <StyledSwitch
                  $hasError={hasError}
                  size={size}
                  checked={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={disabled}
                  checkedIcon={checkedIcon}
                />
              }
              label={label}
            />
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

export default FormSwitch;