// FIXME

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  firstName: string;
  lastName: string;
}

// FIXME update User object
export interface User {
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
}

export interface UserWithGroups extends User {
  groups: number[];
}

export interface RegisterResponse {
  user: User;
  token: string;
}
