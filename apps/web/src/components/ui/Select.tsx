import {
  Select as MuiSelect,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  styled,
  type SxProps,
  type Theme,
  type SelectProps as MuiSelectProps,
} from '@mui/material';
import { forwardRef } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<MuiSelectProps, 'children'> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
}

const StyledFormControl = styled(FormControl)`
  & .MuiOutlinedInput-root {
    border-radius: 8px;

    &:hover .MuiOutlinedInput-notchedOutline {
      border-color: ${({ theme }) => theme.palette.primary.main};
    }

    &.Mui-focused .MuiOutlinedInput-notchedOutline {
      border-width: 2px;
      border-color: ${({ theme }) => theme.palette.primary.main};
    }
  }

  & .MuiInputLabel-root {
    font-weight: 500;
  }
`;

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      label,
      options,
      placeholder,
      error = false,
      helperText,
      fullWidth = true,
      size = 'medium',
      value,
      defaultValue,
      onChange,
      disabled = false,
      sx,
      ...props
    },
    ref
  ) => {
    return (
      <StyledFormControl
        ref={ref}
        fullWidth={fullWidth}
        size={size}
        error={error}
        disabled={disabled}
        sx={sx}
      >
        {label && <InputLabel>{label}</InputLabel>}
        <MuiSelect
          label={label}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          displayEmpty={!!placeholder}
          {...props}
        >
          {placeholder && (
            <MenuItem value="" disabled>
              <span style={{ opacity: 0.5 }}>{placeholder}</span>
            </MenuItem>
          )}
          {options.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </MenuItem>
          ))}
        </MuiSelect>
        {helperText && <FormHelperText>{error ? helperText : ' '}</FormHelperText>}
      </StyledFormControl>
    );
  }
);

Select.displayName = 'Select';

export default Select;
