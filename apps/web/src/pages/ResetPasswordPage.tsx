import { useState } from 'react';
import {
  Link as RouterLink,
  useSearchParams,
  useNavigate,
} from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Lock, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@vestara/validation';
import { apiClient } from '../api/client';
import AuthField from '../components/auth/AuthField';
import PasswordStrength from '../components/auth/PasswordStrength';
import { colors } from '../theme/tokens';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token || '',
      password: '',
    },
  });

  const passwordValue = watch('password');

  if (!token) {
    return (
      <Box>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '16px',
            bgcolor: colors.errorSoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2.5,
          }}
        >
          <Lock size={24} color={colors.error} />
        </Box>

        <Typography
          sx={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: 24,
            color: colors.text,
            mb: 1,
          }}
        >
          Invalid reset link
        </Typography>
        <Typography
          sx={{ fontSize: 14, color: colors.secondary, mb: 4, lineHeight: 1.7 }}
        >
          This password reset link is invalid or has expired. Please request a
          new one.
        </Typography>

        <Button
          fullWidth
          component={RouterLink}
          to="/forgot-password"
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
            transition: 'all .2s',
          }}
        >
          Request new reset link
        </Button>

        <Typography
          sx={{
            fontSize: 13,
            color: colors.secondary,
            textAlign: 'center',
            mt: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <ArrowLeft size={14} />
          <RouterLink
            to="/login"
            style={{
              color: colors.gold,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Back to sign in
          </RouterLink>
        </Typography>
      </Box>
    );
  }

  const onSubmit = async (data: ResetPasswordInput) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/reset-password', {
        token: data.token,
        password: data.password,
      });
      setIsSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to reset password. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Box>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '16px',
            bgcolor: colors.successSoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2.5,
          }}
        >
          <CheckCircle size={24} color={colors.success} />
        </Box>

        <Typography
          sx={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: 24,
            color: colors.text,
            mb: 1,
          }}
        >
          Password reset successful
        </Typography>
        <Typography
          sx={{ fontSize: 14, color: colors.secondary, mb: 4, lineHeight: 1.7 }}
        >
          Your password has been updated. You can now sign in with your new
          password.
        </Typography>

        <Button
          fullWidth
          onClick={() => navigate('/login', { replace: true })}
          endIcon={<ArrowRight size={18} />}
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
            transition: 'all .2s',
          }}
        >
          Sign in
        </Button>
      </Box>
    );
  }

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
        Reset password
      </Typography>
      <Typography sx={{ fontSize: 14, color: colors.secondary, mb: 4 }}>
        Enter your new password below
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

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <input type="hidden" {...register('token')} />

        <AuthField
          label="New password"
          type="password"
          value={passwordValue}
          onChange={(v) => setValue('password', v, { shouldValidate: true })}
          placeholder="At least 8 characters"
          error={errors.password?.message}
          autoComplete="new-password"
          icon={<Lock size={16} />}
          disabled={isSubmitting}
        />
        <PasswordStrength password={passwordValue} />

        <Button
          type="submit"
          fullWidth
          disabled={isSubmitting}
          endIcon={
            isSubmitting ? (
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
            mt: 2,
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
          {isSubmitting ? 'Resetting\u2026' : 'Reset password'}
        </Button>
      </Box>

      <Typography
        sx={{
          fontSize: 13,
          color: colors.secondary,
          textAlign: 'center',
          mt: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        <ArrowLeft size={14} />
        <RouterLink
          to="/login"
          style={{
            color: colors.gold,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Back to sign in
        </RouterLink>
      </Typography>
    </Box>
  );
}

export default ResetPasswordPage;
