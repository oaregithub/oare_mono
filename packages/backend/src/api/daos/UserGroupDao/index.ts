import { User } from '@oare/types';
import knex from '@/connection';

export interface UserGroupRow {
  group_id: number;
}
class UserGroupDao {
  async userInGroup(groupId: number, userUuid: string): Promise<boolean> {
    const res = await knex('user_group')
      .where('group_id', groupId)
      .andWhere('user_uuid', userUuid)
      .first();
    return !!res;
  }

  async getGroupsOfUser(userUuid: string | null): Promise<number[]> {
    const rows: UserGroupRow[] = await knex('user_group')
      .select('group_id')
      .where('user_uuid', userUuid);
    return rows.map(row => row.group_id);
  }

  async getUsersInGroup(groupId: number): Promise<User[]> {
    const users: User[] = await knex('user')
      .innerJoin('user_group', 'user.id', 'user_group.user_id')
      .where('user_group.group_id', groupId)
      .select(
        'user.id',
        'user.uuid',
        'user.first_name',
        'user.last_name',
        'user.email'
      );
    return users;
  }

  async addUsersToGroup(
    groupId: number,
    userUuids: string[]
  ): Promise<number[]> {
    const rows = userUuids.map(uuid => ({
      group_id: groupId,
      user_uuid: uuid,
    }));
    const ids: number[] = await knex('user_group').insert(rows);
    return ids;
  }

  async removeUsersFromGroup(groupId: number, userUuids: string[]) {
    await knex('user_group')
      .where('group_id', groupId)
      .andWhere(function () {
        this.whereIn('user_uuid', userUuids);
      })
      .del();
  }
}

export default new UserGroupDao();
