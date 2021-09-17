import knex from '@/connection';

class AliasDao {
  async getAliasNames(uuid: string): Promise<string[]> {
    const names = await knex('alias')
      .pluck('name')
      .where('alias.reference_uuid', uuid)
      .orderBy('primacy');
    return names;
  }
}

export default new AliasDao();
