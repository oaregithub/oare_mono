import {
  DictionaryWordTranslation,
  WordWithoutForms,
  SearchSpellingResultRow,
  DictionaryWordTypes,
  Word,
  DisplayableWord,
  DictItemComboboxDisplay,
  DictionaryWordRow,
  DictionarySearchRow,
  SearchPossibleSpellingRow,
} from '@oare/types';
import { v4 } from 'uuid';
import { knexRead, knexWrite } from '@/connection';
import sl from '@/serviceLocator';
import { Knex } from 'knex';
import {
  assembleSearchResult,
  assembleComboboxDisplay,
  WordFormSpellingType,
  sortRows,
} from './utils';
import FieldDao from '../FieldDao';
import DictionaryFormDao from '../DictionaryFormDao';
import ItemPropertiesDao from '../ItemPropertiesDao';
import { prepareIndividualSearchCharacters } from '../SignReadingDao/utils';

export interface GrammarInfoRow {
  uuid: string;
  word: string;
  value: string;
  variableNames: string | null;
  variableAbbrevs: string | null;
  translations: string | null;
}

export interface DictSpellEpigRowDictSearch {
  referenceUuid: string;
  reading: string;
}

export interface SearchWordsQueryRow {
  uuid: string;
  type: 'word' | 'PN' | 'GN';
  name: string;
  translations: string | null;
  form: string | null;
  spellings: string | null;
  spellingUuids: string | null;
}

export interface TranslationRow {
  dictionaryUuid: string;
  fieldUuid: string;
  field: string;
  primacy: number | null;
}

export interface WordFormSpellingRow {
  name: string;
  uuid: string;
  referenceUuid: string;
  wordName: string;
  wordUuid: string;
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
    const CollectionTextUtils = sl.get('CollectionTextUtils');

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

    const textsToHide = await CollectionTextUtils.textsToHide(userUuid, trx);

    const occurrences = await Promise.all(
      rows.map(row =>
        TextDiscourseDao.getSpellingOccurrencesCount(
          row.spellingUuid,
          textsToHide,
          {},
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

  async searchPossibleSpellings(
    regexString: string,
    trx?: Knex.Transaction
  ): Promise<SearchPossibleSpellingRow[]> {
    const k = trx || knexRead();

    const rows: SearchPossibleSpellingRow[] = await k
      .select(
        'dw.uuid AS wordUuid',
        'dw.word',
        'df.uuid AS formUuid',
        'df.form',
        'ds.uuid AS spellingUuid',
        'ds.explicit_spelling as explicitSpelling'
      )
      .from('dictionary_word AS dw')
      .innerJoin('dictionary_form AS df', 'df.reference_uuid', 'dw.uuid')
      .innerJoin('dictionary_spelling AS ds', 'ds.reference_uuid', 'df.uuid')
      .whereRaw('ds.explicit_spelling REGEXP ?', regexString);

    const sortedRows = await sortRows(rows);

    return sortedRows;
  }

  async getWords(
    type: DictionaryWordTypes,
    letter: string,
    trx?: Knex.Transaction
  ): Promise<Word[]> {
    const k = trx || knexRead();
    const TextDiscourseDao = sl.get('TextDiscourseDao');

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
    const formsByWord = await Promise.all(
      words.map(word => DictionaryFormDao.getWordForms(word.uuid, false, trx))
    );

    const spellingUuidsByWord = formsByWord.map(forms =>
      forms.flatMap(form => form.spellings.map(spelling => spelling.uuid))
    );

    const occurrencesByWord = await Promise.all(
      spellingUuidsByWord.map(async uuids =>
        (
          await Promise.all(
            uuids.map(uuid =>
              TextDiscourseDao.getSpellingOccurrencesCount(uuid, [], {}, trx)
            )
          )
        ).reduce((sum, element) => sum + element, 0)
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
          forms: formsByWord[idx],
          properties: properties[idx],
          wordOccurrences: occurrencesByWord[idx],
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
    mode: string,
    types: string[],
    trx?: Knex.Transaction
  ) {
    const k = trx || knexRead();
    const lowerSearch = search.toLowerCase();
    let spellEpigRow: DictSpellEpigRowDictSearch[] | null = null;
    const charUuids: string[][] = await prepareIndividualSearchCharacters(
      search
    );
    if (charUuids.length > 0) {
      spellEpigRow = await this.getSpellingUuidsForDictionarySearch(
        charUuids,
        mode
      );
    }
    const query = k
      .from('dictionary_word AS dw')
      .leftJoin('field', 'field.reference_uuid', 'dw.uuid')
      .leftJoin('dictionary_form AS df', 'df.reference_uuid', 'dw.uuid')
      .leftJoin('dictionary_spelling AS ds', 'ds.reference_uuid', 'df.uuid')
      .whereIn('dw.type', types)
      .where(qb => {
        qb.where(
          k.raw('LOWER(dw.word) LIKE ?', [
            `${mode === 'matchSubstring' ? `%${lowerSearch}%` : lowerSearch}`,
          ])
        )
          .orWhere(
            k.raw(
              `LOWER(field.field) ${
                mode === 'matchSubstring' ? 'LIKE' : 'REGEXP'
              } ?`,
              [
                `${
                  mode === 'matchSubstring'
                    ? `%${lowerSearch}%`
                    : `\\b${lowerSearch}\\b`
                }`,
              ]
            )
          )
          .orWhere(
            k.raw('LOWER(df.form) LIKE ?', [
              `${mode === 'matchSubstring' ? `%${lowerSearch}%` : lowerSearch}`,
            ])
          )
          .orWhere(
            k.raw('LOWER(ds.explicit_spelling) LIKE ?', [
              `${mode === 'matchSubstring' ? `%${lowerSearch}%` : lowerSearch}`,
            ])
          );
        if (spellEpigRow) {
          qb.orWhereIn(
            'ds.uuid',
            spellEpigRow.map(({ referenceUuid }) => referenceUuid)
          );
        }
      })
      .select(
        'dw.uuid',
        'dw.type',
        'dw.word AS name',
        k.raw(
          "GROUP_CONCAT(DISTINCT `field`.`field` SEPARATOR ';') AS translations"
        ),
        'df.form',
        k.raw(
          "GROUP_CONCAT(DISTINCT ds.explicit_spelling SEPARATOR ', ') AS spellings"
        ),
        k.raw("GROUP_CONCAT(DISTINCT ds.uuid SEPARATOR ', ') AS spellingUuids")
      )
      .groupBy('df.uuid');

    const rows: SearchWordsQueryRow[] = await query;
    const resultRows: DictionarySearchRow[] = assembleSearchResult(
      rows,
      search,
      spellEpigRow,
      mode
    );
    const offset = (page - 1) * numRows;
    const results = resultRows.slice(offset, offset + numRows);

    return {
      totalRows: resultRows.length,
      results,
    };
  }

  async getSpellingUuidsForDictionarySearch(
    searchCharUuids: string[][],
    mode: string,
    trx?: Knex.Transaction
  ): Promise<DictSpellEpigRowDictSearch[]> {
    const k = trx || knexRead();
    let firstCharReadings: string[] = [];
    let lastCharReadings: string[] | null = null;
    if (mode === 'matchSubstring') {
      firstCharReadings = await k('sign_reading as sr')
        .pluck('sr.reading')
        .whereIn('sr.uuid', searchCharUuids[0]);
      lastCharReadings =
        searchCharUuids.length > 1
          ? await k('sign_reading as sr')
              .pluck('sr.reading')
              .whereIn('sr.uuid', searchCharUuids[searchCharUuids.length - 1])
          : null;
    }
    const refUuids: DictSpellEpigRowDictSearch[] = await k
      .from('dictionary_spelling_epigraphy as dse')
      .select(
        'dse.reference_uuid as referenceUuid',
        k.raw(
          `CONCAT_WS('-', ${searchCharUuids
            .map((_s, idx) => `dse${idx === 0 ? '' : idx}.reading`)
            .join(', ')}) AS reading`
        )
      )
      .modify(query => {
        searchCharUuids.forEach((searchCharUuidArray, idx) => {
          if (idx > 0 || searchCharUuids.length === 1) {
            query.innerJoin(
              `dictionary_spelling_epigraphy as dse${idx}`,
              function () {
                this.on('dse.reference_uuid', `dse${idx}.reference_uuid`).andOn(
                  function () {
                    this.onIn(`dse${idx}.reading_uuid`, searchCharUuidArray);
                    if (
                      idx === searchCharUuids.length - 1 &&
                      lastCharReadings &&
                      mode === 'matchSubstring'
                    ) {
                      lastCharReadings.forEach(charReading => {
                        this.orOn(
                          k.raw(`dse${idx}.reading LIKE ?`, [charReading])
                        );
                      });
                    }
                  }
                );
                if (searchCharUuids.length !== 1) {
                  this.andOn(
                    k.raw(
                      `dse.sign_spell_num + ${idx} = dse${idx}.sign_spell_num`
                    )
                  );
                }
              }
            );
          }
        });
      })
      .whereIn('dse.reading_uuid', searchCharUuids[0])
      .modify(qb => {
        if (mode === 'matchSubstring') {
          firstCharReadings.forEach(reading => {
            qb.orWhereLike('dse.reading', `%${reading}`);
          });
        }
      })
      .groupBy('dse.reference_uuid')
      .modify(qb => {
        if (mode === 'matchWholeWords') {
          qb.leftJoin('dictionary_spelling_epigraphy as dseMAX', function () {
            this.on('dseMAX.reference_uuid', 'dse.reference_uuid').andOn(
              k.raw(
                `dse.sign_spell_num + ${
                  searchCharUuids.length - 1
                } < dseMAX.sign_spell_num`
              )
            );
          })
            .whereNull('dseMAX.uuid')
            .andWhere('dse.sign_spell_num', 1);
        }
      });

    return refUuids;
  }

  async getDictItemsForWordsInTexts(trx?: Knex.Transaction) {
    const k = trx || knexRead();
    const forms: WordFormSpellingRow[] = await k('dictionary_form AS df')
      .join('dictionary_word as dw', 'dw.uuid', 'df.reference_uuid')
      .select(
        'df.form as name',
        'df.uuid',
        'df.reference_uuid as referenceUuid',
        'dw.word as wordName',
        'dw.uuid as wordUuid'
      );
    const spellings: WordFormSpellingRow[] = await k(
      'dictionary_spelling AS ds'
    )
      .join('dictionary_form as df', 'df.uuid', 'ds.reference_uuid')
      .join('dictionary_word as dw', 'dw.uuid', 'df.reference_uuid')
      .select(
        'ds.explicit_spelling as name',
        'ds.uuid',
        'ds.reference_uuid as referenceUuid',
        'dw.word as wordName',
        'dw.uuid as wordUuid'
      );
    const words: WordFormSpellingRow[] = await k(
      'dictionary_word as dw'
    ).select(
      'dw.word as name',
      'dw.uuid',
      'dw.uuid as referenceUuid',
      'dw.word as wordName',
      'dw.uuid as wordUuid'
    );

    const wordFormSpellingArray: WordFormSpellingType[] = [
      ...forms.map(form => ({
        name: form.name,
        uuid: form.uuid,
        type: 'form',
        referenceUuid: form.referenceUuid,
        wordName: form.wordName,
        wordUuid: form.wordUuid,
      })),
      ...words.map(word => ({
        name: word.name,
        uuid: word.uuid,
        type: 'word',
        referenceUuid: word.referenceUuid,
        wordName: word.wordName,
        wordUuid: word.wordUuid,
      })),
      ...spellings.map(spelling => ({
        name: spelling.name,
        uuid: spelling.uuid,
        type: 'spelling',
        referenceUuid: spelling.referenceUuid,
        wordName: spelling.wordName,
        wordUuid: spelling.wordUuid,
      })),
    ] as WordFormSpellingType[];
    const results: DictItemComboboxDisplay[] = await Promise.all(
      wordFormSpellingArray.map(item => assembleComboboxDisplay(item))
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

  async addWord(
    wordSpelling: string,
    wordType: string,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knexWrite();
    const newWordUuid = v4();
    await k('dictionary_word').insert({
      uuid: newWordUuid,
      word: wordSpelling,
      type: wordType,
    });
    return newWordUuid;
  }
}

export default new DictionaryWordDao();
