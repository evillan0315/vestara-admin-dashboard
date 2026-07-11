import { useState } from "react";
import { Box, Drawer } from "@mui/material";
import { Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import Sidebar from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { colors } from "../theme/tokens";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: colors.background,
      }}
    >
      {/* Desktop Sidebar — permanent, collapsible */}
      <Box
        sx={{
          display: { xs: "none", lg: "block" },
          flexShrink: 0,
        }}
      >
        <Sidebar />
      </Box>

      {/* Mobile Drawer — temporary overlay */}
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
            bgcolor: colors.sidebar,
            borderRight: `1px solid ${colors.border}`,
          },
        }}
      >
        <Sidebar onClose={handleDrawerClose} />
      </Drawer>

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
          onMenuClick={handleDrawerToggle}
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
    </Box>
  );
}
