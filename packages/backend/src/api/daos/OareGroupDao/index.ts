import { Group } from '@oare/types';
import knex from '@/connection';
import { Knex } from 'knex';

class OareGroupDao {
  async getGroupByName(
    name: string,
    trx?: Knex.Transaction
  ): Promise<Group | null> {
    const k = trx || knex;
    return k('oare_group').first().where({ name });
  }

  async getGroupById(
    id: number,
    trx?: Knex.Transaction
  ): Promise<Group | null> {
    const k = trx || knex;
    return k('oare_group').first().where({ id });
  }

  async getAllGroups(trx?: Knex.Transaction): Promise<Group[]> {
    const k = trx || knex;
    return k('oare_group')
      .select(
        'oare_group.id',
        'oare_group.name',
        'oare_group.created_on',
        'oare_group.description',
        k.raw('COUNT(user_group.id) AS num_users')
      )
      .leftJoin('user_group', 'user_group.group_id', 'oare_group.id')
      .groupBy('oare_group.id');
  }

  async createGroup(
    name: string,
    description: string,
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knex;
    const ids: number[] = await k('oare_group').insert({
      name,
      description,
    });
    return ids[0];
  }

  async deleteGroup(groupId: number, trx?: Knex.Transaction): Promise<void> {
    const k = trx || knex;
    await k('oare_group').where('id', groupId).del();
  }

  async updateGroupDescription(
    groupId: number,
    description: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    await k('oare_group').where('id', groupId).update({ description });
  }
}

export default new OareGroupDao();
