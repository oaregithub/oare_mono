import { GetUserResponse, User, UpdateProfilePayload } from '@oare/types';
import knex from '@/connection';
import { Knex } from 'knex';
import UserGroupDao from '../UserGroupDao';

class UserDao {
  async emailExists(email: string, trx?: Knex.Transaction): Promise<boolean> {
    const k = trx || knex;
    const user = await k('user').first().where({ email });
    return !!user;
  }

  async getUserByEmail(
    email: string,
    trx?: Knex.Transaction
  ): Promise<User | null> {
    const user = await this.getUserByColumn('email', email, trx);
    return user;
  }

  async uuidExists(uuid: string, trx?: Knex.Transaction): Promise<boolean> {
    const k = trx || knex;
    const user = await k('user').first().where({ uuid });
    return !!user;
  }

  async getUserByUuid(uuid: string, trx?: Knex.Transaction): Promise<User> {
    const row = await this.getUserByColumn('uuid', uuid, trx);
    if (!row) {
      throw new Error(`User with UUID ${uuid} does not exist`);
    }

    return row;
  }

  private async getUserByColumn(
    column: string,
    value: string | number,
    trx?: Knex.Transaction
  ): Promise<User | null> {
    const k = trx || knex;
    const user: User | null = await k('user')
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

  async createUser(user: User, trx?: Knex.Transaction): Promise<void> {
    const k = trx || knex;
    await k('user').insert({
      uuid: user.uuid,
      first_name: user.firstName,
      last_name: user.lastName,
      full_name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      is_admin: user.isAdmin,
    });
  }

  async userIsAdmin(uuid: string, trx?: Knex.Transaction): Promise<boolean> {
    const k = trx || knex;
    const { isAdmin } = await k('user')
      .first('is_admin AS isAdmin')
      .where({ uuid });
    return isAdmin;
  }

  async getAllUsers(trx?: Knex.Transaction): Promise<GetUserResponse[]> {
    const k = trx || knex;
    const users: Pick<
      User,
      'uuid' | 'firstName' | 'lastName' | 'email'
    >[] = await k('user').select(
      'uuid',
      'first_name AS firstName',
      'last_name AS lastName',
      'email'
    );
    const groupObjects = await Promise.all(
      users.map(user => UserGroupDao.getGroupsOfUser(user.uuid, trx))
    );
    const adminStatus = await Promise.all(
      users.map(user => this.userIsAdmin(user.uuid, trx))
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

  async updateProfile(
    userUuid: string,
    { email, firstName, lastName }: Required<UpdateProfilePayload>,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    const displayName = `${firstName} ${lastName}`;
    await k('user')
      .update({
        email,
        first_name: firstName,
        last_name: lastName,
        full_name: displayName,
      })
      .where('uuid', userUuid);
  }
}

export default new UserDao();
