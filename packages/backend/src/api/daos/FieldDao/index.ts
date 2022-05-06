import { v4 } from 'uuid';
import { knexRead, knexWrite } from '@/connection';

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
  async getByReferenceUuid(referenceUuid: string): Promise<FieldRow[]> {
    return knexRead()('field')
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
    options?: FieldOptions
  ): Promise<string> {
    const uuid = v4();
    await knexWrite()('field').insert({
      uuid,
      reference_uuid: referenceUuid,
      type,
      field,
      primacy: options && options.primacy ? options.primacy : null,
    });
    return uuid;
  }

  async updateField(uuid: string, field: string, options?: FieldOptions) {
    await knexWrite()('field')
      .update({
        field,
        primacy: options && options.primacy ? options.primacy : null,
      })
      .where({ uuid });
  }

  async deleteField(uuid: string) {
    await knexWrite()('field').del().where({ uuid });
  }
}

export default new FieldDao();
