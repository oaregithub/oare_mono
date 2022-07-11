import { Knex } from 'knex';
import { knexRead } from '@/connection';
import { BibliographyItem, ZoteroResponse } from '@oare/types';
import { getZoteroAPIKEY } from '@/utils';
import { dynamicImport } from 'tsimportlib';

class BibliographyDao {
  async getZoteroCitationsByUuid(
    uuid: string,
    citationStyle: string,
    trx?: Knex.Transaction
  ): Promise<string | null> {
    const k = trx || knexRead();
    const bibliography: BibliographyItem = await k('bibliography')
      .select('uuid', 'zot_item_key as zoteroKey', 'short_cit as citation')
      .where({ uuid })
      .first();

    const zoteroAPIKey = await getZoteroAPIKEY();

    const fetch = (await dynamicImport(
      'node-fetch',
      module
    )) as typeof import('node-fetch');

    const zoteroResponse = await fetch.default(
      `https://api.zotero.org/groups/318265/items/${bibliography.zoteroKey}?format=json&include=citation&style=${citationStyle}`,
      {
        headers: {
          Authorization: `Bearer ${zoteroAPIKey}`,
        },
      }
    );

    const zoteroJSON = zoteroResponse.ok
      ? ((await zoteroResponse.json()) as ZoteroResponse)
      : null;

    return zoteroJSON && zoteroJSON.citation ? zoteroJSON.citation : null;
  }
}

export default new BibliographyDao();
