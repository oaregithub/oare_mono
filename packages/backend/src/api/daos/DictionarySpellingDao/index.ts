import { v4 } from 'uuid';
import { knexRead, knexWrite } from '@/connection';
import { FormSpelling } from '@oare/types';
import { Knex } from 'knex';
import { spellingHtmlReading } from '@oare/oare';
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
    const k = trx || knexWrite();
    await k('dictionary_spelling')
      .update('explicit_spelling', newSpelling)
      .where({ uuid });
  }

  async getFormSpellings(
    formUuid: string,
    isAdmin: boolean,
    htmlSpelling: boolean
  ): Promise<FormSpelling[]> {
    const rows: FormSpelling[] = await knexRead()('dictionary_spelling')
      .select('uuid', 'explicit_spelling AS spelling')
      .where('reference_uuid', formUuid);

    const hasOccurrences = await Promise.all(
      rows.map(row => TextDiscourseDao.hasSpellingOccurrence(row.uuid))
    );

    let resultRows: FormSpelling[];

    if (htmlSpelling) {
      const htmlSpellings = rows.map(row => spellingHtmlReading(row.spelling));
      resultRows = rows.map((row, idx) => ({
        ...row,
        hasOccurrence: hasOccurrences[idx],
        htmlSpelling: htmlSpellings[idx],
      }));
    } else {
      resultRows = rows.map((row, idx) => ({
        ...row,
        hasOccurrence: hasOccurrences[idx],
      }));
    }

    if (isAdmin) {
      return resultRows;
    }
    return resultRows.filter(row => row.hasOccurrence);
  }

  async spellingExistsOnForm(
    formUuid: string,
    spelling: string
  ): Promise<boolean> {
    const row = await knexRead()('dictionary_spelling')
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
    await knexWrite()('dictionary_spelling').insert({
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
    const k = trx || knexWrite();

    await k('dictionary_spelling').del().where('uuid', spellingUuid);
  }

  async getSpellingByUuid(spellingUuid: string): Promise<string> {
    const row: { explicit_spelling: string } = await knexRead()(
      'dictionary_spelling'
    )
      .where('uuid', spellingUuid)
      .select('explicit_spelling')
      .first();

    return row.explicit_spelling;
  }

  async getFormUuidBySpellingUuid(spellingUuid: string): Promise<string> {
    const row: { referenceUuid: string } = await knexRead()(
      'dictionary_spelling'
    )
      .where('uuid', spellingUuid)
      .select('reference_uuid AS referenceUuid')
      .first();

    if (!row) {
      throw new Error(`Spelling with UUID ${spellingUuid} does not exist`);
    }

    return row.referenceUuid;
  }

  async getUuidBySpelling(spelling: string, formUuid: string): Promise<string> {
    const row: { uuid: string } = await knexRead()('dictionary_spelling')
      .where('reference_uuid', formUuid)
      .andWhere('explicit_spelling', spelling)
      .select('uuid')
      .first();
    return row.uuid;
  }

  async getReferenceUuidsBySpellingUuid(
    spellingUuid: string
  ): Promise<string[]> {
    const row = await knexRead()('dictionary_spelling')
      .where('uuid', spellingUuid)
      .pluck('reference_uuid');

    return row;
  }
}

export default new DictionarySpellingDao();
