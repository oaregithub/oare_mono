import { AllThreadRow, AllThreadRowUndeterminedItem } from '@oare/types';
import sl from '@/serviceLocator';
import BibliographyDao from '../BibliographyDao';

export async function determineThreadItem(
  undeterminedThreadRows: AllThreadRowUndeterminedItem[]
): Promise<AllThreadRow[]> {
  const threadRows: AllThreadRow[] = await Promise.all(
    undeterminedThreadRows.map(async tr => {
      let item: string | null = null;
      if (tr.word) {
        item = tr.word;
      } else if (tr.form) {
        item = tr.form;
      } else if (tr.spelling) {
        item = tr.spelling;
      } else if (tr.definition) {
        item = tr.definition;
      } else if (tr.collectionName) {
        item = tr.collectionName;
      } else if (tr.bibliography) {
        const BibliographyUtils = sl.get('BibliographyUtils');
        const bibItem = await BibliographyDao.getBibliographyByZotItemKey(
          tr.bibliography
        );
        const zoteroData = await BibliographyUtils.getZoteroReferences(
          bibItem,
          'chicago-author-date',
          ['data']
        );
        item = zoteroData?.data ? zoteroData.data.title : 'Title not available';
      }

      const { word, form, spelling, definition, ...threadRow } = tr;
      return {
        ...threadRow,
        item,
      };
    })
  );
  return threadRows;
}
