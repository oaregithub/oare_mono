import knex from '@/connection';
import sl from '@/serviceLocator';
import {
  SearchImagesResponse,
  SearchImagesResultRow,
  SearchNamesPayload,
} from '@oare/types';
import { Knex } from 'knex';
import AWS from 'aws-sdk';

class GroupAllowlistDao {
  async getGroupAllowlist(
    groupId: number,
    type: 'text' | 'img' | 'collection',
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const QuarantineTextDao = sl.get('QuarantineTextDao');
    const quarantinedTexts = await QuarantineTextDao.getQuarantinedTextUuids(
      trx
    );

    const uuids = await k('group_allowlist')
      .pluck('uuid')
      .where('group_id', groupId)
      .andWhere('type', type)
      .whereNotIn('uuid', quarantinedTexts);

    return uuids;
  }

  async addItemsToAllowlist(
    groupId: number,
    uuids: string[],
    type: 'text' | 'img' | 'collection',
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

  async removeItemFromAllowlist(
    groupId: number,
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    await k('group_allowlist')
      .where('group_id', groupId)
      .andWhere({ uuid })
      .del();
  }

  async removeItemFromAllAllowlists(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    await k('group_allowlist').where({ uuid }).del();
  }

  async textIsInAllowlist(
    textUuid: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const CollectionDao = sl.get('CollectionDao');
    const UserGroupDao = sl.get('UserGroupDao');

    const collectionUuid = await CollectionDao.getTextCollectionUuid(
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

  async containsAssociation(
    uuid: string,
    groupId: number,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;
    const containsAssociation = await k('group_allowlist')
      .where({ uuid })
      .andWhere('group_id', groupId)
      .first();

    return !!containsAssociation;
  }
}

export default new GroupAllowlistDao();
