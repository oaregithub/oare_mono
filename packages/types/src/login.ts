export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  firstName: string;
  lastName: string;
}

export interface User {
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
}

export interface GetUserResponse extends User {
  groups: number[];
}

export interface ResetPasswordPayload {
  resetUuid: string;
  newPassword: string;
}

export interface RegisterResponse {
  user: User;
  firebaseToken: string;
}
