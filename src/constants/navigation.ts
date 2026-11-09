export interface NavItem {
  title: string;
  href: string;
  iconName: "LayoutDashboard" | "FileEdit" | "Calendar" | "HardDrive" | "History" | "BarChart3" | "Youtube" | "Settings";
  badge?: string;
  isMvp: boolean;
}

export const MAIN_NAVIGATION: NavItem[] = [
  {
    title: "Overview",
    href: "/",
    iconName: "LayoutDashboard",
    isMvp: true,
  },
  {
    title: "Content Studio",
    href: "/studio",
    iconName: "FileEdit",
    isMvp: true,
  },
  {
    title: "Calendar",
    href: "/calendar",
    iconName: "Calendar",
    isMvp: true,
  },
  {
    title: "Drive Media Staging",
    href: "/media",
    iconName: "HardDrive",
    isMvp: true,
  },
  {
    title: "Publishing History",
    href: "/history",
    iconName: "History",
    isMvp: true,
  },
  {
    title: "Analytics",
    href: "/analytics",
    iconName: "BarChart3",
    isMvp: true,
  },
  {
    title: "Connected Accounts",
    href: "/accounts",
    iconName: "Youtube",
    isMvp: true,
  },
  {
    title: "Settings & AI",
    href: "/settings",
    iconName: "Settings",
    isMvp: true,
  },
];
