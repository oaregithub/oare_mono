import knex from '@/connection';
import { Knex } from 'knex';

// COMPLETE

class UserGroupDao {
  /**
   * Checks if a user belongs to the specified group.
   * @param groupId The ID of the group to check.
   * @param userUuid The UUID of the user to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the specified user belongs to the specified group.
   */
  public async userInGroup(
    groupId: number,
    userUuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const res = await k('user_group')
      .where({ group_id: groupId, user_uuid: userUuid })
      .first();

    return !!res;
  }

  /**
   * Retrieves a list of groups that the specified user belongs to.
   * @param userUuid The UUID of the user whose groups should be retrieved.
   * @param trx Knex Transaction. Optional.
   * @returns An array of group IDs.
   */
  public async getGroupsOfUser(
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<number[]> {
    const k = trx || knex;

    const groupIds: number[] = await k('user_group')
      .pluck('group_id')
      .where({ user_uuid: userUuid });

    return groupIds;
  }

  /**
   * Retrieves a list of users in the specified group.
   * @param groupId The ID of the group whose users should be retrieved.
   * @param trx Knex Transaction. Optional.
   * @returns An array of user UUIDs.
   */
  public async getUsersInGroup(
    groupId: number,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const userUuids: string[] = await k('user')
      .innerJoin('user_group', 'user.uuid', 'user_group.user_uuid')
      .where({ group_id: groupId })
      .pluck('user.uuid');

    return userUuids;
  }

  /**
   * Adds a user to the specified group.
   * @param groupId The ID of the group to add the user to.
   * @param userUuid The UUID of the user to add to the group.
   * @param trx Knex Transaction. Optional.
   */
  public async addUserToGroup(
    groupId: number,
    userUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('user_group').insert({
      group_id: groupId,
      user_uuid: userUuid,
    });
  }

  /**
   * Removes a user from the specified group.
   * @param groupId The ID of the group to remove the user from.
   * @param userUuid The UUID of the user to remove from the group.
   * @param trx Knex Transaction. Optional.
   */
  public async removeUserFromGroup(
    groupId: number,
    userUuid: string,
    trx?: Knex.Transaction
  ) {
    const k = trx || knex;

    await k('user_group')
      .where({ group_id: groupId, user_uuid: userUuid })
      .del();
  }
}

/**
 * UserGroupDao instance as a singleton
 */
export default new UserGroupDao();
