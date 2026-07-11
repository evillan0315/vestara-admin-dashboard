import {
  Radio as MuiRadio,
  RadioGroup as MuiRadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  FormHelperText,
  styled,
  type SxProps,
  type Theme,
  type RadioProps as MuiRadioProps,
} from '@mui/material';
import { type FC, type ReactNode } from 'react';

export interface RadioOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface RadioProps extends Omit<MuiRadioProps, 'size'> {
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
}

const StyledRadio = styled(MuiRadio)`
  &.MuiRadio-root {
    color: ${({ theme }) => theme.palette.text.secondary};

    &.Mui-checked {
      color: ${({ theme }) => theme.palette.primary.main};
    }
  }
`;

export const Radio: FC<RadioProps> = ({
  size = 'medium',
  sx,
  ...props
}) => {
  return <StyledRadio size={size} sx={sx} {...props} />;
};

Radio.displayName = 'Radio';

export interface RadioGroupProps {
  label?: string;
  name?: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  row?: boolean;
  error?: boolean;
  helperText?: string;
  sx?: SxProps<Theme>;
}

export const RadioGroup: FC<RadioGroupProps> = ({
  label,
  name,
  options,
  value,
  defaultValue,
  onChange,
  row = false,
  error = false,
  helperText,
  sx,
}) => {
  return (
    <FormControl error={error} sx={sx}>
      {label && (
        <FormLabel
          sx={{
            fontWeight: 500,
            fontSize: '0.875rem',
            '&.Mui-focused': { color: 'text.primary' },
          }}
        >
          {label}
        </FormLabel>
      )}
      <MuiRadioGroup
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={(_e, val) => onChange?.(val)}
        row={row}
      >
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={<Radio />}
            label={option.label}
            disabled={option.disabled}
          />
        ))}
      </MuiRadioGroup>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

RadioGroup.displayName = 'RadioGroup';

export default Radio;
