import { knexRead, knexWrite } from '@/connection';
import { v4 } from 'uuid';
import { DictionaryForm } from '@oare/types';
import sl from '@/serviceLocator';
import DictionarySpellingDao from '../DictionarySpellingDao';

export interface FormGrammarRow {
  propertyUuid: string;
  parentUuid: string | null;
  variable: string | null;
  valueName: string | null;
  valueAbbrev: string | null;
}

class DictionaryFormDao {
  async updateForm(uuid: string, newForm: string): Promise<void> {
    await knexWrite()('dictionary_form')
      .update({ form: newForm })
      .where({ uuid });
  }

  async getWordForms(
    wordUuid: string,
    isAdmin: boolean,
    htmlSpelling = false
  ): Promise<DictionaryForm[]> {
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');

    const forms: { uuid: string; form: string }[] = await knexRead()(
      'dictionary_form'
    )
      .select('uuid', 'form')
      .where('reference_uuid', wordUuid);

    const formSpellings = await Promise.all(
      forms.map(f =>
        DictionarySpellingDao.getFormSpellings(f.uuid, isAdmin, htmlSpelling)
      )
    );

    const formProperties = await Promise.all(
      forms.map(form =>
        ItemPropertiesDao.getPropertiesByReferenceUuid(form.uuid)
      )
    );

    return forms
      .map((form, i) => ({
        ...form,
        properties: formProperties[i],
        spellings: formSpellings[i],
      }))
      .filter(form => (isAdmin ? form : form.spellings.length > 0))
      .sort((a, b) => a.form.localeCompare(b.form));
  }

  async getDictionaryWordUuidByFormUuid(formUuid: string): Promise<string> {
    const row: { referenceUuid: string } = await knexRead()('dictionary_form')
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
    const row: { form: string } = await knexRead()('dictionary_form')
      .where('uuid', spellingUuids)
      .select('form')
      .first();

    return row.form;
  }

  async addForm(wordUuid: string, formSpelling: string): Promise<string> {
    const newFormUuid = v4();
    await knexWrite()('dictionary_form').insert({
      uuid: newFormUuid,
      reference_uuid: wordUuid,
      form: formSpelling,
    });
    return newFormUuid;
  }
}

export default new DictionaryFormDao();
