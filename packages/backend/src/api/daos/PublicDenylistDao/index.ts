import knex from '@/connection';
import sl from '@/serviceLocator';
import {
  SearchImagesResponse,
  SearchImagesResultRow,
  SearchNamesPayload,
} from '@oare/types';
import AWS from 'aws-sdk';
import { Knex } from 'knex';

class PublicDenylistDao {
  async getDenylistTextUuids(trx?: Knex.Transaction): Promise<string[]> {
    const k = trx || knex;
    const QuarantineTextDao = sl.get('QuarantineTextDao');
    const quarantinedTexts = await QuarantineTextDao.getQuarantinedTextUuids(
      trx
    );

    const rows: Array<{ uuid: string }> = await k('public_denylist')
      .select('uuid')
      .where('type', 'text')
      .whereNotIn('uuid', quarantinedTexts);

    return rows.map(({ uuid }) => uuid);
  }

  async getDenylistImageUuids(trx?: Knex.Transaction): Promise<string[]> {
    const k = trx || knex;
    const rows: Array<{ uuid: string }> = await k('public_denylist')
      .select('uuid')
      .where('type', 'img');

    return rows.map(({ uuid }) => uuid);
  }

  async getDenylistImagesWithTexts(
    trx?: Knex.Transaction
  ): Promise<{ uuid: string; url: string; text: string }[]> {
    const promises = [];
    const s3 = new AWS.S3();
    const k = trx || knex;

    const imgUUIDs: string[] = await k('public_denylist')
      .pluck('uuid')
      .where('type', 'img');

    const texts = await Promise.all(
      imgUUIDs.map(uuid =>
        k('text')
          .select('display_name')
          .where(
            'uuid',
            k('link').select('reference_uuid').where('obj_uuid', uuid)
          )
          .first()
      )
    );

    const resourceLinks: string[] = await k('resource')
      .pluck('link')
      .whereIn('uuid', k('public_denylist').select('uuid').where('type', 'img'))
      .where('type', 'img')
      .andWhere('container', 'oare-image-bucket');

    const signedUrls: string[] = await Promise.all(
      resourceLinks.map(key => {
        const params = {
          Bucket: 'oare-image-bucket',
          Key: key,
        };
        return s3.getSignedUrlPromise('getObject', params);
      })
    );

    const result: {
      uuid: string;
      url: string;
      text: string;
    }[] = signedUrls.map((signedUrl, idx) => ({
      uuid: imgUUIDs[idx],
      url: signedUrl,
      text: texts[idx].display_name,
    }));

    return result;
  }

  async getImagesForDenylist(
    { page, limit, filter }: SearchNamesPayload,
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
        .whereNotIn(
          'resource.uuid',
          k('public_denylist').select('uuid').where('type', 'img')
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

  async getDenylistCollectionUuids(trx?: Knex.Transaction): Promise<string[]> {
    const k = trx || knex;
    const rows: Array<{ uuid: string }> = await k('public_denylist')
      .select('uuid')
      .where('type', 'collection');

    return rows.map(({ uuid }) => uuid);
  }

  async addItemsToDenylist(
    uuids: string[],
    type: 'text' | 'collection' | 'img',
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    const insertRows = uuids.map(uuid => ({
      uuid,
      type,
    }));
    await k('public_denylist').insert(insertRows);
  }

  async removeItemFromDenylist(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    await k('public_denylist').where({ uuid }).del();
  }

  async textIsPubliclyViewable(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const CollectionDao = sl.get('CollectionDao');
    const PDDao = sl.get('PublicDenylistDao');

    const textDenylist = await PDDao.getDenylistTextUuids(trx);
    const collectionDenylist = await PDDao.getDenylistCollectionUuids(trx);

    const collectionUuidOfText = await CollectionDao.getTextCollectionUuid(
      textUuid,
      trx
    );

    if (textDenylist.includes(textUuid)) {
      return false;
    }
    if (
      collectionUuidOfText &&
      collectionDenylist.includes(collectionUuidOfText)
    ) {
      return false;
    }
    return true;
  }

  async collectionIsPubliclyViewable(
    collectionUuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const collectionDenylist = await this.getDenylistCollectionUuids(trx);

    if (collectionDenylist.includes(collectionUuid)) {
      return false;
    }
    return true;
  }
}

export default new PublicDenylistDao();
