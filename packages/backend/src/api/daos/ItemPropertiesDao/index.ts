import { knexRead, knexWrite } from '@/connection';
import {
  ItemPropertyRow,
  InsertItemPropertyRow,
  ImageResourcePropertyDetails,
} from '@oare/types';
import { Knex } from 'knex';

export interface GetItemPropertiesOptions {
  abbreviation?: boolean;
  referenceUuid?: string;
}

class ItemPropertiesDao {
  async addProperties(
    properties: InsertItemPropertyRow[],
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    const itemPropertyRowLevels = [
      ...new Set(properties.map(row => row.level)),
    ];
    const rowsByLevel: InsertItemPropertyRow[][] = itemPropertyRowLevels.map(
      level => properties.filter(row => row.level === level)
    );

    for (let i = 0; i < rowsByLevel.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(
        rowsByLevel[i].map(row =>
          k('item_properties').insert({
            uuid: row.uuid,
            reference_uuid: row.referenceUuid,
            parent_uuid: row.parentUuid,
            level: row.level,
            variable_uuid: row.variableUuid,
            value_uuid: row.valueUuid,
            object_uuid: row.objectUuid,
            value: row.value,
          })
        )
      );
    }
  }

  async getPropertiesByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<ItemPropertyRow[]> {
    const k = trx || knexRead();
    const rows: ItemPropertyRow[] = await k('item_properties as ip')
      .select(
        'ip.uuid',
        'ip.reference_uuid as referenceUuid',
        'ip.parent_uuid as parentUuid',
        'ip.level',
        'ip.variable_uuid as variableUuid',
        'variable.name as variableName',
        'variable.abbreviation as varAbbreviation',
        'ip.value_uuid as valueUuid',
        'value.name as valueName',
        'value.abbreviation as valAbbreviation',
        'ip.object_uuid as objectUuid',
        'ip.value as value'
      )
      .leftJoin('variable', 'variable.uuid', 'ip.variable_uuid')
      .leftJoin('value', 'value.uuid', 'ip.value_uuid')
      .where('ip.reference_uuid', referenceUuid);
    return rows;
  }

  async deletePropertiesByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    const relevantRows: {
      uuid: string;
      level: number | null;
    }[] = await k('item_properties')
      .select('uuid', 'level')
      .where('reference_uuid', referenceUuid);

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
        .where('reference_uuid', referenceUuid)
        .andWhere('level', levels[i]);
    }
  }

  async getObjectUuidsByReferenceAndVariable(
    referenceUuid: string,
    variableUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knexRead();
    const objUuids: string[] = await k('item_properties')
      .pluck('object_uuid')
      .where('variable_uuid', variableUuid)
      .where('reference_uuid', referenceUuid);

    return objUuids;
  }

  async getImagePropertyDetails(
    resourceUuid: string,
    trx?: Knex.Transaction
  ): Promise<ImageResourcePropertyDetails> {
    const k = trx || knexRead();
    const sides: string[] = await k('item_properties')
      .pluck('value.name')
      .leftJoin('value', 'value.uuid', 'item_properties.value_uuid')
      .where('reference_uuid', resourceUuid)
      .andWhere('variable_uuid', '0600c503-7885-11ec-bcc3-0282f921eac9'); // Side Variable UUID

    const views: string[] = await k('item_properties')
      .pluck('value.name')
      .leftJoin('value', 'value.uuid', 'item_properties.value_uuid')
      .where('reference_uuid', resourceUuid)
      .andWhere('variable_uuid', '87126737-7885-11ec-bcc3-0282f921eac9'); // View Variable UUID

    return {
      side: sides.length > 0 ? sides.join(', ') : null,
      view: views.length > 0 ? views.join(', ') : null,
    };
  }
}

export default new ItemPropertiesDao();
