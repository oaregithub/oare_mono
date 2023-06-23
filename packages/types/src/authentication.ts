import { User } from './users';

// COMPLETE

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
}
