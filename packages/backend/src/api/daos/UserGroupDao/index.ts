import { knexRead, knexWrite } from '@/connection';

export interface UserGroupRow {
  group_id: number;
}
class UserGroupDao {
  async userInGroup(groupId: number, userUuid: string): Promise<boolean> {
    const res = await knexRead()('user_group')
      .where('group_id', groupId)
      .andWhere('user_uuid', userUuid)
      .first();
    return !!res;
  }

  async getGroupsOfUser(userUuid: string | null): Promise<number[]> {
    const rows: UserGroupRow[] = await knexRead()('user_group')
      .select('group_id')
      .where('user_uuid', userUuid);
    return rows.map(row => row.group_id);
  }

  async getUsersInGroup(groupId: number): Promise<string[]> {
    const userUuids: Array<{ uuid: string }> = await knexRead()('user')
      .innerJoin('user_group', 'user.uuid', 'user_group.user_uuid')
      .where('user_group.group_id', groupId)
      .select('user.uuid');

    return userUuids.map(({ uuid }) => uuid);
  }

  async addUserToGroup(groupId: number, userUuid: string): Promise<void> {
    await knexWrite()('user_group').insert({
      group_id: groupId,
      user_uuid: userUuid,
    });
  }

  async removeUserFromGroup(groupId: number, userUuid: string) {
    await knexWrite()('user_group')
      .where('group_id', groupId)
      .andWhere('user_uuid', userUuid)
      .del();
  }
}

export default new UserGroupDao();
