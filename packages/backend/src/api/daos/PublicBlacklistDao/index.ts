import { PublicBlacklistPayloadItem, Text, CollectionListItem } from '@oare/types';
import knex from '@/connection';
import Knex from 'knex';
import AliasDao from '../AliasDao';

class PublicBlacklistDao {
  async getAllBlacklistedItems(): Promise<Text[]> {
    const publicTexts: Text[] = await this.getPublicTexts();
    const publicCollectionsTexts: Text[] = await this.getTextsFromPublicCollections();
    const blacklist = publicTexts.concat(publicCollectionsTexts);
    return blacklist;
  }

  async getPublicTexts(): Promise<Text[]> {
    const results: Text[] = await knex('public_blacklist')
      .select('public_blacklist.uuid AS text_uuid')
      .where('public_blacklist.type', 'text');

    const textNames = await Promise.all(results.map((text) => AliasDao.displayAliasNames(text.text_uuid)));

    return results.map((item, index) => ({
      ...item,
      name: textNames[index],
      can_write: false,
      can_read: false,
    }));
  }

  async addPublicTexts(
    texts: PublicBlacklistPayloadItem[],
    postAdd?: (trx: Knex.Transaction) => Promise<void>,
  ): Promise<number[]> {
    const ids: number[] = await knex.transaction(async (trx) => {
      const insertIds = await trx('public_blacklist').insert(texts);

      if (postAdd) {
        await postAdd(trx);
      }

      return insertIds;
    });
    return ids;
  }

  async removePublicTexts(uuid: string, postDelete?: (trx: Knex.Transaction) => Promise<void>) {
    await knex.transaction(async (trx) => {
      await trx('public_blacklist').where('uuid', uuid).del();

      if (postDelete) {
        await postDelete(trx);
      }
    });
  }

  async getPublicCollections(): Promise<CollectionListItem[]> {
    const results: CollectionListItem[] = await knex('public_blacklist')
      .select('public_blacklist.uuid')
      .where('public_blacklist.type', 'collection');

    const textNames = await Promise.all(results.map((text) => AliasDao.displayAliasNames(text.uuid)));

    return results.map((item, index) => ({
      uuid: item.uuid,
      name: textNames[index],
    }));
  }

  async getTextsFromPublicCollections(): Promise<Text[]> {
    const collections = await this.getPublicCollections();
    const uuids = collections.map((collection) => collection.uuid);
    const results: Text[] = await knex('hierarchy')
      .select('uuid AS text_uuid')
      .whereIn('parent_uuid', uuids)
      .andWhere('type', 'text');

    const textNames = await Promise.all(results.map((text) => AliasDao.displayAliasNames(text.text_uuid)));

    return results.map((text, index) => ({
      name: textNames[index],
      text_uuid: text.text_uuid,
      can_read: false,
      can_write: false,
    }));
  }
}

export default new PublicBlacklistDao();
