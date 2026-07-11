import { Button as MuiButton, styled, type SxProps, type Theme } from '@mui/material';
import { type ReactNode } from 'react';

export interface ButtonComponentProps {
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  sx?: SxProps<Theme>;
  className?: string;
}

const StyledButton = styled(MuiButton, {
  shouldForwardProp: (prop) => prop !== 'loading',
})<{ loading?: boolean }>`
  border-radius: 8px;
  text-transform: none;
  font-weight: 600;
  padding: 8px 20px;
  box-shadow: none;

  &:hover {
    box-shadow: none;
  }

  &.MuiButton-sizeSmall {
    padding: 6px 16px;
    font-size: 0.8125rem;
  }

  &.MuiButton-sizeLarge {
    padding: 12px 28px;
    font-size: 1rem;
  }

  &.MuiButton-contained {
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    &:hover {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
  }
`;

export const Button = ({
  variant = 'contained',
  size = 'medium',
  fullWidth = false,
  startIcon,
  endIcon,
  loading = false,
  disabled = false,
  children,
  onClick,
  type = 'button',
  sx,
  className,
}: ButtonComponentProps) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      startIcon={loading ? undefined : startIcon}
      endIcon={endIcon}
      disabled={disabled || loading}
      loading={loading}
      onClick={onClick}
      type={type}
      sx={sx}
      className={className}
    >
      {loading ? (
        <>
          <span style={{
            display: 'inline-block',
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderRadius: '50%',
            borderTopColor: 'transparent',
            animation: 'spin 0.6s linear infinite',
            marginRight: '8px',
          }} />
          Loading...
        </>
      ) : (
        children
      )}
    </StyledButton>
  );
};

export default Button;