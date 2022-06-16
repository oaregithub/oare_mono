import { Knex } from 'knex';
import { knexRead } from '@/connection';
import { BibliographyItem, ZoteroResponse } from '@oare/types';
import { getZoteroResponse } from './utils';
import { getZoteroAPIKEY } from '@/utils';

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
    const response = await getZoteroResponse(zoteroKeys, citationStyle, apiKey);
    return response;
  }
}

export default new BibliographyDao();
