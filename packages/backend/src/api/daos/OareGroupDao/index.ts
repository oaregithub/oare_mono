import knex from '../../../connection';

export interface OareGroup {
  id: number;
  name: string;
  created_on: string;
  num_users?: number;
}

class OareGroupDao {
  async getGroupByName(name: string): Promise<OareGroup> {
    const group: OareGroup = await knex('oare_group').first().where({ name });
    return group;
  }

  async getGroupById(id: number): Promise<OareGroup> {
    const group: OareGroup = await knex('oare_group').first().where({ id });
    return group;
  }

  async getAllGroups(): Promise<OareGroup[]> {
    const groups: OareGroup[] = await knex('oare_group')
      .select(
        'oare_group.id',
        'oare_group.name',
        'oare_group.created_on',
        knex.raw('COUNT(user_group.id) AS num_users'),
      )
      .leftJoin('user_group', 'user_group.group_id', 'oare_group.id')
      .groupBy('oare_group.id');
    return groups;
  }

  async createGroup(name: string): Promise<number> {
    const ids: number[] = await knex('oare_group').insert({ name });
    return ids[0];
  }

  async deleteGroups(groupIds: number[]) {
    await knex('oare_group').whereIn('id', groupIds).del();
  }
}

export default new OareGroupDao();
