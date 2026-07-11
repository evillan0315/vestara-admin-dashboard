import { UserRole } from "@vestara/types";
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  UserRound,
  ShieldCheck,
  Video,
  Crown,
  Wallet,
  ClipboardList,
  ListChecks,
  CalendarDays,
  Radar,
  BellRing,
  AlertTriangle,
  UserSearch,
  GraduationCap,
  FileText,
  Star,
  BarChart3,
  Settings,
  KeyRound,
  ScrollText,
  BookText,
  Building2,
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
      { label: "Bookings", icon: CalendarClock, path: "/bookings" },
      { label: "Clients", icon: Users, path: "/clients" },
      { label: "Companions", icon: UserRound, path: "/companions" },
      {
        label: "Security Specialists",
        icon: ShieldCheck,
        path: "/security-specialists",
      },
      { label: "Virtual Sessions", icon: Video, path: "/virtual-sessions" },
      { label: "Memberships", icon: Crown, path: "/memberships" },
      { label: "Payments & Payouts", icon: Wallet, path: "/payments" },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "Requests", icon: ClipboardList, path: "/requests", badge: 23 },
      { label: "Assignments", icon: ListChecks, path: "/assignments" },
      { label: "Schedule & Calendar", icon: CalendarDays, path: "/schedule" },
      { label: "Live Monitoring", icon: Radar, path: "/live-monitoring" },
      {
        label: "Check-ins & Alerts",
        icon: BellRing,
        path: "/check-ins",
        badge: 8,
      },
      { label: "Incidents", icon: AlertTriangle, path: "/incidents" },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { label: "Talent & Recruiting", icon: UserSearch, path: "/talent" },
      { label: "Training Academy", icon: GraduationCap, path: "/training" },
      { label: "Contracts & Compliance", icon: FileText, path: "/contracts" },
      { label: "Reviews & Ratings", icon: Star, path: "/reviews" },
      { label: "Reports & Analytics", icon: BarChart3, path: "/reports" },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Settings", icon: Settings, path: "/settings" },
      {
        label: "Organizations",
        icon: Building2,
        path: "/organizations",
        allowedRoles: [UserRole.SUPER_ADMIN],
      },
      {
        label: "Users & Roles",
        icon: KeyRound,
        path: "/users",
        allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
      {
        label: "System Logs",
        icon: ScrollText,
        path: "/system-logs",
        allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
      {
        label: "Documentation",
        icon: BookText,
        path: "/docs",
      },
    ],
  },
];
