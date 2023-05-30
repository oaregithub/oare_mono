import { User, UpdateProfilePayload } from '@oare/types';
import knex from '@/connection';
import { Knex } from 'knex';

// MOSTLY COMPLETE

class UserDao {
  /**
   * Checks to see if a user with the given email exists.
   * @param email The email to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the user exists.
   */
  async emailExists(email: string, trx?: Knex.Transaction): Promise<boolean> {
    const k = trx || knex;

    const user = await k('user').first().where({ email });

    return !!user;
  }

  /**
   * Checks to see if a user with the given UUID exists.
   * @param uuid The UUID to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the user exists.
   */
  async uuidExists(uuid: string, trx?: Knex.Transaction): Promise<boolean> {
    const k = trx || knex;

    const user = await k('user').first().where({ uuid });

    return !!user;
  }

  /**
   * Retrieves a user by their UUID.
   * @param uuid The UUID of the user to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns The user object. Null if no user found.
   */
  async getUserByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<User | null> {
    const k = trx || knex;

    const row: User | undefined = await k('user')
      .select(
        'uuid',
        'first_name as firstName',
        'last_name as lastName',
        'email',
        'is_admin as isAdmin'
      )
      .where({ uuid })
      .first();

    return row ? { ...row, isAdmin: !!row.isAdmin } : null;
  }

  // FIXME should deprecate full_name column

  /**
   * Creates a new user.
   * @param user The user object to create.
   * @param trx Knex Transaction. Optional.
   */
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

  // FIXME could probably deprecate this once removed from threads

  /**
   * Checks to see if a user is an admin.
   * @param uuid The UUID of the user to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the user is an admin.
   */
  async userIsAdmin(uuid: string, trx?: Knex.Transaction): Promise<boolean> {
    const k = trx || knex;

    const { isAdmin }: { isAdmin: boolean } = await k('user')
      .first('is_admin AS isAdmin')
      .where({ uuid });

    return isAdmin;
  }

  /**
   * Retrieves a list of all user UUIDs.
   * @param trx Knex Transaction. Optional.
   * @returns Array of user UUIDs.
   */
  async getAllUserUuids(trx?: Knex.Transaction): Promise<string[]> {
    const k = trx || knex;

    const userUuids: string[] = await k('user').pluck('uuid');

    return userUuids;
  }

  // FIXME should deprecate full_name column. Only used by text drafts anyways

  /**
   * Updates a user's profile.
   * @param uuid The UUID of the user to update.
   * @param options The profile options to update.
   * @param trx Knex Transaction. Optional.
   */
  async updateProfile(
    uuid: string,
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
      .where({ uuid });
  }
}

export default new UserDao();
