import { knexRead } from '@/connection';
import { getZoteroAPIKEY } from '@/utils';
import { dynamicImport } from 'tsimportlib';

class BibliographyDao {
  async getBibliographyByUuid(uuid: string) {
    const row = await knexRead()('bibliography')
      .select('uuid', 'zot_item_key as zoteroKey', 'short_cit as citation')
      .where('uuid', uuid)
      .first();
    return row;
  }

  async getZoteroResponses(zoteroKeys: string[], citationStyle: string) {
    const apiKey = await getZoteroAPIKEY();

    const fetch = (await dynamicImport(
      'node-fetch',
      module
    )) as typeof import('node-fetch');

    const response = await Promise.all(
      zoteroKeys.map(zoteroKey =>
        fetch.default(
          `https://api.zotero.org/groups/318265/items/${zoteroKey}?format=json&include=citation&style=${citationStyle}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        )
      )
    );

    return response;
  }
}

export default new BibliographyDao();
