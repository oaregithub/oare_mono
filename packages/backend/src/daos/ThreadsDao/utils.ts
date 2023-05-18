import { AllThreadRow, AllThreadRowUndeterminedItem } from '@oare/types';
import sl from '@/serviceLocator';

// FIXME - what is going on here? Threads/comments needs a major revamp.

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
        const BibliographyDao = sl.get('BibliographyDao');
        const utils = sl.get('utils');

        const bibItem = await BibliographyDao.getBibliographyByZotItemKey(
          tr.bibliography
        );
        const zoteroData = await utils.getZoteroData(
          bibItem.zoteroKey,
          'chicago-author-date'
        );
        item = zoteroData?.data ? zoteroData.data.title : 'Title not available';
      } else if (tr.epigraphyReading) {
        item = tr.epigraphyReading;
      } else if (tr.discourseSpelling) {
        item = tr.discourseSpelling;
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
