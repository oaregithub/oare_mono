import { knexRead, knexWrite } from '@/connection';
import { v4 } from 'uuid';

class AliasDao {
  async getAliasNames(uuid: string): Promise<string[]> {
    const names = await knexRead()('alias')
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
    primacy: number | null
  ): Promise<void> {
    const uuid = v4();
    await knexWrite()('alias').insert({
      uuid,
      type,
      reference_uuid: referenceUuid,
      name,
      name_type: nameType,
      language,
      primacy,
    });
  }
}

export default new AliasDao();
