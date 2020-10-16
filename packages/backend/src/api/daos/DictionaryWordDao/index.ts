import { DictionaryWordTranslation } from '@oare/types';
import getQueryString from '../utils';
import knex from '../../../connection';
import { nestedFormsAndSpellings, prepareWords, assembleSearchResult } from './utils';
import LoggingEditsDao from '../LoggingEditsDao';
import FieldDao from '../FieldDao';

export interface WordQueryRow {
  uuid: string;
  word: string;
  partsOfSpeech: string | null;
  verbalThematicVowelTypes: string | null;
  specialClassifications: string | null;
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
  // translations: WordTranslation[];
}

export interface GrammarResult extends WordQueryResultRow {
  translations: DictionaryWordTranslation[];
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

export interface TranslationRow {
  dictionaryUuid: string;
  fieldUuid: string;
  field: string;
}

class DictionaryWordDao {
  async getWords(): Promise<GrammarResult[]> {
    const wordsQuery = getQueryString('wordsQuery.sql');

    const res: WordQueryRow[] = (await knex.raw(wordsQuery))[0];

    const allTranslations = await this.getAllTranslations();
    const wordsWithoutTranslations = prepareWords(res);
    return wordsWithoutTranslations.map((row) => {
      const translations = allTranslations.filter((tRow) => tRow.dictionaryUuid === row.uuid);
      return {
        ...row,
        translations: translations.map((tRow) => ({
          uuid: tRow.fieldUuid,
          translation: tRow.field,
        })),
      };
    });
  }

  async getAllTranslations(): Promise<TranslationRow[]> {
    const rows: TranslationRow[] = await knex('dictionary_word')
      .select('dictionary_word.uuid AS dictionaryUuid', 'field.uuid AS field.field', 'field.field')
      .innerJoin('field', 'field.reference_uuid', 'dictionary_word.uuid');
    return rows;
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

  async getWordTranslations(wordUuid: string): Promise<DictionaryWordTranslation[]> {
    const translations = (await FieldDao.getByReferenceUuid(wordUuid)).map(({ uuid, field }) => ({
      uuid,
      translation: field,
    })) as DictionaryWordTranslation[];

    return translations;
  }

  async getGrammaticalInfo(wordUuid: string): Promise<GrammarResult> {
    const grammaticalInfoQuery = getQueryString('wordGrammaticalInfoQuery.sql');
    const { uuid, word, partsOfSpeech, specialClassifications, verbalThematicVowelTypes }: WordQueryRow = (
      await knex.raw(grammaticalInfoQuery, wordUuid)
    )[0][0];

    const translations = await this.getWordTranslations(wordUuid);

    return {
      uuid,
      word,
      partsOfSpeech: partsOfSpeech ? partsOfSpeech.split(',') : [],
      specialClassifications: specialClassifications ? specialClassifications.split(',') : [],
      verbalThematicVowelTypes: verbalThematicVowelTypes
        ? verbalThematicVowelTypes.split(',').map((vtv) => vtv.replace('-Class', ''))
        : [],
      translations,
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

  async updateWordSpelling(userUuid: string, uuid: string, word: string): Promise<void> {
    await LoggingEditsDao.logEdit('UPDATE', userUuid, 'dictionary_word', uuid);
    await knex('dictionary_word').update({ word }).where({ uuid });
  }

  async updateTranslations(
    userUuid: string,
    wordUuid: string,
    translations: DictionaryWordTranslation[],
  ): Promise<DictionaryWordTranslation[]> {
    const currentTranslations = await this.getWordTranslations(wordUuid);
    const translationsWithPrimacy = translations.map((tr, index) => ({
      ...tr,
      primacy: index + 1,
    }));

    // Insert new translations
    let newTranslations = translationsWithPrimacy.filter((tr) => tr.uuid === '');
    const insertedUuids = await Promise.all(
      newTranslations.map((tr) =>
        FieldDao.insertField(wordUuid, 'definition', tr.translation, { primacy: tr.primacy }),
      ),
    );
    await Promise.all(
      insertedUuids.map((fieldUuid) => {
        return LoggingEditsDao.logEdit('INSERT', userUuid, 'field', fieldUuid);
      }),
    );
    newTranslations = newTranslations.map((tr, index) => ({
      ...tr,
      uuid: insertedUuids[index],
    }));

    // Update existing translations
    const existingTranslations = translationsWithPrimacy.filter((tr) => tr.uuid !== '');
    await Promise.all(existingTranslations.map((tr) => LoggingEditsDao.logEdit('UPDATE', userUuid, 'field', tr.uuid)));
    await Promise.all(
      existingTranslations.map((tr) => FieldDao.updateField(tr.uuid, tr.translation, { primacy: tr.primacy })),
    );

    // Delete removed translations
    const combinedTranslations = [...newTranslations, ...existingTranslations];
    const currentTranslationUuids = currentTranslations.map((tr) => tr.uuid);
    const remainingTranslationUuids = combinedTranslations.map((tr) => tr.uuid);
    const deletedTranslationUuids = currentTranslationUuids.filter((uuid) => !remainingTranslationUuids.includes(uuid));
    await Promise.all(deletedTranslationUuids.map((uuid) => FieldDao.deleteField(uuid)));

    return combinedTranslations
      .sort((a, b) => {
        if (a.primacy > b.primacy) return 1;
        if (a.primacy < b.primacy) return -1;
        return 0;
      })
      .map((tr) => ({
        translation: tr.translation,
        uuid: tr.uuid,
      }));
  }
}

export default new DictionaryWordDao();
