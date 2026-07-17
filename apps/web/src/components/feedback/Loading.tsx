import { Box, CircularProgress, Typography, styled } from '@mui/material';
import { type ReactNode, type ReactElement } from 'react';

export interface LoadingProps {
  variant?: 'spinner' | 'skeleton' | 'overlay' | 'inline';
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
  children?: ReactNode;
}

const OverlayContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor:
    theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.8)',
  zIndex: theme.zIndex.modal + 1,
  backdropFilter: 'blur(4px)',
}));

const InlineContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
}));

const SpinnerBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
}));

const SpinnerContainer = styled(Box)(() => ({
  position: 'relative',
  display: 'inline-flex',
}));

const SkeletonLine = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'lineWidth',
})<{ lineWidth?: string }>(({ theme, lineWidth }) => ({
  height: 16,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.action.hover,
  animation: 'shimmer 1.5s infinite',
  width: lineWidth || '100%',
  '@keyframes shimmer': {
    '0%': { opacity: 0.5 },
    '50%': { opacity: 1 },
    '100%': { opacity: 0.5 },
  },
}));

const getSpinnerSize = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return 20;
    case 'medium':
      return 36;
    case 'large':
      return 52;
    default:
      return 36;
  }
};

export const Loading = ({
  variant = 'spinner',
  size = 'medium',
  message,
}: LoadingProps): ReactElement => {
  const spinnerSize = getSpinnerSize(size);

  if (variant === 'overlay') {
    return (
      <OverlayContainer>
        <SpinnerBox>
          <CircularProgress size={spinnerSize} />
          {message && (
            <Typography variant="body2" color="text.secondary">
              {message}
            </Typography>
          )}
        </SpinnerBox>
      </OverlayContainer>
    );
  }

  if (variant === 'inline') {
    return (
      <InlineContainer>
        <CircularProgress size={spinnerSize} />
        {message && (
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        )}
      </InlineContainer>
    );
  }

  if (variant === 'skeleton') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
        <SkeletonLine lineWidth="60%" />
        <SkeletonLine lineWidth="80%" />
        <SkeletonLine lineWidth="40%" />
        <SkeletonLine lineWidth="90%" />
      </Box>
    );
  }

  // Default: spinner
  return (
    <SpinnerBox>
      <SpinnerContainer>
        <CircularProgress size={spinnerSize} />
      </SpinnerContainer>
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </SpinnerBox>
  );
};

export const PageLoading = ({ message = 'Loading page...' }: { message?: string }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 2,
    }}
  >
    <Loading variant="spinner" size="large" message={message} />
  </Box>
);

export const ContentLoading = ({ message }: { message?: string }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
    }}
  >
    <Loading variant="spinner" size="medium" message={message || 'Loading...'} />
  </Box>
);

export const ButtonLoading = () => <CircularProgress size={16} color="inherit" />;

export default Loading;
