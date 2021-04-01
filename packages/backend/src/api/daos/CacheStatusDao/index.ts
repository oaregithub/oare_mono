import knex from '@/connection';

export interface CacheStatusRow {
  isEnabled: boolean;
  expires: Date;
}

class CacheStatusDao {
  async cacheIsEnabled(): Promise<boolean> {
    const row: CacheStatusRow = await knex('cache_status')
      .select('is_enabled AS isEnabled', 'expires')
      .first();
    const isEnabled = !!row.isEnabled || row.expires < new Date();
    if (isEnabled) {
      await knex('cache_status').update({ is_enabled: true });
    }
    return isEnabled;
  }

  async disableCache(): Promise<void> {
    const expires = new Date(Date.now() + 1000 * 60 * 10); // 10 mins
    const updateRow = {
      is_enabled: false,
      expires,
    };
    await knex('cache_status').update(updateRow);
  }
}

export default new CacheStatusDao();
