import knex from '@/connection';

export interface CacheStatusRow {
  disableExpires: Date;
}

class CacheStatusDao {
  async cacheIsEnabled(): Promise<boolean> {
    const row: CacheStatusRow = await knex('cache_status')
      .select('disable_expires AS disableExpires')
      .first();
    const isEnabled = row.disableExpires < new Date();
    return isEnabled;
  }

  async disableCache(): Promise<void> {
    const expires = new Date(Date.now() + 1000 * 60 * 10); // 10 mins
    const updateRow = {
      disable_expires: expires,
    };
    await knex('cache_status').update(updateRow);
  }

  async enableCache(): Promise<void> {
    const updateRow = {
      disable_expires: new Date(),
    };
    await knex('cache_status').update(updateRow);
  }
}

export default new CacheStatusDao();
