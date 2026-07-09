import { Role } from './role.model';

export enum UserType {
  Staff = 'staff',
  MgaUser = 'mga_user',
  BrokerUser = 'broker_user',
  CustomerUser = 'customer_user',
}

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
}

export enum PanelMode {
  View = 'view',
  Edit = 'edit',
}

export enum UserDetailTab {
  Profile = 'profile',
  Permissions = 'permissions',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role?: Role;
  user_type: UserType;
  department?: string;
  title?: string;
  status: UserStatus;
  initials: string;
  avatar_color: string;
  last_login_at?: string;
  joined_date?: string;
  is_super_admin?: boolean;
  effective_permissions?: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface UsersFilter {
  page?: number;
  per_page?: number;
  search?: string;
  role_id?: string;
  status?: string;
}

export interface InviteUserPayload {
  email: string;
  name: string;
  role_id: string;
  user_type: string;
  department?: string;
  title?: string;
  user_entity_type?: string;
  user_entity_id?: string;
}

export interface PendingInvite {
  id: string;
  email: string;
  name: string;
  role?: Role;
  user_type: string;
  department?: string;
  title?: string;
  invited_at: string;
  expires_at: string;
}

export interface UserStats {
  total: number;
  active: number;
  roles_defined: number;
  pending_invites: number;
}
