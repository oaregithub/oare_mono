import {
  DictionaryWordTranslation,
  DictionaryWord,
  SearchSpellingResultRow,
  DictionaryWordTypes,
  Word,
  DisplayableWord,
  PartialItemPropertyRow,
} from '@oare/types';
import knex from '@/connection';
import sl from '@/serviceLocator';
import { prepareIndividualSearchCharactersDict } from '@/api/daos/SignReadingDao/utils';
import { assembleSearchResult } from './utils';
import LoggingEditsDao from '../LoggingEditsDao';
import FieldDao from '../FieldDao';
import DictionaryFormDao from '../DictionaryFormDao';
import ItemPropertiesDao from '../ItemPropertiesDao';

export interface WordQueryRow {
  uuid: string;
  word: string;
  partsOfSpeech: string | null;
  verbalThematicVowelTypes: string | null;
  specialClassifications: string | null;
}

export interface GrammarInfoRow {
  uuid: string;
  word: string;
  value: string;
  variableNames: string | null;
  variableAbbrevs: string | null;
  translations: string | null;
}

export interface GrammarInfoResult {
  uuid: string;
  word: string;
  partsOfSpeech: string[];
  verbalThematicVowelTypes: string[];
  specialClassifications: string[];
  translations: string[];
  persons: string[];
  genders: string[];
  grammaticalNumbers: string[];
  morphologicalForms: string[];
  cases: string[];
}

export interface WordQueryResultRow {
  uuid: string;
  word: string;
  partsOfSpeech: string[];
  verbalThematicVowelTypes: string[];
  specialClassifications: string[];
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
    userUuid: string | null
  ): Promise<SearchSpellingResultRow[]> {
    interface SearchSpellingRow {
      wordUuid: string;
      word: string;
      formUuid: string;
      form: string;
      spellingUuid: string;
    }

    const TextDiscourseDao = sl.get('TextDiscourseDao');

    const rows: SearchSpellingRow[] = await knex
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

    const formGrammars = await Promise.all(
      rows.map(r => DictionaryFormDao.getFormGrammar(r.formUuid))
    );

    const occurrences = await Promise.all(
      rows.map(r =>
        TextDiscourseDao.getTotalSpellingTexts(r.spellingUuid, userUuid)
      )
    );

    const grammaticalInfo = await Promise.all(
      rows.map(r => this.getGrammaticalInfo(r.wordUuid))
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
        ...formGrammars[i],
      },
      spellingUuid: row.spellingUuid,
      occurrences: occurrences[i],
      wordInfo: words[i],
    }));
  }

  async getWords(
    type: DictionaryWordTypes,
    letter: string,
    isAdmin: boolean
  ): Promise<Word[]> {
    const letters = letter.split('/');
    let query = knex('dictionary_word').select('uuid', 'word');

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

    const partsOfSpeech = await this.getPartsOfSpeech();
    const specialClassifications = await this.getSpecialClassifications();
    const verbalThematicVowelTypes = await this.getVerbalThematicVowelTypes();
    const allTranslations = await this.getAllTranslations();
    const forms = await Promise.all(
      words.map(word => DictionaryFormDao.getWordForms(word.uuid, isAdmin))
    );

    return words
      .map((word, idx) => {
        const translations = allTranslations
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
            translation: tr.field,
          }));

        return {
          uuid: word.uuid,
          word: word.word,
          partsOfSpeech: partsOfSpeech.filter(
            ({ referenceUuid }) => referenceUuid === word.uuid
          ),
          specialClassifications: specialClassifications.filter(
            ({ referenceUuid }) => referenceUuid === word.uuid
          ),
          verbalThematicVowelTypes: verbalThematicVowelTypes.filter(
            ({ referenceUuid }) => referenceUuid === word.uuid
          ),
          translations,
          forms: forms[idx],
        };
      })
      .filter(word => (isAdmin ? word : word.forms.length > 0))
      .sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));
  }

  async getAllTranslations(): Promise<TranslationRow[]> {
    const rows: TranslationRow[] = await knex('dictionary_word')
      .select(
        'dictionary_word.uuid AS dictionaryUuid',
        'field.uuid AS fieldUuid',
        'field.primacy',
        'field.field'
      )
      .innerJoin('field', 'field.reference_uuid', 'dictionary_word.uuid');
    return rows;
  }

  async getWordTranslations(
    wordUuid: string
  ): Promise<DictionaryWordTranslation[]> {
    const translations = (await FieldDao.getByReferenceUuid(wordUuid)).map(
      ({ uuid, field }) => ({
        uuid,
        translation: field,
      })
    ) as DictionaryWordTranslation[];

    return translations;
  }

  async getPartsOfSpeech(wordUuid?: string): Promise<PartialItemPropertyRow[]> {
    const rows = await ItemPropertiesDao.getProperties('Part of Speech', {
      abbreviation: true,
      ...(wordUuid ? { referenceUuid: wordUuid } : null),
    });

    return rows;
  }

  async getSpecialClassifications(
    wordUuid?: string
  ): Promise<PartialItemPropertyRow[]> {
    const rows = await ItemPropertiesDao.getProperties(
      'Special Classifications',
      wordUuid ? { referenceUuid: wordUuid } : {}
    );

    return rows;
  }

  async getVerbalThematicVowelTypes(
    wordUuid?: string
  ): Promise<PartialItemPropertyRow[]> {
    const rows = await ItemPropertiesDao.getProperties(
      'Verbal Thematic Vowel Type',
      wordUuid ? { referenceUuid: wordUuid } : {}
    );

    return rows.filter(r => !r.name.endsWith('-Class'));
  }

  async getWordName(wordUuid: string): Promise<string> {
    const { word }: { word: string } = await knex('dictionary_word')
      .select('word')
      .where('uuid', wordUuid)
      .first();
    return word;
  }

  async getGrammaticalInfo(wordUuid: string): Promise<DictionaryWord> {
    const [
      word,
      partsOfSpeech,
      specialClassifications,
      verbalThematicVowelTypes,
      translations,
    ] = await Promise.all([
      this.getWordName(wordUuid),
      this.getPartsOfSpeech(wordUuid),
      this.getSpecialClassifications(wordUuid),
      this.getVerbalThematicVowelTypes(wordUuid),
      this.getWordTranslations(wordUuid),
    ]);

    return {
      uuid: wordUuid,
      word,
      partsOfSpeech,
      specialClassifications,
      verbalThematicVowelTypes,
      translations,
    };
  }

  async concatenateDictWordArray(searchArray: string[][]) {
    let result: string[] = [];
    if (searchArray.length === 0) return [];
    if (searchArray.length === 1) return searchArray[0];
    let regex = '^';
    let regexMax = 0;
    let regexMin = 0;
    for (let i = 0; i < searchArray.length; i += 1) {
      const currentArray = searchArray[i];
      const nextArray = searchArray[i + 1];
      const currentArraySorted = currentArray.sort(
        (a, b) => a.length - b.length
      );
      regexMin = currentArraySorted[0].length;
      regexMax = currentArraySorted[currentArraySorted.length - 1].length;
      if (i < searchArray.length - 1) {
        regex += `.{${regexMin},${regexMax}}-`;
      }
      if (i === searchArray.length - 1) {
        regex += `.{${regexMin},${regexMax}}$`;
      }
      if (i < 1) {
        for (let x = 0; x < currentArray.length; x += 1) {
          result.push(currentArray[x]);
        }
        for (let f = 0; f < currentArray.length; f += 1) {
          if (i !== searchArray.length - 1) {
            for (let j = 0; j < nextArray.length; j += 1) {
              result.push(`${result[f]}-${nextArray[j]}`);
            }
          }
        }
      } else {
        const resultLength = result.length;
        for (let f = 0; f < resultLength; f += 1) {
          if (i !== searchArray.length - 1) {
            for (let j = 0; j < nextArray.length; j += 1) {
              result.push(`${result[f]}-${nextArray[j]}`);
            }
          }
        }
      }
    }
    const r = RegExp(regex);
    result = result.filter(word => r.test(word));
    return result;
  }

  async searchWords(search: string, page: number, numRows: number) {
    const searchArray = await prepareIndividualSearchCharactersDict(
      search.replace(/[;'"><=]/g, '')
    );
    const concatenatedSearchArray = await this.concatenateDictWordArray(
      searchArray
    );
    let query;
    if (search.includes('-')) {
      const spellingSearchSQL = concatenatedSearchArray
        .map(word => `LOWER(ds.explicit_spelling) LIKE '%${word}%'`)
        .join(' OR ');

      query = knex
        .from('dictionary_word AS dw')
        .leftJoin('field', 'field.reference_uuid', 'dw.uuid')
        .leftJoin('dictionary_form AS df', 'df.reference_uuid', 'dw.uuid')
        .leftJoin('dictionary_spelling AS ds', 'ds.reference_uuid', 'df.uuid')
        .where(knex.raw(spellingSearchSQL))
        .select(
          'dw.uuid',
          'dw.type',
          'dw.word AS name',
          knex.raw(
            "GROUP_CONCAT(DISTINCT `field`.`field` SEPARATOR ';') AS translations"
          ),
          'df.form',
          knex.raw(
            "GROUP_CONCAT(DISTINCT ds.spelling SEPARATOR ', ') AS spellings"
          )
        )
        .groupBy('df.uuid');
    } else {
      const wordSearchSQL = concatenatedSearchArray
        .map(word => `LOWER(dw.word) LIKE '%${word}%'`)
        .join(' OR ');
      const fieldSearchSQL = concatenatedSearchArray
        .map(word => `LOWER(field.field) LIKE '%${word}%'`)
        .join(' OR ');
      const formSearchSQL = concatenatedSearchArray
        .map(word => `LOWER(df.form) LIKE '%${word}%'`)
        .join(' OR ');

      query = knex
        .from('dictionary_word AS dw')
        .leftJoin('field', 'field.reference_uuid', 'dw.uuid')
        .leftJoin('dictionary_form AS df', 'df.reference_uuid', 'dw.uuid')
        .leftJoin('dictionary_spelling AS ds', 'ds.reference_uuid', 'df.uuid')
        .where(knex.raw(wordSearchSQL))
        .orWhere(knex.raw(fieldSearchSQL))
        .orWhere(knex.raw(formSearchSQL))
        .select(
          'dw.uuid',
          'dw.type',
          'dw.word AS name',
          knex.raw(
            "GROUP_CONCAT(DISTINCT `field`.`field` SEPARATOR ';') AS translations"
          ),
          'df.form',
          knex.raw(
            "GROUP_CONCAT(DISTINCT ds.spelling SEPARATOR ', ') AS spellings"
          )
        )
        .groupBy('df.uuid');
    }
    const rows: SearchWordsQueryRow[] = await query;
    const resultRows = assembleSearchResult(rows, concatenatedSearchArray);
    const offset = (page - 1) * numRows;
    const results = resultRows.slice(offset, offset + numRows);
    return {
      totalRows: resultRows.length,
      results,
      searchArray: concatenatedSearchArray,
    };
  }

  async updateWordSpelling(uuid: string, word: string): Promise<void> {
    await knex('dictionary_word').update({ word }).where({ uuid });
  }

  async updateTranslations(
    userUuid: string,
    wordUuid: string,
    translations: DictionaryWordTranslation[]
  ): Promise<void> {
    const currentTranslations = await this.getWordTranslations(wordUuid);
    const translationsWithPrimacy = translations.map((tr, index) => ({
      ...tr,
      primacy: index + 1,
    }));

    // Insert new translations
    let newTranslations = translationsWithPrimacy.filter(tr => tr.uuid === '');
    const insertedUuids = await Promise.all(
      newTranslations.map(tr =>
        FieldDao.insertField(wordUuid, 'definition', tr.translation, {
          primacy: tr.primacy,
        })
      )
    );
    await Promise.all(
      insertedUuids.map(fieldUuid =>
        LoggingEditsDao.logEdit('INSERT', userUuid, 'field', fieldUuid)
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
        LoggingEditsDao.logEdit('UPDATE', userUuid, 'field', tr.uuid)
      )
    );
    await Promise.all(
      existingTranslations.map(tr =>
        FieldDao.updateField(tr.uuid, tr.translation, { primacy: tr.primacy })
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
      deletedTranslationUuids.map(uuid => FieldDao.deleteField(uuid))
    );
  }
}

export default new DictionaryWordDao();
