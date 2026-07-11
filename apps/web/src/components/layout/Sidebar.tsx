import { type JSX, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Chip,
  Skeleton,
} from "@mui/material";
import { LogOut, Activity } from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { colors } from "../../theme/tokens";
import Logo from "../common/Logo";
import { navGroups } from "../../layouts/navConfig";

// API Status types
interface ApiStatus {
  status: 'healthy' | 'error' | 'loading';
  latency?: number;
  error?: string;
  url?: string;
  version?: string;
}

// Utility functions for API status
function isApiLoading(status: ApiStatus): boolean {
  return status.status === 'loading';
}

function isApiError(status: ApiStatus): boolean {
  return status.status === 'error';
}

function isApiHealthy(status: ApiStatus): boolean {
  return status.status === 'healthy';
}

export const SIDEBAR_WIDTH = 264;

export interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps): JSX.Element {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // API Status State
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    status: 'loading',
    url: 'vestara-admin-api.vercel.app',
  });

  // Fetch API status
  useEffect(() => {
    const fetchApiStatus = async () => {
      try {
        const startTime = Date.now();
        const response = await fetch('https://vestara-admin-api.vercel.app/api/v1/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Vestara-Admin-Dashboard/1.0',
          },
        });
        const endTime = Date.now();
        const latency = endTime - startTime;

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setApiStatus({
          status: 'healthy',
          latency,
          url: new URL(response.url).hostname,
          version: data.version || '1.0.0',
        });
      } catch (error) {
        setApiStatus({
          status: 'error',
          error: error instanceof Error ? error.message : 'Connection failed',
          url: 'vestara-admin-api.vercel.app',
        });
      }
    };

    // Initial fetch
    fetchApiStatus();

    // Poll every 30 seconds
    const interval = setInterval(fetchApiStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  /** Filter nav items based on the current user's role */
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.allowedRoles) return true;
        if (!user?.role) return false;
        return item.allowedRoles.includes(user.role);
      }),
    }))
    .filter((group) => group.items.length > 0);

  const handleNavClick = (path: string) => {
    navigate(path);
    onClose?.();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Box
      component="aside"
      sx={{
        width: "100%",
        height: "100vh",
        position: "sticky",
        top: 0,
        bgcolor: colors.sidebar,
        borderRight: { lg: `1px solid ${colors.border}` },
        display: "flex",
        flexDirection: "column",
        zIndex: 20,
      }}
    >
      {/* Branding Logo Section */}
      <Box
        component={Link}
        to="/"
        onClick={() => onClose?.()}
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          justifyContent: "center",
          textDecoration: "none",
          color: "inherit",
          cursor: "pointer",
          userSelect: "none",
          borderBottom: `1px solid ${colors.border}`,
          transition: "opacity .2s ease, transform .2s ease",
          "&:hover": { opacity: 0.92 },
          "&:active": { transform: "scale(0.98)" },
        }}
      >
        <Logo orientation="vertical" size={62} />
      </Box>

      {/* Navigation Groups */}
      <Box
        className="scrollbar-none"
        sx={{ flex: 1, overflowY: "auto", px: 1.75, pb: 2 }}
      >
        {visibleGroups.map((group) => (
          <Box key={group.title} sx={{ mb: 1.5 }}>
            <Typography
              sx={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: colors.muted,
                px: 1.25,
                pt: 1.5,
                pb: 0.75,
              }}
            >
              {group.title}
            </Typography>
            {group.items.map((item) => {
              const active = pathname === item.path;
              const Icon = item.icon;
              return (
                <Box
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 1.25,
                    py: 1,
                    borderRadius: "10px",
                    cursor: "pointer",
                    mb: 0.25,
                    color: active ? "#0A0F18" : colors.secondary,
                    bgcolor: active ? colors.gold : "transparent",
                    fontWeight: active ? 700 : 500,
                    transition: "background-color .15s ease, color .15s ease",
                    "&:hover": {
                      bgcolor: active
                        ? colors.gold
                        : "rgba(255,255,255,0.05)",
                      color: active ? "#0A0F18" : colors.text,
                    },
                  }}
                >
                  <Icon size={17} strokeWidth={2} />
                  <Typography
                    sx={{ fontSize: 13.5, fontWeight: "inherit", flex: 1 }}
                  >
                    {item.label}
                  </Typography>
                  {item.badge !== undefined && (
                    <Box
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        minWidth: 20,
                        textAlign: "center",
                        borderRadius: "999px",
                        px: 0.6,
                        py: 0.1,
                        bgcolor: active
                          ? "rgba(10,15,24,0.2)"
                          : "rgba(216,164,65,0.15)",
                        color: active ? "#0A0F18" : colors.gold,
                      }}
                    >
                      {item.badge}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* Footer - Server API Status & Logout */}
      <Box sx={{ borderTop: `1px solid ${colors.border}`, px: 2, py: 1.5 }}>
        {/* Server API Status */}
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: "10px",
            bgcolor: colors.cardAlt,
            border: `1px solid ${colors.border}`,
          }}
        >
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 700,
              color: colors.muted,
              mb: 1,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Server API Status
          </Typography>

          {/* API Status Indicator */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            {isApiLoading(apiStatus) ? (
              <>
                <Activity size={16} color={colors.info} className="animate-pulse" />
                <Typography sx={{ fontSize: 12, color: colors.info, fontWeight: 600 }}>
                  Checking...
                </Typography>
              </>
            ) : isApiError(apiStatus) ? (
              <>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: colors.error,
                    boxShadow: `0 0 6px ${colors.error}80`,
                  }}
                />
                <Typography sx={{ fontSize: 12, color: colors.error, fontWeight: 600 }}>
                  Disconnected
                </Typography>
              </>
            ) : isApiHealthy(apiStatus) ? (
              <>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: colors.success,
                    boxShadow: `0 0 8px ${colors.success}80`,
                  }}
                />
                <Typography sx={{ fontSize: 12, color: colors.success, fontWeight: 600 }}>
                  Connected
                </Typography>
              </>
            ) : (
              <>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: colors.warning,
                    boxShadow: `0 0 6px ${colors.warning}80`,
                  }}
                />
                <Typography sx={{ fontSize: 12, color: colors.warning, fontWeight: 600 }}>
                  Unknown
                </Typography>
              </>
            )}
          </Box>

          {/* API Response Details */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            {isApiLoading(apiStatus) ? (
              <Skeleton variant="text" width={120} height={16} />
            ) : isApiError(apiStatus) ? (
              <Typography sx={{ fontSize: 11, color: colors.error }}>
                {apiStatus.error}
              </Typography>
            ) : isApiHealthy(apiStatus) ? (
              <>
                <Chip
                  label={`v${apiStatus.version || '1.0.0'}`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    backgroundColor: colors.success + '20',
                    color: colors.success,
                    border: `1px solid ${colors.success}40`,
                  }}
                />
                {apiStatus.latency && (
                  <Typography sx={{ fontSize: '0.65rem', color: colors.muted }}>
                    • {apiStatus.latency}ms
                  </Typography>
                )}
              </>
            ) : (
              <Typography sx={{ fontSize: 11, color: colors.muted }}>
                Not initialized
              </Typography>
            )}
          </Box>

          {/* API URL */}
          <Box
            sx={{
              mt: 1,
              p: 1,
              borderRadius: "6px",
              bgcolor: colors.background,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.625rem',
                color: colors.muted,
                fontFamily: "'SF Mono', 'Monaco', monospace",
                textAlign: "center",
              }}
            >
              {apiStatus.url || "vestara-admin-api.vercel.app"}
            </Typography>
          </Box>
        </Box>

        {/* Logout Button */}
        <Box>
          <MenuItem
            onClick={handleLogout}
            disableRipple
            sx={{
              borderRadius: "10px",
              px: 1.5,
              py: 1,
              color: colors.error,
              backgroundColor: colors.errorSoft,
              "&:hover": {
                backgroundColor: colors.errorSoft,
                opacity: 0.9,
              },
              transition: "all 0.2s ease",
            }}
          >
            <ListItemIcon sx={{ minWidth: 30, color: "inherit" }}>
              <LogOut size={16} strokeWidth={2} />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{
                fontSize: 13,
                fontWeight: 600,
              }}
            />
          </MenuItem>
        </Box>
      </Box>
    </Box>
  );
}
