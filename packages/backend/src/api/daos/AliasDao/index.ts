import knex from '@/connection';

export interface AliasRow {
  uuid: string;
  name: string;
  primacy: number | null;
}

class AliasDao {
  async getName(uuid: string): Promise<string> {
    const row = await knex('alias').first('name').where('reference_uuid', uuid);
    return row.name;
  }

  async getAllNames(uuid: string): Promise<AliasRow[]> {
    const rows: AliasRow[] = await knex('alias')
      .select('uuid', 'name', 'primacy')
      .where('reference_uuid', uuid)
      .orderBy('primacy');
    return rows;
  }
}

export default new AliasDao();
