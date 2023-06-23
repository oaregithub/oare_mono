import knex from '@/connection';
import {
  DictionaryForm,
  DictionaryFormRow,
  DictionarySpelling,
} from '@oare/types';
import sl from '@/serviceLocator';
import { Knex } from 'knex';

// COMPLETE

class DictionaryFormDao {
  /**
   * Updates the spelling of a given form. This is the `form` column.
   * @param uuid The UUID of the form to update.
   * @param form The new spelling of the form.
   * @param trx Knex Transaction. Optional.
   */
  public async updateFormSpelling(
    uuid: string,
    form: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('dictionary_form').update({ form }).where({ uuid });
  }

  /**
   * Retrieves a list of form UUIDs that have the specified reference UUID.
   * This means that they are forms of the same word.
   * @param referenceUuid The UUID of the word that the forms belong to.
   * @param trx Knex Transaction. Optional.
   * @returns An array of form UUIDs.
   */
  public async getDictionaryFormUuidsByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const uuids: string[] = await k('dictionary_form')
      .pluck('uuid')
      .where({ reference_uuid: referenceUuid });

    return uuids;
  }

  /**
   * Inserts a new form row.
   * @param uuid The UUID of the new form.
   * @param wordUuid The UUID of the word that the form belongs to.
   * @param formSpelling The spelling of the form.
   * @param trx Knex Transaction. Optional.
   */
  public async addForm(
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

  /**
   * Retrieves a single dictionary_form row by UUID.
   * @param uuid The UUID of the form to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A single dictionary_form row.
   */
  public async getDictionaryFormRowByUuid(
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

  /**
   * Constructs a DictionaryForm object for a given UUID.
   * @param uuid The UUID of the form to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A DictionaryForm object.
   */
  public async getDictionaryFormByUuid(
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

/**
 * DictionaryFormDao instance as a singleton.
 */
export default new DictionaryFormDao();
