import knex from '@/connection';
import { Knex } from 'knex';
import { v4 } from 'uuid';

// COMPLETE

class AliasDao {
  /**
   * Retrieves a list of alias names for a given reference UUID.
   * @param referenceUuid The reference UUID to retrieve alias names for.
   * @param trx Knex Transaction. Optional.
   * @returns Array of alias names.
   */
  public async getAliasNamesByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const names: string[] = await k('alias')
      .pluck('name')
      .where({ reference_uuid: referenceUuid })
      .orderBy('primacy');

    return names;
  }

  /**
   * Inserts new row into the `alias` table.
   * @param type Alias type.
   * @param referenceUuid UUID that the alias refers to.
   * @param name Alias name.
   * @param nameType Type of the alias name.
   * @param language Language of the alias name.
   * @param primacy Relative primacy of the alias name.
   * @param trx Knex Transaction. Optional.
   */
  public async insertAliasRow(
    type: string,
    referenceUuid: string,
    name: string,
    nameType: string | null,
    language: string | null,
    primacy: number | null,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    const uuid = v4();

    await k('alias').insert({
      uuid,
      type,
      reference_uuid: referenceUuid,
      name,
      name_type: nameType,
      language,
      primacy,
    });
  }

  /**
   * Updates the name of an alias.
   * @param referenceUuid The reference UUID of the alias to edit.
   * @param name The new name of the alias.
   * @param primacy The primacy of the alias to edit.
   * @param trx Knex Transaction. Optional.
   */
  public async updateName(
    referenceUuid: string,
    name: string,
    primacy: number,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('alias')
      .update({ name })
      .where({ reference_uuid: referenceUuid, primacy });
  }
}

/**
 * AliasDao instance as a singleton
 */
export default new AliasDao();
