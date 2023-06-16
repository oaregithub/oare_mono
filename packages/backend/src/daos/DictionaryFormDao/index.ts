import knex from '@/connection';
import { v4 } from 'uuid';
import { DictionaryForm, DictionaryFormRow } from '@oare/types';
import sl from '@/serviceLocator';
import { Knex } from 'knex';
import DictionarySpellingDao from '../DictionarySpellingDao';

// FIXME

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
    const k = trx || knex;
    await k('dictionary_form').update({ form: newForm }).where({ uuid });
  }

  async getWordForms(
    wordUuid: string,
    htmlSpelling = false,
    trx?: Knex.Transaction
  ): Promise<DictionaryForm[]> {
    const k = trx || knex;
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
        ItemPropertiesDao.getItemPropertiesByReferenceUuid(form.uuid, trx)
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
    const k = trx || knex;
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
    const k = trx || knex;
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
    const k = trx || knex;
    const newFormUuid = v4();
    await k('dictionary_form').insert({
      uuid: newFormUuid,
      reference_uuid: wordUuid,
      form: formSpelling,
    });
    return newFormUuid;
  }

  async getFormByUuid(
    formUuid: string,
    trx?: Knex.Transaction
  ): Promise<DictionaryFormRow> {
    const k = trx || knex;
    const row: DictionaryFormRow = await k('dictionary_form')
      .where('uuid', formUuid)
      .select('uuid', 'reference_uuid as referenceUuid', 'form', 'mash')
      .first();

    if (!row) {
      throw new Error(`Form with UUID ${formUuid} does not exist`);
    }

    return row;
  }
}

export default new DictionaryFormDao();
