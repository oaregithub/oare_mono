import { PublicBlacklistPayloadItem, Text } from '@oare/types';
import knex from '@/connection';
import Knex from 'knex';
import AliasDao from '../AliasDao';

class PublicBlacklistDao {
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
}

export default new PublicBlacklistDao();
