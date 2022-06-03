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

  async getAllCollections(
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knexRead();
    const CollectionTextUtils = sl.get('CollectionTextUtils');
    const user = userUuid ? await UserDao.getUserByUuid(userUuid, trx) : null;
    const isAdmin = user ? user.isAdmin : false;

    const collectionRows: Array<{ uuid: string }> = await k('collection')
      .select('collection.uuid')
      .orderBy('collection.name')
      .modify(qb => {
        if (!isAdmin) {
          qb.innerJoin(
            'hierarchy',
            'hierarchy.object_uuid',
            'collection.uuid'
          ).andWhere('hierarchy.published', true);
        }
      });

    const collectionUuids = collectionRows.map(({ uuid }) => uuid);

    const collectionsViewable = await Promise.all(
      collectionUuids.map(uuid =>
        CollectionTextUtils.canViewCollection(uuid, userUuid, trx)
      )
    );

    return collectionUuids.filter((_, index) => collectionsViewable[index]);
  }
}

export default new CollectionDao();
