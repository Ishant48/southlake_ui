import { IconType } from './sidebar-icons';

export interface SidebarItem {
  label: string;
  route: string;
  queryParams?: Record<string, string>;
  icon: IconType;
  permission?: { module: string; action: string };
}

export interface SidebarSection {
  key: string;
  label: string;
  icon: IconType;
  items: SidebarItem[];
}

export const SIDEBAR_CONFIG: SidebarSection[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'grid',
    items: [
      { label: 'Overview & KPIs', route: '/dashboard', icon: 'grid' },
    ],
  },
  {
    key: 'accounting',
    label: 'Advanced Accounting',
    icon: 'document',
    items: [
      {
        label: 'Chart of Accounts',
        route: '/chart-of-accounts',
        icon: 'line3',
        permission: { module: 'chart_of_accounts', action: 'view' },
      },
      {
        label: 'Journal Entries',
        route: '/journal-entries',
        icon: 'document',
        permission: { module: 'journal_entry', action: 'view' },
      },
      {
        label: 'Premium & Claims Exhibits',
        route: '/reinsurance-calculations',
        icon: 'graph',
        permission: { module: 'reinsurance', action: 'view' },
      },
      {
        label: 'Test Balance',
        route: '/test-balance',
        icon: 'arrow',
        permission: { module: 'chart_of_accounts', action: 'view' },
      },
    ],
  },
  {
    key: 'masters',
    label: 'MGA Operations',
    icon: 'mga',
    items: [
      { label: 'Treaties', route: '/masters', queryParams: { tab: 'treaties' }, icon: 'document', permission: { module: 'treaty', action: 'view' } },
      { label: 'MGAs', route: '/masters', queryParams: { tab: 'mgas' }, icon: 'house', permission: { module: 'mga', action: 'view' } },
      { label: 'LOBs', route: '/masters', queryParams: { tab: 'lobs' }, icon: 'diamond', permission: { module: 'lob', action: 'view' } },
      { label: 'COBs', route: '/masters', queryParams: { tab: 'cobs' }, icon: 'list', permission: { module: 'cob', action: 'view' } },
      { label: 'States', route: '/masters', queryParams: { tab: 'states' }, icon: 'globe', permission: { module: 'state', action: 'view' } },
      { label: 'Reinsurers', route: '/masters', queryParams: { tab: 'reinsurers' }, icon: 'shield', permission: { module: 'reinsurer', action: 'view' } },
      { label: 'Risk Companies', route: '/masters', queryParams: { tab: 'risk-companies' }, icon: 'danger', permission: { module: 'risk_company', action: 'view' } },
      { label: 'Brokers', route: '/masters', queryParams: { tab: 'brokers' }, icon: 'people', permission: { module: 'broker', action: 'view' } },
      { label: 'Products', route: '/masters', queryParams: { tab: 'products' }, icon: 'box', permission: { module: 'product', action: 'view' } },
      { label: 'Document Types', route: '/masters', queryParams: { tab: 'document-types' }, icon: 'document', permission: { module: 'masters_config', action: 'view' } },
      { label: 'Sequence Counters', route: '/masters', queryParams: { tab: 'sequence-prefix-counters' }, icon: 'chart-bar', permission: { module: 'masters_config', action: 'view' } },
      { label: 'Month-End Closing', route: '/masters', queryParams: { tab: 'locked-periods' }, icon: 'lock', permission: { module: 'masters_config', action: 'view' } },
      { label: 'GL Map', route: '/masters', queryParams: { tab: 'gl-mappings' }, icon: 'link', permission: { module: 'gl_mapping', action: 'view' } },
    ],
  },
  {
    key: 'admin',
    label: 'System Admin',
    icon: 'settings',
    items: [
      { label: 'Users', route: '/user-management/users', icon: 'people', permission: { module: 'user', action: 'view' } },
      { label: 'Roles & Permissions', route: '/user-management/roles', icon: 'key', permission: { module: 'role', action: 'manage' } },
      { label: 'Activity Logs', route: '/user-management/activity-logs', icon: 'clock', permission: { module: 'activity_log', action: 'view' } },
    ],
  },
];
