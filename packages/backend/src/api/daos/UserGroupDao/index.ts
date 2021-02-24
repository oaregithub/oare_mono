import { User } from '@oare/types';
import knex from '@/connection';

export interface UserGroupRow {
  group_id: number;
}
class UserGroupDao {
  async userInGroup(groupId: number, userId: number): Promise<boolean> {
    const res = await knex('user_group')
      .where('group_id', groupId)
      .andWhere('user_id', userId)
      .first();
    return !!res;
  }

  async getGroupsOfUser(userId: number | null): Promise<number[]> {
    const rows: UserGroupRow[] = await knex('user_group')
      .select('group_id')
      .where('user_id', userId);
    return rows.map(row => row.group_id);
  }

  async getUsersInGroup(groupId: number): Promise<User[]> {
    const users: User[] = await knex('user')
      .innerJoin('user_group', 'user.id', 'user_group.user_id')
      .where('user_group.group_id', groupId)
      .select('user.id', 'user.first_name', 'user.last_name', 'user.email');
    return users;
  }

  async addUsersToGroup(groupId: number, userIds: number[]): Promise<number[]> {
    const rows = userIds.map(id => ({
      group_id: groupId,
      user_id: id,
    }));
    const ids: number[] = await knex('user_group').insert(rows);
    return ids;
  }

  async removeUsersFromGroup(groupId: number, userIds: number[]) {
    await knex('user_group')
      .where('group_id', groupId)
      .andWhere(function () {
        this.whereIn('user_id', userIds);
      })
      .del();
  }
}

export default new UserGroupDao();
