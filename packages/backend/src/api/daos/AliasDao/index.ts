import knex from '@/connection';
import { Knex } from 'knex';
import { v4 } from 'uuid';

class AliasDao {
  async getAliasNames(uuid: string, trx?: Knex.Transaction): Promise<string[]> {
    const k = trx || knex;
    const names = await k('alias')
      .pluck('name')
      .where('alias.reference_uuid', uuid)
      .orderBy('primacy');
    return names;
  }

  async insertAlias(
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

  async removeAliasByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    await k('alias').del().where({ reference_uuid: referenceUuid });
  }
}

export default new AliasDao();
