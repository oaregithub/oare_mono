import knex from '@/connection';
import sl from '@/serviceLocator';
import {
  DenylistAllowlistType,
  Pagination,
  SearchPotentialPermissionsListsResponse,
} from '@oare/types';
import { Knex } from 'knex';

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

  /**
   * Creates QueryBuilder for searching potential group allowlist texts.
   * @param pagination Pagination object.
   * @param groupId The ID of the group whose allowlist could be added to.
   * @param quarantinedTexts Array of quarantined text UUIDs.
   * @param trx Knex Transaction. Optional.
   * @returns QueryBuilder Object.
   */
  private getPotentialGroupAllowlistTextsQuery(
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
        k('group_allowlist')
          .select('uuid')
          .where({ type: 'text', group_id: groupId })
      )
      .whereIn(
        'text.uuid',
        k('public_denylist').select('uuid').where({ type: 'text' })
      )
      .orderBy('text.display_name');
  }

  /**
   * Retrieves a list of texts that could potentially be added to a group's allowlist.
   * @param pagination Pagination object.
   * @param groupId The ID of the group whose allowlist could be added to.
   * @param trx Knex Transaction. Optional.
   * @returns Object containing an array of matching texts and a count of the total number of matching texts.
   */
  public async getPotentialGroupAllowlistTexts(
    pagination: Pagination,
    groupId: number,
    trx?: Knex.Transaction
  ): Promise<SearchPotentialPermissionsListsResponse> {
    const QuarantineTextDao = sl.get('QuarantineTextDao');
    const TextDao = sl.get('TextDao');

    const quarantinedTexts = await QuarantineTextDao.getAllQuarantinedTextUuids(
      trx
    );

    const count = await this.getPotentialGroupAllowlistTextsQuery(
      pagination,
      groupId,
      quarantinedTexts,
      trx
    )
      .count({ count: 'text.uuid' })
      .first();

    const textUuids: string[] = await this.getPotentialGroupAllowlistTextsQuery(
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

  /**
   * Creates QueryBuilder for searching potential group allowlist images.
   * @param pagination Pagination object.
   * @param groupId The ID of the group whose allowlist could be added to.
   * @param trx Knex Transaction. Optional.
   * @returns QueryBuilder Object.
   */
  private getPotentialGroupAllowlistImagesQuery(
    pagination: Pagination,
    groupId: number,
    trx?: Knex.Transaction
  ): Knex.QueryBuilder {
    const k = trx || knex;

    return k('text')
      .innerJoin('link', 'link.reference_uuid', 'text.uuid')
      .innerJoin('resource', 'resource.uuid', 'link.obj_uuid')
      .where({ container: 'oare-image-bucket' })
      .andWhere('text.display_name', 'like', `%${pagination.filter}%`)
      .whereNotIn(
        'resource.uuid',
        k('group_allowlist')
          .select('uuid')
          .where({ type: 'img', group_id: groupId })
      )
      .whereIn(
        'resource.uuid',
        k('public_denylist').select('uuid').where({ type: 'img' })
      )
      .orderBy('text.display_name');
  }

  /**
   * Retrieves a list of images that could potentially be added to a group's allowlist.
   * @param pagination Pagination object.
   * @param groupId The ID of the group whose allowlist could be added to.
   * @param trx Knex Transaction. Optional.
   * @returns Object containing an array of matching images and a count of the total number of matching images.
   */
  public async getPotentialGroupAllowlistImages(
    pagination: Pagination,
    groupId: number,
    trx?: Knex.Transaction
  ): Promise<SearchPotentialPermissionsListsResponse> {
    const ResourceDao = sl.get('ResourceDao');

    const count = await this.getPotentialGroupAllowlistImagesQuery(
      pagination,
      groupId,
      trx
    )
      .count({ count: 'resource.uuid' })
      .first();

    const resourceUuids: string[] = await this.getPotentialGroupAllowlistImagesQuery(
      pagination,
      groupId,
      trx
    )
      .pluck('resource.uuid')
      .limit(pagination.limit)
      .offset((pagination.page - 1) * pagination.limit);

    const images = await Promise.all(
      resourceUuids.map(uuid => ResourceDao.getS3ImageByUuid(uuid, trx))
    );

    const response: SearchPotentialPermissionsListsResponse = {
      results: images,
      count: count && count.count ? Number(count.count) : 0,
    };

    return response;
  }
}

/**
 * GroupAllowlistDao instance as a singleton
 */
export default new GroupAllowlistDao();
