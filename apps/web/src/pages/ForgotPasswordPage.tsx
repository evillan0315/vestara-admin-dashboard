import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@vestara/validation';
import { apiClient } from '../api/client';
import AuthField from '../components/auth/AuthField';
import { colors } from '../theme/tokens';

export function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const emailValue = watch('email');

  const onSubmit = async (data: ForgotPasswordInput) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/forgot-password', data);
      setSubmittedEmail(data.email);
      setIsSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to send reset email. Please try again.';
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
          <Mail size={24} color={colors.success} />
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
          Check your email
        </Typography>
        <Typography sx={{ fontSize: 14, color: colors.secondary, mb: 4, lineHeight: 1.7 }}>
          We&apos;ve sent a password reset link to{' '}
          <Box component="span" sx={{ color: colors.text, fontWeight: 600 }}>
            {submittedEmail}
          </Box>
          . Please check your inbox and follow the instructions.
        </Typography>

        <Button
          fullWidth
          onClick={() => {
            setIsSuccess(false);
            setSubmittedEmail('');
          }}
          sx={{
            bgcolor: colors.cardAlt,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            fontWeight: 600,
            fontSize: 14,
            py: 1.35,
            borderRadius: '12px',
            textTransform: 'none',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.06)',
              borderColor: colors.gold,
            },
            transition: 'all .2s',
          }}
        >
          Try again
        </Button>

        <Typography
          sx={{
            fontSize: 13,
            color: colors.secondary,
            textAlign: 'center',
            mt: 3,
          }}
        >
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
        Forgot password?
      </Typography>
      <Typography sx={{ fontSize: 14, color: colors.secondary, mb: 4 }}>
        Enter your email and we&apos;ll send you a reset link
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
        <AuthField
          label="Email address"
          type="email"
          value={emailValue}
          onChange={(v) => setValue('email', v, { shouldValidate: true })}
          placeholder="you@company.com"
          error={errors.email?.message}
          autoComplete="email"
          icon={<Mail size={16} />}
          disabled={isSubmitting}
        />

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
          {isSubmitting ? 'Sending\u2026' : 'Send reset link'}
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

export default ForgotPasswordPage;
