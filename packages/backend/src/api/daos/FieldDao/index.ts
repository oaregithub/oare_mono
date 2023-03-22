import { v4 } from 'uuid';
import { knexRead, knexWrite } from '@/connection';
import { Knex } from 'knex';
import { FieldInfo } from '@oare/types';
import DetectLanguage, { DetectionResult } from 'detectlanguage';
import { getDetectLanguageAPIKEY } from '@/utils';
import { languages } from './utils';

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

  async getFieldInfoByReferenceAndType(
    referenceUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<FieldInfo> {
    const k = trx || knexRead();
    return k('field')
      .select(
        'field.field',
        'field.uuid',
        'field.primacy',
        'field.language',
        'field.reference_uuid as referenceUuid'
      )
      .where('field.reference_uuid', referenceUuid)
      .andWhere('field.type', 'description')
      .first();
  }

  async getDefinitionsByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<FieldRow[]> {
    const k = trx || knexRead();
    return k('field')
      .select()
      .where({
        reference_uuid: referenceUuid,
      })
      .andWhere('type', 'definition')
      .orderBy('primacy');
  }

  async getDiscussionLemmasByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<FieldRow[]> {
    const k = trx || knexRead();
    return k('field')
      .select()
      .where({
        reference_uuid: referenceUuid,
      })
      .andWhere('type', 'discussionLemma')
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
        primacy:
          options && options.primacy !== undefined ? options.primacy : null,
      })
      .where({ uuid });
  }

  async updateAllFieldFields(
    uuid: string,
    field: string,
    language: string | null,
    type: string | null,
    options?: FieldOptions,
    trx?: Knex.Transaction
  ) {
    const k = trx || knexWrite();
    await k('field')
      .update({
        field,
        language,
        type,
        primacy:
          options && options.primacy !== undefined ? options.primacy : null,
      })
      .where({ uuid });
  }

  async deleteField(uuid: string, trx?: Knex.Transaction) {
    const k = trx || knexWrite();
    await k('field').del().where({ uuid });
  }

  async removeFieldRowsByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    await k('field').del().where({ reference_uuid: referenceUuid });
  }

  async detectLanguage(text: string): Promise<string> {
    const apiKey: string = await getDetectLanguageAPIKEY();
    const detectLanguageAPI = new DetectLanguage(apiKey);

    const language:
      | { code: string; name: string }
      | undefined = await detectLanguageAPI
      .detect(text)
      .then((results: DetectionResult[]) =>
        languages.find(lang => lang.code === results[0].language)
      );
    return language?.name ?? 'unknown';
  }

  async decrementPrimacy(
    deletedPrimacy: number,
    referenceUuid: string,
    trx?: Knex.Transaction
  ) {
    const k = trx || knexWrite();
    await k('field')
      .decrement('primacy', 1)
      .where({ reference_uuid: referenceUuid })
      .andWhere('primacy', '>=', deletedPrimacy);
  }
}

export default new FieldDao();
