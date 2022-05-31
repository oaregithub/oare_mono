import { knexRead, knexWrite } from '@/connection';
import { BibliographySimpleRow } from '@oare/types';
import { dynamicImport } from 'tsimportlib';

class BibliographyDao {
  async queryAllRows(): Promise<BibliographySimpleRow[]> {
    const rows: BibliographySimpleRow[] = await knexRead()(
      'bibliography'
    ).select('uuid', 'zot_item_key');
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
