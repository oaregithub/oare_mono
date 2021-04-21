import { GetUserResponse, User } from '@oare/types';
import knex from '@/connection';
import { Transaction } from 'knex';
import { hashPassword } from '@/security';
import UserGroupDao from '../UserGroupDao';

class UserDao {
  async emailExists(email: string): Promise<boolean> {
    const user = await knex('user').first().where({ email });
    return !!user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.getUserByColumn('email', email);
    return user;
  }

  async getUserByUuid(uuid: string): Promise<User> {
    const row = await this.getUserByColumn('uuid', uuid);
    if (!row) {
      throw new Error(`User with UUID ${uuid} does not exist`);
    }

    return row;
  }

  async getUserPasswordHash(uuid: string): Promise<string> {
    await this.getUserByUuid(uuid); // throw an error if the uuid does not exist
    const { passwordHash }: { passwordHash: string } = await knex('user')
      .select('password_hash AS passwordHash')
      .where({ uuid })
      .first();

    return passwordHash;
  }

  private async getUserByColumn(
    column: string,
    value: string | number
  ): Promise<User | null> {
    const user: User | null = await knex('user')
      .first(
        'uuid',
        'first_name AS firstName',
        'last_name AS lastName',
        'email',
        'is_admin AS isAdmin'
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
    uuid,
    firstName,
    lastName,
    email,
    passwordHash,
    isAdmin,
  }: {
    uuid: string;
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    isAdmin: boolean;
  }): Promise<void> {
    await knex('user').insert({
      uuid,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
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
    const users: Pick<
      User,
      'uuid' | 'firstName' | 'lastName' | 'email'
    >[] = await knex('user').select(
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
    return users.map(({ uuid, firstName, lastName, email }, index) => ({
      uuid,
      firstName,
      lastName,
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
