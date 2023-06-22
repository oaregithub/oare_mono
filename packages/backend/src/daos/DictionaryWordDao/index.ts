import {
  DictionaryWordTypes,
  DictionaryWordRow,
  DictionaryWord,
  DictionaryForm,
} from '@oare/types';
import knex from '@/connection';
import sl from '@/serviceLocator';
import { Knex } from 'knex';
import { AkkadianLetterGroupsUpper } from '@oare/oare';

// COMPLETE

class DictionaryWordDao {
  async getDictionaryWordUuidsByTypeAndLetter(
    type: DictionaryWordTypes,
    letter: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const letters = AkkadianLetterGroupsUpper[letter];

    const uuids: string[] = await k('dictionary_word')
      .pluck('uuid')
      .where({ type })
      .andWhere(qb => {
        letters.forEach(l => {
          qb.orWhere('word', 'like', `${l.toLocaleUpperCase()}%`)
            .orWhere('word', 'like', `(${l.toLocaleUpperCase()}%`)
            .orWhere('word', 'like', `${l.toLocaleLowerCase()}%`)
            .orWhere('word', 'like', `(${l.toLocaleLowerCase()}%`);
        });
      });

    return uuids;
  }

  async updateWordSpelling(
    uuid: string,
    word: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('dictionary_word').update({ word }).where({ uuid });
  }

  async getDictionaryWordRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<DictionaryWordRow> {
    const k = trx || knex;

    const row: DictionaryWordRow | undefined = await k('dictionary_word')
      .select('uuid', 'word', 'type', 'mash')
      .where({ uuid })
      .first();

    if (!row) {
      throw new Error(`Word with uuid ${uuid} not found`);
    }

    return row;
  }

  async getDictionaryWordByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<DictionaryWord> {
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');
    const FieldDao = sl.get('FieldDao');
    const DictionaryFormDao = sl.get('DictionaryFormDao');
    const TextDiscourseDao = sl.get('TextDiscourseDao');

    const row = await this.getDictionaryWordRowByUuid(uuid, trx);

    const properties = await ItemPropertiesDao.getItemPropertiesByReferenceUuid(
      uuid,
      trx
    );

    const definitions = await FieldDao.getFieldRowsByReferenceUuidAndType(
      uuid,
      'definition',
      trx
    );

    const discussionLemmas = await FieldDao.getFieldRowsByReferenceUuidAndType(
      uuid,
      'discussionLemma',
      trx
    );

    const formUuids = await DictionaryFormDao.getDictionaryFormUuidsByReferenceUuid(
      uuid,
      trx
    );
    const forms: DictionaryForm[] = await Promise.all(
      formUuids.map(formUuid =>
        DictionaryFormDao.getDictionaryFormByUuid(formUuid, trx)
      )
    );

    const spellingUuids = forms
      .map(form => form.spellings.map(spelling => spelling.uuid))
      .flat();

    const occurrences = (
      await Promise.all(
        spellingUuids.map(spellingUuid =>
          TextDiscourseDao.getSpellingOccurrencesCount(
            spellingUuid,
            [],
            {},
            trx
          )
        )
      )
    ).reduce((sum, element) => sum + element, 0);

    const word: DictionaryWord = {
      ...row,
      properties,
      definitions,
      discussionLemmas,
      occurrences,
      forms,
    };

    return word;
  }

  async addWord(
    uuid: string,
    word: string,
    type: DictionaryWordTypes,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('dictionary_word').insert({
      uuid,
      word,
      type,
    });
  }

  async getDictionaryWordUuidsByTypeAndWord(
    type: DictionaryWordTypes,
    word: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const uuids: string[] = await k('dictionary_word')
      .pluck('uuid')
      .where({ word });

    return uuids;
  }

  async searchDictionaryWordsLinkProperties(
    search: string,
    trx?: Knex.Transaction
  ): Promise<{ uuid: string; word: string; type: string }[]> {
    const k = trx || knex;
    const rows: { uuid: string; word: string; type: string }[] = await k
      .select('dw.uuid AS uuid', 'dw.word as word', 'dw.type as type')
      .from('dictionary_word AS dw')
      .leftJoin('dictionary_form AS df', 'df.reference_uuid', 'dw.uuid')
      .leftJoin('dictionary_spelling AS ds', 'ds.reference_uuid', 'df.uuid')
      .where(k.raw('LOWER(dw.word)'), 'like', `%${search.toLowerCase()}%`)
      .orWhere(k.raw('LOWER(df.form)'), 'like', `${search.toLowerCase()}`)
      .orWhere(
        k.raw('LOWER(ds.explicit_spelling)'),
        'like',
        `${search.toLowerCase()}`
      )
      .orWhereRaw('binary dw.uuid = binary ?', search)
      .orderByRaw(
        `CASE 
		    WHEN LOWER(dw.word) LIKE '${search.toLowerCase()}' THEN 1 
        WHEN LOWER(df.form) LIKE '${search.toLowerCase()}' THEN 2
        WHEN LOWER(ds.explicit_spelling) LIKE '${search.toLowerCase()}' THEN 3
        WHEN LOWER(dw.word) LIKE '${search.toLowerCase()}%' THEN 4
        WHEN LOWER(dw.word) LIKE '%${search.toLowerCase()}' THEN 5
        ELSE 5 END`
      )
      .orderByRaw('LOWER(dw.word)');

    return rows;
  }
}

export default new DictionaryWordDao();
