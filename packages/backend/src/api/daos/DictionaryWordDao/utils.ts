import { NameOrPlace, DictionarySearchRow } from '@oare/types';
import {
  WordQueryRow,
  WordQueryResultRow,
  NamePlaceQueryRow,
  SearchWordsQueryRow,
  GrammarInfoRow,
  GrammarInfoResult,
} from './index';

export function nestedFormsAndSpellings(flatNames: NamePlaceQueryRow[]): NameOrPlace[] {
  const wordList = getWordList(flatNames);
  const allNames: NameOrPlace[] = [];

  // Insert forms into list with each word
  wordList.forEach((word) => {
    const names = flatNames.filter((nameInfo) => nameInfo.word === word);
    allNames.push(getNestedNameInfo(names));
  });

  allNames.sort((a, b) => {
    if (a.word.toLowerCase() < b.word.toLowerCase()) {
      return -1;
    }
    if (a.word.toLowerCase() > b.word.toLowerCase()) {
      return 1;
    }
    return 0;
  });
  return allNames;
}

function getWordList(flatNames: NamePlaceQueryRow[]): string[] {
  const wordList = new Set<string>();
  flatNames.forEach((nameInfo) => {
    wordList.add(nameInfo.word);
  });

  return Array.from(wordList);
}

function getNestedNameInfo(flatNames: NamePlaceQueryRow[]): NameOrPlace {
  const info: NameOrPlace = {
    uuid: flatNames[0].uuid,
    word: flatNames[0].word,
    translation: flatNames[0].translation || '',
    forms: [],
  };

  flatNames.forEach(({ formUuid, form, spellings, cases }) => {
    if (form && formUuid) {
      const spellingList = spellings ? spellings.split(',').map((spelling) => spelling.trim()) : [];

      info.forms.push({
        uuid: formUuid,
        form: form.trim(),
        spellings: spellingList,
        cases,
      });
    }
  });

  return info;
}

export function prepareWords(words: WordQueryRow[]): WordQueryResultRow[] {
  const wordsWithLists = words.map((wordInfo) => ({
    ...wordInfo,
    partsOfSpeech: wordInfo.partsOfSpeech ? wordInfo.partsOfSpeech.split(',') : [],
    verbalThematicVowelTypes: wordInfo.verbalThematicVowelTypes
      ? wordInfo.verbalThematicVowelTypes.split(',').map((vowelType) => vowelType.replace('-Class', ''))
      : [],
    specialClassifications: wordInfo.specialClassifications ? wordInfo.specialClassifications.split(',') : [],
  }));
  wordsWithLists.sort((a, b) => {
    if (a.word.toLowerCase() < b.word.toLowerCase()) {
      return -1;
    }
    if (a.word > b.word) {
      return 1;
    }
    return 0;
  });

  return wordsWithLists;
}

function mapWordsToRows(wordRows: SearchWordsQueryRow[]) {
  const wordMap: { [key: string]: SearchWordsQueryRow[] } = {};
  wordRows.forEach((row) => {
    if (row.uuid && !wordMap[row.uuid]) {
      wordMap[row.uuid] = [];
    }
    wordMap[row.uuid].push(row);
  });
  return wordMap;
}

export function assembleSearchResult(rows: SearchWordsQueryRow[], search: string): DictionarySearchRow[] {
  const lowerSearch = search.toLowerCase();
  const wordMap = mapWordsToRows(rows);

  const searchResults: DictionarySearchRow[] = [];
  Object.values(wordMap).forEach((wordRows) => {
    const { uuid, type, name, translations } = wordRows[0];
    const matches: string[] = [];

    wordRows.forEach((wordRow) => {
      const { form, spellings } = wordRow;
      const spellingsList = spellings ? spellings.split(', ') : [];
      if (
        (form && form.toLowerCase().includes(lowerSearch)) ||
        spellingsList.some((s) => s.toLowerCase().includes(lowerSearch))
      ) {
        const spelling = spellings ? `: ${spellings}` : '';
        matches.push(`${form}: ${spelling}`);
      }
    });

    const matchingTranslations = translations
      ? translations.split(';').filter((tr) => tr.toLowerCase().includes(lowerSearch))
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

function getVariables(value: string, grammarRows: GrammarInfoRow[], abbreviation = true): string[] {
  const valueRow = grammarRows.find((row) => row.value === value);
  if (!valueRow) {
    return [];
  }

  if (abbreviation) {
    return valueRow.variableAbbrevs ? valueRow.variableAbbrevs.split(';') : [];
  }
  return valueRow.variableNames ? valueRow.variableNames.split(';') : [];
}

export function assembleGrammarInfoResult(grammarRows: GrammarInfoRow[]): GrammarInfoResult {
  const translations = grammarRows[0].translations ? grammarRows[0].translations.split('#!') : [];

  return {
    uuid: grammarRows[0].uuid,
    word: grammarRows[0].word,
    cases: getVariables('Case', grammarRows),
    genders: getVariables('Gender', grammarRows),
    grammaticalNumbers: getVariables('Grammatical Number', grammarRows),
    morphologicalForms: getVariables('Morphological Form', grammarRows),
    partsOfSpeech: getVariables('Part of Speech', grammarRows),
    persons: getVariables('Person', grammarRows),
    specialClassifications: getVariables('Special Classifications', grammarRows, false),
    translations,
    verbalThematicVowelTypes: getVariables('Verbal Thematic Vowel Type', grammarRows),
  };
}
