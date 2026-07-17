import { Drawer as MuiDrawer, Box, IconButton, Typography, styled } from '@mui/material';
import { Close, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { forwardRef, type ReactNode } from 'react';

export type DrawerVariant = 'temporary' | 'persistent' | 'permanent';
export type DrawerAnchor = 'left' | 'right' | 'top' | 'bottom';

export interface BaseDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback when drawer is closed */
  onClose: () => void;
  /** Anchor position */
  anchor?: DrawerAnchor;
  /** Drawer content */
  children: ReactNode;
  /** Width of the drawer (for left/right) or height (for top/bottom) */
  size?: number | string;
  /** Minimum size */
  minSize?: number | string;
  /** Maximum size */
  maxSize?: number | string;
  /** Title to display in header */
  title?: ReactNode;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Custom close button aria label */
  closeButtonAriaLabel?: string;
  /** Whether to show backdrop (for temporary variant) */
  showBackdrop?: boolean;
  /** Backdrop click behavior */
  hideOnBackdropClick?: boolean;
  /** Escape key behavior */
  hideOnEscapeKeyDown?: boolean;
  /** Custom className */
  className?: string;
  /** Custom sx prop */
  sx?: object;
  /** Whether to keep mounted when closed */
  keepMounted?: boolean;
  /** Z-index */
  zIndex?: number;
  /** Paper elevation */
  elevation?: number;
}

export interface TemporaryDrawerProps extends BaseDrawerProps {
  variant: 'temporary';
  /** Whether drawer is modal (blocks interaction) */
  modal?: boolean;
}

export interface PersistentDrawerProps extends BaseDrawerProps {
  variant: 'persistent';
  /** Callback when drawer is toggled */
  onToggle?: (open: boolean) => void;
}

export interface PermanentDrawerProps extends BaseDrawerProps {
  variant: 'permanent';
}

export type DrawerProps = TemporaryDrawerProps | PersistentDrawerProps | PermanentDrawerProps;

const StyledDrawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) =>
    !['$variant', '$anchor', '$size', '$elevation'].includes(prop as string),
})<{
  $variant?: DrawerVariant;
  $anchor?: DrawerAnchor;
  $size?: number | string;
  $elevation?: number;
}>`
  & .MuiDrawer-paper {
    border: none;
    box-shadow: ${({ theme, $elevation = 8 }) => theme.shadows[$elevation]};
    background-color: ${({ theme }) => theme.palette.background.paper};
    color: ${({ theme }) => theme.palette.text.primary};
    overflow: hidden;
    display: flex;
    flex-direction: column;
    ${({ $anchor, $size }) => {
      if ($anchor === 'left' || $anchor === 'right') {
        return `
          width: ${$size};
          max-width: 100vw;
          height: 100%;
          max-height: 100%;
        `;
      }
      return `
        height: ${$size};
        max-height: 100vh;
        width: 100%;
        max-width: 100%;
      `;
    }}
  }

  & .MuiDrawer-modal {
    z-index: ${({ theme }) => theme.zIndex.drawer + 1};
  }
`;

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  flexShrink: 0,
}));

const DrawerContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  overflow: 'auto',
  flex: 1,
  minHeight: 0,
}));

const DrawerFooter = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  flexShrink: 0,
}));

type BaseDrawerComponentProps = {
  open: boolean;
  onClose: () => void;
  anchor?: DrawerAnchor;
  children: ReactNode;
  size?: number | string;
  minSize?: number | string;
  maxSize?: number | string;
  title?: ReactNode;
  showCloseButton?: boolean;
  closeButtonAriaLabel?: string;
  showBackdrop?: boolean;
  hideOnBackdropClick?: boolean;
  hideOnEscapeKeyDown?: boolean;
  className?: string;
  sx?: object;
  keepMounted?: boolean;
  zIndex?: number;
  elevation?: number;
};

const ResponsiveDrawer = forwardRef<
  HTMLDivElement,
  BaseDrawerComponentProps & {
    variant?: DrawerVariant;
    modal?: boolean;
    onToggle?: (open: boolean) => void;
  }
>(
  (
    {
      open,
      onClose,
      anchor = 'left',
      children,
      size = 320,
      minSize = 280,
      maxSize = 480,
      title,
      showCloseButton = true,
      closeButtonAriaLabel = 'Close drawer',
      showBackdrop = true,
      hideOnBackdropClick = true,
      hideOnEscapeKeyDown = true,
      className,
      sx,
      keepMounted = true,
      zIndex,
      elevation = 8,
      variant = 'temporary',
      onToggle,
      ...props
    },
    ref,
  ) => {
    const handleClose = () => {
      onClose();
      onToggle?.(false);
    };

    const handleBackdropClick = (event: React.MouseEvent) => {
      if (hideOnBackdropClick && event.target === event.currentTarget) {
        onClose();
      }
    };

    const isHorizontal = anchor === 'left' || anchor === 'right';

    return (
      <StyledDrawer
        ref={ref}
        anchor={anchor}
        variant={variant}
        open={open}
        onClose={handleClose}
        ModalProps={{
          keepMounted,
          BackdropProps: {
            invisible: !showBackdrop,
            onClick: handleBackdropClick,
          },
          disableEscapeKeyDown: !hideOnEscapeKeyDown,
        }}
        PaperProps={{
          sx: {
            zIndex,
            ...(variant === 'permanent' && {
              position: 'relative',
            }),
          },
          elevation,
        }}
        className={className}
        sx={{
          ...sx,
          '& .MuiDrawer-paper': {
            width: isHorizontal ? size : '100%',
            maxWidth: isHorizontal ? maxSize : '100%',
            minWidth: isHorizontal ? minSize : 0,
            height: isHorizontal ? '100%' : size,
            maxHeight: isHorizontal ? '100%' : maxSize,
            minHeight: isHorizontal ? 0 : minSize,
          },
        }}
        {...props}
      >
        {variant !== 'permanent' && (
          <>
            {(title || showCloseButton) && (
              <DrawerHeader>
                {title && (
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 600, flex: 1 }}>
                    {title}
                  </Typography>
                )}
                {showCloseButton && (
                  <IconButton
                    onClick={handleClose}
                    aria-label={closeButtonAriaLabel}
                    size="small"
                    sx={{ color: 'text.secondary', p: 0.5 }}
                  >
                    {anchor === 'right' ? (
                      <ChevronRight fontSize="medium" />
                    ) : (
                      <ChevronLeft fontSize="medium" />
                    )}
                  </IconButton>
                )}
              </DrawerHeader>
            )}
            <DrawerContent>{children}</DrawerContent>
          </>
        )}
        {variant === 'permanent' && (
          <>
            {title && (
              <DrawerHeader>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                  {title}
                </Typography>
              </DrawerHeader>
            )}
            <DrawerContent>{children}</DrawerContent>
          </>
        )}
      </StyledDrawer>
    );
  },
);

ResponsiveDrawer.displayName = 'ResponsiveDrawer';

export const Drawer = ResponsiveDrawer;

export interface SidebarProps extends BaseDrawerProps {
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Collapsed width */
  collapsedWidth?: number;
  /** Callback when sidebar is toggled */
  onToggle?: (open: boolean) => void;
  /** Footer content */
  footer?: ReactNode;
  /** Drawer variant */
  variant?: DrawerVariant;
}

export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      open,
      onClose,
      anchor = 'left',
      children,
      size = 280,
      minSize = 240,
      maxSize = 320,
      title,
      showCloseButton = true,
      closeButtonAriaLabel = 'Close sidebar',
      className,
      sx,
      keepMounted = true,
      zIndex,
      variant = 'persistent',
      onToggle,
      collapsed = false,
      collapsedWidth = 72,
      footer,
      ...props
    },
    ref,
  ) => {
    const handleClose = () => {
      onClose();
      onToggle?.(false);
    };

    return (
      <StyledDrawer
        ref={ref}
        anchor={anchor}
        variant={variant}
        open={open}
        onClose={handleClose}
        ModalProps={{
          keepMounted,
        }}
        PaperProps={{
          sx: {
            zIndex,
            width: collapsed ? collapsedWidth : size,
            maxWidth: collapsed ? collapsedWidth : maxSize,
            minWidth: collapsed ? collapsedWidth : minSize,
            height: '100%',
            maxHeight: '100%',
            overflow: 'hidden',
            transition: 'width 0.2s ease, min-width 0.2s ease, max-width 0.2s ease',
          },
        }}
        className={className}
        sx={sx}
        {...props}
      >
        {title && (
          <DrawerHeader>
            <Typography
              variant="h6"
              component="h2"
              sx={{
                fontWeight: 600,
                flex: 1,
                whiteSpace: collapsed ? 'nowrap' : 'normal',
                overflow: collapsed ? 'hidden' : 'visible',
                textOverflow: collapsed ? 'ellipsis' : 'clip',
              }}
            >
              {title}
            </Typography>
            {showCloseButton && (
              <IconButton
                onClick={handleClose}
                aria-label={closeButtonAriaLabel}
                size="small"
                sx={{ color: 'text.secondary', p: 0.5, ml: 1 }}
              >
                <ChevronLeft fontSize="medium" />
              </IconButton>
            )}
          </DrawerHeader>
        )}
        <DrawerContent>{children}</DrawerContent>
        {footer && <DrawerFooter>{footer}</DrawerFooter>}
      </StyledDrawer>
    );
  },
);

Sidebar.displayName = 'Sidebar';

export interface SlideOverProps extends BaseDrawerProps {
  /** Title for the slide over panel */
  title?: ReactNode;
  /** Description/subtitle */
  description?: ReactNode;
  /** Footer actions */
  actions?: ReactNode;
  /** Whether to show drag handle (visual only) */
  showDragHandle?: boolean;
}

export const SlideOver = forwardRef<HTMLDivElement, SlideOverProps>(
  (
    {
      open,
      onClose,
      anchor = 'right',
      children,
      size = 480,
      minSize = 320,
      maxSize = 640,
      title,
      description,
      showCloseButton = true,
      closeButtonAriaLabel = 'Close panel',
      className,
      sx,
      keepMounted = true,
      zIndex,
      elevation = 24,
      showBackdrop = true,
      hideOnBackdropClick = true,
      hideOnEscapeKeyDown = true,
      actions,
      showDragHandle = false,
      ...props
    },
    ref,
  ) => {
    const handleBackdropClick = (event: React.MouseEvent) => {
      if (hideOnBackdropClick && event.target === event.currentTarget) {
        onClose();
      }
    };

    return (
      <StyledDrawer
        ref={ref}
        anchor={anchor}
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted,
          BackdropProps: {
            invisible: !showBackdrop,
            onClick: handleBackdropClick,
          },
          disableEscapeKeyDown: !hideOnEscapeKeyDown,
        }}
        PaperProps={{
          sx: {
            zIndex,
            borderRadius: anchor === 'right' ? '16px 0 0 16px' : '0 16px 16px 0',
            boxShadow: (elevation as number) > 0 ? `var(--shadow-${elevation})` : 'none',
          },
        }}
        className={className}
        sx={{
          ...sx,
          '& .MuiDrawer-paper': {
            width: size,
            maxWidth: maxSize,
            minWidth: minSize,
            height: '100%',
            maxHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        {...props}
      >
        <DrawerHeader sx={{ position: 'relative', zIndex: 1 }}>
          {showDragHandle && (
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 36,
                height: 4,
                borderRadius: 2,
                bgcolor: 'divider',
                pointerEvents: 'none',
              }}
            />
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
            {title && (
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
            )}
            {description && (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>
          {showCloseButton && (
            <IconButton
              onClick={onClose}
              aria-label={closeButtonAriaLabel}
              size="small"
              sx={{ color: 'text.secondary', p: 0.5 }}
            >
              <Close fontSize="medium" />
            </IconButton>
          )}
        </DrawerHeader>
        <DrawerContent>{children}</DrawerContent>
        {actions && <DrawerFooter>{actions}</DrawerFooter>}
      </StyledDrawer>
    );
  },
);

SlideOver.displayName = 'SlideOver';

export default Drawer;
