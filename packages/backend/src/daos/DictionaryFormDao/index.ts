import knex from '@/connection';
import {
  DictionaryForm,
  DictionaryFormRow,
  DictionarySpelling,
} from '@oare/types';
import sl from '@/serviceLocator';
import { Knex } from 'knex';

// COMPLETE

export interface FormGrammarRow {
  propertyUuid: string;
  parentUuid: string | null;
  variable: string | null;
  valueName: string | null;
  valueAbbrev: string | null;
}

class DictionaryFormDao {
  async updateFormSpelling(
    uuid: string,
    form: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('dictionary_form').update({ form }).where({ uuid });
  }

  async getDictionaryFormUuidsByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const uuids: string[] = await k('dictionary_form')
      .pluck('uuid')
      .where({ reference_uuid: referenceUuid });

    return uuids;
  }

  async addForm(
    uuid: string,
    wordUuid: string,
    formSpelling: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('dictionary_form').insert({
      uuid,
      reference_uuid: wordUuid,
      form: formSpelling,
    });
  }

  async getDictionaryFormRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<DictionaryFormRow> {
    const k = trx || knex;

    const row: DictionaryFormRow | undefined = await k('dictionary_form')
      .select('uuid', 'reference_uuid as referenceUuid', 'form', 'mash')
      .where({ uuid })
      .first();

    if (!row) {
      throw new Error(`Form with UUID ${uuid} does not exist`);
    }

    return row;
  }

  async getDictionaryFormByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<DictionaryForm> {
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');
    const DictionarySpellingDao = sl.get('DictionarySpellingDao');

    const row = await this.getDictionaryFormRowByUuid(uuid, trx);

    const properties = await ItemPropertiesDao.getItemPropertiesByReferenceUuid(
      uuid,
      trx
    );

    const spellingUuids = await DictionarySpellingDao.getDictionarySpellingUuidsByReferenceUuid(
      uuid,
      trx
    );
    const spellings: DictionarySpelling[] = await Promise.all(
      spellingUuids.map(spellingUuid =>
        DictionarySpellingDao.getDictionarySpellingByUuid(spellingUuid, trx)
      )
    );

    const form: DictionaryForm = {
      ...row,
      properties,
      spellings,
    };

    return form;
  }
}

export default new DictionaryFormDao();
