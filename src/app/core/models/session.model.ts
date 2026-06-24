export interface SessionToken {
  token: string;
  token_type: 'session' | 'challenge';
  expires_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  challenge_data?: {
    session_id: string;
    device_label: string;
    ip_address: string;
    created_at: string;
  };
}
