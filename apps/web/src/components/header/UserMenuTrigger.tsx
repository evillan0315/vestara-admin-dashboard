import { type JSX, useMemo } from 'react';

import { Box, Typography, useTheme, alpha } from '@mui/material';

import { ChevronDown } from 'lucide-react';

import type { UserDTO } from '@vestara/types';
import AvatarUpload from '../common/AvatarUpload';

export interface UserMenuTriggerProps {
  user: UserDTO | null;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
}

export default function UserMenuTrigger({ user, onClick }: UserMenuTriggerProps): JSX.Element {
  const theme = useTheme();
  const { primary, text } = theme.palette;

  const initials = useMemo(() => {
    const name = user ? `${user.firstName} ${user.lastName}`.trim() : '';

    if (!name) {
      return 'U';
    }

    return name
      .split(' ')
      .map((part: string) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        pl: 2,
        ml: 1,
        borderLeft: `1px solid ${theme.palette.divider}`,
        cursor: 'pointer',
        borderRadius: '10px',
        transition: 'all .2s ease',
        position: 'relative',

        '&:hover': {
          bgcolor: alpha(primary.main, 0.08),
        },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <AvatarUpload
          src={user?.avatarUrl}
          size={42}
          initials={initials}
          border={`2px solid ${alpha(primary.main, 0.3)}`}
        />

        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 12,
            height: 12,
            borderRadius: '50%',
            border: `2px solid ${theme.palette.background.paper}`,
            bgcolor: user?.isActive ? '#2EA043' : '#4A5060',
            display: { xs: 'block', md: 'none' },
          }}
        />
      </Box>

      <Box
        sx={{
          display: {
            xs: 'none',
            md: 'block',
          },
        }}
      >
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 700,
            color: text.primary,
            lineHeight: 1.2,
          }}
        >
          {user ? `${user.firstName} ${user.lastName}` : ''}
        </Typography>

        <Typography
          sx={{
            fontSize: 11.5,
            color: text.secondary,
            textTransform: 'capitalize',
          }}
        >
          {user?.role?.replace('_', ' ')}
        </Typography>
      </Box>

      <ChevronDown size={16} color={text.secondary} />
    </Box>
  );
}
