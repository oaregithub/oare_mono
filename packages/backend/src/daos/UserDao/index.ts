import { User, UpdateProfilePayload, UserRow } from '@oare/types';
import knex from '@/connection';
import { Knex } from 'knex';
import sl from '@/serviceLocator';

// COMPLETE

class UserDao {
  /**
   * Checks to see if a user with the given email exists.
   * @param email The email to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the user exists.
   */
  public async emailExists(
    email: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const user = await k('user').first().where({ email });

    return !!user;
  }

  /**
   * Retrieves a user row by their UUID.
   * @param uuid The UUID of the user to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns The user row.
   * @throws Error if no user found.
   */
  private async getUserRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<UserRow> {
    const k = trx || knex;

    const row: UserRow | undefined = await k('user')
      .select(
        'uuid',
        'first_name as firstName',
        'last_name as lastName',
        'email',
        'is_admin as isAdmin',
        'created_on as createdOn'
      )
      .where({ uuid })
      .first();

    if (!row) {
      throw new Error(`User with uuid ${uuid} does not exist`);
    }

    return { ...row, isAdmin: !!row.isAdmin };
  }

  /**
   * Checks if a user exists.
   * @param uuid The UUID of the user to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the user exists.
   */
  public async userExists(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const user = await k('user').first().where({ uuid });

    return !!user;
  }

  /**
   * Retrieves a user by their UUID.
   * @param uuid The UUID of the user to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns The user object.
   * @throws Error if no user found.
   */
  public async getUserByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<User> {
    const UserGroupDao = sl.get('UserGroupDao');

    const userRow = await this.getUserRowByUuid(uuid, trx);

    const groups = await UserGroupDao.getGroupsOfUser(userRow.uuid);

    const user: User = {
      ...userRow,
      groups,
    };

    return user;
  }

  /**
   * Creates a new user.
   * @param uuid The UUID of the user to create.
   * @param firstName The first name of the user to create.
   * @param lastName The last name of the user to create.
   * @param email The email of the user to create.
   * @param trx Knex Transaction. Optional.
   */
  public async createUser(
    uuid: string,
    firstName: string,
    lastName: string,
    email: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('user').insert({
      uuid,
      first_name: firstName,
      last_name: lastName,
      email,
      is_admin: false,
    });
  }

  /**
   * Retrieves a list of all user UUIDs.
   * @param trx Knex Transaction. Optional.
   * @returns Array of user UUIDs.
   */
  public async getAllUserUuids(trx?: Knex.Transaction): Promise<string[]> {
    const k = trx || knex;

    const userUuids: string[] = await k('user').pluck('uuid');

    return userUuids;
  }

  /**
   * Updates a user's profile.
   * @param uuid The UUID of the user to update.
   * @param options The profile options to update.
   * @param trx Knex Transaction. Optional.
   */
  public async updateProfile(
    uuid: string,
    { email, firstName, lastName }: Required<UpdateProfilePayload>,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('user')
      .update({
        email,
        first_name: firstName,
        last_name: lastName,
      })
      .where({ uuid });
  }
}

/**
 * UserDao instance as a singleton.
 */
export default new UserDao();
