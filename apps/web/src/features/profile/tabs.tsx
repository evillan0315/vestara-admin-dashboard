import type { JSX } from "react";
import {
  User as UserIcon,
  Shield,
  Lock,
  Activity,
  Settings,
  Monitor,
} from "lucide-react";

/**
 * Value identifying a single profile tab.
 * Each value maps to a dedicated route so the header user-menu and the
 * profile page stay in sync.
 */
export type ProfileTabValue =
  | "overview"
  | "security"
  | "permissions"
  | "activity"
  | "preferences"
  | "sessions";

export interface ProfileTabConfig {
  /** Stable identifier used for tab state. */
  value: ProfileTabValue;
  /** Human-readable label shown in the tab bar and menu. */
  label: string;
  /** Route the tab is reachable at. */
  path: string;
  /** Leading icon. */
  icon: JSX.Element;
}

/**
 * Single source of truth for the profile page tabs and their corresponding
 * routes. Reused by `ProfilePage` (tab bar + initial tab derivation) and the
 * header `UserMenu` (navigation shortcuts) to avoid drift between the two.
 */
export const profileTabs: ProfileTabConfig[] = [
  {
    value: "overview",
    label: "Overview",
    path: "/profile",
    icon: <UserIcon size={16} />,
  },
  {
    value: "security",
    label: "Security",
    path: "/security",
    icon: <Shield size={16} />,
  },
  {
    value: "permissions",
    label: "Permissions",
    path: "/permissions",
    icon: <Lock size={16} />,
  },
  {
    value: "activity",
    label: "Activity",
    path: "/activity",
    icon: <Activity size={16} />,
  },
  {
    value: "preferences",
    label: "Preferences",
    path: "/preferences",
    icon: <Settings size={16} />,
  },
  {
    value: "sessions",
    label: "Sessions",
    path: "/sessions",
    icon: <Monitor size={16} />,
  },
];

/** Lookup table indexed by route path. */
const profileTabByPath: Record<string, ProfileTabConfig> = profileTabs.reduce(
  (acc, tab) => {
    acc[tab.path] = tab;
    return acc;
  },
  {} as Record<string, ProfileTabConfig>,
);

/**
 * Resolve the active profile tab from the current location pathname.
 * Falls back to `overview` when the path is not a known profile route.
 */
export function getProfileTabFromPath(pathname: string): ProfileTabValue {
  const match = profileTabByPath[pathname];
  return match ? match.value : "overview";
}
