import knex from '@/connection';

class BibliographyDao {
  async getBibliographyByUuid(textUuid: string) {
    const row = await knex('bibliography').where('uuid', textUuid);
    return row;
  }
}

export default new BibliographyDao();
