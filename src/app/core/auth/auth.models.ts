export type UserRole = 'user' | 'admin';

export interface AuthProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export interface AuthSession {
  token: string;
  profile: AuthProfile;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  profile: AuthProfile;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  exp: number;
}
