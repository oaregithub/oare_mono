import { knexRead, knexWrite } from '@/connection';
import sl from '@/serviceLocator';
import AWS from 'aws-sdk';
import { Knex } from 'knex';

class PublicDenylistDao {
  async getDenylistTextUuids(trx?: Knex.Transaction): Promise<string[]> {
    const k = trx || knexRead();
    const rows: Array<{ uuid: string }> = await k('public_denylist')
      .select('uuid')
      .where('type', 'text');

    return rows.map(({ uuid }) => uuid);
  }

  async getDenylistImageUuids(trx?: Knex.Transaction): Promise<string[]> {
    const k = trx || knexRead();
    const rows: Array<{ uuid: string }> = await k('public_denylist')
      .select('uuid')
      .where('type', 'img');

    return rows.map(({ uuid }) => uuid);
  }

  async getDenylistImagesWithTexts(
    trx?: Knex.Transaction
  ): Promise<{ uuid: string; url: string; text: string }[]> {
    let signedUrls: string[] = [];
    let imgUUIDs: string[] = [];
    let texts: any = [];
    let result: { uuid: string; url: string; text: string }[] = [];
    const promises = [];
    const s3 = new AWS.S3();
    const k = trx || knexRead();

    imgUUIDs = await k('public_denylist').pluck('uuid').where('type', 'img');

    for (let j = 0; j < imgUUIDs.length; j += 1) {
      const text = k('text')
        .pluck('display_name')
        .where(
          'uuid',
          k('link').select('reference_uuid').where('obj_uuid', imgUUIDs[j])
        );
      promises.push(text);
    }

    texts = await Promise.all(promises);

    const resourceLinks: string[] = await k('resource')
      .pluck('link')
      .whereIn('uuid', k('public_denylist').select('uuid').where('type', 'img'))
      .where('type', 'img')
      .andWhere('container', 'oare-image-bucket');

    signedUrls = await Promise.all(
      resourceLinks.map(key => {
        const params = {
          Bucket: 'oare-image-bucket',
          Key: key,
        };
        return s3.getSignedUrlPromise('getObject', params);
      })
    );

    result = signedUrls.map((signedUrl, idx) => ({
      uuid: imgUUIDs[idx],
      url: signedUrl,
      text: texts[idx][0],
    }));

    return result;
  }

  async getDenylistCollectionUuids(trx?: Knex.Transaction): Promise<string[]> {
    const k = trx || knexRead();
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
    const k = trx || knexWrite();
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
    const k = trx || knexWrite();
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

  async collectionIsPubliclyViewable(collectionUuid: string): Promise<boolean> {
    const collectionDenylist = await this.getDenylistCollectionUuids();

    if (collectionDenylist.includes(collectionUuid)) {
      return false;
    }
    return true;
  }
}

export default new PublicDenylistDao();
