import { v4 } from 'uuid';
import { User } from '@oare/types';
import knex from '@/connection';

export interface UserRow {
  id: number;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
  createdOn: string;
}

class UserDao {
  async emailExists(email: string): Promise<boolean> {
    const user = await knex('user').first().where({ email });
    return !!user;
  }

  async getUserById(id: number): Promise<UserRow | null> {
    const user = await this.getUserByColumn('id', id);
    return user;
  }

  async getUserByEmail(email: string): Promise<UserRow | null> {
    const user = await this.getUserByColumn('email', email);
    return user;
  }

  private async getUserByColumn(column: string, value: string | number): Promise<UserRow | null> {
    const user: UserRow | null = await knex('user')
      .first(
        'id',
        'uuid',
        'first_name AS firstName',
        'last_name AS lastName',
        'email',
        'password_hash AS passwordHash',
        'is_admin AS isAdmin',
        'created_on AS createdOn',
      )
      .where(column, value);

    if (!user) {
      return null;
    }

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
      uuid: v4(),
      first_name: firstName,
      last_name: lastName,
      email,
      password_hash: passwordHash,
      is_admin: isAdmin,
    });
  }

  async getAllUsers(): Promise<User[]> {
    const users: User[] = await knex('user').select('id', 'first_name', 'last_name', 'email');
    const mappedUsers = Promise.all(
      users.map(async (user) => {
        const groupObjects = await knex('user_group').select('group_id').where('user_id', user.id);
        const userGroups = groupObjects.map((index) => index.group_id);
        return {
          ...user,
          groups: userGroups,
        };
      }),
    );
    return mappedUsers;
  }
}

export default new UserDao();
