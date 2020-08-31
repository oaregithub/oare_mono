import getQueryString from '../utils';
import knex from '../../../connection';
import { nestedFormsAndSpellings, prepareWords, assembleSearchResult } from './utils';

export interface WordQueryRow {
  uuid: string;
  word: string;
  partsOfSpeech: string | null;
  verbalThematicVowelTypes: string | null;
  specialClassifications: string | null;
  translations: string | null;
}

export interface GrammarInfoRow {
  uuid: string;
  word: string;
  value: string;
  variableNames: string | null;
  variableAbbrevs: string | null;
  translations: string | null;
}

export interface GrammarInfoResult {
  uuid: string;
  word: string;
  partsOfSpeech: string[];
  verbalThematicVowelTypes: string[];
  specialClassifications: string[];
  translations: string[];
  persons: string[];
  genders: string[];
  grammaticalNumbers: string[];
  morphologicalForms: string[];
  cases: string[];
}

export interface WordQueryResultRow {
  uuid: string;
  word: string;
  partsOfSpeech: string[];
  verbalThematicVowelTypes: string[];
  specialClassifications: string[];
  translations: string[];
}

export interface NamePlaceQueryRow {
  uuid: string;
  word: string;
  formUuid: string | null;
  translation: string | null;
  form: string | null;
  cases: string | null;
  spellings: string | null;
}

export interface NamePlaceForm {
  uuid: string;
  form: string;
  spellings: string[];
  cases: string | null;
}

export interface NamePlaceQueryResult {
  uuid: string;
  word: string;
  translation: string;
  forms: NamePlaceForm[];
}

export interface SearchWordsQueryRow {
  uuid: string;
  type: 'word' | 'PN' | 'GN';
  name: string;
  translations: string | null;
  form: string | null;
  spellings: string | null;
}

export interface SearchWordsQueryResult {
  uuid: string;
  type: 'word' | 'PN' | 'GN';
  name: string;
  translations: string[];
  matches: string[];
}

class DictionaryWordDao {
  async getWords(): Promise<WordQueryResultRow[]> {
    const wordsQuery = getQueryString('wordsQuery.sql');

    const res: WordQueryRow[] = (await knex.raw(wordsQuery))[0];

    return prepareWords(res);
  }

  async getNames() {
    const namesQuery = getQueryString('namesAndPlacesQuery.sql').replace('#{wordType}', 'PN');

    const nameRows: NamePlaceQueryRow[] = (await knex.raw(namesQuery))[0];
    return nestedFormsAndSpellings(nameRows);
  }

  async getPlaces() {
    const placesQuery = getQueryString('./namesAndPlacesQuery.sql').replace('#{wordType}', 'GN');

    const placeRows: NamePlaceQueryRow[] = (await knex.raw(placesQuery))[0];
    return nestedFormsAndSpellings(placeRows);
  }

  async getGrammaticalInfo(wordUuid: string): Promise<WordQueryResultRow> {
    const grammaticalInfoQuery = getQueryString('wordGrammaticalInfoQuery.sql');
    const {
      uuid,
      word,
      partsOfSpeech,
      specialClassifications,
      translations,
      verbalThematicVowelTypes,
    }: WordQueryRow = (await knex.raw(grammaticalInfoQuery, wordUuid))[0][0];

    return {
      uuid,
      word,
      partsOfSpeech: partsOfSpeech ? partsOfSpeech.split(',') : [],
      specialClassifications: specialClassifications ? specialClassifications.split(',') : [],
      verbalThematicVowelTypes: verbalThematicVowelTypes
        ? verbalThematicVowelTypes.split(',').map((vtv) => vtv.replace('-Class', ''))
        : [],
      translations: translations ? translations.split('#!') : [],
    };
  }

  async searchWords(search: string, page: number, numRows: number) {
    const lowerSearch = search.toLowerCase();
    const query = knex
      .from('dictionary_word AS dw')
      .leftJoin('field', 'field.reference_uuid', 'dw.uuid')
      .leftJoin('dictionary_form AS df', 'df.reference_uuid', 'dw.uuid')
      .leftJoin('dictionary_spelling AS ds', 'ds.reference_uuid', 'df.uuid')
      .where(knex.raw('LOWER(dw.word) LIKE ?', [`%${lowerSearch}%`]))
      .orWhere(knex.raw('LOWER(field.field) LIKE ?', [`%${lowerSearch}%`]))
      .orWhere(knex.raw('LOWER(df.form) LIKE ?', [`%${lowerSearch}%`]))
      .orWhere(knex.raw('LOWER(ds.spelling) LIKE ?', [`%${lowerSearch}%`]))
      .select(
        'dw.uuid',
        'dw.type',
        'dw.word AS name',
        knex.raw("GROUP_CONCAT(DISTINCT `field`.`field` SEPARATOR ';') AS translations"),
        'df.form',
        knex.raw("GROUP_CONCAT(DISTINCT ds.spelling SEPARATOR ', ') AS spellings"),
      )
      .groupBy('df.uuid');
    const rows: SearchWordsQueryRow[] = await query;
    const resultRows = assembleSearchResult(rows, search);
    const offset = (page - 1) * numRows;
    const results = resultRows.slice(offset, offset + numRows);

    return {
      totalRows: resultRows.length,
      results,
    };
  }
}

export default new DictionaryWordDao();
