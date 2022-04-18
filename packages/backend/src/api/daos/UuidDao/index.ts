import knex from '@/connection';

class UuidDao {
  async haveSameTableReference(uuids: string[]) {
    const tableReferences = await knex('uuid')
      .pluck('table_reference')
      .whereIn('uuid', uuids);
    const uniqueTableReferences = [...new Set(tableReferences)];
    return uniqueTableReferences.length === 1;
  }
}

export default new UuidDao();
