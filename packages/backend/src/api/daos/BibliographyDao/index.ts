import { Knex } from 'knex';
import { knexRead } from '@/connection';
import { BibliographyItem } from '@oare/types';

class BibliographyDao {
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
}

export default new BibliographyDao();
