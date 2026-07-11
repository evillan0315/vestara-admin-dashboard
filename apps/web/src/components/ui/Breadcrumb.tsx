import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
  styled,
  type SxProps,
  type Theme,
} from '@mui/material';
import { NavigateNext } from '@mui/icons-material';
import { type FC } from 'react';
import { Link as RouterLink } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  sx?: SxProps<Theme>;
}

const StyledBreadcrumbs = styled(MuiBreadcrumbs)`
  & .MuiBreadcrumbs-separator {
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 1.25rem;
  }
`;

export const Breadcrumb: FC<BreadcrumbProps> = ({
  items,
  separator = <NavigateNext fontSize="small" />,
  sx,
}) => {
  return (
    <StyledBreadcrumbs separator={separator} sx={sx}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast || item.isCurrent) {
          return (
            <Typography
              key={item.label}
              color="text.primary"
              sx={{ fontWeight: 500, fontSize: '0.875rem' }}
            >
              {item.label}
            </Typography>
          );
        }

        return item.href ? (
          <Link
            key={item.label}
            component={RouterLink}
            to={item.href}
            color="inherit"
            sx={{
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 400,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {item.label}
          </Link>
        ) : (
          <Typography
            key={item.label}
            color="text.secondary"
            sx={{ fontSize: '0.875rem' }}
          >
            {item.label}
          </Typography>
        );
      })}
    </StyledBreadcrumbs>
  );
};

Breadcrumb.displayName = 'Breadcrumb';

export default Breadcrumb;
