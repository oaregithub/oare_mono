import { LinkItem } from '@oare/types';
import { Knex } from 'knex';
import knex from '@/connection';

// VERIFIED COMPLETE

class SpatialUnitDao {
  /**
   * Searches for spatial units by name or UUID. Used for autocomplete when connecting link properties.
   * @param search The search string. Could be a UUID or a name.
   * @param trx Knex Transaction. Optional.
   * @returns Array of matching, ordered `LinkItem` objects.
   */
  async searchSpatialUnits(
    search: string,
    trx?: Knex.Transaction
  ): Promise<LinkItem[]> {
    const k = trx || knex;

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

/**
 * SpatialUnitDao instance as a singleton
 */
export default new SpatialUnitDao();
