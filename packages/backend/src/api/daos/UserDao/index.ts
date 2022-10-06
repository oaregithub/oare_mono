import { GetUserResponse, User, UpdateProfilePayload } from '@oare/types';
import { knexRead, knexWrite } from '@/connection';
import { Knex } from 'knex';
import UserGroupDao from '../UserGroupDao';

class UserDao {
  async emailExists(email: string, trx?: Knex.Transaction): Promise<boolean> {
    const k = trx || knexRead();
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
    const k = trx || knexRead();
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
    const k = trx || knexRead();
    const user: User | null = await k('user')
      .first(
        'uuid',
        'first_name AS firstName',
        'last_name AS lastName',
        'email',
        'is_admin AS isAdmin',
        'beta_access AS betaAccess'
      )
      .where(column, value);

    if (!user) {
      return null;
    }

    return {
      ...user,
      isAdmin: !!user.isAdmin,
      betaAccess: !!user.betaAccess,
    };
  }

  async createUser(
    {
      uuid,
      firstName,
      lastName,
      email,
      isAdmin,
      betaAccess,
    }: {
      uuid: string;
      firstName: string;
      lastName: string;
      email: string;
      isAdmin: boolean;
      betaAccess: boolean;
    },
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    await k('user').insert({
      uuid,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      email,
      is_admin: isAdmin,
      beta_access: betaAccess,
    });
  }

  async userIsAdmin(uuid: string, trx?: Knex.Transaction): Promise<boolean> {
    const k = trx || knexRead();
    const { isAdmin } = await k('user')
      .first('is_admin AS isAdmin')
      .where({ uuid });
    return isAdmin;
  }

  async userHasBetaAccess(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knexRead();
    const { betaAccess } = await k('user')
      .first('beta_access AS betaAccess')
      .where({ uuid });
    return betaAccess;
  }

  async setBetaAccess(
    uuid: string,
    status: boolean,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    await k('user')
      .update({
        beta_access: status,
      })
      .where('uuid', uuid);
  }

  async getAllUsers(trx?: Knex.Transaction): Promise<GetUserResponse[]> {
    const k = trx || knexRead();
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
    const betaStatus = await Promise.all(
      users.map(user => this.userHasBetaAccess(user.uuid, trx))
    );
    return users.map(({ uuid, firstName, lastName, email }, index) => ({
      uuid,
      firstName,
      lastName,
      email,
      groups: groupObjects[index],
      isAdmin: adminStatus[index],
      betaAccess: betaStatus[index],
    }));
  }

  async updateProfile(
    userUuid: string,
    { email, firstName, lastName }: Required<UpdateProfilePayload>,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
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
