import knex from '@/connection';
import { SpellingText } from '@oare/types';
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

  async getSpellingTexts(spellingUuid: string): Promise<SpellingText[]> {
    interface SpellingTextRow {
      textUuid: string;
      name: string;
      primacy: null | number;
    }
    const rows: SpellingTextRow[] = await knex('text_discourse')
      .select('text_discourse.text_uuid AS textUuid', 'alias.name', 'alias.primacy')
      .innerJoin('alias', 'alias.reference_uuid', 'text_discourse.text_uuid')
      .where('text_discourse.spelling_uuid', spellingUuid)
      .groupBy('text_discourse.text_uuid', 'alias.primacy');

    const textUuids = [...new Set(rows.map((r) => r.textUuid))];

    return textUuids.map((textUuid) => {
      const spellingTextRows = rows
        .filter((r) => r.textUuid === textUuid)
        .sort((a, b) => {
          if (a.primacy === null) {
            return -1;
          }
          if (b.primacy === null) {
            return 1;
          }
          if (a.primacy < b.primacy) {
            return 1;
          }
          if (a.primacy > b.primacy) {
            return -1;
          }
          return 0;
        });

      if (spellingTextRows.length === 1) {
        return {
          uuid: textUuid,
          text: spellingTextRows[0].name,
        };
      }
      return {
        uuid: textUuid,
        text: `${spellingTextRows[0].name} (${spellingTextRows[1].name})`,
      };
    });
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
