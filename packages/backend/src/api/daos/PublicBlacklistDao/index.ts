import {
  PublicBlacklistPayloadItem,
  Text,
  CollectionListItem,
} from '@oare/types';
import knex from '@/connection';
import Knex from 'knex';
import AliasDao from '../AliasDao';

class PublicBlacklistDao {
  async getBlacklistedTexts(): Promise<Text[]> {
    const results: Text[] = await knex('public_blacklist')
      .select('public_blacklist.uuid')
      .where('public_blacklist.type', 'text');

    const textNames = await Promise.all(
      results.map(text => AliasDao.textAliasNames(text.uuid))
    );

    return results.map((item, index) => ({
      ...item,
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

  async getBlacklistedCollections(): Promise<CollectionListItem[]> {
    const blacklistCollections = await knex('public_blacklist')
      .select('uuid')
      .where('type', 'collection');
    const collectionNames = await Promise.all(
      blacklistCollections.map(collection =>
        AliasDao.textAliasNames(collection.uuid)
      )
    );
    return blacklistCollections.map((collection, index) => ({
      name: collectionNames[index],
      uuid: collection.uuid,
    }));
  }
}

export default new PublicBlacklistDao();
