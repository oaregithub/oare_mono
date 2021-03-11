import { PublicBlacklistPayloadItem, Text, Collection } from '@oare/types';
import knex from '@/connection';
import Knex from 'knex';
import TextDao from '../TextDao';
import CollectionDao from '../CollectionDao';

class PublicBlacklistDao {
  async getBlacklistedTextUuids(): Promise<string[]> {
    const rows: Array<{ uuid: string }> = await knex('public_blacklist')
      .select('uuid')
      .where('type', 'text');

    return rows.map(({ uuid }) => uuid);
  }

  async getBlacklistedTexts(): Promise<Text[]> {
    const textUuids = await this.getBlacklistedTextUuids();

    const textNames = (
      await Promise.all(textUuids.map(uuid => TextDao.getTextByUuid(uuid)))
    ).map(text => (text ? text.name : ''));

    return textUuids.map((uuid, index) => ({
      uuid,
      name: textNames[index],
      canWrite: false,
      canRead: false,
    }));
  }

  async addPublicTexts(
    texts: PublicBlacklistPayloadItem[],
    postAdd?: (trx: Knex.Transaction) => Promise<void>
  ): Promise<number[]> {
    const ids: number[] = await knex.transaction(async trx => {
      const insertIds = await trx('public_blacklist').insert(texts);

      if (postAdd) {
        await postAdd(trx);
      }

      return insertIds;
    });
    return ids;
  }

  async removePublicTexts(
    uuid: string,
    postDelete?: (trx: Knex.Transaction) => Promise<void>
  ) {
    await knex.transaction(async trx => {
      await trx('public_blacklist').where('uuid', uuid).del();

      if (postDelete) {
        await postDelete(trx);
      }
    });
  }

  async getBlacklistedCollectionUuids(): Promise<string[]> {
    const collectionUuids: Array<{ uuid: string }> = await knex(
      'public_blacklist'
    )
      .select('uuid')
      .where('type', 'collection');

    return collectionUuids.map(({ uuid }) => uuid);
  }

  async getBlacklistedCollections(): Promise<Collection[]> {
    const collectionUuids = await this.getBlacklistedCollectionUuids();

    const collectionNames = (
      await Promise.all(
        collectionUuids.map(uuid => CollectionDao.getCollectionByUuid(uuid))
      )
    ).map(collection => (collection ? collection.name : ''));

    return collectionUuids.map((uuid, index) => ({
      name: collectionNames[index],
      uuid,
    }));
  }

  async isTextPubliclyViewable(textUuid: string): Promise<boolean> {
    const textUuids = await this.getBlacklistedTextUuids();
    if (textUuids.includes(textUuid)) {
      return true;
    }

    const collectionUuids = await this.getBlacklistedCollectionUuids();
    const textCollectionUuid = await CollectionDao.getTextCollectionUuid(
      textUuid
    );

    return collectionUuids.includes(textCollectionUuid || '');
  }
}

export default new PublicBlacklistDao();
