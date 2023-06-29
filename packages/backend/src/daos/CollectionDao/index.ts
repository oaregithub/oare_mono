import knex from '@/connection';
import { CollectionRow, Collection } from '@oare/types';
import { Knex } from 'knex';
import sl from '@/serviceLocator';

// COMPLETE

class CollectionDao {
  /**
   * Retrieves a collection row by its UUID.
   * @param uuid The UUID of the collection row to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Single collection row.
   * @throws Error if no collection row found.
   */
  public async getCollectionRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<CollectionRow> {
    const k = trx || knex;

    const collection: CollectionRow | undefined = await k('collection')
      .select('uuid', 'name')
      .where({ uuid })
      .first();

    if (!collection) {
      throw new Error(`Collection with uuid ${uuid} does not exist`);
    }

    return collection;
  }

  /**
   * Checks if a collection exists.
   * @param uuid The UUID of the collection to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the collection exists.
   */
  public async collectionExists(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const collection = await k('collection').first().where({ uuid });

    return !!collection;
  }

  /**
   * Retrieves the UUID of the collection that contains the given text.
   * @param textUuid The UUID of the text whose containing collection to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns UUID of the collection that contains the given text.
   * @throws Error if no collection found.
   */
  public async getCollectionUuidByTextUuid(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knex;

    const row: { uuid: string } | undefined = await k('collection')
      .select('collection.uuid')
      .innerJoin('hierarchy', 'hierarchy.obj_parent_uuid', 'collection.uuid')
      .where('hierarchy.object_uuid', textUuid)
      .first();

    if (!row) {
      throw new Error(
        `Collection containing text with uuid ${textUuid} does not exist`
      );
    }

    return row.uuid;
  }

  /**
   * Retreives list of all collection UUIDs.
   * @param trx Knex Transaction. Optional.
   * @returns Array of collection UUIDs.
   */
  public async getAllCollectionUuids(
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const collectionUuids: string[] = await k('collection')
      .pluck('uuid')
      .orderBy('name');

    return collectionUuids;
  }

  /**
   * Constructs a collection object for the given collection UUID.
   * @param uuid The UUID of the collection to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Collection object.
   * @throws Error if no collection found or if no hierarchy row found for the collection.
   */
  public async getCollectionByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<Collection> {
    const HierarchyDao = sl.get('HierarchyDao');
    const TextDao = sl.get('TextDao');

    const collectionRow = await this.getCollectionRowByUuid(uuid, trx);

    const hierarchyRows = await HierarchyDao.getHierarchyRowsByObjectUuidAndType(
      uuid,
      'collection',
      trx
    );
    const hierarchyRow = hierarchyRows.length > 0 ? hierarchyRows[0] : null;
    if (!hierarchyRow) {
      throw new Error(
        `No hierarchy row found for collection with uuid ${uuid}`
      );
    }

    const textUuids = await HierarchyDao.getTextUuidsByCollectionUuid(
      uuid,
      trx
    );
    const texts = await Promise.all(
      textUuids.map(textUuid => TextDao.getTextByUuid(textUuid, trx))
    );

    const collection: Collection = {
      ...collectionRow,
      hierarchy: hierarchyRow,
      texts,
    };

    return collection;
  }
}

/**
 * CollectionDao instance as a singleton.
 */
export default new CollectionDao();
