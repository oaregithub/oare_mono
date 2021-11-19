import { GetUserResponse, User, UpdateProfilePayload } from '@oare/types';
import knex from '@/connection';
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

  async uuidExists(uuid: string): Promise<boolean> {
    const user = await knex('user').first().where({ uuid });
    return !!user;
  }

  async getUserByUuid(uuid: string): Promise<User> {
    const row = await this.getUserByColumn('uuid', uuid);
    if (!row) {
      throw new Error(`User with UUID ${uuid} does not exist`);
    }

    return row;
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

  async createUser({
    uuid,
    firstName,
    lastName,
    email,
    isAdmin,
  }: {
    uuid: string;
    firstName: string;
    lastName: string;
    email: string;
    isAdmin: boolean;
  }): Promise<void> {
    await knex('user').insert({
      uuid,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      email,
      is_admin: isAdmin,
    });
  }

  async userIsAdmin(uuid: string): Promise<boolean> {
    const { isAdmin } = await knex('user')
      .first('is_admin AS isAdmin')
      .where({ uuid });
    return isAdmin;
  }

  async userHasBetaAccess(uuid: string): Promise<boolean> {
    const { betaAccess } = await knex('user')
      .first('beta_access AS betaAccess')
      .where({ uuid });
    return betaAccess;
  }

  async setBetaAccess(uuid: string, status: boolean): Promise<void> {
    await knex('user')
      .update({
        beta_access: status,
      })
      .where('uuid', uuid);
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
    const betaStatus = await Promise.all(
      users.map(user => this.userHasBetaAccess(user.uuid))
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
    { email, firstName, lastName }: Required<UpdateProfilePayload>
  ): Promise<void> {
    const displayName = `${firstName} ${lastName}`;
    await knex('user')
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
