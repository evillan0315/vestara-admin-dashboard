import {
  Drawer as MuiDrawer,
  Box,
  styled,
} from '@mui/material';
import { type ReactNode, type ReactElement } from 'react';

export interface CustomDrawerProps {
  open: boolean;
  onClose: () => void;
  anchor?: 'left' | 'right' | 'top' | 'bottom';
  children: ReactNode;
  width?: number | string;
  title?: ReactNode;
  showCloseButton?: boolean;
}

const StyledDrawer = styled(MuiDrawer)`
  & .MuiDrawer-paper {
    border: none;
    box-shadow: ${({ theme }) => theme.shadows[8]};
    background-color: ${({ theme }) => theme.palette.background.paper};
    color: ${({ theme }) => theme.palette.text.primary};
  }
`;

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const DrawerContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  overflow: 'auto',
}));

export const Drawer = ({
  open,
  onClose,
  anchor = 'left',
  children,
  width = 320,
  title,
  showCloseButton = true,
}: CustomDrawerProps): ReactElement => {
  return (
    <StyledDrawer
      anchor={anchor}
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
      }}
      PaperProps={{
        sx: {
          width,
          maxWidth: '100vw',
          height: anchor === 'top' || anchor === 'bottom' ? 'auto' : '100%',
          maxHeight: anchor === 'top' || anchor === 'bottom' ? '100vh' : '100%',
        },
      }}
    >
      {(title || showCloseButton) && (
        <DrawerHeader>
          {title && <span>{title}</span>}
          {showCloseButton && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close drawer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </DrawerHeader>
      )}
      <DrawerContent>{children}</DrawerContent>
    </StyledDrawer>
  );
};

Drawer.displayName = 'Drawer';

export interface SidebarDrawerProps extends CustomDrawerProps {
  variant?: 'permanent' | 'persistent';
  onToggle?: (open: boolean) => void;
}

export const Sidebar = ({
  open,
  onClose,
  variant = 'persistent',
  onToggle,
  ...props
}: SidebarDrawerProps): ReactElement => {
  const handleClose = () => {
    onClose();
    onToggle?.(false);
  };

  return (
    <StyledDrawer
      anchor="left"
      variant={variant}
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: props.width || 280,
        },
      }}
    >
      {props.title && (
        <DrawerHeader>
          <span>{props.title}</span>
          {props.showCloseButton !== false && (
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close sidebar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </DrawerHeader>
      )}
      <DrawerContent>{props.children}</DrawerContent>
    </StyledDrawer>
  );
};

export default Drawer;