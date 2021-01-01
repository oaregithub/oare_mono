import { v4 } from 'uuid';
import { User, GetUserResponse } from '@oare/types';
import knex from '@/connection';
import { hashPassword } from '@/security';
import UserGroupDao from '../UserGroupDao';

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

  async getUserByUuid(uuid: string): Promise<UserRow | null> {
    return this.getUserByColumn('uuid', uuid);
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

  async userIsAdmin(email: string): Promise<boolean> {
    const { isAdmin } = await knex('user').first('is_admin AS isAdmin').where('email', email);
    return isAdmin;
  }

  async getAllUsers(): Promise<GetUserResponse[]> {
    const users: User[] = await knex('user').select('id', 'first_name', 'last_name', 'email');
    const groupObjects = await Promise.all(users.map((user) => UserGroupDao.getGroupsOfUser(user.id)));
    const adminStatus = await Promise.all(users.map((user) => this.userIsAdmin(user.email)));
    return users.map((user, index) => ({
      ...user,
      groups: groupObjects[index],
      isAdmin: adminStatus[index],
    }));
  }

  async updatePassword(userUuid: string, newPassword: string): Promise<void> {
    await knex('user').update('password_hash', hashPassword(newPassword)).where('uuid', userUuid);
  }
}

export default new UserDao();
