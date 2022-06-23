import { Knex } from 'knex';
import { knexRead } from '@/connection';
import { BibliographyItem, ZoteroResponse } from '@oare/types';
import { getZoteroAPIKEY } from '@/utils';
import { dynamicImport } from 'tsimportlib';

class BibliographyDao {
  async getZoteroCitationsByUuid(
    objUuids: string[],
    citationStyle: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knexRead();
    const bibliographies: BibliographyItem[] = await Promise.all(
      objUuids.map(uuid =>
        k('bibliography')
          .select('uuid', 'zot_item_key', 'short_cit')
          .where('uuid', uuid)
          .first()
      )
    );

    const apiKey = await getZoteroAPIKEY();

    const fetch = (await dynamicImport(
      'node-fetch',
      module
    )) as typeof import('node-fetch');

    const response = await Promise.all(
      bibliographies.map(async bibliography => {
        const resp = await fetch.default(
          `https://api.zotero.org/groups/318265/items/${bibliography.zot_item_key}?format=json&include=citation&style=${citationStyle}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );
        const json = (await resp.json()) as ZoteroResponse;
        return json;
      })
    );

    const zoteroCitations: string[] = response
      .filter(item => !!item.citation)
      .map(item => item.citation!);

    return zoteroCitations;
  }

  async queryBibliographyPage(
    citationStyle: string,
    { page = 1, rows = 10 },
    trx?: Knex.Transaction
  ): Promise<ZoteroResponse[]> {
    //page = 1, rows = 10
    const zoteroRows: BibliographyItem[] = await knexRead()('bibliography')
      .select('uuid', 'zot_item_key')
      .orderBy('id')
      .limit(rows)
      .offset((page - 1) * rows);

    const apiKey = await getZoteroAPIKEY();

    const fetch = (await dynamicImport(
      'node-fetch',
      module
    )) as typeof import('node-fetch');

    const response = await Promise.all(
      zoteroRows.map(async row => {
        const resp = await fetch.default(
          `https://api.zotero.org/groups/318265/items/${row.zot_item_key}?format=json&include=bib,data&style=${citationStyle}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );
        const json = (await resp.json()) as ZoteroResponse;
        return json;
      })
    );

    return response;
  }
}

export default new BibliographyDao();
