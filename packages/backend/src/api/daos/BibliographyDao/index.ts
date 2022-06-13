import { Knex } from 'knex';
import { knexRead } from '@/connection';
import { getZoteroAPIKEY } from '@/utils';
import { BibliographyItem, ZoteroResponse } from '@oare/types';
import { dynamicImport } from 'tsimportlib';
class BibliographyDao {
  async getBibliographyByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<BibliographyItem> {
    const k = trx || knexRead();
    const row: BibliographyItem = await k('bibliography')
      .select('uuid', 'zot_item_key as zoteroKey', 'short_cit as citation')
      .where('uuid', uuid)
      .first();
    return row;
  }

  async getZoteroResponses(
    zoteroKeys: string[],
    citationStyle: string
  ): Promise<ZoteroResponse[]> {
    const apiKey = await getZoteroAPIKEY();

    const fetch = (await dynamicImport(
      'node-fetch',
      module
    )) as typeof import('node-fetch');

    const response = await Promise.all(
      zoteroKeys.map(zoteroKey =>
        fetch
          .default(
            `https://api.zotero.org/groups/318265/items/${zoteroKey}?format=json&include=citation&style=${citationStyle}`,
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            }
          )
          .then(value => value.json())
          .then(json => json as ZoteroResponse)
      )
    );

    return response;
  }
}

export default new BibliographyDao();
