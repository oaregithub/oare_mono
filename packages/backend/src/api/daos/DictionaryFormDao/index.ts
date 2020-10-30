import knex from '@/connection';
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

class DictionaryFormDao {
  async updateForm(uuid: string, newForm: string): Promise<void> {
    await knex('dictionary_form').update({ form: newForm }).where({ uuid });
  }

  async getFormsWithSpellings(wordUuid: string) {
    const formsQueryString = getQueryString('dictionaryFormsQuery.sql');
    const formsGrammarQueryString = getQueryString('formsGrammarQuery.sql');

    const formsQuery = knex.raw(formsQueryString, [wordUuid]);
    const formsGrammarQuery = knex.raw(formsGrammarQueryString, [wordUuid]);

    const spellingRows: SpellingQueryRow[] = (await formsQuery)[0];
    const formGrammarRows: FormGrammarRow[] = (await formsGrammarQuery)[0];

    const forms = assembleSpellingsAndFormGrammar(spellingRows, formGrammarRows);
    return forms.sort((a, b) => a.form.localeCompare(b.form));
  }
}

export default new DictionaryFormDao();
