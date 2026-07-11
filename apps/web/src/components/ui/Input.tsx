import { TextField, InputAdornment, IconButton, styled } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useState, type ReactNode, type FC } from 'react';

export interface InputProps {
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
  value?: string;
  defaultValue?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  autoComplete?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}

const StyledTextField = styled(TextField)`
  & .MuiOutlinedInput-root {
    border-radius: 8px;

    &:hover .MuiOutlinedInput-notchedOutline {
      border-color: ${({ theme }) => theme.palette.primary.main};
    }

    &.Mui-focused .MuiOutlinedInput-notchedOutline {
      border-width: 2px;
      border-color: ${({ theme }) => theme.palette.primary.main};
    }

    &.Mui-error .MuiOutlinedInput-notchedOutline {
      border-color: ${({ theme }) => theme.palette.error.main};
    }
  }

  & .MuiInputLabel-root {
    font-weight: 500;
  }

  & .MuiInputLabel-root.Mui-focused {
    color: ${({ theme }) => theme.palette.primary.main};
  }
`;

export const Input: FC<InputProps> = ({
  label,
  placeholder,
  type = 'text',
  error = false,
  helperText,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  fullWidth = true,
  size = 'medium',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password' && showPasswordToggle;

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <StyledTextField
      label={label}
      placeholder={placeholder}
      error={error}
      helperText={error ? helperText : undefined}
      fullWidth={fullWidth}
      size={size}
      type={isPasswordType ? (showPassword ? 'text' : 'password') : type}
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
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ) : rightIcon ? (
          <InputAdornment position="end">{rightIcon}</InputAdornment>
        ) : undefined,
      }}
      {...props}
    />
  );
};

Input.displayName = 'Input';

export default Input;