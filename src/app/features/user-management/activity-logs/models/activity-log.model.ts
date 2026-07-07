export interface ActivityLog {
  id: string;
  user?: {
    name: string;
    email: string;
    initials: string;
    avatar_color: string;
  };
  module_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  description?: string;
  ip_address?: string;
  created_at: string;
}

export interface ActivityLogsFilter {
  page?: number;
  per_page?: number;
  search?: string;
  action?: string;
  module_id?: string;
  date_from?: string;
  date_to?: string;
}
