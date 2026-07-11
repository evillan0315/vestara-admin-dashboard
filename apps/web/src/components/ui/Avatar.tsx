import {
  Avatar as MuiAvatar,
  AvatarGroup as MuiAvatarGroup,
  styled,
  type AvatarProps as MuiAvatarProps,
  type SxProps,
  type Theme,
} from '@mui/material';
import { type FC } from 'react';

export interface AvatarProps extends MuiAvatarProps {
  size?: 'small' | 'medium' | 'large';
  sx?: SxProps<Theme>;
}

const sizeMap = {
  small: { width: 32, height: 32 },
  medium: { width: 40, height: 40 },
  large: { width: 56, height: 56 },
};

const StyledAvatar = styled(MuiAvatar, {
  shouldForwardProp: (prop) => prop !== 'avatarSize',
})<{ avatarSize?: 'small' | 'medium' | 'large' }>(({ avatarSize = 'medium' }) => ({
  ...sizeMap[avatarSize],
  fontWeight: 600,
  fontSize: avatarSize === 'small' ? '0.875rem' : avatarSize === 'large' ? '1.5rem' : '1rem',
}));

export const Avatar: FC<AvatarProps> = ({
  size = 'medium',
  src,
  alt,
  children,
  sx,
  ...props
}) => {
  return (
    <StyledAvatar
      avatarSize={size}
      src={src}
      alt={alt}
      sx={sx}
      {...props}
    >
      {children}
    </StyledAvatar>
  );
};

Avatar.displayName = 'Avatar';

export interface AvatarGroupProps {
  max?: number;
  total?: number;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

const StyledAvatarGroup = styled(MuiAvatarGroup)`
  & .MuiAvatar-root {
    width: 32px;
    height: 32px;
    font-size: 0.875rem;
    font-weight: 600;
    border: 2px solid ${({ theme }) => theme.palette.background.paper};
  }
`;

export const AvatarGroup: FC<AvatarGroupProps> = ({
  max = 4,
  total,
  children,
  sx,
}) => {
  return (
    <StyledAvatarGroup max={max} total={total} sx={sx}>
      {children}
    </StyledAvatarGroup>
  );
};

AvatarGroup.displayName = 'AvatarGroup';

export default Avatar;
