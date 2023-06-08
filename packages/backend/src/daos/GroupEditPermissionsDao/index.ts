import knex from '@/connection';
import sl from '@/serviceLocator';
import { Knex } from 'knex';

class GroupEditPermissionsDao {
  async getGroupEditPermissions(
    groupId: number,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    // FIXME i should just remove the items from the edit permissions when they're quarantined
    const QuarantineTextDao = sl.get('QuarantineTextDao');
    const quarantinedTexts = await QuarantineTextDao.getQuarantinedTextUuids(
      trx
    );

    const uuids = await k('group_edit_permissions')
      .pluck('uuid')
      .where('group_id', groupId)
      .whereNotIn('uuid', quarantinedTexts);

    return uuids;
  }

  async addItemsToGroupEditPermissions(
    groupId: number,
    uuids: string[],
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    const rows = uuids.map(uuid => ({
      uuid,
      group_id: groupId,
    }));
    await k('group_edit_permissions').insert(rows);
  }

  async removeItemFromGroupEditPermissions(
    groupId: number,
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    await k('group_edit_permissions')
      .where('group_id', groupId)
      .andWhere({ uuid })
      .del();
  }

  async removeItemFromAllEditPermissions(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    await k('group_edit_permissions').andWhere({ uuid }).del();
  }

  async containsAssociation(
    uuid: string,
    groupId: number,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;
    const containsAssociation = await k('group_edit_permissions')
      .where({ uuid })
      .andWhere('group_id', groupId)
      .first();

    return !!containsAssociation;
  }
}

export default new GroupEditPermissionsDao();
