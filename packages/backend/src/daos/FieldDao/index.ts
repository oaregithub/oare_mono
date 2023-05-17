import { v4 } from 'uuid';
import knex from '@/connection';
import { Knex } from 'knex';
import { FieldRow } from '@oare/types';
import DetectLanguage, { DetectionResult } from 'detectlanguage';
import { getDetectLanguageAPIKEY } from '@/utils';
import { languages } from './utils';

interface FieldOptions {
  primacy?: number;
}
class FieldDao {
  async getFieldRowsByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<FieldRow[]> {
    const k = trx || knex;
    return k('field')
      .select(
        'uuid',
        'reference_uuid as referenceUuid',
        'type',
        'language',
        'primacy',
        'field',
        'source_uuid as sourceUuid'
      )
      .where({
        reference_uuid: referenceUuid,
      })
      .orderBy('primacy');
  }

  async getFieldRowsByReferenceUuidAndType(
    referenceUuid: string,
    type: string,
    trx?: Knex.Transaction
  ): Promise<FieldRow[]> {
    const k = trx || knex;

    const rows: FieldRow[] = await k('field')
      .select(
        'uuid',
        'reference_uuid as referenceUuid',
        'type',
        'language',
        'primacy',
        'field',
        'source_uuid as sourceUuid'
      )
      .where({ reference_uuid: referenceUuid, type })
      .orderBy('primacy');

    return rows;
  }

  async insertField(
    referenceUuid: string,
    type: string,
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

  async updateField(
    uuid: string,
    field: string,
    options?: FieldOptions,
    trx?: Knex.Transaction
  ) {
    const k = trx || knex;
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
    const k = trx || knex;
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
    const k = trx || knex;
    await k('field').del().where({ uuid });
  }

  async removeFieldRowsByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
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
    type: string,
    trx?: Knex.Transaction
  ) {
    const k = trx || knex;
    await k('field')
      .decrement('primacy', 1)
      .where({ reference_uuid: referenceUuid })
      .andWhere('primacy', '>=', deletedPrimacy)
      .andWhere({ type });
  }
}

export default new FieldDao();
