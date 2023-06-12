import knex from '@/connection';
import sl from '@/serviceLocator';
import { DenylistAllowlistType } from '@oare/types';
import { Knex } from 'knex';

// MOSTLY COMPLETE

class GroupAllowlistDao {
  /**
   * Retrieves the allowlist for a single group, given the type of items
   * @param groupId The ID of the group
   * @param type The type of items to retrieve
   * @param trx Knex Transaction. Optional.
   * @returns An array of UUIDs of the items in the allowlist
   */
  public async getGroupAllowlist(
    groupId: number,
    type: DenylistAllowlistType,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const QuarantineTextDao = sl.get('QuarantineTextDao');

    // FIXME should probably just remove from allowlist if quarantined
    const quarantinedTextUuids = await QuarantineTextDao.getAllQuarantinedTextUuids(
      trx
    );

    const uuids = await k('group_allowlist')
      .pluck('uuid')
      .where({ group_id: groupId, type })
      .whereNotIn('uuid', quarantinedTextUuids);

    return uuids;
  }

  /**
   * Adds items to a single group's allowlist
   * @param groupId The ID of the group
   * @param uuids The UUIDs of the items to add
   * @param type The type of the items to add
   * @param trx Knex Transaction. Optional.
   */
  public async addItemsToAllowlist(
    groupId: number,
    uuids: string[],
    type: DenylistAllowlistType,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    const rows = uuids.map(uuid => ({
      uuid,
      type,
      group_id: groupId,
    }));

    await k('group_allowlist').insert(rows);
  }

  /**
   * Removes an item from a single group's allowlist
   * @param groupId The ID of the group
   * @param uuid The UUID of the item to remove
   * @param trx Knex Transaction. Optional.
   */
  public async removeItemFromAllowlist(
    groupId: number,
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('group_allowlist').where({ group_id: groupId, uuid }).del();
  }

  /**
   * Removes an item from all allowlists. Used when permanently deleting a text.
   * @param uuid The UUID of the item to remove
   * @param trx Knex Transaction. Optional.
   */
  public async removeItemFromAllAllowlists(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('group_allowlist').where({ uuid }).del();
  }

  /**
   * Determines if there is an association between a group and an allowlist item
   * @param uuid The UUID of the allowlist item
   * @param groupId The ID of the group
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating if there is an association
   */
  public async containsAssociation(
    uuid: string,
    groupId: number,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const containsAssociation = await k('group_allowlist')
      .where({ uuid, group_id: groupId })
      .first();

    return !!containsAssociation;
  }
}

/**
 * GroupAllowlistDao instance as a singleton
 */
export default new GroupAllowlistDao();
