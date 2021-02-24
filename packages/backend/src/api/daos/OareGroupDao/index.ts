import { Group } from '@oare/types';
import knex from '@/connection';

class OareGroupDao {
  async getGroupByName(name: string): Promise<Group | null> {
    return knex('oare_group').first().where({ name });
  }

  async getGroupById(id: number): Promise<Group | null> {
    return knex('oare_group').first().where({ id });
  }

  async getAllGroups(): Promise<Group[]> {
    return knex('oare_group')
      .select(
        'oare_group.id',
        'oare_group.name',
        'oare_group.created_on',
        knex.raw('COUNT(user_group.id) AS num_users')
      )
      .leftJoin('user_group', 'user_group.group_id', 'oare_group.id')
      .groupBy('oare_group.id');
  }

  async createGroup(name: string): Promise<number> {
    const ids: number[] = await knex('oare_group').insert({ name });
    return ids[0];
  }

  async deleteGroup(groupId: number): Promise<void> {
    await knex('oare_group').where('id', groupId).del();
  }
}

export default new OareGroupDao();
