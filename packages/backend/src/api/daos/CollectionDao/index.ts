import knex from '@/connection';
import { Collection } from '@oare/types';

class CollectionDao {
  async getCollectionByUuid(
    collectionUuid: string
  ): Promise<Collection | null> {
    const collection = await knex('collection')
      .select('uuid', 'name')
      .where('uuid', collectionUuid)
      .first();
    return collection || null;
  }
}

export default new CollectionDao();
