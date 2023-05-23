import knex from '@/connection';
import sl from '@/serviceLocator';
import {
  SearchImagesResponse,
  SearchImagesResultRow,
  SearchNamesPayload,
  DenylistAllowlistType,
} from '@oare/types';
import { Knex } from 'knex';
import AWS from 'aws-sdk';

class GroupAllowlistDao {
  /**
   * Retrieves the allowlist for a single group, given the type of items
   * @param groupId The ID of the group
   * @param type The type of items to retrieve
   * @param trx Knex Transaction. Optional.
   * @returns An array of UUIDs of the items in the allowlist
   */
  async getGroupAllowlist(
    groupId: number,
    type: DenylistAllowlistType,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const QuarantineTextDao = sl.get('QuarantineTextDao');

    const quarantinedTexts = await QuarantineTextDao.getQuarantinedTextUuids(
      trx
    );

    const uuids = await k('group_allowlist')
      .pluck('uuid')
      .where({ group_id: groupId, type })
      .whereNotIn('uuid', quarantinedTexts);

    return uuids;
  }

  /**
   * Adds items to a single group's allowlist
   * @param groupId The ID of the group
   * @param uuids The UUIDs of the items to add
   * @param type The type of the items to add
   * @param trx Knex Transaction. Optional.
   */
  async addItemsToAllowlist(
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
  async removeItemFromAllowlist(
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
  async removeItemFromAllAllowlists(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('group_allowlist').where({ uuid }).del();
  }

  /**
   * Checks if a text is in the allowlist for a user
   * @param textUuid The UUID of the text
   * @param userUuid The UUID of the user
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating if the text is in the allowlist
   */
  async textIsInAllowlist(
    textUuid: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const CollectionDao = sl.get('CollectionDao');
    const UserGroupDao = sl.get('UserGroupDao');

    const collectionUuid = await CollectionDao.getCollectionUuidByTextUuid(
      textUuid,
      trx
    );
    const groups = await UserGroupDao.getGroupsOfUser(userUuid, trx);

    const textAllowlist = (
      await Promise.all(
        groups.map(groupId => this.getGroupAllowlist(groupId, 'text', trx))
      )
    ).flat();

    const collectionAllowlist = (
      await Promise.all(
        groups.map(groupId =>
          this.getGroupAllowlist(groupId, 'collection', trx)
        )
      )
    ).flat();

    if (textAllowlist.includes(textUuid)) {
      return true;
    }
    if (collectionUuid && collectionAllowlist.includes(collectionUuid)) {
      return true;
    }
    return false;
  }

  // FIXME - maybe simplify this one and clean up the parameters. Why are we using SearchNamesPayload?
  async getImagesForAllowlist(
    { page, limit, filter, groupId }: SearchNamesPayload,
    trx?: Knex.Transaction
  ): Promise<SearchImagesResponse> {
    const k = trx || knex;
    const s3 = new AWS.S3();

    const createBaseQuery = () =>
      k('link')
        .innerJoin('resource', 'link.obj_uuid', 'resource.uuid')
        .innerJoin('text', 'text.uuid', 'link.reference_uuid')
        .where('resource.container', 'oare-image-bucket')
        .andWhere('text.display_name', 'like', `%${filter}%`)
        .whereIn(
          'resource.uuid',
          k('public_denylist').select('uuid').where('type', 'img')
        )
        .whereNotIn(
          'resource.uuid',
          k('group_allowlist')
            .select('uuid')
            .where('group_id', groupId)
            .andWhere('type', 'img')
        );

    const totalNum = await createBaseQuery()
      .count({
        count: 'text.display_name',
      })
      .first();

    const totalCount = totalNum ? Number(totalNum.count) : 0;

    const imgUuidsAndLinks: {
      uuid: string;
      link: string;
    }[] = await createBaseQuery()
      .select('resource.uuid', 'resource.link')
      .limit(limit)
      .offset((page - 1) * limit);

    const textNames = await Promise.all(
      imgUuidsAndLinks.map(el =>
        k('text')
          .select('display_name')
          .whereIn(
            'uuid',
            k('link').select('reference_uuid').where('obj_uuid', el.uuid)
          )
          .first()
      )
    );

    const signedUrls = await Promise.all(
      imgUuidsAndLinks.map(el => {
        const params = {
          Bucket: 'oare-image-bucket',
          Key: el.link,
        };
        return s3.getSignedUrlPromise('getObject', params);
      })
    );

    const result: SearchImagesResultRow[] = signedUrls.map((element, idx) => {
      const imageInfo = {
        uuid: imgUuidsAndLinks[idx].uuid,
        name: textNames[idx].display_name,
        imgUrl: element,
      };
      return imageInfo;
    });

    return {
      items: result,
      count: totalCount,
    };
  }

  /**
   * Checks if a collection is in the allowlist for a user
   * @param collectionUuid The UUID of the collection
   * @param userUuid The UUID of the user
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating if the collection is in the allowlist
   */
  async collectionIsInAllowlist(
    collectionUuid: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const UserGroupDao = sl.get('UserGroupDao');

    const groups = await UserGroupDao.getGroupsOfUser(userUuid, trx);

    const collectionAllowlist = (
      await Promise.all(
        groups.map(groupId =>
          this.getGroupAllowlist(groupId, 'collection', trx)
        )
      )
    ).flat();

    if (collectionAllowlist.includes(collectionUuid)) {
      return true;
    }
    return false;
  }

  /**
   * Determines if there is an association between a group and an allowlist item
   * @param uuid The UUID of the allowlist item
   * @param groupId The ID of the group
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating if there is an association
   */
  async containsAssociation(
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
