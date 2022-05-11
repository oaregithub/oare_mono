import {
  DictionaryWordTranslation,
  DictionaryWord,
  SearchSpellingResultRow,
  DictionaryWordTypes,
  Word,
  DisplayableWord,
  WordFormAutocompleteDisplay,
} from '@oare/types';
import { knexRead, knexWrite } from '@/connection';
import sl from '@/serviceLocator';
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

    const rows: SearchSpellingRow[] = await knexRead()
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
      rows.map(r => ItemPropertiesDao.getPropertiesByReferenceUuid(r.formUuid))
    );

    const occurrences = await Promise.all(
      rows.map(r =>
        TextDiscourseDao.getTotalSpellingTexts([r.spellingUuid], userUuid)
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
    userUuid: string | null,
    isAdmin: boolean
  ): Promise<Word[]> {
    const letters = letter.split('/');
    let query = knexRead()('dictionary_word').select('uuid', 'word');

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
        ItemPropertiesDao.getPropertiesByReferenceUuid(word.uuid)
      )
    );
    const allTranslations = await this.getAllTranslations();
    const forms = await Promise.all(
      words.map(word => DictionaryFormDao.getWordForms(word.uuid, isAdmin))
    );

    const spellingUuids = forms.map(form =>
      form.flatMap(spellings =>
        spellings.spellings.map(spelling => spelling.uuid)
      )
    );

    const TextDiscourseDao = sl.get('TextDiscourseDao');

    const wordOccurrences = await Promise.all(
      spellingUuids.map(uuids =>
        TextDiscourseDao.getTotalSpellingTexts(uuids, userUuid)
      )
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
          translations,
          forms: forms[idx],
          properties: properties[idx],
          wordOccurrences: wordOccurrences[idx],
        };
      })
      .filter(word => (isAdmin ? word : word.forms.length > 0))
      .sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));
  }

  async getAllTranslations(): Promise<TranslationRow[]> {
    const rows: TranslationRow[] = await knexRead()('dictionary_word')
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

  async getWordName(wordUuid: string): Promise<string> {
    const { word }: { word: string } = await knexRead()('dictionary_word')
      .select('word')
      .where('uuid', wordUuid)
      .first();
    return word;
  }

  async getGrammaticalInfo(wordUuid: string): Promise<DictionaryWord> {
    const [word, properties, translations] = await Promise.all([
      this.getWordName(wordUuid),
      ItemPropertiesDao.getPropertiesByReferenceUuid(wordUuid),
      this.getWordTranslations(wordUuid),
    ]);

    return {
      uuid: wordUuid,
      word,
      properties,
      translations,
    };
  }

  async searchWords(search: string, page: number, numRows: number) {
    const lowerSearch = search.toLowerCase();
    const query = knexRead()
      .from('dictionary_word AS dw')
      .leftJoin('field', 'field.reference_uuid', 'dw.uuid')
      .leftJoin('dictionary_form AS df', 'df.reference_uuid', 'dw.uuid')
      .leftJoin('dictionary_spelling AS ds', 'ds.reference_uuid', 'df.uuid')
      .where(knexRead().raw('LOWER(dw.word) LIKE ?', [`%${lowerSearch}%`]))
      .orWhere(
        knexRead().raw('LOWER(field.field) LIKE ?', [`%${lowerSearch}%`])
      )
      .orWhere(knexRead().raw('LOWER(df.form) LIKE ?', [`%${lowerSearch}%`]))
      .orWhere(
        knexRead().raw('LOWER(ds.explicit_spelling) LIKE ?', [
          `%${lowerSearch}%`,
        ])
      )
      .select(
        'dw.uuid',
        'dw.type',
        'dw.word AS name',
        knexRead().raw(
          "GROUP_CONCAT(DISTINCT `field`.`field` SEPARATOR ';') AS translations"
        ),
        'df.form',
        knexRead().raw(
          "GROUP_CONCAT(DISTINCT ds.spelling SEPARATOR ', ') AS spellings"
        )
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

  async getWordsAndFormsForWordsInTexts() {
    const query = knexRead()
      .from('dictionary_form AS df')
      .select(
        'df.form as name',
        'df.uuid',
        knexRead().raw("concat('form') as type")
      )
      .union([
        knexRead()('dictionary_word as dw').select(
          'dw.word as name',
          'dw.uuid',
          knexRead().raw("concat('word') as type")
        ),
      ]);
    const resultRows = await query;
    const results: WordFormAutocompleteDisplay[] = await Promise.all(
      resultRows.map(row => assembleAutocompleteDisplay(row))
    );
    return results;
  }

  async updateWordSpelling(uuid: string, word: string): Promise<void> {
    await knexWrite()('dictionary_word').update({ word }).where({ uuid });
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

  async getWordUuidByWordOrFormUuid(uuid: string): Promise<string> {
    const { wordUuid } = await knexRead()('dictionary_word')
      .select('dictionary_word.uuid as wordUuid')
      .innerJoin(
        'dictionary_form',
        'dictionary_form.reference_uuid',
        'dictionary_word.uuid'
      )
      .where('dictionary_word.uuid', '=', uuid)
      .orWhere('dictionary_form.uuid', '=', uuid)
      .first();
    return wordUuid;
  }
}

export default new DictionaryWordDao();
