import { useState } from "react";
import { Box, Drawer, useTheme } from "@mui/material";
import { Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import Sidebar from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { ThemeSettings } from "../theme/ThemeSettings";
import { useThemeContext } from "../providers/ThemeProvider";
import { densitySpacing } from "../theme/tokens";

const SIDEBAR_MOBILE_WIDTH = 320;

interface DashboardLayoutProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}

export default function DashboardLayout({
  title = "Dashboard",
  subtitle,
  children,
}: DashboardLayoutProps) {
  const theme = useTheme();
  const themeCtx = useThemeContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  const density = densitySpacing[themeCtx.density];
  const sidebarWidth = themeCtx.sidebarCollapsed
    ? density.sidebarCollapsedWidth
    : density.sidebarWidth;

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  const isHidden = themeCtx.sidebarVariant === "hidden";

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
      }}
    >
      {/* Desktop Sidebar — permanent */}
      {!isHidden && (
        <>
          <Box
            sx={{
              display: { xs: "none", lg: "block" },
              flexShrink: 0,
              width: sidebarWidth,
              transition: "width 0.2s ease",
            }}
          >
            <Sidebar />
          </Box>

          {/* Mobile Drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", lg: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: { xs: "100%", sm: SIDEBAR_MOBILE_WIDTH },
                maxWidth: "100vw",
                bgcolor: theme.palette.background.paper,
                borderRight: `1px solid ${theme.palette.divider}`,
              },
            }}
          >
            <Sidebar onClose={handleDrawerClose} />
          </Drawer>
        </>
      )}

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        <Header
          title={title}
          subtitle={subtitle}
          onMenuClick={isHidden ? undefined : handleDrawerToggle}
        />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3, md: 3.5 },
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2, sm: 3 },
            overflow: "auto",
          }}
        >
          {children ?? <Outlet />}
        </Box>
      </Box>

      {/* Theme Settings Drawer */}
      <ThemeSettings />
    </Box>
  );
}
