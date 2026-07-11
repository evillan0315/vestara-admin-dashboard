import { Box, Typography, Button, styled } from '@mui/material';
import { Inbox, SearchOff, FolderOff, ErrorOutline, type SvgIconComponent } from '@mui/icons-material';
import { type ReactNode, type ReactElement } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  iconComponent?: SvgIconComponent;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'contained' | 'outlined' | 'text';
  };
  variant?: 'default' | 'search' | 'error' | 'minimal';
  children?: ReactNode;
}

const Container = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(6, 3),
  textAlign: 'center',
  maxWidth: 480,
  margin: '0 auto',
}));

const IconContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 80,
  height: 80,
  borderRadius: '50%',
  backgroundColor: theme.palette.mode === 'light' ? 'rgba(37, 99, 235, 0.08)' : 'rgba(59, 130, 246, 0.12)',
  marginBottom: theme.spacing(3),
  '& svg': {
    fontSize: 40,
    color: theme.palette.primary.main,
  },
}));

const Title = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1.25rem',
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1),
}));

const Description = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.text.secondary,
  lineHeight: 1.6,
  marginBottom: theme.spacing(3),
  maxWidth: 360,
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  fontWeight: 600,
  textTransform: 'none',
}));

export const EmptyState = ({
  icon,
  iconComponent: Icon,
  title,
  description,
  action,
  variant = 'default',
  children,
}: EmptyStateProps): ReactElement => {
  const defaultIcon = variant === 'search' ? SearchOff : variant === 'error' ? ErrorOutline : Inbox;
  const IconComponent = Icon || defaultIcon;

  return (
    <Container>
      <IconContainer>
        {icon || <IconComponent />}
      </IconContainer>

      <Title variant="h6">{title}</Title>

      {description && <Description>{description}</Description>}

      {action && (
        <ActionButton
          variant={action.variant || 'contained'}
          color="primary"
          onClick={action.onClick}
        >
          {action.label}
        </ActionButton>
      )}

      {children}
    </Container>
  );
};

export const NoData = ({ message = 'No data available' }: { message?: string }) => (
  <EmptyState
    iconComponent={Inbox}
    title="No Data"
    description={message}
    variant="minimal"
  />
);

export const NoSearchResults = ({
  query,
  onClear,
}: {
  query?: string;
  onClear?: () => void;
}) => (
  <EmptyState
    iconComponent={SearchOff}
    title="No Results Found"
    description={
      query
        ? `No results found for "${query}". Try a different search term.`
        : 'No results found. Try a different search term.'
    }
    action={
      onClear
        ? {
            label: 'Clear Search',
            onClick: onClear,
            variant: 'outlined',
          }
        : undefined
    }
    variant="search"
  />
);

export const EmptyFolder = ({
  title = 'No Files',
  description = 'There are no files in this folder yet.',
  action,
}: {
  title?: string;
  description?: string;
  action?: EmptyStateProps['action'];
}) => (
  <EmptyState
    iconComponent={FolderOff}
    title={title}
    description={description}
    action={action}
  />
);

export const ErrorState = ({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) => (
  <EmptyState
    iconComponent={ErrorOutline}
    title={title}
    description={description}
    action={
      onRetry
        ? {
            label: 'Try Again',
            onClick: onRetry,
            variant: 'outlined',
          }
        : undefined
    }
    variant="error"
  />
);

export default EmptyState;