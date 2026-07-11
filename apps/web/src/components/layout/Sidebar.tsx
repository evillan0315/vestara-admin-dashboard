import { type JSX } from "react";
import {
  Box,
  Typography,
  Avatar,
  ListItemIcon,
  ListItemText,
  MenuItem,
} from "@mui/material";
import { LogOut } from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { colors } from "../../theme/tokens";
import Logo from "../common/Logo";
import { navGroups } from "../../layouts/navConfig";

export const SIDEBAR_WIDTH = 264;

export interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps): JSX.Element {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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

      {/* Footer — User Info & Logout */}
      {user && (
        <Box sx={{ borderTop: `1px solid ${colors.border}`, px: 2, py: 1.5 }}>
          {/* User Avatar & Info */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 1,
            }}
          >
            <Avatar
              src={user.avatarUrl || undefined}
              alt={`${user.firstName} ${user.lastName}`}
              sx={{
                width: 36,
                height: 36,
                bgcolor: colors.gold,
                color: "#0A0F18",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {user.firstName?.[0]?.toUpperCase() || "U"}
              {user.lastName?.[0]?.toUpperCase() || ""}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: colors.text,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.firstName} {user.lastName}
              </Typography>
              <Typography
                sx={{
                  fontSize: 11,
                  color: colors.muted,
                  textTransform: "capitalize",
                  lineHeight: 1.3,
                }}
              >
                {user.role.replace("_", " ")}
              </Typography>
            </Box>
          </Box>

          {/* Logout */}
          <MenuItem
            onClick={handleLogout}
            disableRipple
            sx={{
              borderRadius: "10px",
              px: 1.25,
              py: 0.75,
              color: colors.error,
              "&:hover": {
                bgcolor: colors.errorSoft,
              },
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
      )}
    </Box>
  );
}
