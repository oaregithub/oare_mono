import knex from '@/connection';
import sl from '@/serviceLocator';
import {
  Pagination,
  SearchPotentialPermissionsListsResponse,
} from '@oare/types';
import { Knex } from 'knex';

class GroupEditPermissionsDao {
  /**
   * Retrieves the UUIDs of all texts that are editable by the given group.
   * @param groupId The ID of the group whose editable texts to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Array of UUIDs of all texts that are editable by the given group.
   */
  public async getGroupEditPermissions(
    groupId: number,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

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
  public async addTextsToGroupEditPermissions(
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
  public async removeTextFromGroupEditPermissions(
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
   * Determines if there is an association between a group and a text in the edit permissions table.
   * @param uuid The UUID of the text.
   * @param groupId The ID of the group.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether there is an association between the group and the text.
   */
  public async containsAssociation(
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

  /**
   * Creates QueryBuilder for searching potential group edit permissions texts.
   * @param pagination Pagination object.
   * @param groupId The ID of the group whose edit permissions could be added to.
   * @param quarantinedTexts Array of UUIDs of quarantined texts.
   * @param trx Knex Transaction. Optional.
   * @returns QueryBuilder Object.
   */
  private getPotentialGroupEditPermissionsTextsQuery(
    pagination: Pagination,
    groupId: number,
    quarantinedTexts: string[],
    trx?: Knex.Transaction
  ): Knex.QueryBuilder {
    const k = trx || knex;

    return k('text')
      .where('text.display_name', 'like', `%${pagination.filter}%`)
      .whereNotIn('text.uuid', quarantinedTexts)
      .whereNotIn(
        'text.uuid',
        k('group_edit_permissions').select('uuid').where({ group_id: groupId })
      )
      .orderBy('text.display_name');
  }

  /**
   * Retrieves a list of texts that could potentially be added to a group's edit permissions.
   * @param pagination Pagination object.
   * @param groupId The ID of the group whose edit permissions could be added to.
   * @param trx Knex Transaction. Optional.
   * @returns Object containing an array of matching texts and a count of the total number of matching texts.
   */
  public async getPotentialGroupEditPermissionsTexts(
    pagination: Pagination,
    groupId: number,
    trx?: Knex.Transaction
  ): Promise<SearchPotentialPermissionsListsResponse> {
    const QuarantineTextDao = sl.get('QuarantineTextDao');
    const TextDao = sl.get('TextDao');

    const quarantinedTexts = await QuarantineTextDao.getAllQuarantinedTextUuids(
      trx
    );

    const count = await this.getPotentialGroupEditPermissionsTextsQuery(
      pagination,
      groupId,
      quarantinedTexts,
      trx
    )
      .count({ count: 'text.uuid' })
      .first();

    const textUuids: string[] = await this.getPotentialGroupEditPermissionsTextsQuery(
      pagination,
      groupId,
      quarantinedTexts,
      trx
    )
      .pluck('uuid')
      .limit(pagination.limit)
      .offset((pagination.page - 1) * pagination.limit);

    const texts = await Promise.all(
      textUuids.map(uuid => TextDao.getTextByUuid(uuid, trx))
    );

    const response: SearchPotentialPermissionsListsResponse = {
      results: texts,
      count: count && count.count ? Number(count.count) : 0,
    };

    return response;
  }
}

/**
 * GroupEditPermissionsDao instance as a singleton.
 */
export default new GroupEditPermissionsDao();
