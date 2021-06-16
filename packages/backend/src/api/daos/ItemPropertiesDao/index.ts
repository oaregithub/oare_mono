import knex from '@/connection';
import {
  ItemPropertyRow,
  Pagination,
  InsertItemPropertyRow,
} from '@oare/types';

export interface GetItemPropertiesOptions {
  abbreviation?: boolean;
  referenceUuid?: string;
}

class ItemProperties {
  async getProperties(
    referenceType: string,
    { abbreviation, referenceUuid }: GetItemPropertiesOptions = {}
  ): Promise<ItemPropertyRow[]> {
    let query = knex('item_properties AS ip')
      .select(
        'ip.uuid',
        'ip.reference_uuid AS referenceUuid',
        'a2.name',
        'ip.value_uuid as valueUuid'
      )
      .innerJoin('alias AS a1', 'a1.reference_uuid', 'ip.variable_uuid')
      .innerJoin('alias AS a2', 'a2.reference_uuid', 'ip.value_uuid')
      .where('a1.name', referenceType);

    if (abbreviation) {
      query = query.andWhere('a2.type', 'abbreviation');
    }

    if (referenceUuid) {
      query = query.andWhere('ip.reference_uuid', referenceUuid);
    }

    return query;
  }

  private getTextsOfPersonBaseQuery(
    personUuid: string,
    pagination?: Pagination
  ) {
    return knex('item_properties')
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
    const referenceUuids = await knex('item_properties')
      .distinct('item_properties.reference_uuid AS referenceUuid')
      .where('item_properties.object_uuid', personUuid);

    return referenceUuids.map(item => item.referenceUuid);
  }

  async addProperty(property: InsertItemPropertyRow): Promise<void> {
    await knex('item_properties').insert({
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
}

export default new ItemProperties();
