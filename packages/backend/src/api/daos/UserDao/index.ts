import knex from '../../../connection';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
  createdOn: string;
}

export interface UserInfo {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}
class UserDao {
  async getUserById(id: number): Promise<User> {
    const user = await this.getUserByColumn('id', id);
    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.getUserByColumn('email', email);
    return user;
  }

  private async getUserByColumn(column: string, value: string | number) {
    const user: User = await knex('user')
      .first(
        'id',
        'first_name AS firstName',
        'last_name AS lastName',
        'email',
        'password_hash AS passwordHash',
        'is_admin AS isAdmin',
        'created_on AS createdOn',
      )
      .where(column, value);
    return {
      ...user,
      isAdmin: !!user.isAdmin,
    };
  }

  async createUser({
    firstName,
    lastName,
    email,
    passwordHash,
    isAdmin,
  }: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    isAdmin: boolean;
  }): Promise<void> {
    await knex('user').insert({
      first_name: firstName,
      last_name: lastName,
      email,
      password_hash: passwordHash,
      is_admin: isAdmin,
    });
  }

  async getAllUsers(): Promise<UserInfo[]> {
    const users: UserInfo[] = await knex('user').select('id', 'first_name', 'last_name', 'email');
    return users;
  }
}

export default new UserDao();
