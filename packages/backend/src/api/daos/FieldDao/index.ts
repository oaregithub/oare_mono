import { v4 } from 'uuid';
import { knexRead, knexWrite } from '@/connection';
import { Knex } from 'knex';

interface FieldRow {
  id: number;
  uuid: string;
  reference_uuid: string;
  type: string | null;
  language: string | null;
  primary: number | null;
  field: string | null;
}

interface FieldOptions {
  primacy?: number;
}
class FieldDao {
  async getByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<FieldRow[]> {
    const k = trx || knexRead();
    return k('field')
      .select()
      .where({
        reference_uuid: referenceUuid,
      })
      .orderBy('primacy');
  }

  async insertField(
    referenceUuid: string,
    type: string,
    field: string,
    primacy: number | null,
    language: string | null,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knexWrite();
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

  async updateField(
    uuid: string,
    field: string,
    options?: FieldOptions,
    trx?: Knex.Transaction
  ) {
    const k = trx || knexWrite();
    await k('field')
      .update({
        field,
        primacy: options && options.primacy ? options.primacy : null,
      })
      .where({ uuid });
  }

  async deleteField(uuid: string, trx?: Knex.Transaction) {
    const k = trx || knexWrite();
    await k('field').del().where({ uuid });
  }
}

export default new FieldDao();
