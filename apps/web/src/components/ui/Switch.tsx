import {
  Switch as MuiSwitch,
  FormControlLabel,
  FormGroup,
  styled,
  type SxProps,
  type Theme,
  type SwitchProps as MuiSwitchProps,
} from '@mui/material';
import { type FC, type ReactNode } from 'react';

export interface SwitchProps extends Omit<MuiSwitchProps, 'size'> {
  label?: ReactNode;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
}

const StyledSwitch = styled(MuiSwitch)`
  & .MuiSwitch-switchBase.Mui-checked {
    color: ${({ theme }) => theme.palette.primary.contrastText};

    & + .MuiSwitch-track {
      background-color: ${({ theme }) => theme.palette.primary.main};
    }
  }
`;

export const Switch: FC<SwitchProps> = ({
  label,
  size = 'medium',
  sx,
  ...props
}) => {
  if (label) {
    return (
      <FormControlLabel
        control={<StyledSwitch size={size} {...props} />}
        label={label}
        sx={sx}
      />
    );
  }

  return <StyledSwitch size={size} sx={sx} {...props} />;
};

Switch.displayName = 'Switch';

export interface SwitchGroupProps {
  label?: string;
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  value?: string[];
  onChange?: (value: string[]) => void;
  sx?: SxProps<Theme>;
}

export const SwitchGroup: FC<SwitchGroupProps> = ({
  label,
  options,
  value = [],
  onChange,
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
          }}
        >
          {label}
        </span>
      )}
      {options.map((option) => (
        <Switch
          key={option.value}
          label={option.label}
          checked={value.includes(option.value)}
          onChange={(e) => handleChange(e.target.checked, option.value)}
          disabled={option.disabled}
        />
      ))}
    </FormGroup>
  );
};

SwitchGroup.displayName = 'SwitchGroup';

export default Switch;
