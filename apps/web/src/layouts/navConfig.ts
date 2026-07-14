import { UserRole } from "@vestara/types";
import {
  LayoutDashboard,
  BarChart3,
  MessageSquare,
  Users,
  Settings,
  FolderOpen,
  Building2,
  ScrollText,
  Wrench,
  BookText,
  FileBarChart,
  Plug,
} from "lucide-react";

export interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  path: string;
  badge?: number;
  allowedRoles?: UserRole[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: "MAIN MENU",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/" },
      { label: "Analytics", icon: BarChart3, path: "/analytics" },
      { label: "AI Chat", icon: MessageSquare, path: "/chat" },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      {
        label: "Reports",
        icon: FileBarChart,
        path: "/reports",
      },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      {
        label: "Users & Roles",
        icon: Users,
        path: "/users",
        allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
      {
        label: "Integrations",
        icon: Plug,
        path: "/integrations",
        allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR],
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Settings", icon: Settings, path: "/settings" },
      {
        label: "File Manager",
        icon: FolderOpen,
        path: "/files",
      },
      {
        label: "Organizations",
        icon: Building2,
        path: "/organizations",
        allowedRoles: [UserRole.SUPER_ADMIN],
      },
      {
        label: "System Logs",
        icon: ScrollText,
        path: "/system-logs",
        allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
      {
        label: "Admin",
        icon: Wrench,
        path: "/admin",
      },
      {
        label: "Documentation",
        icon: BookText,
        path: "/docs",
      },
    ],
  },
];