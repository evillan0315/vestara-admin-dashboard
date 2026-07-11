import {
  Checkbox as MuiCheckbox,
  FormControlLabel,
  FormGroup,
  styled,
  type SxProps,
  type Theme,
  type CheckboxProps as MuiCheckboxProps,
} from '@mui/material';
import { type FC, type ReactNode } from 'react';

export interface CheckboxProps extends Omit<MuiCheckboxProps, 'size'> {
  label?: ReactNode;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
}

const StyledCheckbox = styled(MuiCheckbox)`
  &.MuiCheckbox-root {
    color: ${({ theme }) => theme.palette.text.secondary};

    &.Mui-checked {
      color: ${({ theme }) => theme.palette.primary.main};
    }
  }
`;

export const Checkbox: FC<CheckboxProps> = ({
  label,
  size = 'medium',
  sx,
  ...props
}) => {
  if (label) {
    return (
      <FormControlLabel
        control={<StyledCheckbox size={size} {...props} />}
        label={label}
        sx={sx}
      />
    );
  }

  return <StyledCheckbox size={size} sx={sx} {...props} />;
};

Checkbox.displayName = 'Checkbox';

export interface CheckboxGroupProps {
  label?: string;
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  value?: string[];
  onChange?: (value: string[]) => void;
  error?: boolean;
  helperText?: string;
  sx?: SxProps<Theme>;
}

export const CheckboxGroup: FC<CheckboxGroupProps> = ({
  label,
  options,
  value = [],
  onChange,
  error = false,
  helperText,
  sx,
}) => {
  const handleChange = (checked: boolean, optionValue: string) => {
    if (!onChange) return;
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter((v) => v !== optionValue));
    }
  };

  return (
    <FormGroup sx={sx}>
      {label && (
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            marginBottom: '4px',
            color: error ? '#d32f2f' : undefined,
          }}
        >
          {label}
        </span>
      )}
      {options.map((option) => (
        <Checkbox
          key={option.value}
          label={option.label}
          checked={value.includes(option.value)}
          onChange={(e) => handleChange(e.target.checked, option.value)}
          disabled={option.disabled}
        />
      ))}
      {helperText && error && (
        <span style={{ fontSize: '0.75rem', color: '#d32f2f', marginTop: '4px' }}>
          {helperText}
        </span>
      )}
    </FormGroup>
  );
};

CheckboxGroup.displayName = 'CheckboxGroup';

export default Checkbox;
