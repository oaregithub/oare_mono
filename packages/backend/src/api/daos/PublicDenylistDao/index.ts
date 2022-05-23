import { knexRead, knexWrite } from '@/connection';
import sl from '@/serviceLocator';
import AWS from 'aws-sdk';

class PublicDenylistDao {
  async getDenylistTextUuids(): Promise<string[]> {
    const rows: Array<{ uuid: string }> = await knexRead()('public_denylist')
      .select('uuid')
      .where('type', 'text');

    return rows.map(({ uuid }) => uuid);
  }

  async getDenylistImageUuids(): Promise<string[]> {
    const rows: Array<{ uuid: string }> = await knexRead()('public_denylist')
      .select('uuid')
      .where('type', 'img');

    return rows.map(({ uuid }) => uuid);
  }

  async getDenylistImagesWithTexts(): Promise<
    { uuid: string; url: string; text: string }[]
  > {
    const s3 = new AWS.S3();
    let signedUrls: string[] = [];
    let imgUUIDs: string[] = [];
    let texts: string[] = [];
    let text: string[] = [];

    try {
      imgUUIDs = await knexRead()('public_denylist')
        .pluck('uuid')
        .where('type', 'img');

      for (let j = 0; j < imgUUIDs.length; j++) {
        text = await knexRead()('text')
          .pluck('display_name')
          .where(
            'uuid',
            knexRead()('link')
              .select('reference_uuid')
              .where('obj_uuid', imgUUIDs[j])
          );
        texts.push(text[0]);
      }

      const resourceLinks: string[] = await knexRead()('resource')
        .pluck('link')
        .whereIn(
          'uuid',
          knexRead()('public_denylist').select('uuid').where('type', 'img')
        )
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
    } catch (err) {
      const ErrorsDao = sl.get('ErrorsDao');
      await ErrorsDao.logError({
        userUuid: null,
        stacktrace: (err as Error).stack || null,
        status: 'In Progress',
        description: 'Error retrieving S3 photos',
      });
    }

    let result: { uuid: string; url: string; text: string }[] = [];

    for (let i = 0; i < signedUrls.length; i++) {
      result.push({ uuid: imgUUIDs[i], url: signedUrls[i], text: texts[i] });
    }

    return result;
  }

  async getDenylistCollectionUuids(): Promise<string[]> {
    const rows: Array<{ uuid: string }> = await knexRead()('public_denylist')
      .select('uuid')
      .where('type', 'collection');

    return rows.map(({ uuid }) => uuid);
  }

  async addItemsToDenylist(
    uuids: string[],
    type: 'text' | 'collection' | 'img'
  ): Promise<void> {
    const insertRows = uuids.map(uuid => ({
      uuid,
      type,
    }));
    await knexWrite()('public_denylist').insert(insertRows);
  }

  async removeItemFromDenylist(uuid: string): Promise<void> {
    await knexWrite()('public_denylist').where({ uuid }).del();
  }

  async textIsPubliclyViewable(textUuid: string): Promise<boolean> {
    const CollectionDao = sl.get('CollectionDao');
    const PDDao = sl.get('PublicDenylistDao');

    const textDenylist = await PDDao.getDenylistTextUuids();
    const collectionDenylist = await PDDao.getDenylistCollectionUuids();

    const collectionUuidOfText = await CollectionDao.getTextCollectionUuid(
      textUuid
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
