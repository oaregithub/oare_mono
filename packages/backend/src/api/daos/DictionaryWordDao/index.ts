import {DictionaryWord, DictionaryWordTranslation, NameOrPlace, SearchSpellingResultRow} from '@oare/types';
import knex from '@/connection';
import getQueryString from '../utils';
import {assembleSearchResult, nestedFormsAndSpellings} from './utils';
import LoggingEditsDao from '../LoggingEditsDao';
import FieldDao from '../FieldDao';
import DictionaryFormDao from '../DictionaryFormDao';
import ItemPropertiesDao, {ItemPropertyRow} from '../ItemPropertiesDao';

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

export interface NamePlaceQueryRow {
  uuid: string;
  word: string;
  formUuid: string | null;
  translation: string | null;
  form: string | null;
  cases: string | null;
  spellings: string | null;
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
  async searchSpellings(spelling: string): Promise<SearchSpellingResultRow[]> {
    interface SearchSpellingRow {
      wordUuid: string;
      word: string;
      formUuid: string;
      form: string;
    }

    const rows: SearchSpellingRow[] = await knex
      .select('dw.uuid AS wordUuid', 'dw.word', 'df.uuid AS formUuid', 'df.form')
      .from('dictionary_word AS dw')
      .innerJoin('dictionary_form AS df', 'df.reference_uuid', 'dw.uuid')
      .innerJoin('dictionary_spelling AS ds', 'ds.reference_uuid', 'df.uuid')
      .where('ds.explicit_spelling', spelling);

    const formGrammars = await Promise.all(rows.map((r) => DictionaryFormDao.getFormGrammar(r.formUuid)));

    return rows.map((row, i) => ({
      word: row.word,
      wordUuid: row.wordUuid,
      form: {
        form: row.form,
        uuid: row.formUuid,
        ...formGrammars[i],
      },
    }));
  }

  async getWords(letter: string): Promise<DictionaryWord[]> {
    const letters = letter.split('/');
    let query = knex('dictionary_word').select('uuid', 'word');

    letters.forEach((l) => {
      query = query.orWhere('word', 'like', `${l}%`);
    });

    const words: { uuid: string; word: string }[] = await query;

    const partsOfSpeech = await this.getPartsOfSpeech();
    const specialClassifications = await this.getSpecialClassifications();
    const verbalThematicVowelTypes = await this.getVerbalThematicVowelTypes();
    const allTranslations = await this.getAllTranslations();

    return words
      .map((word) => {
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
          .map((tr) => ({
            uuid: tr.fieldUuid,
            translation: tr.field,
          }));

        return {
          uuid: word.uuid,
          word: word.word,
          partsOfSpeech: partsOfSpeech.filter(({ referenceUuid }) => referenceUuid === word.uuid),
          specialClassifications: specialClassifications.filter(({ referenceUuid }) => referenceUuid === word.uuid),
          verbalThematicVowelTypes: verbalThematicVowelTypes.filter(({ referenceUuid }) => referenceUuid === word.uuid),
          translations,
        };
      })
      .sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));
  }

  async getAllTranslations(): Promise<TranslationRow[]> {
    const rows: TranslationRow[] = await knex('dictionary_word')
      .select('dictionary_word.uuid AS dictionaryUuid', 'field.uuid AS fieldUuid', 'field.primacy', 'field.field')
      .innerJoin('field', 'field.reference_uuid', 'dictionary_word.uuid');
    return rows;
  }

  async getNames(): Promise<NameOrPlace[]> {
    const namesQuery = getQueryString('namesAndPlacesQuery.sql').replace('#{wordType}', 'PN')
        .replace('#{upperCaseLetter}', 'A')
        .replace('#{lowerCaseLetter}', 'a');

    const nameRows: NamePlaceQueryRow[] = (await knex.raw(namesQuery))[0];
    return nestedFormsAndSpellings(nameRows);
  }

  async getPlaces() {
    const placesQuery = getQueryString('./namesAndPlacesQuery.sql').replace('#{wordType}', 'GN')

    const [dictionary_words, dictionary_form, dictionary_spelling, field, item_properties, alias] = await Promise.all([
      (await knex('dictionary_word AS dw')
          .select('dw.uuid', 'dw.word')
          .where('dw.type', 'GN')),
      (await knex('dictionary_form AS df')
          .select('df.uuid', 'df.reference_uuid', 'df.form'))
          .reduce((map, obj) => {
            if (map[obj.reference_uuid] === undefined) {
              map[obj.reference_uuid] = [obj];
            } else {
              const dict_form_array = map[obj.reference_uuid];
              dict_form_array.push(obj);
              map[obj.reference_uuid] = dict_form_array
            }
            return map;
          }, {}),
      (await knex('dictionary_spelling AS ds')
          .select('ds.reference_uuid', 'ds.explicit_spelling AS spelling'))
          .reduce((map, obj) => {
            if (map[obj.reference_uuid] === undefined) {
              map[obj.reference_uuid] = [obj.spelling];
            } else {
              const dict_form_array = map[obj.reference_uuid];
              dict_form_array.push(obj.spelling);
              map[obj.reference_uuid] = dict_form_array
            }
            return map;
          }, {}),
      (await knex('field AS f')
          .select('f.reference_uuid', 'f.field'))
          .reduce((map, obj) => {
            map[obj.reference_uuid] = obj;
            return map;
          }, {}),
      (await knex('item_properties AS ip')
            .select('ip.reference_uuid', 'ip.value_uuid')
            .where('ip.variable_uuid', 'e0092e36-fb94-a4dc-cd04-5883ab861fd6'))
          .reduce((map, obj) => {
            if (map[obj.reference_uuid] === undefined) {
              map[obj.reference_uuid] = [obj];
            } else {
              const dict_form_array = map[obj.reference_uuid];
              dict_form_array.push(obj);
              map[obj.reference_uuid] = dict_form_array
            }
            return map;
          }, {}),
      (await knex('alias AS a')
          .select('a.reference_uuid', 'a.name')
          .where('a.type', 'abbreviation'))
          .reduce((map, obj) => {
            map[obj.reference_uuid] = obj;
            return map;
          }, {})
    ]);

    console.log('Dictionary Words');
    // console.log(dictionary_words);
    // console.log(item_properties);
    console.log("Length: " + dictionary_words.length);
    console.log("Is Array: " + Array.isArray(dictionary_words));


    // console.log(dictionary_words);
    const words_and_form_results: NamePlaceQueryRow[] = [];
    dictionary_words.forEach( (dictionary_word : {uuid: string, word: string}) => {


      let form_uuid: string | undefined = '';
      let form_string: string | undefined = '';
      let translation: string | undefined = '';
      // const abbreviations = new Set();
      let abbreviations: { [key:string]:Set<string> } = {};
      // let explicit_spelling = new Set();
      let explicit_spelling: { [key:string]:Set<string> } = {};
      let forms: {uuid: string, reference_uuid: string, form: string}[] = [];


      if (dictionary_form[dictionary_word.uuid] !== undefined) {
        forms = dictionary_form[dictionary_word.uuid];

        // form_uuid = form.uuid;
        // form_string = form.form;
      }

      forms.forEach((form) => {
        if (form.uuid !== undefined && dictionary_spelling[form.uuid] !== undefined) {
          dictionary_spelling[form.uuid].forEach((spelling: string) => {
            if (explicit_spelling[form.uuid] === undefined) {
              explicit_spelling[form.uuid] = new Set<string>().add(spelling);
            } else {
              explicit_spelling[form.uuid].add(spelling);
            }
          });
        }
      });

      if (field[dictionary_word.uuid] !== undefined) {
        translation = field[dictionary_word.uuid]?.field;
      }

      forms.forEach((form) => {
        const properties: {reference_uuid: string, value_uuid: string}[] = item_properties[form.uuid];
        if (properties !== undefined) {
          properties.forEach( property => {
            if (alias[property.value_uuid] !== undefined) {
              if (abbreviations[form.uuid] === undefined) {
                abbreviations[form.uuid] = new Set<string>().add(alias[property.value_uuid].name);
              } else {
                abbreviations[form.uuid].add(alias[property.value_uuid].name);
              }
            }
          });
        }
      });



      //q1.uuid, q1.word, q1.form_uuid AS formUuid, q1.field AS translation, q1.form, q2.parse AS cases, q1.spelling AS spellings
      // console.log(dictionary_word.uuid, dictionary_word.word, form_uuid, translation, form_string, Array.from(abbreviations).join('/'), Array.from(explicit_spelling).join(','));

      if (forms !== undefined && forms.length !== 0) {
        forms.forEach((form) => {
          words_and_form_results.push({
            uuid: dictionary_word.uuid,
            word: dictionary_word.word,
            formUuid: form.uuid,
            translation: translation,
            form: form.form,
            cases: (abbreviations[form.uuid] !== undefined) ? Array.from(abbreviations[form.uuid]).join('/') : null,
            spellings: (explicit_spelling[form.uuid] !== undefined) ? Array.from(explicit_spelling[form.uuid]).join(',') : null,
          } as NamePlaceQueryRow);
        });
      } else {
        words_and_form_results.push({
          uuid: dictionary_word.uuid,
          word: dictionary_word.word,
          formUuid: null,
          translation: translation,
          form: null,
          cases: null,
          spellings: null,
        } as NamePlaceQueryRow);
      }


    });

    // console.log("OUTPUT");
    // words_and_form_results.sort((a: any, b: any) => {
    //   return (a.word.toLowerCase() < b.word.toLowerCase()) ? 1 : -1;
    // })
    //
    // words_and_form_results.forEach((dictionary_word) => {
    //   console.log(dictionary_word.word);
    // })
    // console.log(words_and_form_results);



    const placeRows: NamePlaceQueryRow[] = (await knex.raw(placesQuery))[0];
    console.log("SQL ROWS");
    // placeRows.sort((a: any, b: any) => {
    //   return (a.word.toLowerCase() < b.word.toLowerCase()) ? 1 : -1;
    // })
    //
    //
    // console.log(placeRows);


    return nestedFormsAndSpellings(words_and_form_results);
    // return nestedFormsAndSpellings(placeRows);
  }

  async getWordTranslations(wordUuid: string): Promise<DictionaryWordTranslation[]> {
    const translations = (await FieldDao.getByReferenceUuid(wordUuid)).map(({ uuid, field }) => ({
      uuid,
      translation: field,
    })) as DictionaryWordTranslation[];

    return translations;
  }

  async getPartsOfSpeech(wordUuid?: string): Promise<ItemPropertyRow[]> {
    const rows = await ItemPropertiesDao.getProperties('Part of Speech', {
      abbreviation: true,
      ...(wordUuid ? { referenceUuid: wordUuid } : null),
    });

    return rows;
  }

  async getSpecialClassifications(wordUuid?: string): Promise<ItemPropertyRow[]> {
    const rows = await ItemPropertiesDao.getProperties(
      'Special Classifications',
      wordUuid ? { referenceUuid: wordUuid } : {},
    );

    return rows;
  }

  async getVerbalThematicVowelTypes(wordUuid?: string): Promise<ItemPropertyRow[]> {
    const rows = await ItemPropertiesDao.getProperties(
      'Verbal Thematic Vowel Type',
      wordUuid ? { referenceUuid: wordUuid } : {},
    );

    return rows.filter((r) => !r.name.endsWith('-Class'));
  }

  async getWordName(wordUuid: string): Promise<string> {
    const { word }: { word: string } = await knex('dictionary_word').select('word').where('uuid', wordUuid).first();
    return word;
  }

  async getGrammaticalInfo(wordUuid: string): Promise<DictionaryWord> {
    const [word, partsOfSpeech, specialClassifications, verbalThematicVowelTypes, translations] = await Promise.all([
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

  async searchWords(search: string, page: number, numRows: number) {
    const lowerSearch = search.toLowerCase();
    const query = knex
      .from('dictionary_word AS dw')
      .leftJoin('field', 'field.reference_uuid', 'dw.uuid')
      .leftJoin('dictionary_form AS df', 'df.reference_uuid', 'dw.uuid')
      .leftJoin('dictionary_spelling AS ds', 'ds.reference_uuid', 'df.uuid')
      .where(knex.raw('LOWER(dw.word) LIKE ?', [`%${lowerSearch}%`]))
      .orWhere(knex.raw('LOWER(field.field) LIKE ?', [`%${lowerSearch}%`]))
      .orWhere(knex.raw('LOWER(df.form) LIKE ?', [`%${lowerSearch}%`]))
      .orWhere(knex.raw('LOWER(ds.spelling) LIKE ?', [`%${lowerSearch}%`]))
      .select(
        'dw.uuid',
        'dw.type',
        'dw.word AS name',
        knex.raw("GROUP_CONCAT(DISTINCT `field`.`field` SEPARATOR ';') AS translations"),
        'df.form',
        knex.raw("GROUP_CONCAT(DISTINCT ds.spelling SEPARATOR ', ') AS spellings"),
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

  async updateWordSpelling(uuid: string, word: string): Promise<void> {
    await knex('dictionary_word').update({ word }).where({ uuid });
  }

  async updateTranslations(
    userUuid: string,
    wordUuid: string,
    translations: DictionaryWordTranslation[],
  ): Promise<DictionaryWordTranslation[]> {
    const currentTranslations = await this.getWordTranslations(wordUuid);
    const translationsWithPrimacy = translations.map((tr, index) => ({
      ...tr,
      primacy: index + 1,
    }));

    // Insert new translations
    let newTranslations = translationsWithPrimacy.filter((tr) => tr.uuid === '');
    const insertedUuids = await Promise.all(
      newTranslations.map((tr) =>
        FieldDao.insertField(wordUuid, 'definition', tr.translation, { primacy: tr.primacy }),
      ),
    );
    await Promise.all(
      insertedUuids.map((fieldUuid) => {
        return LoggingEditsDao.logEdit('INSERT', userUuid, 'field', fieldUuid);
      }),
    );
    newTranslations = newTranslations.map((tr, index) => ({
      ...tr,
      uuid: insertedUuids[index],
    }));

    // Update existing translations
    const existingTranslations = translationsWithPrimacy.filter((tr) => tr.uuid !== '');
    await Promise.all(existingTranslations.map((tr) => LoggingEditsDao.logEdit('UPDATE', userUuid, 'field', tr.uuid)));
    await Promise.all(
      existingTranslations.map((tr) => FieldDao.updateField(tr.uuid, tr.translation, { primacy: tr.primacy })),
    );

    // Delete removed translations
    const combinedTranslations = [...newTranslations, ...existingTranslations];
    const currentTranslationUuids = currentTranslations.map((tr) => tr.uuid);
    const remainingTranslationUuids = combinedTranslations.map((tr) => tr.uuid);
    const deletedTranslationUuids = currentTranslationUuids.filter((uuid) => !remainingTranslationUuids.includes(uuid));
    await Promise.all(deletedTranslationUuids.map((uuid) => FieldDao.deleteField(uuid)));

    return combinedTranslations
      .sort((a, b) => {
        if (a.primacy > b.primacy) return 1;
        if (a.primacy < b.primacy) return -1;
        return 0;
      })
      .map((tr) => ({
        translation: tr.translation,
        uuid: tr.uuid,
      }));
  }
}

export default new DictionaryWordDao();
