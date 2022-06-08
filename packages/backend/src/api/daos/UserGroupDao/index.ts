import { knexRead, knexWrite } from '@/connection';
import { Knex } from 'knex';

export interface UserGroupRow {
  group_id: number;
}
class UserGroupDao {
  async userInGroup(
    groupId: number,
    userUuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knexRead();
    const res = await k('user_group')
      .where('group_id', groupId)
      .andWhere('user_uuid', userUuid)
      .first();
    return !!res;
  }

  async getGroupsOfUser(
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<number[]> {
    const k = trx || knexRead();
    const rows: UserGroupRow[] = await k('user_group')
      .select('group_id')
      .where('user_uuid', userUuid);
    return rows.map(row => row.group_id);
  }

  async getUsersInGroup(
    groupId: number,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knexRead();
    const userUuids: Array<{ uuid: string }> = await k('user')
      .innerJoin('user_group', 'user.uuid', 'user_group.user_uuid')
      .where('user_group.group_id', groupId)
      .select('user.uuid');

    return userUuids.map(({ uuid }) => uuid);
  }

  async addUserToGroup(
    groupId: number,
    userUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    await k('user_group').insert({
      group_id: groupId,
      user_uuid: userUuid,
    });
  }

  async removeUserFromGroup(
    groupId: number,
    userUuid: string,
    trx?: Knex.Transaction
  ) {
    const k = trx || knexWrite();
    await k('user_group')
      .where('group_id', groupId)
      .andWhere('user_uuid', userUuid)
      .del();
  }
}

export default new UserGroupDao();
