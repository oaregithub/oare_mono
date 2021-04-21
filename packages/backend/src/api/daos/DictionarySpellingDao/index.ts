import { v4 } from 'uuid';
import knex from '@/connection';
import { FormSpelling } from '@oare/types';
import Knex from 'knex';
import TextDiscourseDao from '../TextDiscourseDao';

export interface DictionarySpellingRows {
  uuid: string;
  referenceUuid: string;
  explicitSpelling: string;
}

class DictionarySpellingDao {
  async updateSpelling(
    uuid: string,
    newSpelling: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    await k('dictionary_spelling')
      .update('explicit_spelling', newSpelling)
      .where({ uuid });
  }

  async getFormSpellings(formUuid: string): Promise<FormSpelling[]> {
    const rows: FormSpelling[] = await knex('dictionary_spelling')
      .select('uuid', 'explicit_spelling AS spelling')
      .where('reference_uuid', formUuid);

    return rows;
  }

  async spellingExistsOnForm(
    formUuid: string,
    spelling: string
  ): Promise<boolean> {
    const row = await knex('dictionary_spelling')
      .select()
      .where({
        reference_uuid: formUuid,
        explicit_spelling: spelling,
      })
      .first();

    return !!row;
  }

  async addSpelling(formUuid: string, spelling: string): Promise<string> {
    const uuid = v4();
    await knex('dictionary_spelling').insert({
      uuid,
      reference_uuid: formUuid,
      spelling,
      explicit_spelling: spelling,
    });
    return uuid;
  }

  async deleteSpelling(
    spellingUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('dictionary_spelling').del().where('uuid', spellingUuid);
  }

  async getSpellingByUuid(spellingUuid: string): Promise<string> {
    const row: { explicit_spelling: string } = await knex('dictionary_spelling')
      .where('uuid', spellingUuid)
      .select('explicit_spelling')
      .first();

    return row.explicit_spelling;
  }

  async getDictionarySpellingRows(): Promise<DictionarySpellingRows[]> {
    const spellings: DictionarySpellingRows[] = await knex(
      'dictionary_spelling AS ds'
    ).select(
      'ds.uuid',
      'ds.reference_uuid AS referenceUuid',
      'ds.explicit_spelling AS explicitSpelling'
    );
    return spellings;
  }

  async getFormUuidBySpellingUuid(spellingUuid: string): Promise<string> {
    const row: { referenceUuid: string } = await knex('dictionary_spelling')
      .where('uuid', spellingUuid)
      .select('reference_uuid AS referenceUuid')
      .first();

    if (!row) {
      throw new Error(`Spelling with UUID ${spellingUuid} does not exist`);
    }

    return row.referenceUuid;
  }
}

export default new DictionarySpellingDao();
