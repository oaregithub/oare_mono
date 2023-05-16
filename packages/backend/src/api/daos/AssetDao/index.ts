import { LinkItem } from '@oare/types';
import { Knex } from 'knex';
import knex from '@/connection';

class AssetDao {
  async searchAssets(
    search: string,
    trx?: Knex.Transaction
  ): Promise<LinkItem[]> {
    const k = trx || knex;
    const rows: LinkItem[] = await k('asset')
      .innerJoin('alias', 'alias.reference_uuid', 'asset.uuid')
      .select('asset.uuid as objectUuid', 'alias.name as objectDisplay')
      .where(k.raw('LOWER(alias.name)'), 'like', `%${search.toLowerCase()}%`)
      .orWhereRaw('binary asset.uuid = binary ?', search)
      .orderByRaw(
        `CASE WHEN LOWER(alias.name) LIKE '${search.toLowerCase()}' THEN 1 WHEN LOWER(alias.name) LIKE '${search.toLowerCase()}%' THEN 2 WHEN LOWER(alias.name) LIKE '%${search.toLowerCase()}' THEN 4 ELSE 3 END`
      )
      .orderByRaw('LOWER(alias.name)');

    return rows;
  }
}

export default new AssetDao();
