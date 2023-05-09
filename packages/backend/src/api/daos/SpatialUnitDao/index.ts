import { LinkItem } from '@oare/types';
import { Knex } from 'knex';
import { knexRead } from '@/connection';

class SpatialUnitDao {
  async searchSpatialUnits(
    search: string,
    trx?: Knex.Transaction
  ): Promise<LinkItem[]> {
    const k = trx || knexRead();
    const rows: LinkItem[] = await k('spatial_unit')
      .innerJoin('alias', 'alias.reference_uuid', 'spatial_unit.uuid')
      .select('spatial_unit.uuid as objectUuid', 'alias.name as objectDisplay')
      .where(k.raw('LOWER(alias.name)'), 'like', `%${search.toLowerCase()}%`)
      .orWhereRaw('binary spatial_unit.uuid = binary ?', search)
      .orderByRaw(
        `CASE WHEN LOWER(alias.name) LIKE '${search.toLowerCase()}' THEN 1 WHEN LOWER(alias.name) LIKE '${search.toLowerCase()}%' THEN 2 WHEN LOWER(alias.name) LIKE '%${search.toLowerCase()}' THEN 4 ELSE 3 END`
      )
      .orderByRaw('LOWER(alias.name)');

    return rows;
  }
}

export default new SpatialUnitDao();
