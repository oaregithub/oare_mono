import {
  DictionaryWordTranslation,
  WordWithoutForms,
  SearchSpellingResultRow,
  DictionaryWordTypes,
  Word,
  DisplayableWord,
  WordFormAutocompleteDisplay,
  DictionaryWordRow,
} from '@oare/types';
import { knexRead, knexWrite } from '@/connection';
import sl from '@/serviceLocator';
import { Knex } from 'knex';
import { assembleSearchResult, assembleAutocompleteDisplay } from './utils';
import LoggingEditsDao from '../LoggingEditsDao';
import FieldDao from '../FieldDao';
import DictionaryFormDao from '../DictionaryFormDao';
import ItemPropertiesDao from '../ItemPropertiesDao';

export interface GrammarInfoRow {
  uuid: string;
  word: string;
  value: string;
  variableNames: string | null;
  variableAbbrevs: string | null;
  translations: string | null;
}

export interface SearchWordsQueryRow {
  uuid: string;
  type: 'word' | 'PN' | 'GN';
  name: string;
  translations: string | null;
  form: string | null;
  spellings: string | null;
}

export interface TranslationRow {
  dictionaryUuid: string;
  fieldUuid: string;
  field: string;
  primacy: number | null;
}

class DictionaryWordDao {
  async searchSpellings(
    spelling: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<SearchSpellingResultRow[]> {
    const k = trx || knexRead();
    interface SearchSpellingRow {
      wordUuid: string;
      word: string;
      formUuid: string;
      form: string;
      spellingUuid: string;
    }

    const TextDiscourseDao = sl.get('TextDiscourseDao');

    const rows: SearchSpellingRow[] = await k
      .select(
        'dw.uuid AS wordUuid',
        'dw.word',
        'df.uuid AS formUuid',
        'df.form',
        'ds.uuid AS spellingUuid'
      )
      .from('dictionary_word AS dw')
      .innerJoin('dictionary_form AS df', 'df.reference_uuid', 'dw.uuid')
      .innerJoin('dictionary_spelling AS ds', 'ds.reference_uuid', 'df.uuid')
      .where('ds.explicit_spelling', spelling);

    const formProperties = await Promise.all(
      rows.map(r =>
        ItemPropertiesDao.getPropertiesByReferenceUuid(r.formUuid, trx)
      )
    );

    const occurrences = await Promise.all(
      rows.map(r =>
        TextDiscourseDao.getTotalSpellingTexts(
          [r.spellingUuid],
          userUuid,
          undefined,
          trx
        )
      )
    );

    const grammaticalInfo = await Promise.all(
      rows.map(r => this.getGrammaticalInfo(r.wordUuid, trx))
    );
    const words: Word[] = grammaticalInfo.map(info => ({
      ...info,
      forms: [],
    }));

    return rows.map((row, i) => ({
      word: row.word,
      wordUuid: row.wordUuid,
      form: {
        form: row.form,
        uuid: row.formUuid,
        properties: formProperties[i],
      },
      spellingUuid: row.spellingUuid,
      occurrences: occurrences[i],
      wordInfo: words[i],
    }));
  }

  async getWords(
    type: DictionaryWordTypes,
    letter: string,
    trx?: Knex.Transaction
  ): Promise<Word[]> {
    const k = trx || knexRead();
    const letters = letter.split('/');
    let query = k('dictionary_word').select('uuid', 'word');

    letters.forEach(possibleVowel => {
      switch (possibleVowel) {
        case 'a':
          return letters.push('ā');
        case 'e':
          return letters.push('ē');
        case 'i':
          return letters.push('ī');
        case 'o':
          return letters.push('ō');
        case 'u':
          return letters.push('ū');
        default:
          return letters;
      }
    });

    query = query.andWhere(qb => {
      letters.forEach(l => {
        qb.orWhere('word', 'like', `${l.toLocaleUpperCase()}%`)
          .orWhere('word', 'like', `(${l.toLocaleUpperCase()}%`)
          .orWhere('word', 'like', `${l.toLocaleLowerCase()}%`)
          .orWhere('word', 'like', `(${l.toLocaleLowerCase()}%`);
      });
    });

    query = query.andWhere('type', type);

    const words: DisplayableWord[] = await query;

    const properties = await Promise.all(
      words.map(word =>
        ItemPropertiesDao.getPropertiesByReferenceUuid(word.uuid, trx)
      )
    );
    const translationsForDefinition = await this.getAllTranslations(
      'definition',
      trx
    );
    const discussionLemmas = await this.getAllTranslations(
      'discussionLemma',
      trx
    );
    const forms = await Promise.all(
      words.map(word => DictionaryFormDao.getWordForms(word.uuid, false, trx))
    );

    const spellingUuids = forms.map(form =>
      form.flatMap(spellings =>
        spellings.spellings.map(spelling => spelling.uuid)
      )
    );

    const TextDiscourseDao = sl.get('TextDiscourseDao');

    const wordOccurrences = await Promise.all(
      spellingUuids.map(uuids =>
        TextDiscourseDao.getTotalSpellingTexts(uuids, undefined, undefined, trx)
      )
    );

    return words
      .map((word, idx) => {
        const translationsForDefinitionList = translationsForDefinition
          .filter(({ dictionaryUuid }) => word.uuid === dictionaryUuid)
          .sort((a, b) => {
            if (a.primacy === null) {
              return 1;
            }
            if (b.primacy === null) {
              return -1;
            }

            return a.primacy - b.primacy;
          })
          .map(tr => ({
            uuid: tr.fieldUuid,
            val: tr.field,
          }));
        const discussionLemmasList = discussionLemmas
          .filter(({ dictionaryUuid }) => word.uuid === dictionaryUuid)
          .sort((a, b) => {
            if (a.primacy === null) {
              return 1;
            }
            if (b.primacy === null) {
              return -1;
            }

            return a.primacy - b.primacy;
          })
          .map(tr => ({
            uuid: tr.fieldUuid,
            val: tr.field,
          }));

        return {
          uuid: word.uuid,
          word: word.word,
          translationsForDefinition: translationsForDefinitionList,
          discussionLemmas: discussionLemmasList,
          forms: forms[idx],
          properties: properties[idx],
          wordOccurrences: wordOccurrences[idx],
        };
      })
      .sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));
  }

  async getAllTranslations(
    fieldType: string,
    trx?: Knex.Transaction
  ): Promise<TranslationRow[]> {
    const k = trx || knexRead();
    const rows: TranslationRow[] = await k('dictionary_word')
      .select(
        'dictionary_word.uuid AS dictionaryUuid',
        'field.uuid AS fieldUuid',
        'field.primacy',
        'field.field'
      )
      .innerJoin('field', 'field.reference_uuid', 'dictionary_word.uuid')
      .where('field.type', fieldType);
    return rows;
  }

  async getWordTranslationsForDefinition(
    wordUuid: string,
    trx?: Knex.Transaction
  ): Promise<DictionaryWordTranslation[]> {
    const translations = (
      await FieldDao.getDefinitionsByReferenceUuid(wordUuid, trx)
    ).map(({ uuid, field }) => ({
      uuid,
      val: field,
    })) as DictionaryWordTranslation[];

    return translations;
  }

  async getWordDiscussionLemmas(
    wordUuid: string,
    trx?: Knex.Transaction
  ): Promise<DictionaryWordTranslation[]> {
    const discussionLemmas = (
      await FieldDao.getDiscussionLemmasByReferenceUuid(wordUuid, trx)
    ).map(({ uuid, field }) => ({
      uuid,
      val: field,
    })) as DictionaryWordTranslation[];

    return discussionLemmas;
  }

  async getWordName(wordUuid: string, trx?: Knex.Transaction): Promise<string> {
    const k = trx || knexRead();
    const { word }: { word: string } = await k('dictionary_word')
      .select('word')
      .where('uuid', wordUuid)
      .first();
    return word;
  }

  async getGrammaticalInfo(
    wordUuid: string,
    trx?: Knex.Transaction
  ): Promise<WordWithoutForms> {
    const [
      word,
      properties,
      translationsForDefinition,
      discussionLemmas,
    ] = await Promise.all([
      this.getWordName(wordUuid, trx),
      ItemPropertiesDao.getPropertiesByReferenceUuid(wordUuid, trx),
      this.getWordTranslationsForDefinition(wordUuid, trx),
      this.getWordDiscussionLemmas(wordUuid, trx),
    ]);

    return {
      uuid: wordUuid,
      word,
      properties,
      translationsForDefinition,
      discussionLemmas,
    };
  }

  async searchWords(
    search: string,
    page: number,
    numRows: number,
    trx?: Knex.Transaction
  ) {
    const k = trx || knexRead();
    const lowerSearch = search.toLowerCase();
    const query = k
      .from('dictionary_word AS dw')
      .leftJoin('field', 'field.reference_uuid', 'dw.uuid')
      .leftJoin('dictionary_form AS df', 'df.reference_uuid', 'dw.uuid')
      .leftJoin('dictionary_spelling AS ds', 'ds.reference_uuid', 'df.uuid')
      .where(k.raw('LOWER(dw.word) LIKE ?', [`%${lowerSearch}%`]))
      .orWhere(k.raw('LOWER(field.field) LIKE ?', [`%${lowerSearch}%`]))
      .orWhere(k.raw('LOWER(df.form) LIKE ?', [`%${lowerSearch}%`]))
      .orWhere(
        k.raw('LOWER(ds.explicit_spelling) LIKE ?', [`%${lowerSearch}%`])
      )
      .select(
        'dw.uuid',
        'dw.type',
        'dw.word AS name',
        k.raw(
          "GROUP_CONCAT(DISTINCT `field`.`field` SEPARATOR ';') AS translations"
        ),
        'df.form',
        k.raw("GROUP_CONCAT(DISTINCT ds.spelling SEPARATOR ', ') AS spellings")
      )
      .groupBy('df.uuid');
    const rows: SearchWordsQueryRow[] = await query;
    const resultRows = assembleSearchResult(rows, search);
    const offset = (page - 1) * numRows;
    const results = resultRows.slice(offset, offset + numRows);

    return {
      totalRows: resultRows.length,
      results,
    };
  }

  async getWordsAndFormsForWordsInTexts(trx?: Knex.Transaction) {
    const k = trx || knexRead();
    const forms: Array<{
      name: string;
      uuid: string;
      wordUuid: string;
    }> = await k
      .from('dictionary_form AS df')
      .select('df.form as name', 'df.uuid', 'df.reference_uuid as wordUuid');
    const words: Array<{
      name: string;
      uuid: string;
      wordUuid: string;
    }> = await k('dictionary_word as dw').select(
      'dw.word as name',
      'dw.uuid',
      'dw.uuid as wordUuid'
    );

    const wordAndFormArray = [
      ...forms.map(form => ({
        name: form.name,
        uuid: form.uuid,
        type: 'form',
        wordUuid: form.wordUuid,
      })),
      ...words.map(word => ({
        name: word.name,
        uuid: word.uuid,
        type: 'word',
        wordUuid: word.wordUuid,
      })),
    ];
    const results: WordFormAutocompleteDisplay[] = await Promise.all(
      wordAndFormArray.map(item => assembleAutocompleteDisplay(item))
    );
    return results;
  }

  async updateWordSpelling(
    uuid: string,
    word: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    await k('dictionary_word').update({ word }).where({ uuid });
  }

  async updateTranslations(
    userUuid: string,
    wordUuid: string,
    translations: DictionaryWordTranslation[],
    fieldType: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    let currentTranslations: DictionaryWordTranslation[] = [];
    if (fieldType === 'definition') {
      currentTranslations = await this.getWordTranslationsForDefinition(
        wordUuid,
        trx
      );
    } else {
      currentTranslations = await this.getWordDiscussionLemmas(wordUuid, trx);
    }

    const translationsWithPrimacy = translations.map((tr, index) => ({
      ...tr,
      primacy: index + 1,
    }));

    // Insert new translations
    let newTranslations = translationsWithPrimacy.filter(tr => tr.uuid === '');

    const insertedUuids = await Promise.all(
      newTranslations.map(tr =>
        FieldDao.insertField(wordUuid, fieldType, tr.val, tr.primacy, null, trx)
      )
    );
    await Promise.all(
      insertedUuids.map(fieldUuid =>
        LoggingEditsDao.logEdit('INSERT', userUuid, 'field', fieldUuid, trx)
      )
    );
    newTranslations = newTranslations.map((tr, index) => ({
      ...tr,
      uuid: insertedUuids[index],
    }));

    // Update existing translations
    const existingTranslations = translationsWithPrimacy.filter(
      tr => tr.uuid !== ''
    );
    await Promise.all(
      existingTranslations.map(tr =>
        LoggingEditsDao.logEdit('UPDATE', userUuid, 'field', tr.uuid, trx)
      )
    );
    await Promise.all(
      existingTranslations.map(tr =>
        FieldDao.updateField(
          tr.uuid,
          tr.val,
          {
            primacy: tr.primacy,
          },
          trx
        )
      )
    );

    // Delete removed translations
    const combinedTranslations = [...newTranslations, ...existingTranslations];
    const currentTranslationUuids = currentTranslations.map(tr => tr.uuid);
    const remainingTranslationUuids = combinedTranslations.map(tr => tr.uuid);
    const deletedTranslationUuids = currentTranslationUuids.filter(
      uuid => !remainingTranslationUuids.includes(uuid)
    );
    await Promise.all(
      deletedTranslationUuids.map(uuid => FieldDao.deleteField(uuid, trx))
    );
  }

  async getDictionaryWordRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<DictionaryWordRow> {
    const k = trx || knexRead();
    const row = await k('dictionary_word')
      .select('uuid', 'word', 'type')
      .where({ uuid })
      .first();
    return row;
  }
}

export default new DictionaryWordDao();
