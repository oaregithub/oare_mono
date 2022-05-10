import { Group } from '@oare/types';
import { knexRead, knexWrite } from '@/connection';

class OareGroupDao {
  async getGroupByName(name: string): Promise<Group | null> {
    return knexRead()('oare_group').first().where({ name });
  }

  async getGroupById(id: number): Promise<Group | null> {
    return knexRead()('oare_group').first().where({ id });
  }

  async getAllGroups(): Promise<Group[]> {
    return knexRead()('oare_group')
      .select(
        'oare_group.id',
        'oare_group.name',
        'oare_group.created_on',
        'oare_group.description',
        knexRead().raw('COUNT(user_group.id) AS num_users')
      )
      .leftJoin('user_group', 'user_group.group_id', 'oare_group.id')
      .groupBy('oare_group.id');
  }

  async createGroup(name: string, description: string): Promise<number> {
    const ids: number[] = await knexWrite()('oare_group').insert({
      name,
      description,
    });
    return ids[0];
  }

  async deleteGroup(groupId: number): Promise<void> {
    await knexWrite()('oare_group').where('id', groupId).del();
  }

  async updateGroupDescription(
    groupId: number,
    description: string
  ): Promise<void> {
    await knexWrite()('oare_group')
      .where('id', groupId)
      .update({ description });
  }
}

export default new OareGroupDao();
