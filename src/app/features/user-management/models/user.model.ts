import { Role } from './role.model';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: Role;
  user_type: 'staff' | 'mga_user' | 'broker_user' | 'customer_user';
  department?: string;
  title?: string;
  status: 'active' | 'inactive' | 'pending';
  initials: string;
  avatar_color: string;
  last_login_at?: string;
  joined_date?: string;
  is_super_admin?: boolean;
  effective_permissions?: string[];
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
