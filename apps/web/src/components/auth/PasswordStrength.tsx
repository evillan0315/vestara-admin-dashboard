import { Box, Typography } from '@mui/material';
import { useMemo } from 'react';
import { colors } from '../../theme/tokens';

function score(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s) as 0 | 1 | 2 | 3 | 4;
}

const levels: { label: string; color: string }[] = [
  { label: '', color: colors.border },
  { label: 'Weak', color: colors.error },
  { label: 'Fair', color: colors.warning },
  { label: 'Good', color: '#3B82F6' },
  { label: 'Strong', color: colors.success },
];

export default function PasswordStrength({ password }: { password: string }) {
  const s = useMemo(() => score(password), [password]);
  if (!password) return null;
  const { label, color } = levels[s];

  return (
    <Box sx={{ mb: 2, mt: -0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        {[1, 2, 3, 4].map((i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: 3,
              borderRadius: '2px',
              bgcolor: i <= s ? color : colors.border,
              transition: 'background-color .25s',
            }}
          />
        ))}
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, color, ml: 1, width: 44 }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}
