export interface SessionToken {
  token_type: 'session' | 'challenge';
  session_token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  challenge_token?: string;
  existing_device?: {
    label: string;
    ip: string;
    created_at: string;
  };
}
