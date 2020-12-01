import { v4 } from 'uuid';
import knex from '@/connection';
import { FormSpelling } from '@oare/types';
import TextDiscourseDao from '../TextDiscourseDao';
import Knex from 'knex';

class DictionarySpellingDao {
  async updateSpelling(uuid: string, newSpelling: string): Promise<void> {
    await knex('dictionary_spelling').update('explicit_spelling', newSpelling).where({ uuid });
  }

  async getFormSpellings(formUuid: string): Promise<FormSpelling[]> {
    interface FormSpellingRow {
      uuid: string;
      spelling: string;
    }

    const rows: FormSpellingRow[] = await knex('dictionary_spelling')
      .select('uuid', 'explicit_spelling AS spelling')
      .where('reference_uuid', formUuid);

    const spellingTexts = await Promise.all(rows.map((r) => TextDiscourseDao.getSpellingTexts(r.uuid)));

    return rows.map((r, i) => ({
      ...r,
      texts: spellingTexts[i],
    }));
  }

  async spellingExistsOnForm(formUuid: string, spelling: string): Promise<boolean> {
    const row = await knex('dictionary_spelling')
      .select()
      .where({
        reference_uuid: formUuid,
        explicit_spelling: spelling,
      })
      .first();

    return !!row;
  }

  async addSpelling(formUuid: string, spelling: string): Promise<string> {
    const uuid = v4();
    await knex('dictionary_spelling').insert({
      uuid,
      reference_uuid: formUuid,
      spelling,
      explicit_spelling: spelling,
    });
    return uuid;
  }

  async deleteSpelling(spellingUuid: string, postDelete?: (trx: Knex.Transaction) => Promise<void>): Promise<void> {
    await knex.transaction(async (trx) => {
      await trx('dictionary_spelling').del().where('uuid', spellingUuid);

      if (postDelete) {
        await postDelete(trx);
      }
    });
  }
}

export default new DictionarySpellingDao();
