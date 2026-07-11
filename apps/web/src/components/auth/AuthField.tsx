import { Box, Typography, InputBase, IconButton } from '@mui/material';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { colors } from '../../theme/tokens';

interface AuthFieldProps {
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export default function AuthField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  icon,
  disabled,
}: AuthFieldProps) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPw ? 'text' : 'password') : type;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        component="label"
        sx={{
          display: 'block',
          fontSize: 13,
          fontWeight: 600,
          color: colors.secondary,
          mb: 0.75,
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: colors.cardAlt,
          border: `1.5px solid ${error ? colors.error : colors.border}`,
          borderRadius: '12px',
          px: 1.75,
          py: 0.35,
          transition: 'border-color .15s, box-shadow .15s',
          '&:focus-within': {
            borderColor: error ? colors.error : colors.gold,
            boxShadow: `0 0 0 3px ${error ? 'rgba(239,68,68,0.12)' : 'rgba(216,164,65,0.12)'}`,
          },
        }}
      >
        {icon && (
          <Box sx={{ color: colors.muted, display: 'flex', flexShrink: 0 }}>
            {icon}
          </Box>
        )}
        <InputBase
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          fullWidth
          sx={{
            fontSize: 14,
            color: colors.text,
            py: 1,
            '& input::placeholder': { color: colors.muted, opacity: 1 },
            '& input:disabled': { opacity: 0.6 },
          }}
        />
        {isPassword && (
          <IconButton
            size="small"
            onClick={() => setShowPw((v) => !v)}
            tabIndex={-1}
            sx={{ color: colors.muted, '&:hover': { color: colors.secondary } }}
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </IconButton>
        )}
      </Box>

      {error && (
        <Typography
          sx={{ fontSize: 12, color: colors.error, mt: 0.5, ml: 0.5 }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}
