import { Card as MuiCard, CardHeader, CardContent, CardActions, CardMedia, styled } from '@mui/material';
import { type ReactNode, forwardRef, type HTMLAttributes } from 'react';

export interface CardComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  cardVariant?: 'elevated' | 'outlined' | 'filled';
  hoverable?: boolean;
  padding?: 'none' | 'normal' | 'comfortable';
  header?: {
    title: ReactNode;
    subheader?: ReactNode;
    action?: ReactNode;
    avatar?: ReactNode;
  };
  media?: {
    image: string;
    title?: string;
    position?: 'top' | 'bottom';
  };
  children: ReactNode;
  actions?: ReactNode;
  actionPosition?: 'start' | 'end';
}

const StyledCard = styled(MuiCard, {
  shouldForwardProp: (prop) => prop !== 'cardVariant' && prop !== 'hoverable' && prop !== 'padding',
})<{ cardVariant?: 'elevated' | 'outlined' | 'filled'; hoverable?: boolean; padding?: 'none' | 'normal' | 'comfortable' }>`
  border-radius: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;

  ${({ cardVariant = 'elevated', theme }) => {
    switch (cardVariant) {
      case 'outlined':
        return `
          border: 1px solid ${theme.palette.divider};
          box-shadow: none;
        `;
      case 'filled':
        return `
          background-color: ${theme.palette.background.default};
          box-shadow: none;
        `;
      case 'elevated':
      default:
        return `
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
        `;
    }
  }}

  ${({ hoverable }) =>
    hoverable &&
    `
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
    }
  `}
`;

const StyledCardContent = styled(CardContent, {
  shouldForwardProp: (prop) => prop !== 'cardPadding',
})<{ cardPadding?: 'none' | 'normal' | 'comfortable' }>`
  ${({ cardPadding = 'normal', theme }) => {
    switch (cardPadding) {
      case 'none':
        return 'padding: 0;';
      case 'comfortable':
        return `padding: ${theme.spacing(3)};`;
      case 'normal':
      default:
        return `padding: ${theme.spacing(2)};`;
    }
  }}
`;

export const Card = forwardRef<HTMLDivElement, CardComponentProps>(
  (
    {
      cardVariant = 'elevated',
      hoverable = false,
      padding = 'normal',
      header,
      media,
      children,
      actions,
      actionPosition = 'end',
      ...props
    },
    ref
  ) => {
    return (
      <StyledCard
        ref={ref}
        cardVariant={cardVariant}
        hoverable={hoverable}
        padding={padding}
        {...props}
      >
        {media && media.position !== 'bottom' && (
          <CardMedia
            image={media.image}
            title={media.title}
            sx={{ height: 200 }}
          />
        )}

        {header && (
          <CardHeader
            title={header.title}
            subheader={header.subheader}
            action={header.action}
            avatar={header.avatar}
          />
        )}

        <StyledCardContent cardPadding={padding}>{children}</StyledCardContent>

        {actions && (
          <CardActions disableSpacing sx={{ justifyContent: actionPosition === 'start' ? 'flex-start' : 'flex-end' }}>
            {actions}
          </CardActions>
        )}

        {media && media.position === 'bottom' && (
          <CardMedia
            image={media.image}
            title={media.title}
            sx={{ height: 200 }}
          />
        )}
      </StyledCard>
    );
  }
);

Card.displayName = 'Card';

export default Card;