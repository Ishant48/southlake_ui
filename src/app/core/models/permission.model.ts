export interface Permission {
  id: string;
  action: string;
  label: string;
}

export interface Module {
  id: string;
  label: string;
}

export const MODULES: Module[] = [
  { id: 'chart_of_accounts', label: 'Chart of Accounts' },
  { id: 'user_management', label: 'User Management' },
  { id: 'master_data', label: 'Master Data' },
];

export const PERMISSION_ACTIONS = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'approve', label: 'Approve' },
  { key: 'export', label: 'Export' },
  { key: 'post', label: 'Post' },
  { key: 'file', label: 'File' },
  { key: 'lock', label: 'Lock' },
  { key: 'override', label: 'Override' },
  { key: 'reconcile', label: 'Reconcile' },
  { key: 'void', label: 'Void' },
  { key: 'reverse', label: 'Reverse' },
] as const;

export type PermissionActionKey = 'view' | 'create' | 'edit' | 'approve' | 'export' | 'post' | 'file' | 'lock' | 'override' | 'reconcile' | 'void' | 'reverse';
