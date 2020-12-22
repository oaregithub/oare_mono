import knex from '@/connection';
import { ItemProperty } from '@oare/types';

export interface ItemPropertyRow extends ItemProperty {
  referenceUuid: string;
}

export interface GetItemPropertiesOptions {
  abbreviation?: boolean;
  referenceUuid?: string;
}

class ItemProperties {
  async getProperties(
    referenceType: string,
    { abbreviation, referenceUuid }: GetItemPropertiesOptions = {},
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
}

export default new ItemProperties();
