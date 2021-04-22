import knex from '@/connection';

export interface AliasRow {
  uuid: string;
  name: string;
  primacy: number | null;
}

export interface AliasWithName {
  uuid: string;
  referenceUuid: string;
  name: string | null;
}

class AliasDao {
  public readonly ABBREVIATION_TYPE = 'abbreviation';

  public readonly LABEL_TYPE = 'label';

  public readonly CASE_NAME = 'Case';

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

  async getAliasesByType(type: string): Promise<AliasWithName[]> {
    const aliases: AliasWithName[] = await knex('alias AS a')
      .select('a.uuid', 'a.reference_uuid AS referenceUuid', 'a.name')
      .where({ type });
    return aliases;
  }
}

export default new AliasDao();
