import { DictionarySearchRow, WordFormAutocompleteDisplay } from '@oare/types';
import { SearchWordsQueryRow } from './index';

function mapWordsToRows(wordRows: SearchWordsQueryRow[]) {
  const wordMap: { [key: string]: SearchWordsQueryRow[] } = {};
  wordRows.forEach(row => {
    if (row.uuid && !wordMap[row.uuid]) {
      wordMap[row.uuid] = [];
    }
    wordMap[row.uuid].push(row);
  });
  return wordMap;
}

export async function assembleAutocompleteDisplay(row: {
  name: string;
  uuid: string;
  type: string;
  wordUuid: string;
}): Promise<WordFormAutocompleteDisplay> {
  const wordFormAutocompleteDisplay: WordFormAutocompleteDisplay = {
    info: { uuid: row.uuid, wordUuid: row.wordUuid, name: row.name },
    wordDisplay: `${
      row.type === 'form' ? `${row.name} - form` : `${row.name} - word`
    }`,
  };
  return wordFormAutocompleteDisplay;
}

export function assembleSearchResult(
  rows: SearchWordsQueryRow[],
  search: string
): DictionarySearchRow[] {
  const lowerSearch = search.toLowerCase();
  const wordMap = mapWordsToRows(rows);

  const searchResults: DictionarySearchRow[] = [];
  Object.values(wordMap).forEach(wordRows => {
    const { uuid, type, name, translations } = wordRows[0];
    const matches: string[] = [];

    wordRows.forEach(wordRow => {
      const { form, spellings } = wordRow;
      const spellingsList = spellings ? spellings.split(', ') : [];
      if (
        (form && form.toLowerCase().includes(lowerSearch)) ||
        spellingsList.some(s => s.toLowerCase().includes(lowerSearch))
      ) {
        const spelling = spellings ? `: ${spellings}` : '';
        matches.push(`${form}: ${spelling}`);
      }
    });

    const matchingTranslations = translations
      ? translations
          .split(';')
          .filter(tr => tr.toLowerCase().includes(lowerSearch))
      : [];
    searchResults.push({
      uuid,
      type,
      name,
      translations: matchingTranslations,
      matches,
    });
  });

  searchResults.sort((a, b) => {
    if (a.name.toLowerCase() < b.name.toLowerCase()) {
      return -1;
    }
    if (a.name.toLowerCase() > b.name.toLowerCase()) {
      return 1;
    }
    return 0;
  });
  return searchResults;
}
