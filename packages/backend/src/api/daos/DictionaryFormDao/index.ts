import knex from '../../../connection';
import getQueryString from '../utils';
import assembleSpellingsAndFormGrammar from './utils';

export interface SpellingQueryRow {
  formUuid: string;
  form: string;
  spellingUuids: string | null;
  spellings: string | null;
}

export interface FormGrammarRow {
  propertyUuid: string;
  parentUuid: string | null;
  formUuid: string;
  form: string;
  variable: string | null;
  valueName: string | null;
  valueAbbrev: string | null;
}

export interface FormSpelling {
  uuid: string;
  spelling: string;
}

export interface FormQueryResult {
  uuid: string;
  form: string;
  stems: string[];
  tenses: string[];
  persons: string[];
  genders: string[];
  grammaticalNumbers: string[];
  cases: string[];
  states: string[];
  moods: string[];
  clitics: string[];
  morphologicalForms: string[];
  spellings: FormSpelling[];
  suffix: {
    persons: string[];
    genders: string[];
    grammaticalNumbers: string[];
    cases: string[];
  } | null;
}

class DictionaryFormDao {
  async getFormsWithSpellings(wordUuid: string) {
    const formsQueryString = getQueryString('dictionaryFormsQuery.sql');
    const formsGrammarQueryString = getQueryString('formsGrammarQuery.sql');

    const formsQuery = knex.raw(formsQueryString, [wordUuid]);
    const formsGrammarQuery = knex.raw(formsGrammarQueryString, [wordUuid]);

    const spellingRows: SpellingQueryRow[] = (await formsQuery)[0];
    const formGrammarRows: FormGrammarRow[] = (await formsGrammarQuery)[0];

    return assembleSpellingsAndFormGrammar(spellingRows, formGrammarRows);
  }
}

export default new DictionaryFormDao();
