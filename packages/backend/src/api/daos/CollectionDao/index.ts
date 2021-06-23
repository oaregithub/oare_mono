import knex from '@/connection';
import { Collection } from '@oare/types';
import UserDao from '../UserDao';
import CollectionGroupDao from '../CollectionGroupDao';

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

  async getTextCollectionUuid(textUuid: string): Promise<string | null> {
    const collection: { uuid: string } | null = await knex('collection')
      .select('collection.uuid')
      .innerJoin('hierarchy', 'hierarchy.obj_parent_uuid', 'collection.uuid')
      .where('hierarchy.object_uuid', textUuid)
      .first();
    return collection ? collection.uuid : null;
  }

  async getTextCollection(textUuid: string): Promise<Collection | null> {
    const collectionUuid = await this.getTextCollectionUuid(textUuid);
    return collectionUuid ? this.getCollectionByUuid(collectionUuid) : null;
  }

  async getAllCollections(userUuid: string | null): Promise<string[]> {
    const user = userUuid ? await UserDao.getUserByUuid(userUuid) : null;
    const isAdmin = user ? user.isAdmin : false;

    const collectionRows: Array<{ uuid: string }> = await knex('collection')
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
        CollectionGroupDao.canViewCollection(uuid, userUuid)
      )
    );

    return collectionUuids.filter((_, index) => collectionsViewable[index]);
  }
}

export default new CollectionDao();
