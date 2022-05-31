import { knexRead, knexWrite } from '@/connection';
import { BibliographySimpleRow } from '@oare/types';

class BibliographyDao {
  async queryAllRows(): Promise<BibliographySimpleRow[]> {
    const rows: BibliographySimpleRow[] = await knexRead()(
      'bibliography'
    ).select('uuid', 'zot_item_key');

    return rows;
  }
}

export default new BibliographyDao();
