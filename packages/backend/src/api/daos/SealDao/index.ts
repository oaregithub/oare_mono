import { knexRead } from '@/connection';
import { SealNameUuid, SealProperty } from '@oare/types';
import { Knex } from 'knex';

class SealDao {
  async getSeals(trx?: Knex): Promise<SealNameUuid[]> {
    const k = trx || knexRead();
    const seals: SealNameUuid[] = await k('alias as a')
      .join('spatial_unit as su', 'su.uuid', 'a.reference_uuid')
      .where('su.tree_abb', 'Seal_Cat')
      .groupBy('su.uuid')
      .select('su.uuid as uuid', 'a.name as name');

    return seals;
  }

  async getSealByUuid(sealUuid: string, trx?: Knex): Promise<SealNameUuid> {
    const k = trx || knexRead();
    const seals: SealNameUuid = await k('alias as a')
      .join('spatial_unit as su', 'su.uuid', 'a.reference_uuid')
      .where('su.tree_abb', 'Seal_Cat')
      .andWhere('su.uuid', sealUuid)
      .groupBy('su.uuid')
      .select('su.uuid as uuid', 'a.name as name')
      .first();

    return seals;
  }

  async getImagesBySealUuid(sealUuid: string, trx?: Knex): Promise<string[]> {
    const k = trx || knexRead();

    const imageLinks: string[] = await k('spatial_unit as su')
      .join('text_markup as tm', 'tm.obj_uuid', 'su.uuid')
      .join('link as l', 'l.reference_uuid', 'tm.reference_uuid')
      .join('resource as re', 'l.obj_uuid', 're.uuid')
      .where('su.tree_abb', 'Seal_Cat')
      .andWhere('su.uuid', sealUuid)
      .pluck('re.link');

    return imageLinks;
  }

  async getSealImpressionCountBySealUuid(
    sealUuid: string,
    trx?: Knex
  ): Promise<number> {
    const k = trx || knexRead();

    const count = await k('spatial_unit as su')
      .leftJoin('item_properties as ip', 'ip.object_uuid', 'su.uuid')
      .leftJoin('text_epigraphy as te', 'te.uuid', 'ip.reference_uuid')
      .where('su.tree_abb', 'Seal_Cat')
      .andWhere('su.type', 'object')
      .andWhere('su.uuid', sealUuid)
      .whereNotNull('te.text_uuid')
      .count({ count: 'su.uuid' })
      .first();

    return Number(count?.count) || 0;
  }

  async getSealImpressionsBySealUuid(
    sealUuid: string,
    trx?: Knex
  ): Promise<string[]> {
    const k = trx || knexRead();

    const textUuids: string[] = await k('spatial_unit as su')
      .leftJoin('item_properties as ip', 'ip.object_uuid', 'su.uuid')
      .leftJoin('text_epigraphy as te', 'te.uuid', 'ip.reference_uuid')
      .where('su.tree_abb', 'Seal_Cat')
      .andWhere('su.type', 'object')
      .andWhere('su.uuid', sealUuid)
      .whereNotNull('te.text_uuid')
      .pluck('te.text_uuid');

    return textUuids;
  }

  async getSealProperties(
    sealUuid: string,
    trx?: Knex
  ): Promise<SealProperty[]> {
    const k = trx || knexRead();

    const sealProperties: SealProperty[] = await k('spatial_unit as su')
      .leftJoin('item_properties as ip', 'ip.reference_uuid', 'su.uuid')
      .leftJoin('alias as a', 'a.reference_uuid', 'ip.variable_uuid')
      .where('su.tree_abb', 'Seal_Cat')
      .andWhere('su.type', 'object')
      .whereNot('a.name', '.')
      .andWhere('ip.level', '>', 1)
      .andWhere('su.uuid', sealUuid)
      .select('a.name as name', 'ip.value as value')
      .then((val: { name: string | null; value: string | null }[]) => {
        const properties: SealProperty[] = [];
        val.forEach(v => {
          if (v.name && v.value) {
            properties.push({ [v.name]: v.value });
          }
        });
        return properties;
      });

    return sealProperties;
  }
}

export default new SealDao();
