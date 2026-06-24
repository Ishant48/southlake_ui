export interface Role {
  id: string;
  name: string;
  label: string;
  color: string;
  description?: string;
  is_system: boolean;
  user_count?: number;
}

export interface RolePermission {
  module_id: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  approve: boolean;
  export: boolean;
  post: boolean;
  file: boolean;
  lock: boolean;
  override: boolean;
  reconcile: boolean;
  void: boolean;
  reverse: boolean;
}

export interface RoleDetail extends Role {
  user_count: number;
  permissions: RolePermission[];
}

export interface CreateRolePayload {
  name: string;
  label: string;
  color: string;
  description?: string;
  permissions: RolePermission[];
}
