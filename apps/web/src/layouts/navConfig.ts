import { UserRole } from '@vestara/types';
import {
  LayoutDashboard,
  BarChart3,
  Wallet,
  CreditCard,
  ReceiptText,
  Store,
  ShoppingCart,
  CalendarDays,
  Gift,
  MessageSquare,
  Plug,
  Database,
  Users,
  Building2,
  Settings,
  FolderOpen,
  ScrollText,
  Wrench,
  BookText,
  FileBarChart,
  ShieldCheck,
} from 'lucide-react';

export interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  path: string;
  badge?: number;
  /** Marks a documented platform module that is on the roadmap but not yet built. */
  soon?: boolean;
  allowedRoles?: UserRole[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: 'MAIN MENU',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { label: 'Analytics', icon: BarChart3, path: '/analytics' },
      {
        label: 'Reports',
        icon: FileBarChart,
        path: '/reports',
      },
    ],
  },
  {
    title: 'WALLET & PAYMENTS',
    items: [
      { label: 'Digital Wallet', icon: Wallet, path: '/wallet', soon: true },
      { label: 'Payments', icon: CreditCard, path: '/payments', soon: true },
      {
        label: 'Transactions',
        icon: ReceiptText,
        path: '/transactions',
        soon: true,
      },
    ],
  },
  {
    title: 'MARKETPLACE',
    items: [
      { label: 'Marketplace', icon: Store, path: '/marketplace', soon: true },
      { label: 'Orders', icon: ShoppingCart, path: '/orders', soon: true },
    ],
  },
  {
    title: 'BOOKINGS',
    items: [
      {
        label: 'Bookings',
        icon: CalendarDays,
        path: '/bookings',
        soon: true,
      },
    ],
  },
  {
    title: 'REWARDS',
    items: [{ label: 'Vestara Points', icon: Gift, path: '/rewards', soon: true }],
  },
  {
    title: 'AI SERVICES',
    items: [
      { label: 'AI Chat', icon: MessageSquare, path: '/chat' },
      {
        label: 'Integrations',
        icon: Plug,
        path: '/integrations',
        allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR],
      },
      {
        label: 'Data Explorer',
        icon: Database,
        path: '/data-explorer',
        allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR],
      },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      {
        label: 'Users & Roles',
        icon: Users,
        path: '/users',
        allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
      {
        label: 'Organizations',
        icon: Building2,
        path: '/organizations',
        allowedRoles: [UserRole.SUPER_ADMIN],
      },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Settings', icon: Settings, path: '/settings' },
      {
        label: 'File Manager',
        icon: FolderOpen,
        path: '/files',
      },
      {
        label: 'System Logs',
        icon: ScrollText,
        path: '/system-logs',
        allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
      {
        label: 'Admin',
        icon: Wrench,
        path: '/admin',
      },
      {
        label: 'Documentation',
        icon: BookText,
        path: '/docs',
      },
    ],
  },
  {
    title: 'SECURITY',
    items: [
      {
        label: 'Security Center',
        icon: ShieldCheck,
        path: '/security-center',
        soon: true,
        allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
    ],
  },
];
