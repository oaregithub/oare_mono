import knex from '@/connection';
import { DictionaryForm } from '@oare/types';
import DictionarySpellingDao from '../DictionarySpellingDao';

export interface FormGrammarRow {
  propertyUuid: string;
  parentUuid: string | null;
  formUuid: string;
  form: string;
  variable: string | null;
  valueName: string | null;
  valueAbbrev: string | null;
}

function getCliticSuffixUuid(grammarRows: FormGrammarRow[]): string | null {
  const cliticRow = grammarRows.find((row) => row.variable === 'Clitic' && row.valueName === 'Suffix pronoun');
  return cliticRow ? cliticRow.propertyUuid : null;
}

function getVariables(variable: string, grammarRows: FormGrammarRow[], cliticUuid: string | null): string[] {
  const valueRows = grammarRows.filter((row) => row.variable === variable && row.parentUuid !== cliticUuid);

  const values = valueRows.map((row) => row.valueAbbrev || '').filter((row) => row !== '');
  return values;
}

function getSuffixVariables(variable: string, grammarRows: FormGrammarRow[], cliticUuid: string): string[] {
  const valueRows = grammarRows.filter((row) => row.variable === variable && row.parentUuid === cliticUuid);

  const values = valueRows.map((row) => row.valueAbbrev || '').filter((row) => row !== '');
  return values;
}

class DictionaryFormDao {
  async updateForm(uuid: string, newForm: string): Promise<void> {
    await knex('dictionary_form').update({ form: newForm }).where({ uuid });
  }

  async getForms(wordUuid: string): Promise<DictionaryForm[]> {
    const forms: { uuid: string; form: string }[] = await knex('dictionary_form')
      .select('uuid', 'form')
      .where('reference_uuid', wordUuid);

    const formSpellings = await Promise.all(forms.map((f) => DictionarySpellingDao.getFormSpellings(f.uuid)));

    const grammarRows: FormGrammarRow[] = await knex('dictionary_form AS df')
      .select(
        'ip.uuid AS propertyUuid',
        'ip.parent_uuid AS parentUuid',
        'df.form',
        'df.uuid AS formUuid',
        'a1.name AS variable',
        'a2.name AS valueName',
        'a3.name AS valueAbbrev',
      )
      .leftJoin('item_properties AS ip', 'ip.reference_uuid', 'df.uuid')
      .leftJoin('alias AS a1', 'a1.reference_uuid', 'ip.variable_uuid')
      .leftJoin('alias AS a2', 'a2.reference_uuid', 'ip.value_uuid')
      .leftJoin('alias AS a3', 'a3.reference_uuid', 'ip.value_uuid')
      .where('df.reference_uuid', wordUuid)
      .andWhere('a2.type', '!=', 'abbreviation')
      .andWhere('a3.type', 'abbreviation');

    return forms
      .map((form, i) => {
        const formGrammarRows = grammarRows.filter((r) => r.formUuid === form.uuid);
        const cliticSuffixUuid = getCliticSuffixUuid(formGrammarRows);

        let suffix = null;
        if (cliticSuffixUuid) {
          const [persons, cases, genders, grammaticalNumbers] = [
            'Person',
            'Case',
            'Gender',
            'Grammatical Number',
          ].map((varValue) => getSuffixVariables(varValue, formGrammarRows, cliticSuffixUuid));
          suffix = {
            persons,
            cases,
            genders,
            grammaticalNumbers,
          };
        }

        const [stems, tenses, cases, states, moods, persons, grammaticalNumbers, morphologicalForms, genders] = [
          'Stem',
          'Tense',
          'Case',
          'State',
          'Mood',
          'Person',
          'Grammatical Number',
          'Morphological Form',
          'Gender',
        ].map((varType) => getVariables(varType, formGrammarRows, cliticSuffixUuid));

        return {
          ...form,
          stems,
          tenses,
          cases,
          states,
          moods,
          persons,
          grammaticalNumbers,
          morphologicalForms,
          genders,
          spellings: formSpellings[i],
          suffix,
          clitics: getVariables('Clitic', formGrammarRows, cliticSuffixUuid).sort((a, b) => {
            if (a === 'suf.') return 1;
            if (b === 'suf.') return -1;
            return 0;
          }),
        };
      })
      .sort((a, b) => a.form.localeCompare(b.form));
  }
}

export default new DictionaryFormDao();
