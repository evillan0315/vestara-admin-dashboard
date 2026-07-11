import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { User, Mail, Lock, ArrowRight, Check } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@vestara/validation';
import { useAuth } from '../features/auth/AuthContext';
import AuthField from '../components/auth/AuthField';
import OAuthButtons from '../components/auth/OAuthButtons';
import PasswordStrength from '../components/auth/PasswordStrength';
import { colors } from '../theme/tokens';

const perks = [
  'Access to all companion management tools',
  'Real-time booking and scheduling',
  'Advanced analytics and reporting',
  'Secure payment processing',
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, oauthRedirect } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  const {
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  const firstNameValue = watch('firstName');
  const lastNameValue = watch('lastName');
  const emailValue = watch('email');
  const passwordValue = watch('password');

  const onSubmit = async (data: RegisterInput) => {
    if (!agreeTerms) {
      setTermsError('You must accept the terms to continue.');
      return;
    }
    setTermsError(null);
    setError(null);
    setIsSubmitting(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      navigate('/', { replace: true });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.';
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
        Create your account
      </Typography>
      <Typography sx={{ fontSize: 14, color: colors.secondary, mb: 3 }}>
        Already have an account?{' '}
        <Typography
          component={RouterLink}
          to="/login"
          sx={{
            color: colors.gold,
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline',
            '&:hover': { color: colors.goldHover },
          }}
        >
          Sign in
        </Typography>
      </Typography>

      {/* Perk list */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0.75,
          mb: 3,
        }}
      >
        {perks.map((p) => (
          <Box key={p} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                bgcolor: colors.successSoft,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                mt: '1px',
              }}
            >
              <Check size={9} color={colors.success} strokeWidth={3} />
            </Box>
            <Typography
              sx={{ fontSize: 12, color: colors.secondary, lineHeight: 1.5 }}
            >
              {p}
            </Typography>
          </Box>
        ))}
      </Box>

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
        label="sign up"
      />

      <Box sx={{ my: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: 1, height: 1, bgcolor: colors.border }} />
        <Typography sx={{ fontSize: 12, color: colors.muted }}>
          or sign up with email
        </Typography>
        <Box sx={{ flex: 1, height: 1, bgcolor: colors.border }} />
      </Box>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Two-column row for name */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <AuthField
            label="First name"
            value={firstNameValue}
            onChange={(v) => setValue('firstName', v, { shouldValidate: true })}
            placeholder="John"
            error={errors.firstName?.message}
            autoComplete="given-name"
            icon={<User size={16} />}
            disabled={isLoading}
          />
          <AuthField
            label="Last name"
            value={lastNameValue}
            onChange={(v) => setValue('lastName', v, { shouldValidate: true })}
            placeholder="Doe"
            error={errors.lastName?.message}
            autoComplete="family-name"
            icon={<User size={16} />}
            disabled={isLoading}
          />
        </Box>

        <AuthField
          label="Email address"
          type="email"
          value={emailValue}
          onChange={(v) => setValue('email', v, { shouldValidate: true })}
          placeholder="you@company.com"
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
          placeholder="At least 8 characters"
          error={errors.password?.message}
          autoComplete="new-password"
          icon={<Lock size={16} />}
          disabled={isLoading}
        />
        <PasswordStrength password={passwordValue} />

        <FormControlLabel
          sx={{
            mb: termsError ? 0.5 : 2,
            mt: 0.5,
            alignItems: 'flex-start',
          }}
          control={
            <Checkbox
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (e.target.checked) setTermsError(null);
              }}
              disabled={isLoading}
              size="small"
              sx={{
                color: termsError ? colors.error : colors.border,
                '&.Mui-checked': { color: colors.gold },
                mt: '-2px',
              }}
            />
          }
          label={
            <Typography
              sx={{ fontSize: 12.5, color: colors.secondary, lineHeight: 1.6 }}
            >
              I agree to Vestara&apos;s{' '}
              <Box
                component="a"
                href="#"
                sx={{
                  color: colors.gold,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Terms of Service
              </Box>{' '}
              and{' '}
              <Box
                component="a"
                href="#"
                sx={{
                  color: colors.gold,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Privacy Policy
              </Box>
              . Your data is handled with strict confidentiality.
            </Typography>
          }
        />
        {termsError && (
          <Typography
            sx={{ fontSize: 12, color: colors.error, mb: 2, ml: 0.5 }}
          >
            {termsError}
          </Typography>
        )}

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
          {isLoading ? 'Creating account\u2026' : 'Create account'}
        </Button>
      </Box>
    </Box>
  );
}

export default RegisterPage;
