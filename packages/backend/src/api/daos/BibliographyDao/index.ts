import { knexRead } from '@/connection';
import { dynamicImport } from 'tsimportlib';

class BibliographyDao {
  async getBibliographyByUuid(uuid: string) {
    const row = await knexRead()('bibliography')
      .select('uuid', 'zot_item_key as zoteroKey', 'short_cit as citation')
      .where('uuid', uuid)
      .first();
    return row;
  }

  async getZoteroResponses(zoteroKey: string) {
    const fetch = (await dynamicImport(
      'node-fetch',
      module
    )) as typeof import('node-fetch');
  }
}

export default new BibliographyDao();
