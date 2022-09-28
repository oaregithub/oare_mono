import { DictionarySearchRow, WordFormAutocompleteDisplay } from '@oare/types';
import { DictSpellEpigRowDictSearch, SearchWordsQueryRow } from './index';

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
      row.type === 'form' ? `${row.name} - Form` : `${row.name} - Word`
    }`,
  };
  return wordFormAutocompleteDisplay;
}

export function assembleSearchResult(
  rows: SearchWordsQueryRow[],
  search: string,
  spellEpigRow: DictSpellEpigRowDictSearch[] | null
): DictionarySearchRow[] {
  const lowerSearch = search.toLowerCase();
  const wordMap = mapWordsToRows(rows);

  const searchResults: DictionarySearchRow[] = [];
  Object.values(wordMap).forEach(wordRows => {
    const { uuid, type, name, translations } = wordRows[0];
    const searchSpellingUuids: string[] | null = spellEpigRow
      ? spellEpigRow.map(({ referenceUuid }) => referenceUuid)
      : null;
    const spellReadings: string[] | null = spellEpigRow
      ? [...new Set(spellEpigRow.map(({ reading }) => reading))]
      : null;
    const matches: string[] = [];

    wordRows.forEach(wordRow => {
      const { form, spellings, spellingUuids } = wordRow;
      const spellingsList = spellings ? spellings.split(', ') : [];
      const spellingUuidsList = spellingUuids ? spellingUuids.split(', ') : [];
      if (
        (form && form.toLowerCase().includes(lowerSearch)) ||
        spellingsList.some(s => s.toLowerCase().includes(lowerSearch))
      ) {
        const spelling = spellings ? `: ${spellings}` : '';
        matches.push(`${form}: ${spelling}`);
      } else if (
        searchSpellingUuids &&
        searchSpellingUuids.some(s => spellingUuidsList.includes(s)) &&
        spellReadings &&
        spellings
      ) {
        const components: string[] = [];
        for (let i = 0; i < spellings.length; i += 1) {
          let pushUnchanged = true;
          for (let j = 0; j < spellReadings.length; j += 1) {
            const currentReading = spellReadings[j];
            if (
              spellings
                .substring(i, i + currentReading.length)
                .toLocaleLowerCase() === currentReading.toLocaleLowerCase()
            ) {
              components.push(
                `<mark>${spellings.substring(
                  i,
                  i + currentReading.length
                )}</mark>`
              );
              i += currentReading.length - 1;
              pushUnchanged = false;
              break;
            }
          }
          if (pushUnchanged) {
            components.push(spellings[i]);
          }
        }
        const spelling = components.join('');
        matches.push(`${form}: ${spelling}`);
      }
    });
    const translationsArray = translations ? translations.split(';') : [];
    const matchingTranslations = translations
      ? translations
          .split(';')
          .filter(tr => tr.toLowerCase().includes(lowerSearch))
      : [];
    searchResults.push({
      uuid,
      type,
      name,
      translations:
        matchingTranslations.length === 0
          ? translationsArray
          : matchingTranslations,
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
