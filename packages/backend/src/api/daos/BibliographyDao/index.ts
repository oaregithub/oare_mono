import { Knex } from 'knex';
import { knexRead } from '@/connection';
import { BibliographyItem, ZoteroResponse } from '@oare/types';
import { getZoteroAPIKEY } from '@/utils';
import axios from 'axios';

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

    const { data }: { data: ZoteroResponse } = await axios.get(
      `https://api.zotero.org/groups/318265/items/${bibliography.zoteroKey}?format=json&include=citation&style=${citationStyle}`,
      {
        headers: {
          Authorization: `Bearer ${zoteroAPIKey}`,
        },
      }
    );

    return data && data.citation ? data.citation : null;
  }
}

export default new BibliographyDao();
