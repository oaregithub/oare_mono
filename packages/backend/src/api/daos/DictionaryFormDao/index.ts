import knex from '@/connection';
import { DictionaryForm, DictionaryFormGrammar } from '@oare/types';
import DictionarySpellingDao from '../DictionarySpellingDao';

export interface FormGrammarRow {
  propertyUuid: string;
  parentUuid: string | null;
  variable: string | null;
  valueName: string | null;
  valueAbbrev: string | null;
}

function getCliticSuffixUuid(grammarRows: FormGrammarRow[]): string | null {
  const cliticRow = grammarRows.find(
    row => row.variable === 'Clitic' && row.valueName === 'Suffix pronoun'
  );
  return cliticRow ? cliticRow.propertyUuid : null;
}

function getVariables(
  variable: string,
  grammarRows: FormGrammarRow[],
  cliticUuid: string | null
): string[] {
  const valueRows = grammarRows.filter(
    row => row.variable === variable && row.parentUuid !== cliticUuid
  );

  const values = valueRows
    .map(row => row.valueAbbrev || '')
    .filter(row => row !== '');
  return values;
}

function getSuffixVariables(
  variable: string,
  grammarRows: FormGrammarRow[],
  cliticUuid: string
): string[] {
  const valueRows = grammarRows.filter(
    row => row.variable === variable && row.parentUuid === cliticUuid
  );

  const values = valueRows
    .map(row => row.valueAbbrev || '')
    .filter(row => row !== '');
  return values;
}

class DictionaryFormDao {
  async updateForm(uuid: string, newForm: string): Promise<void> {
    await knex('dictionary_form').update({ form: newForm }).where({ uuid });
  }

  async getFormGrammar(formUuid: string): Promise<DictionaryFormGrammar> {
    const grammarRows: FormGrammarRow[] = await knex('dictionary_form AS df')
      .select(
        'ip.uuid AS propertyUuid',
        'ip.parent_uuid AS parentUuid',
        'a1.name AS variable',
        'a2.name AS valueName',
        'a3.name AS valueAbbrev'
      )
      .leftJoin('item_properties AS ip', 'ip.reference_uuid', 'df.uuid')
      .leftJoin('alias AS a1', 'a1.reference_uuid', 'ip.variable_uuid')
      .leftJoin('alias AS a2', 'a2.reference_uuid', 'ip.value_uuid')
      .leftJoin('alias AS a3', 'a3.reference_uuid', 'ip.value_uuid')
      .where('df.uuid', formUuid)
      .andWhere('a2.type', '!=', 'abbreviation')
      .andWhere('a3.type', 'abbreviation');

    const cliticSuffixUuid = getCliticSuffixUuid(grammarRows);

    let suffix = null;
    if (cliticSuffixUuid) {
      const [persons, cases, genders, grammaticalNumbers] = [
        'Person',
        'Case',
        'Gender',
        'Grammatical Number',
      ].map(varValue =>
        getSuffixVariables(varValue, grammarRows, cliticSuffixUuid)
      );
      suffix = {
        persons,
        cases,
        genders,
        grammaticalNumbers,
      };
    }

    const [
      stems,
      tenses,
      cases,
      states,
      moods,
      persons,
      grammaticalNumbers,
      morphologicalForms,
      genders,
    ] = [
      'Stem',
      'Tense',
      'Case',
      'State',
      'Mood',
      'Person',
      'Grammatical Number',
      'Morphological Form',
      'Gender',
    ].map(varType => getVariables(varType, grammarRows, cliticSuffixUuid));

    return {
      stems,
      tenses,
      cases,
      states,
      moods,
      persons,
      grammaticalNumbers,
      morphologicalForms,
      genders,
      suffix,
      clitics: getVariables('Clitic', grammarRows, cliticSuffixUuid).sort(
        (a, b) => {
          if (a === 'suf.') return 1;
          if (b === 'suf.') return -1;
          return 0;
        }
      ),
    };
  }

  async getWordForms(
    wordUuid: string,
    isAdmin: boolean
  ): Promise<DictionaryForm[]> {
    const forms: { uuid: string; form: string }[] = await knex(
      'dictionary_form'
    )
      .select('uuid', 'form')
      .where('reference_uuid', wordUuid);

    const formSpellings = await Promise.all(
      forms.map(f => DictionarySpellingDao.getFormSpellings(f.uuid, isAdmin))
    );

    const formGrammars = await Promise.all(
      forms.map(f => this.getFormGrammar(f.uuid))
    );

    return forms
      .map((form, i) => ({
        ...form,
        ...formGrammars[i],
        spellings: formSpellings[i],
      }))
      .filter(form => (isAdmin ? form : form.spellings.length > 0))
      .sort((a, b) => a.form.localeCompare(b.form));
  }

  async getDictionaryWordUuidByFormUuid(formUuid: string): Promise<string> {
    const row: { referenceUuid: string } = await knex('dictionary_form')
      .where('uuid', formUuid)
      .select('reference_uuid AS referenceUuid')
      .first();

    if (!row) {
      throw new Error(`Form with UUID ${formUuid} does not exist`);
    }

    return row.referenceUuid;
  }

  async getTranscriptionBySpellingUuids(
    spellingUuids: string[]
  ): Promise<string> {
    const row: { form: string } = await knex('dictionary_form')
      .where('uuid', spellingUuids)
      .select('form')
      .first();

    return row.form;
  }
}

export default new DictionaryFormDao();
