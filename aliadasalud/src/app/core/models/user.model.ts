export interface User {
  id: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  role?: string;
  user_metadata?: Record<string, any>;
}

export interface RegisterData {
  email: string;
  password: string;
  metadata?: {
    firstName?: string;
    lastName?: string;
    [key: string]: any;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  error: string | null;
  success: boolean;
}
