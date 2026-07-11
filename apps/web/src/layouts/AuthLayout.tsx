import { type JSX, type ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { colors } from '../theme/tokens';
import Logo from '../components/common/Logo';

interface AuthLayoutProps {
  children: ReactNode;
}

/** Maps auth routes to brand-panel copy */
const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/login': {
    title: 'Command Centre Access',
    subtitle:
      'Sign in to manage your command center, operations, and intelligence — all from one secure dashboard.',
  },
  '/register': {
    title: 'Join the Command Centre',
    subtitle:
      'Create your Vestara admin account and unlock full access to the command center platform.',
  },
  '/forgot-password': {
    title: 'Recover Your Access',
    subtitle:
      "No worries — we'll help you reset your password and get you back into the dashboard in no time.",
  },
  '/reset-password': {
    title: 'Set a New Password',
    subtitle:
      'Choose a strong, unique password to keep your Vestara admin account secure.',
  },
};

export function AuthLayout({ children }: AuthLayoutProps): JSX.Element {
  const location = useLocation();
  const meta = pageMeta[location.pathname] ?? pageMeta['/login'];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: colors.background,
      }}
    >
      {/* ── Left brand panel ── */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          width: '42%',
          flexShrink: 0,
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          bgcolor: colors.sidebar,
          borderRight: `1px solid ${colors.border}`,
          p: 5,
        }}
      >
        {/* Geometric background layers */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(ellipse 80% 60% at 50% 10%, rgba(216,164,65,0.10) 0%, transparent 70%),
              radial-gradient(ellipse 60% 80% at 80% 80%, rgba(139,92,246,0.07) 0%, transparent 60%)
            `,
          }}
        />

        {/* Decorative grid lines */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(216,164,65,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(216,164,65,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Animated gold orb */}
        <Box
          sx={{
            position: 'absolute',
            width: 420,
            height: 420,
            borderRadius: '50%',
            top: '8%',
            left: '-18%',
            background:
              'radial-gradient(circle, rgba(216,164,65,0.12) 0%, transparent 70%)',
            animation: 'floatA 8s ease-in-out infinite',
            '@keyframes floatA': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-24px)' },
            },
          }}
        />

        {/* Animated purple orb */}
        <Box
          sx={{
            position: 'absolute',
            width: 280,
            height: 280,
            borderRadius: '50%',
            bottom: '12%',
            right: '-8%',
            background:
              'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)',
            animation: 'floatB 10s ease-in-out infinite',
            '@keyframes floatB': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(20px)' },
            },
          }}
        />

        {/* Corner diamond accent */}
        <Box
          sx={{
            position: 'absolute',
            top: '38%',
            right: '-40px',
            width: 120,
            height: 120,
            bgcolor: colors.gold,
            opacity: 0.07,
            transform: 'rotate(45deg)',
            borderRadius: '8px',
          }}
        />

        {/* Top — Logo */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Logo orientation="horizontal" size={42} />
          </Box>
        </Box>

        {/* Centre — Hero text */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            sx={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: 36,
              lineHeight: 1.2,
              color: colors.text,
              mb: 2,
            }}
          >
            {meta.title}
          </Typography>
          <Typography
            sx={{
              fontSize: 15,
              color: colors.secondary,
              lineHeight: 1.7,
              maxWidth: 380,
              mb: 5,
            }}
          >
            {meta.subtitle}
          </Typography>

          {/* Stats row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[
              { label: 'Active Commands', value: '328+' },
              { label: 'Command Centers', value: '612+' },
              { label: 'Monthly Revenue', value: '\u20B114.5M' },
            ].map((s) => (
              <Box key={s.label}>
                <Typography
                  sx={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 22,
                    color: colors.gold,
                  }}
                >
                  {s.value}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 11,
                    color: colors.muted,
                    fontWeight: 500,
                  }}
                >
                  {s.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Bottom — Testimonial */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            p: 2.5,
            bgcolor: 'rgba(255,255,255,0.03)',
            border: `1px solid ${colors.border}`,
            borderRadius: '14px',
          }}
        >
          <Typography
            sx={{
              fontSize: 13.5,
              color: colors.secondary,
              lineHeight: 1.7,
              fontStyle: 'italic',
              mb: 1.5,
            }}
          >
            &ldquo;Vestara has transformed how we manage our command center. The
            platform&apos;s precision and reliability are unmatched in the
            industry.&rdquo;
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'rgba(216,164,65,0.15)',
                color: colors.gold,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              RC
            </Box>
            <Box>
              <Typography
                sx={{ fontSize: 12.5, fontWeight: 700, color: colors.text }}
              >
                Rafael Cruz
              </Typography>
              <Typography sx={{ fontSize: 11, color: colors.muted }}>
                Operations Director, Lux Holdings
              </Typography>
            </Box>
            {/* Stars */}
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}
            >
              {[...Array(5)].map((_, i) => (
                <Box
                  key={i}
                  component="span"
                  sx={{ color: colors.gold, fontSize: 13 }}
                >
                  ★
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── Right form panel ── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 5, lg: 6 },
          overflowY: 'auto',
        }}
      >
        {/* Mobile logo — hidden on large screens */}
        <Box
          sx={{
            display: { lg: 'none' },
            alignItems: 'center',
            gap: 2,
            mb: 8,
          }}
        >
          <Logo orientation="horizontal" size={36} />
        </Box>

        <Box sx={{ width: '100%', maxWidth: 460 }}>{children}</Box>
      </Box>
    </Box>
  );
}

export default AuthLayout;
