import { Box, Link, Typography, IconButton, Tooltip } from '@mui/material';
import { Breadcrumbs as MuiBreadcrumbs } from '@mui/material';
import {
  NavigateNext,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
} from '@mui/icons-material';

interface BreadcrumbItem {
  id: string | null;
  label: string;
}

interface FileManagerBreadcrumbsProps {
  folderStack: BreadcrumbItem[];
  viewMode: 'list' | 'grid';
  onNavigate: (index: number) => void;
  onToggleView: () => void;
}

export function FileManagerBreadcrumbs({
  folderStack,
  viewMode,
  onNavigate,
  onToggleView,
}: FileManagerBreadcrumbsProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <MuiBreadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ flex: 1 }}>
        {folderStack.map((item, index) => {
          const isLast = index === folderStack.length - 1;
          return isLast ? (
            <Typography
              key={item.label}
              color="text.primary"
              sx={{ fontWeight: 500, fontSize: '0.875rem' }}
            >
              {item.label}
            </Typography>
          ) : (
            <Link
              key={item.label}
              component="button"
              underline="hover"
              onClick={() => onNavigate(index)}
              sx={{
                fontSize: '0.875rem',
                fontWeight: 400,
                color: 'text.secondary',
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' },
                bgcolor: 'transparent',
                border: 'none',
                fontFamily: 'inherit',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        <Tooltip title={viewMode === 'list' ? 'Grid view' : 'List view'}>
          <IconButton size="small" onClick={onToggleView}>
            {viewMode === 'list' ? <GridViewIcon /> : <ViewListIcon />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export default FileManagerBreadcrumbs;
