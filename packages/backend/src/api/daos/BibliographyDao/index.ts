import { Knex } from 'knex';
import { knexRead } from '@/connection';
import { BibliographyItem, ZoteroResponse, BibliographyRow } from '@oare/types';
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
          .select('uuid', 'zot_item_key as zoteroKey', 'short_cit as citation')
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
          `https://api.zotero.org/groups/318265/items/${bibliography.zoteroKey}?format=json&include=citation&style=${citationStyle}`,
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

  async queryAllRows(): Promise<BibliographyRow[]> {
    const rows: BibliographyRow[] = await knexRead()('bibliography').select(
      'uuid',
      'zot_item_key'
    );
    return rows;
  }

  async queryZotero(zot_item_key: string, style: string) {
    const zoteroLink = `https://api.zotero.org/groups/318265/items/${zot_item_key}?format=json&include=bib,data&style=${style}`;

    const fetch = (await dynamicImport(
      'node-fetch',
      module
    )) as typeof import('node-fetch');

    const response = await fetch.default(zoteroLink);
  }
}

export default new BibliographyDao();
