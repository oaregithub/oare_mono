import knex from '@/connection';

class BibliographyDao {
  async getBibliographyByUuid(uuid: string) {
    const row = await knex('bibliography')
      .select('uuid', 'zot_item_key as zoteroKey', 'short_cit as citation')
      .where('uuid', uuid)
      .first();
    return row;
  }
}

export default new BibliographyDao();
