import { Text } from '@oare/types';
import knex from '@/connection';
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
}

export default new PublicBlacklistDao();
