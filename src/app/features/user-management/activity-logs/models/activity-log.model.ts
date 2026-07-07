export interface FieldChange {
  field: string;
  old_value: string;
  new_value: string;
}

export interface ActivityLog {
  id: string;
  user?: {
    name: string;
    email: string;
    initials: string;
    avatar_color: string;
    role?: string;
  };
  module_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  description?: string;
  ip_address?: string;
  created_at: string;

  // Mock fields added for UI demonstration
  status?: string;
  device?: string;
  os?: string;
  browser?: string;
  location?: string;
  session_id?: string;
  correlation_id?: string;
  field_changes?: FieldChange[];
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
