import { knexRead, knexWrite } from '@/connection';
import { Knex } from 'knex';

class GroupEditPermissionsDao {
  async getGroupEditPermissions(
    groupId: number,
    type: 'text' | 'collection',
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knexRead();
    const uuids = await k('group_edit_permissions')
      .pluck('uuid')
      .where('group_id', groupId)
      .andWhere('type', type);

    return uuids;
  }

  async addItemsToGroupEditPermissions(
    groupId: number,
    uuids: string[],
    type: 'text' | 'collection',
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    const rows = uuids.map(uuid => ({
      uuid,
      type,
      group_id: groupId,
    }));
    await k('group_edit_permissions').insert(rows);
  }

  async removeItemFromGroupEditPermissions(
    groupId: number,
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    await k('group_edit_permissions')
      .where('group_id', groupId)
      .andWhere({ uuid })
      .del();
  }

  async removeItemFromAllEditPermissions(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    await k('group_edit_permissions').andWhere({ uuid }).del();
  }

  async containsAssociation(
    uuid: string,
    groupId: number,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knexRead();
    const containsAssociation = await k('group_edit_permissions')
      .where({ uuid })
      .andWhere('group_id', groupId)
      .first();

    return !!containsAssociation;
  }
}

export default new GroupEditPermissionsDao();
