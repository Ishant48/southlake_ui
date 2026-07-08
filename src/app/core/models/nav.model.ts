export interface NavItem {
  id: string;
  label: string;
  icon: string | null;
  route: string | null;
  sortOrder: number;
}

export interface NavGroup extends NavItem {
  children: NavItem[];
}
