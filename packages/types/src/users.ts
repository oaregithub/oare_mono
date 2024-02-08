// COMPLETE

export interface User extends UserRow {
  groups: number[];
}

export interface UserRow {
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
  createdOn: Date;
}
