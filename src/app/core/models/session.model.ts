export enum SessionTokenType {
  Session = 'session',
  Challenge = 'challenge',
}

export interface SessionToken {
  token_type: SessionTokenType;
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
