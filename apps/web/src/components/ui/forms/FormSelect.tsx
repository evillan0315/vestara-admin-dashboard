import {
  Select as MuiSelect,
  MenuItem,
  FormControl,
  InputLabel,
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
import { forwardRef, type ForwardedRef } from 'react';

export interface FormSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface FormSelectProps<T extends FieldValues> extends Omit<
  ControllerProps<T>,
  'render' | 'control' | 'name'
> {
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  options: FormSelectOption[];
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
  inputRef?: ForwardedRef<HTMLSelectElement>;
  native?: boolean;
}

const StyledFormControl = styled(FormControl)<{ $hasError?: boolean }>(({ theme, $hasError }) => ({
  width: '100%',
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius,
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: $hasError ? theme.palette.error.main : theme.palette.primary.main,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderWidth: 2,
      borderColor: $hasError ? theme.palette.error.main : theme.palette.primary.main,
    },
    '&.Mui-error .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.error.main,
    },
    '&.Mui-disabled': {
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.divider,
      },
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
    '&.Mui-focused': {
      color: $hasError ? theme.palette.error.main : theme.palette.primary.main,
    },
  },
}));

interface FormSelectComponentProps<T extends FieldValues> extends FormSelectProps<T> {
  control: ControllerProps<T>['control'];
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectComponentProps<FieldValues>>(
  (props, ref) => {
    const {
      name,
      label,
      placeholder,
      options,
      error,
      helperText,
      disabled,
      fullWidth = true,
      size = 'medium',
      sx,
      control,
      rules,
      defaultValue,
      native = false,
      ...rest
    } = props;

    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={defaultValue}
        render={({ field, fieldState }) => {
          const hasError = error || !!fieldState.error;
          return (
            <StyledFormControl
              $hasError={hasError}
              fullWidth={fullWidth}
              size={size}
              error={hasError}
              disabled={disabled}
              sx={sx}
            >
              {label && <InputLabel id={`${name}-label`}>{label}</InputLabel>}
              <MuiSelect
                ref={ref}
                labelId={`${name}-label`}
                label={label}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                displayEmpty={!!placeholder}
                disabled={disabled}
                native={native}
                {...rest}
              >
                {placeholder && (
                  <MenuItem value="" disabled>
                    <span style={{ opacity: 0.5 }}>{placeholder}</span>
                  </MenuItem>
                )}
                {options.map((option) => (
                  <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </MenuItem>
                ))}
              </MuiSelect>
              {helperText || fieldState.error ? (
                <FormHelperText id={`${name}-helper-text`}>
                  {fieldState.error?.message || helperText}
                </FormHelperText>
              ) : (
                <FormHelperText>&nbsp;</FormHelperText>
              )}
            </StyledFormControl>
          );
        }}
      />
    );
  },
);

FormSelect.displayName = 'FormSelect';

export default FormSelect;
