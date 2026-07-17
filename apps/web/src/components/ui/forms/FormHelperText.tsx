import {
  FormHelperText as MuiFormHelperText,
  styled,
  type SxProps,
  type Theme,
} from '@mui/material';

export interface FormHelperTextProps {
  children?: React.ReactNode;
  error?: boolean;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

const StyledHelperText = styled(MuiFormHelperText)(({ theme, error, disabled }) => ({
  fontSize: '0.75rem',
  marginTop: theme.spacing(0.5),
  color: error
    ? theme.palette.error.main
    : disabled
      ? theme.palette.text.disabled
      : theme.palette.text.secondary,
}));

export function FormHelperText({
  children,
  error = false,
  disabled = false,
  sx,
}: FormHelperTextProps) {
  if (!children) return null;

  return (
    <StyledHelperText error={error} disabled={disabled} sx={sx}>
      {children}
    </StyledHelperText>
  );
}

export default FormHelperText;
