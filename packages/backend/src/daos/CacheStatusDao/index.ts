import knex from '@/connection';
import { Knex } from 'knex';

// COMPLETE

interface CacheStatusRow {
  disableExpires: Date;
}

class CacheStatusDao {
  /**
   * Checks if the cache is currently enabled
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating if the cache is enabled
   * @throws Error if the cache status row does not exist
   */
  public async cacheIsEnabled(trx?: Knex.Transaction): Promise<boolean> {
    const k = trx || knex;

    const row: CacheStatusRow | undefined = await k('cache_status')
      .select('disable_expires AS disableExpires')
      .first();

    if (!row) {
      throw new Error('Cache status row does not exist');
    }

    const isEnabled = row.disableExpires < new Date();

    return isEnabled;
  }

  /**
   * Disables the cache for 10 minutes.
   * @param trx Knex Transaction. Optional.
   */
  public async disableCache(trx?: Knex.Transaction): Promise<void> {
    const k = trx || knex;

    const expires = new Date(Date.now() + 1000 * 60 * 10); // 10 mins
    await k('cache_status').update({
      disable_expires: expires,
    });
  }

  /**
   * Enables the cache.
   * @param trx Knex Transaction. Optional.
   */
  public async enableCache(trx?: Knex.Transaction): Promise<void> {
    const k = trx || knex;

    await k('cache_status').update({
      disable_expires: new Date(),
    });
  }
}

/**
 * CacheStatusDao instance as as singleton
 */
export default new CacheStatusDao();
