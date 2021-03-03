import { v4 } from 'uuid';
import { GetUserResponse } from '@oare/types';
import knex from '@/connection';
import { Transaction } from 'knex';
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

  private async getUserByColumn(
    column: string,
    value: string | number
  ): Promise<UserRow | null> {
    const user: UserRow | null = await knex('user')
      .first(
        'id',
        'uuid',
        'first_name AS firstName',
        'last_name AS lastName',
        'email',
        'password_hash AS passwordHash',
        'is_admin AS isAdmin',
        'created_on AS createdOn'
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

  async userIsAdmin(uuid: string): Promise<boolean> {
    const { isAdmin } = await knex('user')
      .first('is_admin AS isAdmin')
      .where('uuid', uuid);
    return isAdmin;
  }

  async getAllUsers(): Promise<GetUserResponse[]> {
    const users: UserRow[] = await knex('user').select(
      'id',
      'uuid',
      'first_name AS firstName',
      'last_name AS lastName',
      'email'
    );
    const groupObjects = await Promise.all(
      users.map(user => UserGroupDao.getGroupsOfUser(user.uuid))
    );
    const adminStatus = await Promise.all(
      users.map(user => this.userIsAdmin(user.uuid))
    );
    return users.map(({ id, uuid, firstName, lastName, email }, index) => ({
      id,
      uuid,
      first_name: firstName,
      last_name: lastName,
      email,
      groups: groupObjects[index],
      isAdmin: adminStatus[index],
    }));
  }

  async updatePassword(
    userUuid: string,
    newPassword: string,
    trx?: Transaction
  ): Promise<void> {
    const k = trx || knex;
    await k('user')
      .update('password_hash', hashPassword(newPassword))
      .where('uuid', userUuid);
  }
}

export default new UserDao();
