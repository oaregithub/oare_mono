import knex from '@/connection';
import { ItemProperty, Pagination, SpellingOccurrenceRow } from '@oare/types';

export interface ItemPropertyRow extends ItemProperty {
  referenceUuid: string;
}

export interface GetItemPropertiesOptions {
  abbreviation?: boolean;
  referenceUuid?: string;
}

export interface ItemPropertyShortRow {
  uuid: string;
  referenceUuid: string;
  valueUuid: string | null;
}

class ItemProperties {
  async getProperties(
    referenceType: string,
    { abbreviation, referenceUuid }: GetItemPropertiesOptions = {}
  ): Promise<ItemPropertyRow[]> {
    let query = knex('item_properties AS ip')
      .select('ip.uuid', 'ip.reference_uuid AS referenceUuid', 'a2.name')
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

  async getItemPropertyRowsByAliasName(
    aliasName: string
  ): Promise<ItemPropertyShortRow[]> {
    const itemProperties: ItemPropertyShortRow[] = await knex(
      'item_properties AS ip'
    )
      .select(
        'ip.uuid',
        'ip.reference_uuid AS referenceUuid',
        'ip.value_uuid AS valueUuid'
      )
      .innerJoin('alias AS a', 'a.reference_uuid', 'ip.variable_uuid')
      .where('a.name', aliasName);
    return itemProperties;
  }

  getTextsOfPersonBaseQuery(personUuid: string, pagination?: Pagination) {
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

  async getTextsOfPerson(
    personUuid: string,
    { limit, page, filter }: Pagination
  ): Promise<SpellingOccurrenceRow[]> {
    const rows: SpellingOccurrenceRow[] = await this.getTextsOfPersonBaseQuery(
      personUuid
    )
      .distinct(
        'text_discourse.uuid AS discourseUuid',
        'name AS textName',
        'text_epigraphy.line',
        'text_discourse.word_on_tablet AS wordOnTablet',
        'text_discourse.text_uuid AS textUuid'
      )
      .innerJoin(
        'text_epigraphy',
        'text_epigraphy.discourse_uuid',
        'text_discourse.uuid'
      )
      .orderBy('text.name')
      .limit(limit)
      .offset((page - 1) * limit)
      .modify(qb => {
        if (filter) {
          qb.andWhere('text.name', 'like', `%${filter}%`);
        }
      });

    return rows;
  }
}

export default new ItemProperties();
