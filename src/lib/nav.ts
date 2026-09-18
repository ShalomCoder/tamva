import { RESOURCES, RESOURCE_GROUPS } from "./resources";

export interface NavItem {
  key: string;
  label: string;
  icon: string;
  to: string;
  scopes?: string[];
  roles?: string[];
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

const CUSTOM: Record<string, NavItem[]> = {
  Overview: [
    { key: "dashboard", label: "Dashboard", icon: "layout-dashboard", to: "/" },
    { key: "analytics", label: "Analytics", icon: "bar-chart-3", to: "/analytics" },
  ],
  Platform: [{ key: "api-reference", label: "API Reference", icon: "code-2", to: "/api-reference" }],
  System: [{ key: "settings", label: "Settings", icon: "settings", to: "/settings" }],
};

export const NAV: NavGroup[] = RESOURCE_GROUPS.map((group) => ({
  group: group.toUpperCase(),
  items: [
    ...(CUSTOM[group] ?? []),
    ...RESOURCES.filter((r) => r.group === group).map((r) => ({
      key: r.key,
      label: r.label,
      icon: r.icon,
      to: `/r/${r.key}`,
      scopes: r.scopes,
      roles: r.roles,
    })),
  ],
})).filter((g) => g.items.length > 0);
