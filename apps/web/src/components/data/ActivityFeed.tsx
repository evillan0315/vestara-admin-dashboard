import { Box, Typography, Avatar, styled, type SxProps, type Theme } from '@mui/material';
import { memo, type ReactElement, type ReactNode } from 'react';

export interface ActivityItem {
  id: string;
  user: {
    name: string;
    avatar?: string;
    initials?: string;
  };
  action: string;
  target?: string;
  timestamp: string;
  icon?: ReactNode;
  iconColor?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

export interface ActivityFeedProps {
  items: ActivityItem[];
  title?: string;
  maxItems?: number;
  sx?: SxProps<Theme>;
}

const FeedContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

const FeedHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const FeedList = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

const FeedItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:last-child': {
    borderBottom: 'none',
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  transition: 'background-color 0.15s ease',
}));

const ItemAvatar = styled(Avatar)(({ theme }) => ({
  width: 36,
  height: 36,
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: `${theme.palette.primary.main}15`,
  color: theme.palette.primary.main,
}));

const ItemContent = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
}));

const ItemText = styled(Typography)(() => ({
  fontSize: '0.875rem',
  lineHeight: 1.5,
  '& strong': {
    fontWeight: 600,
  },
}));

const ItemTimestamp = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  marginTop: 2,
}));

const IconBadge = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'iconColor',
})<{ iconColor: string }>(({ theme, iconColor }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  borderRadius: '50%',
  flexShrink: 0,
  backgroundColor:
    iconColor === 'primary'
      ? `${theme.palette.primary.main}15`
      : iconColor === 'secondary'
        ? `${theme.palette.secondary.main}15`
        : iconColor === 'success'
          ? `${theme.palette.success.main}15`
          : iconColor === 'error'
            ? `${theme.palette.error.main}15`
            : iconColor === 'warning'
              ? `${theme.palette.warning.main}15`
              : `${theme.palette.info.main}15`,
  '& svg': {
    fontSize: 14,
    color:
      iconColor === 'primary'
        ? theme.palette.primary.main
        : iconColor === 'secondary'
          ? theme.palette.secondary.main
          : iconColor === 'success'
            ? theme.palette.success.main
            : iconColor === 'error'
              ? theme.palette.error.main
              : iconColor === 'warning'
                ? theme.palette.warning.main
                : theme.palette.info.main,
  },
}));

export const ActivityFeed = memo(
  ({ items, title = 'Recent Activity', maxItems = 10, sx }: ActivityFeedProps): ReactElement => {
    const displayItems = items.slice(0, maxItems);

    return (
      <FeedContainer sx={sx}>
        <FeedHeader>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {items.length} {items.length === 1 ? 'event' : 'events'}
          </Typography>
        </FeedHeader>
        <FeedList>
          {displayItems.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No recent activity
              </Typography>
            </Box>
          ) : (
            displayItems.map((item) => (
              <FeedItem key={item.id}>
                <ItemAvatar src={item.user.avatar}>
                  {item.user.initials || item.user.name.charAt(0).toUpperCase()}
                </ItemAvatar>
                <ItemContent>
                  <ItemText>
                    <strong>{item.user.name}</strong> {item.action}
                    {item.target && (
                      <>
                        {' '}
                        <strong>{item.target}</strong>
                      </>
                    )}
                  </ItemText>
                  <ItemTimestamp>{item.timestamp}</ItemTimestamp>
                </ItemContent>
                {item.icon && (
                  <IconBadge iconColor={item.iconColor || 'primary'}>{item.icon}</IconBadge>
                )}
              </FeedItem>
            ))
          )}
        </FeedList>
      </FeedContainer>
    );
  },
);

export default ActivityFeed;
