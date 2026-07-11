import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { useAuth } from '../features/auth/AuthContext';
import { colors } from '../theme/tokens';

/**
 * /auth/callback
 *
 * This page is the redirect target for OAuth providers (Google, GitHub).
 * The backend redirects here with ?accessToken=...&refreshToken=...
 * or ?error=... in the URL.
 *
 * It stores the tokens and redirects to the dashboard (or login on error).
 */
export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage(error);
      return;
    }

    if (!accessToken || !refreshToken) {
      setStatus('error');
      setErrorMessage('Missing authentication tokens. Please try again.');
      return;
    }

    // Store tokens and fetch user
    handleOAuthCallback(accessToken, refreshToken)
      .then(() => {
        setStatus('success');
        // Redirect to dashboard after a brief success animation
        setTimeout(() => navigate('/', { replace: true }), 1500);
      })
      .catch((err) => {
        setStatus('error');
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Failed to complete authentication. Please try again.',
        );
      });
  }, [searchParams, navigate, handleOAuthCallback]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 3,
      }}
    >
      {status === 'processing' && (
        <>
          <CircularProgress size={48} sx={{ color: colors.gold }} />
          <Typography
            sx={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              fontSize: 18,
              color: colors.text,
            }}
          >
            Completing sign-in...
          </Typography>
          <Typography sx={{ fontSize: 14, color: colors.secondary }}>
            Verifying your credentials with the authentication provider.
          </Typography>
        </>
      )}

      {status === 'success' && (
        <>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: colors.successSoft,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle sx={{ fontSize: 36, color: colors.success }} />
          </Box>
          <Typography
            sx={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 20,
              color: colors.text,
            }}
          >
            Welcome to Vestara!
          </Typography>
          <Typography sx={{ fontSize: 14, color: colors.secondary }}>
            Redirecting you to the dashboard...
          </Typography>
        </>
      )}

      {status === 'error' && (
        <>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: colors.errorSoft,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ErrorIcon sx={{ fontSize: 36, color: colors.error }} />
          </Box>
          <Typography
            sx={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 20,
              color: colors.text,
            }}
          >
            Authentication Failed
          </Typography>
          <Typography
            sx={{ fontSize: 14, color: colors.secondary, textAlign: 'center', maxWidth: 400 }}
          >
            {errorMessage}
          </Typography>
          <Typography
            component="a"
            href="/login"
            sx={{
              fontSize: 14,
              color: colors.gold,
              fontWeight: 600,
              textDecoration: 'none',
              '&:hover': { color: colors.goldHover },
              cursor: 'pointer',
            }}
          >
            Back to sign in
          </Typography>
        </>
      )}
    </Box>
  );
}

export default OAuthCallbackPage;
