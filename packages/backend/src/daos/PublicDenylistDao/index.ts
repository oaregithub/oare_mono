import knex from '@/connection';
import sl from '@/serviceLocator';
import {
  DenylistAllowlistType,
  Pagination,
  SearchPotentialPermissionsListsResponse,
} from '@oare/types';
import { Knex } from 'knex';

class PublicDenylistDao {
  /**
   * Retrieves the public denylist for the given type.
   * @param type The type of items to retrieve
   * @param trx Knex Transaction. Optional.
   * @returns Array of UUIDs of the items in the denylist.
   */
  public async getDenylist(
    type: DenylistAllowlistType,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const QuarantineTextDao = sl.get('QuarantineTextDao');
    const quarantinedTextUuids = await QuarantineTextDao.getAllQuarantinedTextUuids(
      trx
    );

    const uuids = await k('public_denylist')
      .pluck('uuid')
      .where({ type })
      .whereNotIn('uuid', quarantinedTextUuids);

    return uuids;
  }

  /**
   * Adds items to the public denylist.
   * @param uuids The UUIDs of the items to add.
   * @param type The type of the items to add.
   * @param trx Knex Transaction. Optional.
   */
  public async addItemsToDenylist(
    uuids: string[],
    type: DenylistAllowlistType,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    const insertRows = uuids.map(uuid => ({
      uuid,
      type,
    }));

    await k('public_denylist').insert(insertRows);
  }

  /**
   * Removes item from the public denylist.
   * @param uuid The UUID of the item to remove.
   * @param trx Knex Transaction. Optional.
   */
  public async removeItemFromDenylist(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('public_denylist').where({ uuid }).del();
  }

  /**
   * Checks if a text is publicly viewable.
   * @param textUuid The UUID of the text to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the text is publicly viewable.
   */
  public async textIsPubliclyViewable(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const textDenylist = await this.getDenylist('text', trx);

    if (textDenylist.includes(textUuid)) {
      return false;
    }

    return true;
  }

  /**
   * Creates QueryBuilder for searching potential public denylist images.
   * @param pagination Pagination object.
   * @param quarantinedTexts Array of UUIDs of quarantined texts.
   * @param trx Knex Transaction. Optional.
   * @returns QueryBuilder Object.
   */
  private getPotentialPublicDenylistImagesQuery(
    pagination: Pagination,
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
        k('public_denylist').select('uuid').where({ type: 'img' })
      )
      .orderBy('text.display_name');
  }

  /**
   * Retrieves a list of images that could potentially be added to the public denylist.
   * @param pagination Pagination object.
   * @param trx Knex Transaction. Optional.
   * @returns Object containing an array of matching images and a count of the total number of matching images.
   */
  public async getPotentialPublicDenylistImages(
    pagination: Pagination,
    trx?: Knex.Transaction
  ): Promise<SearchPotentialPermissionsListsResponse> {
    const ResourceDao = sl.get('ResourceDao');

    const count = await this.getPotentialPublicDenylistImagesQuery(
      pagination,
      trx
    )
      .count({ count: 'resource.uuid' })
      .first();

    const resourceUuids: string[] = await this.getPotentialPublicDenylistImagesQuery(
      pagination,
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

  /**
   * Creates QueryBuilder for searching potential public denylist texts.
   * @param pagination Pagination object.
   * @param quarantinedTexts Array of UUIDs of quarantined texts.
   * @param trx Knex Transaction. Optional.
   * @returns QueryBuilder Object.
   */
  private getPotentialPublicDenylistTextsQuery(
    pagination: Pagination,
    quarantinedTexts: string[],
    trx?: Knex.Transaction
  ): Knex.QueryBuilder {
    const k = trx || knex;

    return k('text')
      .where('text.display_name', 'like', `%${pagination.filter}%`)
      .whereNotIn('text.uuid', quarantinedTexts)
      .whereNotIn(
        'text.uuid',
        k('public_denylist').select('uuid').where({ type: 'text' })
      )
      .orderBy('text.display_name');
  }

  /**
   * Retrieves a list of texts that could potentially be added to the public denylist.
   * @param pagination Pagination object.
   * @param trx Knex Transaction. Optional.
   * @returns Object containing an array of matching texts and a count of the total number of matching texts.
   */
  public async getPotentialPublicDenylistTexts(
    pagination: Pagination,
    trx?: Knex.Transaction
  ): Promise<SearchPotentialPermissionsListsResponse> {
    const QuarantineTextDao = sl.get('QuarantineTextDao');
    const TextDao = sl.get('TextDao');

    const quarantinedTexts = await QuarantineTextDao.getAllQuarantinedTextUuids(
      trx
    );

    const count = await this.getPotentialPublicDenylistTextsQuery(
      pagination,
      quarantinedTexts,
      trx
    )
      .count({ count: 'text.uuid' })
      .first();

    const textUuids: string[] = await this.getPotentialPublicDenylistTextsQuery(
      pagination,
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
 * PublicDenylistDao instance as a singleton.
 */
export default new PublicDenylistDao();
