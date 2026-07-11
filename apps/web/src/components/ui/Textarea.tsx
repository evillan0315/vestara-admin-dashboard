import { TextField, styled, type SxProps, type Theme } from '@mui/material';
import { type FC } from 'react';

export interface TextareaProps {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  name?: string;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  rows?: number;
  minRows?: number;
  maxRows?: number;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  autoFocus?: boolean;
  sx?: SxProps<Theme>;
}

const StyledTextarea = styled(TextField)`
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

export const Textarea: FC<TextareaProps> = ({
  label,
  placeholder,
  error = false,
  helperText,
  fullWidth = true,
  size = 'medium',
  rows = 4,
  minRows,
  maxRows,
  ...props
}) => {
  return (
    <StyledTextarea
      label={label}
      placeholder={placeholder}
      error={error}
      helperText={error ? helperText : undefined}
      fullWidth={fullWidth}
      size={size}
      multiline
      rows={!minRows && !maxRows ? rows : undefined}
      minRows={minRows}
      maxRows={maxRows}
      {...props}
    />
  );
};

Textarea.displayName = 'Textarea';

export default Textarea;
