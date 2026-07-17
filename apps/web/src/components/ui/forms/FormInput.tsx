import {
  TextField,
  InputAdornment,
  IconButton,
  styled,
  type SxProps,
  type Theme,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  type PathValue,
} from 'react-hook-form';
import { useState, type ReactNode } from 'react';

export interface FormInputProps<T extends FieldValues> extends Omit<
  ControllerProps<T>,
  'render' | 'control' | 'name'
> {
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  type?: string;
  error?: boolean;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  showPasswordToggle?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
  value?: string;
  defaultValue?: PathValue<T, FieldPath<T>>;
  disabled?: boolean;
  required?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  autoComplete?: string;
  inputMode?: 'text' | 'none' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
  inputRef?: React.Ref<HTMLInputElement>;
  multiline?: boolean;
  rows?: number;
}

const StyledTextField = styled(TextField)<{ $hasError?: boolean }>(({ theme, $hasError }) => ({
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

interface FormInputComponentProps<T extends FieldValues> extends FormInputProps<T> {
  control: ControllerProps<T>['control'];
}

export function FormInput<T extends FieldValues>({
  name,
  label,
  placeholder,
  type = 'text',
  error,
  helperText,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  fullWidth = true,
  size = 'medium',
  sx,
  control,
  rules,
  defaultValue,
  disabled,
  required,
  onChange,
  onKeyDown,
  autoFocus,
  autoComplete,
  inputMode,
  inputRef,
  multiline,
  rows,
  ...props
}: FormInputComponentProps<T>) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password' && showPasswordToggle;

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => {
        const hasError = error || !!fieldState.error;
        return (
          <StyledTextField
            $hasError={hasError}
            label={label}
            placeholder={placeholder}
            type={isPasswordType ? (showPassword ? 'text' : 'password') : type}
            error={hasError}
            helperText={hasError ? fieldState.error?.message : helperText}
            fullWidth={fullWidth}
            size={size}
            multiline={multiline}
            rows={rows}
            value={field.value}
            onChange={(e) => {
              field.onChange(e.target.value);
              onChange?.(e as React.ChangeEvent<HTMLInputElement>);
            }}
            onBlur={field.onBlur}
            onKeyDown={onKeyDown}
            disabled={disabled}
            required={required}
            autoFocus={autoFocus}
            autoComplete={autoComplete}
            inputMode={inputMode}
            inputRef={inputRef}
            InputProps={{
              startAdornment: leftIcon ? (
                <InputAdornment position="start">{leftIcon}</InputAdornment>
              ) : undefined,
              endAdornment: showPasswordToggle ? (
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    onClick={handleTogglePassword}
                    edge="end"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                    size="small"
                  >
                    {showPassword ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ) : rightIcon ? (
                <InputAdornment position="end">{rightIcon}</InputAdornment>
              ) : undefined,
            }}
            sx={sx}
            {...props}
          />
        );
      }}
    />
  );
}

export default FormInput;
