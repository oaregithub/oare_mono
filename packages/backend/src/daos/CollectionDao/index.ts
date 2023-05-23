import knex from '@/connection';
import { CollectionRow, Text, Collection } from '@oare/types';
import { Knex } from 'knex';
import sl from '@/serviceLocator';

class CollectionDao {
  private async getCollectionRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<CollectionRow> {
    const k = trx || knex;

    const collection = await k('collection')
      .select('uuid', 'name')
      .where({ uuid })
      .first();

    if (!collection) {
      throw new Error(`Collection with uuid ${uuid} does not exist`);
    }

    return collection;
  }

  // FIXME can hopefully deprecated once collectionUuid is added to Text object
  public async getCollectionUuidByTextUuid(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<string | null> {
    const k = trx || knex;

    const uuid: string | null = await k('collection')
      .select('collection.uuid')
      .innerJoin('hierarchy', 'hierarchy.obj_parent_uuid', 'collection.uuid')
      .where('hierarchy.object_uuid', textUuid)
      .first()
      .then(row => row.uuid || null);

    return uuid;
  }

  public async getAllCollectionUuids(
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const collectionUuids: string[] = await k('collection')
      .pluck('uuid')
      .orderBy('name');

    return collectionUuids;
  }

  public async getCollectionByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<Collection> {
    const HierarchyDao = sl.get('HierarchyDao');
    const TextDao = sl.get('TextDao');

    const collectionRow = await this.getCollectionRowByUuid(uuid, trx);

    const hierarchyRow = (
      await HierarchyDao.getHierarchyRowsByObjectUuid(uuid, trx)
    )[0];

    const textUuids = await HierarchyDao.getTextUuidsByCollectionUuid(
      uuid,
      trx
    );

    const texts = (
      await Promise.all(
        textUuids.map(textUuid => TextDao.getTextByUuid(textUuid, trx))
      )
    ).filter((text): text is Text => text !== null);

    const collection: Collection = {
      ...collectionRow,
      hierarchy: hierarchyRow,
      texts,
    };

    return collection;
  }
}

export default new CollectionDao();
