import { knexRead, knexWrite } from '@/connection';
import {
  ItemPropertyRow,
  Pagination,
  InsertItemPropertyRow,
} from '@oare/types';

export interface GetItemPropertiesOptions {
  abbreviation?: boolean;
  referenceUuid?: string;
}

class ItemPropertiesDao {
  private getTextsOfPersonBaseQuery(
    personUuid: string,
    pagination?: Pagination
  ) {
    return knexRead()('item_properties')
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

  async getTextsOfPersonCount(personUuid: string): Promise<number> {
    const textsOfPeopleCount = await this.getTextsOfPersonBaseQuery(personUuid)
      .count({ count: 'text_discourse.text_uuid' })
      .first();
    return textsOfPeopleCount ? Number(textsOfPeopleCount.count) : 0;
  }

  async getUniqueReferenceUuidOfPerson(personUuid: string): Promise<string[]> {
    const referenceUuids = await knexRead()('item_properties')
      .distinct('item_properties.reference_uuid AS referenceUuid')
      .where('item_properties.object_uuid', personUuid);

    return referenceUuids.map(item => item.referenceUuid);
  }

  async addProperty(property: InsertItemPropertyRow): Promise<void> {
    await knexWrite()('item_properties').insert({
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
    referenceUuid: string
  ): Promise<ItemPropertyRow[]> {
    const rows: ItemPropertyRow[] = await knexRead()('item_properties as ip')
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

  async deletePropertiesByReferenceUuid(referenceUuid: string): Promise<void> {
    const relevantRows: {
      uuid: string;
      level: number | null;
    }[] = await knexRead()('item_properties')
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
      await knexWrite()('item_properties')
        .del()
        .where('reference_uuid', referenceUuid)
        .andWhere('level', levels[i]);
    }
  }

  async getVariableObjectByReference(
    referenceUuid: string,
    variableUuid: string
  ) {
    const objUuids: string[] = await knexRead()('item_properties as ip')
      .pluck('ip.object_uuid')
      .where('variable_uuid', variableUuid)
      .where('reference_uuid', referenceUuid);

    return objUuids;
  }
}

export default new ItemPropertiesDao();
