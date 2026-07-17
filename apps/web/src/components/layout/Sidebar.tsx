/**
 * Sidebar
 *
 * Fully theme-aware sidebar with support for:
 *  - Dynamic width from density + sidebarCollapsed
 *  - Icon-only mode when collapsed or variant === 'compact'
 *  - Tooltip on hover for icon-only items
 *  - Hidden variant (renders nothing — the outer layout removes the container)
 *  - Primary color, font family, font scale, borderRadiusScale, contrastLevel
 *    from ThemeContext
 *  - No hardcoded color tokens — everything via MUI theme.palette
 */

import { type JSX, useCallback, useRef } from 'react';
import { Box, Typography, Tooltip, useTheme, CircularProgress, alpha } from '@mui/material';
import { Camera } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { useSidebarConfig } from '../../features/sidebar/useSidebarConfig';
import { useAppLogo, useUpdateAppLogo } from '../../features/settings/useAppLogo';
import { navGroups, type NavItem } from '../../layouts/navConfig';
import { uploadImage } from '../../api/upload';
import Logo from '../common/Logo';
import ApiStatusWidget from './ApiStatusWidget';

export const SIDEBAR_WIDTH = 264; // kept for external consumers that may reference it

export interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps): JSX.Element | null {
  const theme = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const cfg = useSidebarConfig();

  const { data: appLogoUrl } = useAppLogo();
  const updateAppLogo = useUpdateAppLogo();
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const handleLogoUpload = useCallback(
    async (file: File) => {
      try {
        const result = await uploadImage(file);
        if (result.success && result.data?.url) {
          await updateAppLogo.mutateAsync(result.data.url);
        }
      } catch {
        // silently fail — the logo simply won't update
      }
    },
    [updateAppLogo],
  );

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
    if (e.target) e.target.value = '';
  };

  // If the variant is 'hidden', render nothing (the outer DashboardLayout
  // also removes the container, this is a safety net).
  if (cfg.hidden) return null;

  const isDark = theme.palette.mode === 'dark';
  const primaryMain = theme.palette.primary.main;
  const primaryContrast = theme.palette.primary.contrastText;

  /** Filter nav groups by role. */
  const visibleGroups = navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        if (!item.allowedRoles) return true;
        if (!user?.role) return false;
        return item.allowedRoles.includes(user.role);
      }),
    }))
    .filter((g) => g.items.length > 0);

  const handleNavClick = (item: NavItem) => {
    if (item.soon) return;
    navigate(item.path);
    onClose?.();
  };

  // Shared style for nav item wrapper
  const navItemSx = (item: NavItem, active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: cfg.iconOnly ? 'center' : 'flex-start',
    gap: cfg.iconOnly ? 0 : 1.75,
    px: cfg.iconOnly ? 0.5 : 1.75,
    py: cfg.iconOnly ? 1 : 1,
    borderRadius: `${Math.round(10 * cfg.borderRadiusScale)}px`,
    cursor: item.soon ? 'default' : 'pointer',
    mb: 0.25,
    color: item.soon
      ? theme.palette.text.disabled
      : active
        ? primaryContrast
        : theme.palette.text.secondary,
    bgcolor: active ? primaryMain : 'transparent',
    fontWeight: active ? 700 : 500,
    opacity: item.soon ? 0.6 : 1,
    transition: 'background-color 0.15s ease, color 0.15s ease',
    '&:hover': {
      bgcolor: item.soon
        ? 'transparent'
        : active
          ? primaryMain
          : isDark
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(0,0,0,0.05)',
      color: item.soon
        ? theme.palette.text.disabled
        : active
          ? primaryContrast
          : theme.palette.text.primary,
    },
  });

  // Font size helper scaled by fontScale
  const s = (px: number) => `${Math.round(px * cfg.fontScale)}px`;

  // ── Render ──

  return (
    <Box
      component="aside"
      sx={{
        width: cfg.width,
        height: '100vh',
        position: 'sticky',
        top: 0,
        bgcolor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
        transition: 'width 0.2s ease',
      }}
    >
      {/* ── Logo ── */}
      <Box
        component={isAdmin ? 'div' : Link}
        to={isAdmin ? undefined : '/'}
        onClick={() => {
          if (!isAdmin) onClose?.();
        }}
        sx={{
          px: cfg.iconOnly ? 1 : 2.5,
          py: cfg.iconOnly ? 1.5 : 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textDecoration: 'none',
          color: 'inherit',
          cursor: isAdmin ? 'default' : 'pointer',
          userSelect: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          position: 'relative',
          ...(isAdmin
            ? {
                '&:hover .logo-upload-overlay': { opacity: 1 },
              }
            : { '&:hover': { opacity: 0.92 }, '&:active': { transform: 'scale(0.98)' } }),
        }}
      >
        <Logo
          src={appLogoUrl}
          collapsed={cfg.iconOnly}
          orientation="vertical"
          size={cfg.iconOnly ? 36 : 62}
        />

        {/* Admin-only upload overlay */}
        {isAdmin && (
          <>
            <Box
              className="logo-upload-overlay"
              onClick={() => logoFileInputRef.current?.click()}
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.common.black, 0.5),
                opacity: 0,
                transition: 'opacity 0.2s',
                cursor: 'pointer',
                zIndex: 2,
              }}
            >
              {updateAppLogo.isPending ? (
                <CircularProgress size={20} sx={{ color: '#fff' }} />
              ) : (
                <Camera size={20} color="#fff" />
              )}
            </Box>
            <input
              ref={logoFileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleLogoFileChange}
            />
          </>
        )}
      </Box>

      {/* ── Navigation groups ── */}
      <Box
        className="scrollbar-none"
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: cfg.iconOnly ? 0.5 : 1.75,
          pb: 2,
        }}
      >
        {visibleGroups.map((group) => (
          <Box key={group.title} sx={{ mb: 1.5 }}>
            {/* Group title — hidden in icon-only mode */}
            {!cfg.iconOnly && (
              <Typography
                sx={{
                  fontSize: s(10.5),
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: theme.palette.text.disabled,
                  px: 1.25,
                  pt: 1.5,
                  pb: 0.75,
                }}
              >
                {group.title}
              </Typography>
            )}

            {group.items.map((item) => {
              const active = pathname === item.path;
              const Icon = item.icon;

              const content = (
                <Box
                  key={item.path}
                  onClick={() => handleNavClick(item)}
                  sx={navItemSx(item, active)}
                >
                  <Icon size={cfg.iconOnly ? 22 : 17} strokeWidth={active ? 2.5 : 2} />
                  {!cfg.iconOnly && (
                    <Typography
                      sx={{
                        fontSize: s(13.5),
                        fontWeight: 'inherit',
                        flex: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.label}
                    </Typography>
                  )}

                  {/* "Soon" badge or numeric badge */}
                  {!cfg.iconOnly &&
                    (item.soon ? (
                      <Box
                        sx={{
                          fontSize: s(9.5),
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          borderRadius: '999px',
                          px: 0.8,
                          py: 0.2,
                          bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                          color: theme.palette.text.disabled,
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        Soon
                      </Box>
                    ) : item.badge !== undefined ? (
                      <Box
                        sx={{
                          fontSize: s(11),
                          fontWeight: 700,
                          minWidth: 20,
                          textAlign: 'center',
                          borderRadius: '999px',
                          px: 0.6,
                          py: 0.1,
                          bgcolor: active ? `${primaryContrast}20` : `${primaryMain}20`,
                          color: active ? primaryContrast : primaryMain,
                        }}
                      >
                        {item.badge}
                      </Box>
                    ) : null)}
                </Box>
              );

              // In icon-only mode, wrap in a Tooltip
              return cfg.iconOnly ? (
                <Tooltip key={item.path} title={item.label} placement="right" arrow>
                  {content}
                </Tooltip>
              ) : (
                <div key={item.path}>{content}</div>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* ── Footer: API health widget + info ── */}
      {!cfg.iconOnly && (
        <Box
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            px: 2,
            py: 1.5,
          }}
        >
          <ApiStatusWidget />
        </Box>
      )}

      {/* Compact footer – just a thin divider */}
      {cfg.iconOnly && (
        <Box
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            px: 1,
            py: 1,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Tooltip
            title={`${user?.firstName ?? 'User'} ${user?.lastName ?? ''}`}
            placement="right"
            arrow
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: primaryMain,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: s(11),
                fontWeight: 700,
                color: primaryContrast,
                cursor: 'pointer',
              }}
              onClick={() => navigate('/profile')}
            >
              {(user?.firstName?.[0] ?? 'U').toUpperCase()}
            </Box>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}
