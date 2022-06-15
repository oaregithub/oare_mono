import { knexRead, knexWrite } from '@/connection';
import {
  ItemPropertyRow,
  Pagination,
  InsertItemPropertyRow,
  ParsePropertiesDisplay,
  ParseTreePropertyUuids,
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

  async getParseProperties(): Promise<ParsePropertiesDisplay[]> {
    const partsOfSpeech: string[] = await knexRead()('hierarchy as h')
      .where('h.obj_parent_uuid', '11be11d9-f2e8-e12b-520d-88d7f653b746')
      .distinct('h.object_uuid')
      .then((vals: { object_uuid: string }[]) =>
        vals.map(({ object_uuid }) => object_uuid)
      );
    const childProps: string[] = await knexRead()('item_properties as ip')
      .distinct('ip.value_uuid')
      .join('dictionary_form as df', 'df.uuid', 'ip.reference_uuid')
      .whereNotIn('ip.value_uuid', [
        ...partsOfSpeech,
        '11be11d9-f2e8-e12b-520d-88d7f653b746',
      ])
      .then((vals: { value_uuid: string }[]) =>
        vals.map(({ value_uuid }) => value_uuid)
      );

    const parseProperties: ParsePropertiesDisplay[] = (
      await Promise.all(
        partsOfSpeech.map(async partOfSpeech => {
          const partOfSpeechName: string = (
            await knexRead()('value')
              .select('name')
              .where('uuid', partOfSpeech)
              .first()
          ).name;
          const properties: ParsePropertiesDisplay[] = await Promise.all(
            childProps.map(async otherProp => {
              const propertyName: string = (
                await knexRead()('value')
                  .select('name')
                  .where('uuid', otherProp)
                  .first()
              ).name;
              const sub1 = knexRead()
                .select('df.uuid as uuid')
                .from('item_properties as ip')
                .join('dictionary_form as df', 'df.uuid', 'ip.reference_uuid')
                .where('ip.value_uuid', otherProp);
              const sub2 = knexRead()
                .select('df.uuid as uuid')
                .from('item_properties as ip')
                .join('dictionary_form as df', 'df.uuid', 'ip.reference_uuid')
                .where('ip.value_uuid', partOfSpeech);
              const results: Array<{
                uuid: string;
              }> = await knexRead()(sub1.as('sub1'))
                .join(sub2.as('sub2'), 'sub2.uuid', 'sub1.uuid')
                .select('sub1.uuid as uuid');
              // .select('df.uuid')
              // .join('dictionary_form as df', 'df.uuid', 'ip.reference_uuid')
              // .where('ip.value_uuid', otherProp);

              const returnVal: ParsePropertiesDisplay = {
                partOfSpeech,
                formUuids: results.map(({ uuid }) => uuid),
                display: `${propertyName} - ${partOfSpeechName}`,
                name: propertyName,
              };
              return returnVal;
            })
          );
          return properties;
        })
      )
    ).flat();

    return parseProperties.filter(
      parseProperty => parseProperty.formUuids.length > 0
    );
  }

  async getFormsByProperties(
    parseProperties: ParseTreePropertyUuids[]
  ): Promise<string[]> {
    const subqueries = parseProperties.map(p =>
      knexRead()('hierarchy as h')
        .join('item_properties as ip', 'ip.value_uuid', 'h.object_uuid')
        .where('h.uuid', p.value.uuid)
        .select('ip.reference_uuid as ref_uuid')
    );
    const formUuids: string[] = await knexRead()('dictionary_form as df')
      .distinct('df.uuid')
      .modify(qb => {
        parseProperties.forEach((_p, i) => {
          qb.join(subqueries[i].as(`sub${i}`), `sub${i}.ref_uuid`, 'df.uuid');
        });
      })
      .then((results: { uuid: string }[]) => results.map(({ uuid }) => uuid));
    return formUuids;
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
}

export default new ItemPropertiesDao();
