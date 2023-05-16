import { Knex } from 'knex';
import knex from '@/connection';
import { BibliographyItem } from '@oare/types';

class BibliographyDao {
  async getBibliographyByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<BibliographyItem> {
    const k = trx || knex;
    const bibliography: BibliographyItem = await k('bibliography')
      .select('uuid', 'zot_item_key as zoteroKey', 'short_cit as citation')
      .where('uuid', uuid)
      .first();
    return bibliography;
  }

  async getBibliographies(trx?: Knex.Transaction): Promise<BibliographyItem[]> {
    const k = trx || knex;
    const bibliographies: BibliographyItem[] = await k('bibliography').select(
      'uuid',
      'zot_item_key as zoteroKey',
      'short_cit as citation'
    );
    return bibliographies;
  }

  async getBibliographyByZotItemKey(
    zotItemKey: string,
    trx?: Knex.Transaction
  ): Promise<BibliographyItem> {
    const k = trx || knex;
    const bibliography: BibliographyItem = await k('bibliography')
      .select('uuid', 'zot_item_key as zoteroKey', 'short_cit as citation')
      .where('zot_item_key', zotItemKey)
      .first();
    return bibliography;
  }
}

export default new BibliographyDao();
