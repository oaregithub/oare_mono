import { knexRead, knexWrite } from '@/connection';
import { v4 } from 'uuid';
import { DictionaryForm } from '@oare/types';
import sl from '@/serviceLocator';
import { Knex } from 'knex';
import DictionarySpellingDao from '../DictionarySpellingDao';

export interface FormGrammarRow {
  propertyUuid: string;
  parentUuid: string | null;
  variable: string | null;
  valueName: string | null;
  valueAbbrev: string | null;
}

class DictionaryFormDao {
  async updateForm(
    uuid: string,
    newForm: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    await k('dictionary_form').update({ form: newForm }).where({ uuid });
  }

  async getWordForms(
    wordUuid: string,
    htmlSpelling = false,
    trx?: Knex.Transaction
  ): Promise<DictionaryForm[]> {
    const k = trx || knexRead();
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');

    const forms: { uuid: string; form: string }[] = await k('dictionary_form')
      .select('uuid', 'form')
      .where('reference_uuid', wordUuid);

    const formSpellings = await Promise.all(
      forms.map(f =>
        DictionarySpellingDao.getFormSpellings(f.uuid, htmlSpelling, trx)
      )
    );

    const formProperties = await Promise.all(
      forms.map(form =>
        ItemPropertiesDao.getPropertiesByReferenceUuid(form.uuid, trx)
      )
    );

    return forms
      .map((form, i) => ({
        ...form,
        properties: formProperties[i],
        spellings: formSpellings[i],
      }))
      .sort((a, b) => a.form.localeCompare(b.form));
  }

  async getDictionaryWordUuidByFormUuid(
    formUuid: string,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knexRead();
    const row: { referenceUuid: string } = await k('dictionary_form')
      .where('uuid', formUuid)
      .select('reference_uuid AS referenceUuid')
      .first();

    if (!row) {
      throw new Error(`Form with UUID ${formUuid} does not exist`);
    }

    return row.referenceUuid;
  }

  async getTranscriptionBySpellingUuids(
    spellingUuids: string[],
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knexRead();
    const row: { form: string } = await k('dictionary_form')
      .where('uuid', spellingUuids)
      .select('form')
      .first();

    return row.form;
  }

  async addForm(
    wordUuid: string,
    formSpelling: string,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knexWrite();
    const newFormUuid = v4();
    await k('dictionary_form').insert({
      uuid: newFormUuid,
      reference_uuid: wordUuid,
      form: formSpelling,
    });
    return newFormUuid;
  }
}

export default new DictionaryFormDao();
