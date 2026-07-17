import { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { loginSchema, type LoginInput } from '@vestara/validation';
import { useAuth } from '../features/auth/AuthContext';
import AuthField from '../components/auth/AuthField';
import OAuthButtons from '../components/auth/OAuthButtons';
import { colors } from '../theme/tokens';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, oauthRedirect } = useAuth();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remember, setRemember] = useState(false);

  const {
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'github') => {
    oauthRedirect(provider);
  };

  const isLoading = isSubmitting;

  return (
    <Box>
      <Typography
        sx={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          fontSize: 28,
          color: colors.text,
          mb: 0.75,
        }}
      >
        Welcome back
      </Typography>
      <Typography sx={{ fontSize: 14, color: colors.secondary, mb: 4 }}>
        Sign in to your Vestara admin account.{' '}
        <Typography
          component={RouterLink}
          to="/register"
          sx={{
            color: colors.gold,
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline',
            '&:hover': { color: colors.goldHover },
          }}
        >
          Create an account
        </Typography>
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2.5,
            bgcolor: 'rgba(239,68,68,0.1)',
            color: colors.error,
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '10px',
            '& .MuiAlert-icon': { color: colors.error },
          }}
        >
          {error}
        </Alert>
      )}

      <OAuthButtons
        onGoogle={() => handleOAuth('google')}
        onGitHub={() => handleOAuth('github')}
        loading={isLoading}
        label="sign in"
      />

      <Box sx={{ my: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: 1, height: 1, bgcolor: colors.border }} />
        <Typography sx={{ fontSize: 12, color: colors.muted }}>or sign in with email</Typography>
        <Box sx={{ flex: 1, height: 1, bgcolor: colors.border }} />
      </Box>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <AuthField
          label="Email address"
          type="email"
          value={emailValue}
          onChange={(v) => setValue('email', v, { shouldValidate: true })}
          placeholder="admin@vestara-admin-api.vercel.app"
          error={errors.email?.message}
          autoComplete="email"
          icon={<Mail size={16} />}
          disabled={isLoading}
        />

        <AuthField
          label="Password"
          type="password"
          value={passwordValue}
          onChange={(v) => setValue('password', v, { shouldValidate: true })}
          placeholder="Enter your password"
          error={errors.password?.message}
          autoComplete="current-password"
          icon={<Lock size={16} />}
          disabled={isLoading}
        />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
            mt: -0.5,
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={isLoading}
                size="small"
                sx={{
                  color: colors.border,
                  '&.Mui-checked': { color: colors.gold },
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: 13, color: colors.secondary }}>Remember me</Typography>
            }
          />
          <Typography
            component={RouterLink}
            to="/forgot-password"
            sx={{
              fontSize: 13,
              color: colors.gold,
              fontWeight: 600,
              textDecoration: 'none',
              '&:hover': { color: colors.goldHover },
            }}
          >
            Forgot password?
          </Typography>
        </Box>

        <Button
          type="submit"
          fullWidth
          disabled={isLoading}
          endIcon={
            isLoading ? (
              <CircularProgress size={16} sx={{ color: '#0A0F18' }} />
            ) : (
              <ArrowRight size={18} />
            )
          }
          sx={{
            bgcolor: colors.gold,
            color: '#0A0F18',
            fontWeight: 800,
            fontSize: 15,
            py: 1.5,
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(216,164,65,0.3)',
            textTransform: 'none',
            '&:hover': {
              bgcolor: colors.goldHover,
              boxShadow: '0 6px 24px rgba(216,164,65,0.4)',
              transform: 'translateY(-1px)',
            },
            '&:active': { transform: 'translateY(0)' },
            '&:disabled': { opacity: 0.6 },
            transition: 'all .2s',
          }}
        >
          {isLoading ? 'Signing in\u2026' : 'Sign in'}
        </Button>
      </Box>

      <Typography
        sx={{
          fontSize: 12,
          color: colors.muted,
          textAlign: 'center',
          mt: 3,
          lineHeight: 1.7,
        }}
      >
        By signing in, you agree to Vestara&apos;s{' '}
        <Box component="a" href="#" sx={{ color: colors.secondary, textDecoration: 'none' }}>
          Terms of Service
        </Box>{' '}
        and{' '}
        <Box component="a" href="#" sx={{ color: colors.secondary, textDecoration: 'none' }}>
          Privacy Policy
        </Box>
        .
      </Typography>
    </Box>
  );
}

export default LoginPage;
