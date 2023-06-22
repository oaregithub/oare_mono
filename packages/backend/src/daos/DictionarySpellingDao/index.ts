import knex from '@/connection';
import { DictionarySpelling, DictionarySpellingRow } from '@oare/types';
import { Knex } from 'knex';
import { spellingHtmlReading } from '@oare/oare';
import sl from '@/serviceLocator';

// COMPLETE

export interface DictionarySpellingRows {
  uuid: string;
  referenceUuid: string;
  explicitSpelling: string;
}

class DictionarySpellingDao {
  async updateSpelling(
    uuid: string,
    spelling: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('dictionary_spelling')
      .update({ spelling, explicit_spelling: spelling })
      .where({ uuid });
  }

  async getDictionarySpellingUuidsByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const uuids: string[] = await k('dictionary_spelling')
      .pluck('uuid')
      .where({ reference_uuid: referenceUuid });

    return uuids;
  }

  async getDictionarySpellingRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<DictionarySpellingRow> {
    const k = trx || knex;

    const row: DictionarySpellingRow | undefined = await k(
      'dictionary_spelling'
    )
      .select(
        'uuid',
        'reference_uuid as referenceUuid',
        'spelling',
        'explicit_spelling as explicitSpelling',
        'mash'
      )
      .where({ uuid })
      .first();

    if (!row) {
      throw new Error(`Spelling with UUID ${uuid} does not exist`);
    }

    return row;
  }

  async getDictionarySpellingByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<DictionarySpelling> {
    const TextDiscourseDao = sl.get('TextDiscourseDao');

    const row = await this.getDictionarySpellingRowByUuid(uuid, trx);

    const hasOccurrence = await TextDiscourseDao.hasSpellingOccurrence(
      uuid,
      trx
    );

    const htmlSpelling = spellingHtmlReading(row.explicitSpelling);

    const spelling: DictionarySpelling = {
      ...row,
      hasOccurrence,
      htmlSpelling,
    };

    return spelling;
  }

  async spellingExistsOnForm(
    formUuid: string,
    spelling: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const row = await k('dictionary_spelling')
      .where({
        reference_uuid: formUuid,
        explicit_spelling: spelling,
      })
      .first();

    return !!row;
  }

  async addSpelling(
    uuid: string,
    formUuid: string,
    spelling: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('dictionary_spelling').insert({
      uuid,
      reference_uuid: formUuid,
      spelling,
      explicit_spelling: spelling,
    });
  }

  async deleteSpelling(uuid: string, trx?: Knex.Transaction): Promise<void> {
    const k = trx || knex;

    await k('dictionary_spelling').del().where({ uuid });
  }
}

export default new DictionarySpellingDao();
