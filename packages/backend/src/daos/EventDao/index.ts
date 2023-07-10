import { LinkItem } from '@oare/types';
import { Knex } from 'knex';
import knex from '@/connection';

class EventDao {
  /**
   * Search events by name or UUID. Used for autocomplete when connecting link properties.
   * @param search The search string. Could be a UUID or a name.
   * @param trx Knex Transaction. Optional.
   * @returns Array of matching, ordered `LinkItem` objects.
   */
  public async searchEventsLinkProperties(
    search: string,
    trx?: Knex.Transaction
  ): Promise<LinkItem[]> {
    const k = trx || knex;

    const rows: LinkItem[] = await k('event')
      .innerJoin('alias', 'alias.reference_uuid', 'event.uuid')
      .select('event.uuid as objectUuid', 'alias.name as objectDisplay')
      .where(k.raw('LOWER(alias.name)'), 'like', `%${search.toLowerCase()}%`)
      .orWhereRaw('binary event.uuid = binary ?', search)
      .orderByRaw(
        `CASE WHEN LOWER(alias.name) LIKE '${search.toLowerCase()}' THEN 1 WHEN LOWER(alias.name) LIKE '${search.toLowerCase()}%' THEN 2 WHEN LOWER(alias.name) LIKE '%${search.toLowerCase()}' THEN 4 ELSE 3 END`
      )
      .orderByRaw('LOWER(alias.name)');

    return rows;
  }
}

/**
 * EventDao instance as a singleton
 */
export default new EventDao();
