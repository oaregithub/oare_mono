import { knexRead, knexWrite } from '@/connection';
import {
  ItemPropertyRow,
  Pagination,
  InsertItemPropertyRow,
  ImageResourcePropertyDetails,
} from '@oare/types';
import { Knex } from 'knex';

export interface GetItemPropertiesOptions {
  abbreviation?: boolean;
  referenceUuid?: string;
}

class ItemPropertiesDao {
  private getTextsOfPersonBaseQuery(
    personUuid: string,
    pagination?: Pagination,
    trx?: Knex.Transaction
  ) {
    const k = trx || knexRead();
    return k('item_properties')
      .leftJoin(
        'text_discourse',
        'text_discourse.uuid',
        'item_properties.reference_uuid'
      )
      .innerJoin('text', 'text.uuid', 'text_discourse.text_uuid')
      .where('item_properties.object_uuid', personUuid)
      .modify(qb => {
        if (pagination) {
          qb.limit(pagination.limit);
          qb.offset((pagination.page - 1) * pagination.limit);
          if (pagination.filter) {
            qb.andWhere('text.name', 'like', `%${pagination.filter}%`);
          }
        }
      });
  }

  async getTextsOfPersonCount(
    personUuid: string,
    trx?: Knex.Transaction
  ): Promise<number> {
    const textsOfPeopleCount = await this.getTextsOfPersonBaseQuery(
      personUuid,
      undefined,
      trx
    )
      .count({ count: 'text_discourse.text_uuid' })
      .first();
    return textsOfPeopleCount ? Number(textsOfPeopleCount.count) : 0;
  }

  async getUniqueReferenceUuidOfPerson(
    personUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knexRead();
    const referenceUuids = await k('item_properties')
      .distinct('item_properties.reference_uuid AS referenceUuid')
      .where('item_properties.object_uuid', personUuid);

    return referenceUuids.map(item => item.referenceUuid);
  }

  async addProperty(
    property: InsertItemPropertyRow,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    await k('item_properties').insert({
      uuid: property.uuid,
      reference_uuid: property.referenceUuid,
      parent_uuid: property.parentUuid,
      level: property.level,
      variable_uuid: property.variableUuid,
      value_uuid: property.valueUuid,
      object_uuid: property.objectUuid,
      value: property.value,
    });
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
        'ip.value as value,'
      )
      .innerJoin('variable', 'variable.uuid', 'ip.variable_uuid')
      .innerJoin('value', 'value.uuid', 'ip.value_uuid')
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
