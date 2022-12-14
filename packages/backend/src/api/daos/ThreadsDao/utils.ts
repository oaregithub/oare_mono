import { AllThreadRow, AllThreadRowUndeterminedItem } from '@oare/types';

export function determineThreadItem(
  undertimendItemThreadRows: AllThreadRowUndeterminedItem[]
): AllThreadRow[] {
  const threadRows: AllThreadRow[] = undertimendItemThreadRows.map(tr => {
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
    }

    const { word, form, spelling, definition, ...threadRow } = tr;
    return {
      ...threadRow,
      item,
    };
  });
  return threadRows;
}
