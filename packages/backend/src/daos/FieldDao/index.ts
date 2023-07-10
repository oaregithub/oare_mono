import { v4 } from 'uuid';
import knex from '@/connection';
import { Knex } from 'knex';
import { FieldRow, FieldType } from '@oare/types';

class FieldDao {
  /**
   * Retreieves a singled field row by its UUID.
   * @param uuid The UUID of the field row to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns The single field row.
   * @throws Error if no field row found.
   */
  public async getFieldRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<FieldRow> {
    const k = trx || knex;

    const row: FieldRow | undefined = await k('field')
      .select(
        'uuid',
        'reference_uuid as referenceUuid',
        'type',
        'language',
        'primacy',
        'field',
        'source_uuid as sourceUuid'
      )
      .where({ uuid })
      .first();

    if (!row) {
      throw new Error(`Field with uuid ${uuid} does not exist`);
    }

    return row;
  }

  /**
   * Checks if a field exists.
   * @param uuid The UUID of the field to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the field exists.
   */
  public async fieldExists(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const field = await k('field').first().where({ uuid });

    return !!field;
  }

  /**
   * Retrieves all field rows with the given reference UUID and type.
   * @param referenceUuid The reference UUID.
   * @param type The field type.
   * @param trx Knex Transaction. Optional.
   * @returns An array of field rows with the given reference UUID and type.
   * @throws Error if one or more referenced field rows don't exist.
   */
  public async getFieldRowsByReferenceUuidAndType(
    referenceUuid: string,
    type: FieldType,
    trx?: Knex.Transaction
  ): Promise<FieldRow[]> {
    const fieldUuids = await this.getFieldUuidsByReferenceUuidAndType(
      referenceUuid,
      type
    );

    const rows = await Promise.all(
      fieldUuids.map(uuid => this.getFieldRowByUuid(uuid, trx))
    );

    return rows;
  }

  /**
   * Retrieves a list of UUIDs of field rows with the given reference UUID and type.
   * @param referenceUuid The reference UUID.
   * @param type The field type.
   * @param trx Knex Transaction. Optional.
   * @returns Array of UUIDs of field rows with the given reference UUID and type.
   */
  private async getFieldUuidsByReferenceUuidAndType(
    referenceUuid: string,
    type: FieldType,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const uuids = await k('field')
      .pluck('uuid')
      .where({ reference_uuid: referenceUuid, type })
      .orderBy('primacy');

    return uuids;
  }

  /**
   * Inserts a new field row.
   * @param referenceUuid The reference UUID.
   * @param type The field type.
   * @param field The field value.
   * @param primacy The field primacy.
   * @param language The field language.
   * @param trx Knex Transaction. Optional.
   * @returns The UUID of the newly inserted field row.
   */
  public async insertField(
    referenceUuid: string,
    type: FieldType,
    field: string,
    primacy: number | null,
    language: string | null,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knex;

    const uuid = v4();

    await k('field').insert({
      uuid,
      reference_uuid: referenceUuid,
      type,
      field,
      primacy,
      language,
    });

    return uuid;
  }

  /**
   * Updates a field row.
   * @param uuid The UUID of the field row to update.
   * @param field The field value.
   * @param language The field language.
   * @param type The field type.
   * @param primacy The field primacy.
   * @param trx Knex Transaction. Optional.
   */
  public async updateField(
    uuid: string,
    field: string,
    language: string | null,
    type: FieldType,
    primacy: number | null,
    trx?: Knex.Transaction
  ) {
    const k = trx || knex;
    await k('field')
      .update({
        field,
        language,
        type,
        primacy,
      })
      .where({ uuid });
  }

  /**
   * Deletes a field row by its UUID.
   * @param uuid The UUID of the field row to delete.
   * @param trx Knex Transaction. Optional.
   */
  public async deleteField(uuid: string, trx?: Knex.Transaction) {
    const k = trx || knex;

    await k('field').del().where({ uuid });
  }

  /**
   * Deletes all field rows with the given reference UUID and type after a previously deleted field row. Used after deleting a field row to maintain primacy ordering.
   * @param referenceUuid The reference UUID.
   * @param deletedPrimacy The primacy of the deleted field row.
   * @param type The field type.
   * @param trx Knex Transaction. Optional.
   */
  public async decrementPrimacy(
    referenceUuid: string,
    deletedPrimacy: number,
    type: FieldType,
    trx?: Knex.Transaction
  ) {
    const k = trx || knex;

    await k('field')
      .decrement('primacy', 1)
      .where({ reference_uuid: referenceUuid, type })
      .andWhere('primacy', '>=', deletedPrimacy);
  }
}

/**
 * FieldDao instance as a singleton.
 */
export default new FieldDao();
