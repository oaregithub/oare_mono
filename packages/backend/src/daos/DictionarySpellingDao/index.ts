import knex from '@/connection';
import { DictionarySpelling, DictionarySpellingRow } from '@oare/types';
import { Knex } from 'knex';
import { spellingHtmlReading } from '@oare/oare';
import sl from '@/serviceLocator';

class DictionarySpellingDao {
  /**
   * Updates the spelling of a spelling. This also updates the explicit spelling.
   * @param uuid The UUID of the spelling to update.
   * @param spelling The new spelling.
   * @param trx Knex Transaction. Optional.
   */
  public async updateSpelling(
    uuid: string,
    spelling: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('dictionary_spelling')
      .update({ spelling, explicit_spelling: spelling })
      .where({ uuid });
  }

  /**
   * Retrieves a list of spelling UUIDs that have the specified reference UUID.
   * This means that they are spellings of the same form.
   * @param referenceUuid The UUID of the form that the spellings belong to.
   * @param trx Knex Transaction. Optional.
   * @returns An array of spelling UUIDs.
   */
  public async getDictionarySpellingUuidsByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const uuids: string[] = await k('dictionary_spelling')
      .pluck('uuid')
      .where({ reference_uuid: referenceUuid });

    return uuids;
  }

  /**
   * Retrieves a single dictionary_spelling row by UUID.
   * @param uuid The UUID of the spelling to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A single dictionary_spelling row.
   */
  public async getDictionarySpellingRowByUuid(
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

  /**
   * Constructs a DictionarySpelling object for a given UUID.
   * @param uuid The UUID of the spelling to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A DictionarySpelling object.
   */
  public async getDictionarySpellingByUuid(
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

  /**
   * Checks if a spelling already exists on a form.
   * @param formUuid The UUID of the form to check.
   * @param spelling The spelling to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the spelling exists on the form.
   */
  public async spellingExistsOnForm(
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

  /**
   * Inserts a new spelling into the database.
   * @param uuid The UUID of the spelling.
   * @param formUuid The UUID of the form that the spelling belongs to.
   * @param spelling The new spelling.
   * @param trx Knex Transaction. Optional.
   */
  public async addSpelling(
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

  /**
   * Removes a spelling from the database.
   * @param uuid The UUID of the spelling to remove.
   * @param trx Knex Transaction. Optional.
   */
  public async deleteSpelling(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('dictionary_spelling').del().where({ uuid });
  }
}

/**
 * DictionarySpellingDao instance as a singleton.
 */
export default new DictionarySpellingDao();
