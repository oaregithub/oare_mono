export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  password: string;
  email: string;
}

export interface LoginRegisterResponse {
  id: number;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
}

export interface ResetPasswordPayload {
  resetUuid: string;
  newPassword: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface GetUserResponse extends User {
  groups: number[];
  isAdmin: boolean;
}
