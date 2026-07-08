export interface Permission {
  id: string;
  action: string;
  label: string;
}

export interface Module {
  id: string;
  label: string;
  is_active: boolean;
  route: string | null;
  sort_order: number;
  parent_module_id: string | null;
  permission_action: string | null;
}

export enum PermissionActionKey {
  View = 'view',
  Create = 'create',
  Edit = 'edit',
  Approve = 'approve',
  Export = 'export',
  Post = 'post',
  File = 'file',
  Lock = 'lock',
  Override = 'override',
  Reconcile = 'reconcile',
  Void = 'void',
  Reverse = 'reverse',
}

export const PERMISSION_ACTION_LABELS: Record<PermissionActionKey, string> = {
  [PermissionActionKey.View]: 'View',
  [PermissionActionKey.Create]: 'Create',
  [PermissionActionKey.Edit]: 'Edit',
  [PermissionActionKey.Approve]: 'Approve',
  [PermissionActionKey.Export]: 'Export',
  [PermissionActionKey.Post]: 'Post',
  [PermissionActionKey.File]: 'File',
  [PermissionActionKey.Lock]: 'Lock',
  [PermissionActionKey.Override]: 'Override',
  [PermissionActionKey.Reconcile]: 'Reconcile',
  [PermissionActionKey.Void]: 'Void',
  [PermissionActionKey.Reverse]: 'Reverse',
};

export const PERMISSION_ACTIONS = Object.entries(PERMISSION_ACTION_LABELS).map(([key, label]) => ({
  key: key as PermissionActionKey,
  label,
}));
