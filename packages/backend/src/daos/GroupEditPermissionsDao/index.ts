import knex from '@/connection';
import sl from '@/serviceLocator';
import { Knex } from 'knex';

// FIXME run migration to remove type column and removing rows of type collection

class GroupEditPermissionsDao {
  /**
   * Retrieves the UUIDs of all texts that are editable by the given group.
   * @param groupId The ID of the group whose editable texts to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Array of UUIDs of all texts that are editable by the given group.
   */
  async getGroupEditPermissions(
    groupId: number,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    // FIXME i should just remove the items from the edit permissions when they're quarantined
    const QuarantineTextDao = sl.get('QuarantineTextDao');

    const quarantinedTextUuids = await QuarantineTextDao.getAllQuarantinedTextUuids(
      trx
    );

    const uuids = await k('group_edit_permissions')
      .pluck('uuid')
      .where('group_id', groupId)
      .whereNotIn('uuid', quarantinedTextUuids);

    return uuids;
  }

  /**
   * Adds items to a single group's edit permissions.
   * @param groupId The ID of the group to add items to.
   * @param uuids Array of text UUIDs to add to the group's edit permissions.
   * @param trx Knex Transaction. Optional.
   */
  async addTextsToGroupEditPermissions(
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

  /**
   * Removes an item from a single group's edit permissions.
   * @param groupId The ID of the group to remove the item from.
   * @param uuid The UUID of the text to remove from the group's edit permissions.
   * @param trx Knex Transaction. Optional.
   */
  async removeTextFromGroupEditPermissions(
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

  /**
   * Removes text from all groups' edit permissions. Used when a text is permanently deleted.
   * @param uuid The UUID of the text to remove from all groups' edit permissions.
   * @param trx Knex Transaction. Optional.
   */
  async removeTextFromAllEditPermissions(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('group_edit_permissions').where({ uuid }).del();
  }

  /**
   * Determines if there is an association between a group and a text in the edit permissions table.
   * @param uuid The UUID of the text.
   * @param groupId The ID of the group.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether there is an association between the group and the text.
   */
  async containsAssociation(
    uuid: string,
    groupId: number,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const containsAssociation = await k('group_edit_permissions')
      .where({ uuid, group_id: groupId })
      .first();

    return !!containsAssociation;
  }
}

export default new GroupEditPermissionsDao();
