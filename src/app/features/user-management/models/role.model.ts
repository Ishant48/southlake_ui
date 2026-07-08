export interface Role {
  id: string;
  name: string;
  label: string;
  color: string;
  description?: string;
  is_system: boolean;
  is_active: boolean;
  user_count?: number;
}

export interface RoleDetail extends Role {
  user_count: number;
  permissions: { id: string; action: string }[];
}

export interface CreateRolePayload {
  name: string;
  label: string;
  color: string;
  description?: string;
  permissions: string[];
}
