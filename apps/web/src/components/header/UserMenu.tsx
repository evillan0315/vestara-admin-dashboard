import { type JSX, useMemo, useState } from "react";

import {
  Avatar,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";

import {
  ChevronDown,
  LogOut,
  SlidersHorizontal,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../features/auth/AuthContext";
import { profileTabs } from "../../features/profile/tabs";
import UserPreferencesDrawer from "../layout/UserPreferencesDialog";

export interface UserMenuProps {
  onLogout?: () => Promise<void> | void;
}

export default function UserMenu({ onLogout }: UserMenuProps): JSX.Element {
  const theme = useTheme();
  const { primary, text, divider, error, background } = theme.palette;

  const navigate = useNavigate();

  const { user } = useAuth();

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const open = Boolean(anchorEl);

  const initials = useMemo(() => {
    const name = user
      ? `${user.firstName} ${user.lastName}`.trim()
      : "";

    if (!name) {
      return "U";
    }

    return name
      .split(" ")
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  const navigateTo = (path: string) => {
    closeMenu();
    navigate(path);
  };

  const logout = async () => {
    closeMenu();
    await onLogout?.();
  };

  const openPreferences = () => {
    closeMenu();
    setPreferencesOpen(true);
  };

  // Profile-related tabs surfaced as shortcuts in the menu.
  // Excludes "Overview" (already reachable via the header avatar) to keep
  // the list focused on secondary destinations.
  const profileShortcuts = profileTabs.filter((tab) => tab.value !== "overview");

  return (
    <>
      <Box
        onClick={openMenu}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          pl: 2,
          ml: 1,
          borderLeft: `1px solid ${divider}`,
          cursor: "pointer",
          borderRadius: "10px",
          transition: "all .2s ease",

          "&:hover": {
            bgcolor: alpha(primary.main, 0.08),
          },
        }}
      >
        <Avatar
          src={user?.avatarUrl}
          sx={{
            width: 42,
            height: 42,
            bgcolor: primary.main,
            color: primary.contrastText,
            fontWeight: 700,
            border: `2px solid ${alpha(primary.main, 0.3)}`,
            transition: "border-color .2s ease",
          }}
        >
          {initials}
        </Avatar>

        <Box
          sx={{
            display: {
              xs: "none",
              md: "block",
            },
          }}
        >
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 700,
              color: text.primary,
              lineHeight: 1.2,
            }}
          >
            {user ? `${user.firstName} ${user.lastName}` : ""}
          </Typography>

          <Typography
            sx={{
              fontSize: 11.5,
              color: text.secondary,
              textTransform: "capitalize",
            }}
          >
            {user?.role}
          </Typography>
        </Box>

        <ChevronDown size={16} color={text.secondary} />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        transformOrigin={{
          horizontal: "right",
          vertical: "top",
        }}
        anchorOrigin={{
          horizontal: "right",
          vertical: "bottom",
        }}
        slotProps={{
          paper: {
            sx: {
              width: 270,
              mt: 1,
              overflow: "hidden",
              bgcolor: background.paper,
              border: `1px solid ${divider}`,
              borderRadius: "14px",
              color: text.primary,
              boxShadow: "0 16px 40px rgba(0,0,0,.45)",
            },
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Avatar
            src={user?.avatarUrl}
            sx={{
              width: 50,
              height: 50,
              bgcolor: primary.main,
              color: primary.contrastText,
            }}
          >
            {initials}
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: 14,
                color: text.primary,
              }}
              noWrap
            >
              {user ? `${user.firstName} ${user.lastName}` : ""}
            </Typography>

            <Typography
              sx={{
                fontSize: 12,
                color: text.secondary,
              }}
              noWrap
            >
              {user?.email}
            </Typography>
          </Box>
        </Box>

        <Divider />

        {/* Profile tab shortcuts — kept in sync with ProfilePage via profileTabs */}
        {profileShortcuts.map((tab) => (
          <MenuItem
            key={tab.value}
            onClick={() => navigateTo(tab.path)}
            sx={{
              "&:hover": {
                bgcolor: alpha(primary.main, 0.08),
                "& .MuiListItemIcon-root svg": { color: primary.main },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: text.secondary }}>
              {tab.icon}
            </ListItemIcon>

            <ListItemText
              primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500 }}
            >
              {tab.label}
            </ListItemText>
          </MenuItem>
        ))}

        <Divider />

        <MenuItem
          onClick={openPreferences}
          sx={{
            "&:hover": {
              bgcolor: alpha(primary.main, 0.08),
              "& .MuiListItemIcon-root svg": { color: primary.main },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: text.secondary }}>
            <SlidersHorizontal size={18} />
          </ListItemIcon>

          <ListItemText
            primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500 }}
          >
            Preferences
          </ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={logout}
          sx={{
            color: error.main,
            "&:hover": {
              bgcolor: alpha(error.main, 0.1),
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: error.main }}>
            <LogOut size={18} />
          </ListItemIcon>

          <ListItemText
            primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500 }}
          >
            Logout
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* User Preferences Drawer */}
      <UserPreferencesDrawer
        open={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
      />
    </>
  );
}
