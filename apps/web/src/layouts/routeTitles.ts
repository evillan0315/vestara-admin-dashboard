import { navGroups, type NavItem } from "./navConfig";
import { profileTabs } from "../features/profile/tabs";

export interface RouteTitle {
  title: string;
  subtitle: string;
}

/**
 * Flatten the sidebar nav items (excluding "soon" roadmap placeholders) into a
 * path -> NavItem lookup. Items marked `soon` are intentionally skipped so the
 * header never advertises a route that does not exist yet.
 */
const navItemByPath: Record<string, NavItem> = navGroups.reduce(
  (acc, group) => {
    for (const item of group.items) {
      if (!item.soon) {
        acc[item.path] = item;
      }
    }
    return acc;
  },
  {} as Record<string, NavItem>,
);

/** Profile sub-routes (Overview, Security, Permissions, Activity, …). */
const profileTitleByPath: Record<string, RouteTitle> = profileTabs.reduce(
  (acc, tab) => {
    acc[tab.path] = { title: tab.label, subtitle: "Profile" };
    return acc;
  },
  {} as Record<string, RouteTitle>,
);

/**
 * Resolve a human-friendly page title + subtitle from the current location
 * pathname. Combines the sidebar navigation config with the profile tab
 * routing so the header reflects the active page for every route.
 *
 * Falls back to "Dashboard" when the path is unknown (e.g. the index route).
 */
export function getRouteTitle(pathname: string): RouteTitle {
  if (profileTitleByPath[pathname]) {
    return profileTitleByPath[pathname];
  }

  const navItem = navItemByPath[pathname];
  if (navItem) {
    return { title: navItem.label, subtitle: "" };
  }

  return { title: "Dashboard", subtitle: "" };
}
