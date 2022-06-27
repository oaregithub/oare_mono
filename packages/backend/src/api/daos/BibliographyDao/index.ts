import { Knex } from 'knex';
import { knexRead } from '@/connection';
import { BibliographyItem, ZoteroResponse } from '@oare/types';
import { dynamicImport } from 'tsimportlib';
import { fetchZotero } from './utils';

class BibliographyDao {
  /*
  async queryBibliographyByUuids(
    objUuids: string[],
    trx?: Knex.Transaction
  ): Promise<BibliographyItem[]> {
    const k = trx || knexRead();
    const bibliographies: BibliographyItem[] = await Promise.all(
      objUuids.map(uuid =>
        k('bibliography')
          .select('uuid', 'zot_item_key', 'short_cit')
          .where('uuid', uuid)
          .first()
      )
    );
    return bibliographies;
  }

  async queryBibliographyByPage(
    { page = 1, rows = 25 },
    trx?: Knex.Transaction
  ): Promise<BibliographyItem[]> {
    const k = trx || knexRead();
    const bibliographies: BibliographyItem[] = await k('bibliography')
      .select('uuid', 'zot_item_key')
      .orderBy('id')
      .limit(rows)
      .offset((page - 1) * rows);
    return bibliographies;
  }
  */

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

    const response = await fetchZotero(bibliographies, citationStyle);

    const zoteroCitations: string[] = response
      .filter(item => !!item.citation)
      .map(item => item.citation!);

    return zoteroCitations;
  }

  async queryBibliographyPage(
    citationStyle: string,
    { page = 1, rows = 25 },
    trx?: Knex.Transaction
  ): Promise<ZoteroResponse[]> {
    const k = trx || knexRead();
    const bibliographies: BibliographyItem[] = await k('bibliography')
      .select('uuid', 'zot_item_key')
      .orderBy('id')
      .limit(rows)
      .offset((page - 1) * rows);

    const response = await fetchZotero(bibliographies, citationStyle);

    //const objUuids = bibliographies.map(item => item.uuid);

    return response;
  }
}

export default new BibliographyDao();
