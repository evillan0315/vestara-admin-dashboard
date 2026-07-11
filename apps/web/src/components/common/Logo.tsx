import type { JSX } from 'react';
import { Box, Typography } from '@mui/material';

/** Logo served from public/ */
const logo = '/logo.svg';

export interface LogoProps {
  collapsed?: boolean;
  orientation?: 'vertical' | 'horizontal';
  showText?: boolean;
  size?: number;
}

export default function Logo({
  collapsed = false,
  orientation = 'vertical',
  showText,
  size = 72,
}: LogoProps): JSX.Element {
  const displayText = showText ?? !collapsed;
  const vertical = orientation === 'vertical';

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: vertical ? 1.75 : 2,
      }}
    >
      <Box
        component="img"
        src={logo}
        alt="Vestara"
        sx={{
          width: size,
          height: size,
          flexShrink: 0,
          objectFit: 'contain',
        }}
      />

      {displayText && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: vertical ? 'center' : 'flex-start',
            textAlign: vertical ? 'center' : 'left',
          }}
        >
          <Typography
            sx={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 500,
              fontSize: vertical ? 22 : 18,
              letterSpacing: vertical ? '0.42em' : '0.18em',
              lineHeight: 1,
              color: '#F8FAFC',
              whiteSpace: 'nowrap',
            }}
          >
            VESTARA
          </Typography>

          <Typography
            sx={{
              mt: 0.9,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: vertical ? 10 : 9,
              letterSpacing: '0.36em',
              textTransform: 'uppercase',
              color: '#D8A441',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            Command Center
          </Typography>
        </Box>
      )}
    </Box>
  );
}
