import knex from '@/connection';
import { ItemPropertyRow, ItemProperty } from '@oare/types';
import { Knex } from 'knex';
import sl from '@/serviceLocator';

class ItemPropertiesDao {
  /**
   * Inserts a single item property row.
   * @param row The item property row to insert.
   * @param trx Knex Transaction. Optional.
   */
  private async insertItemPropertyRow(
    row: ItemPropertyRow,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('item_properties').insert({
      uuid: row.uuid,
      reference_uuid: row.referenceUuid,
      parent_uuid: row.parentUuid,
      level: row.level,
      variable_uuid: row.variableUuid,
      value_uuid: row.valueUuid,
      object_uuid: row.objectUuid,
      value: row.value,
    });
  }

  /**
   * Inserts an arary of item property rows. It splits the rows by level to prevent foreign key constraint errors.
   * @param properties Array of item property rows to insert.
   * @param trx Knex Transaction. Optional.
   */
  public async insertItemPropertyRows(
    properties: ItemPropertyRow[],
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    // Split by levels to prevent FK constraint errors
    const itemPropertyRowLevels = [
      ...new Set(properties.map(row => row.level)),
    ];
    const rowsByLevel: ItemPropertyRow[][] = itemPropertyRowLevels.map(level =>
      properties.filter(row => row.level === level)
    );

    for (let i = 0; i < rowsByLevel.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(
        rowsByLevel[i].map(row => this.insertItemPropertyRow(row, trx))
      );
    }
  }

  /**
   * Deletes all item property rows for a given reference UUID and object UUID.
   * @param referenceUuid The reference UUID of the item properties to delete.
   * @param objectUuid The object UUID of the item properties to delete.
   * @param trx Knex Transaction. Optional.
   */
  public async deleteItemPropertyRowsByReferenceUuidAndObjectUuid(
    referenceUuid: string,
    objectUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('item_properties')
      .where({ reference_uuid: referenceUuid, object_uuid: objectUuid })
      .del();
  }

  /**
   * Deletes all item property rows for a given reference UUID. It splits the rows by level to prevent foreign key constraint errors.
   * @param referenceUuid The reference UUID of the item properties to delete.
   * @param trx Knex Transaction. Optional.
   */
  public async deleteItemPropertyRowsByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    const relevantUuids = await this.getItemPropertyUuidsByReferenceUuid(
      referenceUuid,
      trx
    );
    const relevantRows = await Promise.all(
      relevantUuids.map(uuid => this.getItemPropertyRowByUuid(uuid, trx))
    );

    // Split by levels to prevent FK constraint errors
    const levels = [...new Set(relevantRows.map(row => row.level))]
      .sort()
      .sort((a, _) => {
        if (a === null) {
          return -1;
        }
        return 0;
      })
      .reverse();

    for (let i = 0; i < levels.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await k('item_properties')
        .del()
        .where({ reference_uuid: referenceUuid, level: levels[i] });
    }
  }

  /**
   * Gets referring location for a given citation. Returns null if no referring location is found.
   * @param variableUuid The variable UUID of type of referring locatin you want to retrieve.
   * @param textUuid The text UUID of the citation you want to retrieve the referring location for. This is the reference UUID of the item property.
   * @param bibliographyUuid The bibliography UUID of the citation you want to retrieve the referring location for. This is the object UUID of the item property.
   * @param trx Knex Transaction. Optional.
   * @returns The referring location or null if no referring location is found.
   */
  public async getCitationReferringLocation(
    variableUuid: string,
    textUuid: string,
    bibliographyUuid: string,
    trx?: Knex.Transaction
  ): Promise<string | null> {
    const k = trx || knex;

    const referringLocation: string | null = await k('item_properties as ip')
      .leftJoin('item_properties as ip2', 'ip.parent_uuid', 'ip2.parent_uuid')
      .leftJoin('item_properties as ip3', 'ip2.uuid', 'ip3.parent_uuid')
      .where('ip3.variable_uuid', variableUuid)
      .andWhere('ip3.reference_uuid', textUuid)
      .andWhere('ip.object_uuid', bibliographyUuid)
      .select('ip3.value')
      .first()
      .then(row => (row ? row.value : null));

    return referringLocation;
  }

  /**
   * Retrieves a single item property row by UUID.
   * @param uuid The UUID of the item property row to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A single item property row.
   * @throws Error if no item property row is found.
   */
  private async getItemPropertyRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<ItemPropertyRow> {
    const k = trx || knex;

    const row: ItemPropertyRow | undefined = await k('item_properties')
      .select(
        'uuid',
        'reference_uuid as referenceUuid',
        'parent_uuid as parentUuid',
        'level',
        'variable_uuid as variableUuid',
        'value_uuid as valueUuid',
        'object_uuid as objectUuid',
        'value'
      )
      .where({ uuid })
      .first();

    if (!row) {
      throw new Error(`ItemPropertyRow with UUID ${uuid} not found.`);
    }

    return row;
  }

  /**
   * Constructs an item property object for a given UUID.
   * @param uuid The UUID of the item property to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A single item property object.
   * @throws Error if no item property is found.
   */
  private async getItemPropertyByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<ItemProperty> {
    const HierarchyDao = sl.get('HierarchyDao');

    const itemPropertyRow = await this.getItemPropertyRowByUuid(uuid, trx);

    const variableRow = await HierarchyDao.getVariableRowByUuid(
      itemPropertyRow.variableUuid,
      trx
    );

    const valueRow = itemPropertyRow.valueUuid
      ? await HierarchyDao.getValueRowByUuid(itemPropertyRow.valueUuid, trx)
      : null;

    const itemProperty: ItemProperty = {
      ...itemPropertyRow,
      variableRow,
      valueRow,
    };

    return itemProperty;
  }

  /**
   * Retrieves a list of item property UUIDs for a given reference UUID.
   * @param referenceUuid The reference UUID of the item properties to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Array of item property UUIDs.
   */
  private async getItemPropertyUuidsByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const uuids: string[] = await k('item_properties')
      .pluck('uuid')
      .where({ reference_uuid: referenceUuid });

    return uuids;
  }

  /**
   * Retrieves a list of item properties objects for a given reference UUID.
   * @param referenceUuid The reference UUID of the item properties to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Array of item property objects.
   * @throws Error if one or more item properties are not found.
   */
  public async getItemPropertiesByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<ItemProperty[]> {
    const uuids = await this.getItemPropertyUuidsByReferenceUuid(
      referenceUuid,
      trx
    );

    const itemProperties: ItemProperty[] = await Promise.all(
      uuids.map(uuid => this.getItemPropertyByUuid(uuid, trx))
    );

    return itemProperties;
  }
}

/**
 * ItemPropertiesDao instance as a singleton.
 */
export default new ItemPropertiesDao();
