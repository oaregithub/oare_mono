import { knexRead } from '@/connection';
import { Collection } from '@oare/types';
import sl from '@/serviceLocator';
import { Knex } from 'knex';
import UserDao from '../UserDao';

class CollectionDao {
  async getCollectionByUuid(
    collectionUuid: string,
    trx?: Knex.Transaction
  ): Promise<Collection | null> {
    const k = trx || knexRead();
    const collection = await k('collection')
      .select('uuid', 'name')
      .where('uuid', collectionUuid)
      .first();
    return collection || null;
  }

  async getTextCollectionUuid(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<string | null> {
    const k = trx || knexRead();
    const collection: { uuid: string } | null = await k('collection')
      .select('collection.uuid')
      .innerJoin('hierarchy', 'hierarchy.obj_parent_uuid', 'collection.uuid')
      .where('hierarchy.object_uuid', textUuid)
      .first();
    return collection ? collection.uuid : null;
  }

  async getTextCollection(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<Collection | null> {
    const collectionUuid = await this.getTextCollectionUuid(textUuid, trx);
    return collectionUuid
      ? this.getCollectionByUuid(collectionUuid, trx)
      : null;
  }

  async getAllCollections(trx?: Knex.Transaction): Promise<string[]> {
    const k = trx || knexRead();

    const collectionRows: Array<{ uuid: string }> = await k('collection')
      .select('collection.uuid')
      .orderBy('collection.name');

    const collectionUuids = collectionRows.map(({ uuid }) => uuid);

    return collectionUuids;
  }
}

export default new CollectionDao();
