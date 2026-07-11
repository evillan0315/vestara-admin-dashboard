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
} from "@mui/material";

import {
  ChevronDown,
  LogOut,
  Settings,
  Shield,
  User as UserIcon,
  SlidersHorizontal,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../features/auth/AuthContext";
import { colors } from "../../theme/tokens";
import UserPreferencesDrawer from "../layout/UserPreferencesDialog";

export interface UserMenuProps {
  onLogout?: () => Promise<void> | void;
}

export default function UserMenu({ onLogout }: UserMenuProps): JSX.Element {
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
          borderLeft: `1px solid ${colors.border}`,
          cursor: "pointer",
          borderRadius: "10px",
          transition: "all .2s ease",

          "&:hover": {
            bgcolor: "rgba(255,255,255,.03)",
          },
        }}
      >
        <Avatar
          src={user?.avatarUrl}
          sx={{
            width: 42,
            height: 42,
            bgcolor: colors.gold,
            color: "#0A0F18",
            fontWeight: 700,
            border: `2px solid rgba(255,255,255,.08)`,
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
              color: colors.text,
              lineHeight: 1.2,
            }}
          >
            {user ? `${user.firstName} ${user.lastName}` : ""}
          </Typography>

          <Typography
            sx={{
              fontSize: 11.5,
              color: colors.secondary,
              textTransform: "capitalize",
            }}
          >
            {user?.role}
          </Typography>
        </Box>

        <ChevronDown size={16} color={colors.secondary} />
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
              bgcolor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: "14px",
              color: colors.text,
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
              bgcolor: colors.gold,
              color: "#0A0F18",
            }}
          >
            {initials}
          </Avatar>

          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {user ? `${user.firstName} ${user.lastName}` : ""}
            </Typography>

            <Typography
              sx={{
                fontSize: 12,
                color: colors.secondary,
              }}
            >
              {user?.email}
            </Typography>
          </Box>
        </Box>

        <Divider />

        <MenuItem onClick={() => navigateTo("/profile")}>
          <ListItemIcon>
            <UserIcon size={18} color={colors.secondary} />
          </ListItemIcon>

          <ListItemText>Profile</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => navigateTo("/settings")}>
          <ListItemIcon>
            <Settings size={18} color={colors.secondary} />
          </ListItemIcon>

          <ListItemText>Settings</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => navigateTo("/security")}>
          <ListItemIcon>
            <Shield size={18} color={colors.secondary} />
          </ListItemIcon>

          <ListItemText>Security</ListItemText>
        </MenuItem>

        <MenuItem onClick={openPreferences}>
          <ListItemIcon>
            <SlidersHorizontal size={18} color={colors.secondary} />
          </ListItemIcon>

          <ListItemText>Preferences</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={logout}
          sx={{
            color: colors.error,
          }}
        >
          <ListItemIcon>
            <LogOut size={18} color={colors.error} />
          </ListItemIcon>

          <ListItemText>Logout</ListItemText>
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
