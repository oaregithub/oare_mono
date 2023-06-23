import {
  DictionaryWordType,
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
  /**
   * Retrieves a list of dictionary word UUIDs that have the specified type and begin with the specified letter group.
   * Used for the dictionary word list.
   * @param type The type of word to retrieve.
   * @param letterGroup The letter group to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns An array of dictionary word UUIDs.
   */
  public async getDictionaryWordUuidsByTypeAndLetterGroup(
    type: DictionaryWordType,
    letterGroup: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const letters = AkkadianLetterGroupsUpper[letterGroup];

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

  /**
   * Updates the spelling of a given word. This is the `word` column.
   * @param uuid The UUID of the word to update.
   * @param word The new spelling of the word.
   * @param trx Knex Transaction. Optional.
   */
  public async updateWordSpelling(
    uuid: string,
    word: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('dictionary_word').update({ word }).where({ uuid });
  }

  /**
   * Retrieves a single dictionary_word row by UUID.
   * @param uuid The UUID of the word to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A single dictionary_word row.
   */
  public async getDictionaryWordRowByUuid(
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

  /**
   * Constructs a DictionaryWord object for a given UUID.
   * @param uuid The UUID of the word to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A DictionaryWord object.
   */
  public async getDictionaryWordByUuid(
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

  /**
   * Inserts a new dictionary word into the database.
   * @param uuid The UUID of the word to insert.
   * @param word The spelling of the word to insert.
   * @param type The type of word to insert.
   * @param trx Knex Transaction. Optional.
   */
  public async addWord(
    uuid: string,
    word: string,
    type: DictionaryWordType,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('dictionary_word').insert({
      uuid,
      word,
      type,
    });
  }

  /**
   * Retrieves a list of dictionary word UUIDs that have the specified type and word spelling.
   * Used to check if a word already exists.
   * @param type The type of word to retrieve.
   * @param word The spelling of the word to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns An array of dictionary word UUIDs.
   */
  public async getDictionaryWordUuidsByTypeAndWord(
    type: DictionaryWordType,
    word: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const uuids: string[] = await k('dictionary_word')
      .pluck('uuid')
      .where({ type, word });

    return uuids;
  }

  /**
   * Searches for dictionary words for use with link item properties.
   * @param search The search string.
   * @param trx Knex Transaction. Optional.
   * @returns Array of dictionary words.
   */
  public async searchDictionaryWordsLinkProperties(
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

/**
 * DictionaryWordDao instance as a singleton.
 */
export default new DictionaryWordDao();
