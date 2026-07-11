import { type JSX } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useLocation, useNavigate, Link } from "react-router-dom";
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

  const handleNavClick = (path: string) => {
    navigate(path);
    onClose?.();
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
        {navGroups.map((group) => (
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

      {/* Footer — System Status & Copyright */}
      <Box sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
        <Box
          sx={{
            bgcolor: colors.cardAlt,
            borderRadius: "12px",
            p: 1.5,
            mb: 1.5,
          }}
        >
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 600,
              color: colors.secondary,
              mb: 1,
            }}
          >
            System Status
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: colors.success,
              }}
            />
            <Typography
              sx={{ fontSize: 12, fontWeight: 600, color: colors.text }}
            >
              All Systems Operational
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: colors.success,
                }}
              />
            ))}
          </Box>
        </Box>

        <Typography
          sx={{
            fontSize: 10.5,
            color: colors.muted,
            px: 0.5,
            lineHeight: 1.5,
          }}
        >
          © 2026 Vestara Elite Companions
          <br />
          All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}


