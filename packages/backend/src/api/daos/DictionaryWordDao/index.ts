import {
  DictionaryWordTranslation,
  DictionaryWord,
  NameOrPlace,
  SearchSpellingResultRow,
  CopyWithPartial,
  ExplicitSpelling,
} from '@oare/types';
import knex from '@/connection';
import { DictionarySpellingRows } from '@/api/daos/DictionarySpellingDao';
import { AliasWithName } from '@/api/daos/AliasDao';
import sl from '@/serviceLocator';
import { assembleSearchResult, nestedFormsAndSpellings } from './utils';
import LoggingEditsDao from '../LoggingEditsDao';
import FieldDao, { FieldShortRow } from '../FieldDao';
import AliasDao from '../AliasDao';
import DictionaryFormDao, { FormRow } from '../DictionaryFormDao';
import ItemPropertiesDao, {
  ItemPropertyRow,
  ItemPropertyShortRow,
} from '../ItemPropertiesDao';

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

export interface WordQueryWordResultRow {
  uuid: string;
  word: string;
}

export interface WordCombination
  extends FormRow,
    DictionarySpellingRows,
    FieldShortRow,
    ItemPropertyShortRow,
    AliasWithName {}

export interface NamePlaceQueryRow {
  uuid: string;
  word: string;
  formUuid: string | null;
  translation: string | null;
  form: string | null;
  cases: string | null;
  spellings: ExplicitSpelling[] | null;
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

type PartialWordCombination = CopyWithPartial<
  WordCombination,
  'form' | 'explicitSpelling' | 'field' | 'valueUuid' | 'name'
>;

class DictionaryWordDao {
  public readonly PLACE_TYPE = 'GN';

  public readonly NAMES_TYPE = 'PN';

  async searchSpellings(spelling: string): Promise<SearchSpellingResultRow[]> {
    interface SearchSpellingRow {
      wordUuid: string;
      word: string;
      formUuid: string;
      form: string;
    }

    const rows: SearchSpellingRow[] = await knex
      .select(
        'dw.uuid AS wordUuid',
        'dw.word',
        'df.uuid AS formUuid',
        'df.form'
      )
      .from('dictionary_word AS dw')
      .innerJoin('dictionary_form AS df', 'df.reference_uuid', 'dw.uuid')
      .innerJoin('dictionary_spelling AS ds', 'ds.reference_uuid', 'df.uuid')
      .where('ds.explicit_spelling', spelling);

    const formGrammars = await Promise.all(
      rows.map(r => DictionaryFormDao.getFormGrammar(r.formUuid))
    );

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

    letters.forEach(l => {
      query = query.orWhere('word', 'like', `${l}%`);
    });

    const words: { uuid: string; word: string }[] = await query;

    const partsOfSpeech = await this.getPartsOfSpeech();
    const specialClassifications = await this.getSpecialClassifications();
    const verbalThematicVowelTypes = await this.getVerbalThematicVowelTypes();
    const allTranslations = await this.getAllTranslations();

    return words
      .map(word => {
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
        };
      })
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

  async getNames(letter: string): Promise<NameOrPlace[]> {
    const results: NamePlaceQueryRow[] = await this.getNamesOrPlaces(
      this.NAMES_TYPE,
      letter
    );
    return nestedFormsAndSpellings(results);
  }

  async getDictionaryWordsByType(
    type: string,
    letter: string
  ): Promise<WordQueryWordResultRow[]> {
    // REGEX = Starts with open parenthesis followed by upperCase 'letter' OR just starts with upperCase 'letter'
    const letters = letter.split('/');

    let andWhere = '';
    letters.forEach((l: string, index: number) => {
      andWhere += `dw.word REGEXP '^[(]${l.toUpperCase()}|^[${l.toUpperCase()}]|^[(]${l.toLowerCase()}|^[${l.toLowerCase()}]]'`;
      if (index !== letters.length - 1) {
        andWhere += ' OR ';
      }
    });

    const words: WordQueryWordResultRow[] = await knex('dictionary_word AS dw')
      .select('dw.uuid', 'dw.word')
      .where('dw.type', type)
      .andWhereRaw(andWhere);
    return words;
  }

  async getDictionaryFormRows(): Promise<FormRow[]> {
    const dictionaryFormDao = sl.get('DictionaryFormDao');
    const results: FormRow[] = await dictionaryFormDao.getDictionaryFormRows();
    return results;
  }

  async getDictionarySpellingRows(): Promise<DictionarySpellingRows[]> {
    const dictionarySpellingDao = sl.get('DictionarySpellingDao');
    const results: DictionarySpellingRows[] = await dictionarySpellingDao.getDictionarySpellingRows();
    return results;
  }

  async getFieldRows(): Promise<FieldShortRow[]> {
    const fieldDao = sl.get('FieldDao');
    const results: FieldShortRow[] = await fieldDao.getFieldRows();
    return results;
  }

  async getItemPropertyRowsByAliasName(
    aliasName: string
  ): Promise<ItemPropertyShortRow[]> {
    const itemPropertiesDao = sl.get('ItemPropertiesDao');
    const results: ItemPropertyShortRow[] = await itemPropertiesDao.getItemPropertyRowsByAliasName(
      aliasName
    );
    return results;
  }

  async getAliasesByType(type: string): Promise<AliasWithName[]> {
    const aliasDao = sl.get('AliasDao');
    const results: AliasWithName[] = await aliasDao.getAliasesByType(type);
    return results;
  }

  private reduceByReferenceUuid(
    iterable: PartialWordCombination[],
    hasMultiplePerReferenceUuid?: boolean
  ): Record<string, PartialWordCombination | PartialWordCombination[]> {
    let results: Record<string, any> = {};

    if (hasMultiplePerReferenceUuid) {
      results = iterable.reduce(
        (
          map: Record<string, PartialWordCombination[]>,
          obj: PartialWordCombination
        ) => {
          if (map[obj.referenceUuid] === undefined) {
            map[obj.referenceUuid] = [obj];
          } else {
            const returnObjs = map[obj.referenceUuid];
            returnObjs.push(obj);
            map[obj.referenceUuid] = returnObjs;
          }
          return map;
        },
        {}
      );
    } else {
      results = iterable.reduce(
        (
          map: Record<string, PartialWordCombination>,
          obj: PartialWordCombination
        ) => {
          map[obj.referenceUuid] = obj;
          return map;
        },
        {}
      );
    }

    return results;
  }

  private parseNamesOrPlacesQueries(
    dictionaryWords: WordQueryWordResultRow[],
    dictionaryFormsMapped: Record<string, FormRow[]>,
    dictionarySpellingsMapped: Record<string, DictionarySpellingRows[]>,
    fieldsMapped: Record<string, FieldShortRow>,
    itemPropertiesMapped: Record<string, ItemPropertyShortRow[]>,
    aliasesMapped: Record<string, AliasWithName>
  ): NamePlaceQueryRow[] {
    // Join results for NamePlaceQuery.
    const results: NamePlaceQueryRow[] = [];
    dictionaryWords.forEach((dictWord: WordQueryWordResultRow) => {
      let translation: string | null = '';
      const abbreviations: Record<string, Set<string | null>> = {};
      const explicitSpellings: Record<string, Set<ExplicitSpelling>> = {};
      let forms: FormRow[] = [];

      // Get all forms associated with the current word.
      if (dictionaryFormsMapped[dictWord.uuid] !== undefined) {
        forms = dictionaryFormsMapped[dictWord.uuid];
      }

      // Get all explicitSpellings for each form associated with the current word.
      forms.forEach((form: FormRow) => {
        if (
          form.uuid !== undefined &&
          dictionarySpellingsMapped[form.uuid] !== undefined
        ) {
          dictionarySpellingsMapped[form.uuid].forEach(
            (spelling: DictionarySpellingRows) => {
              if (explicitSpellings[form.uuid] === undefined) {
                explicitSpellings[form.uuid] = new Set<ExplicitSpelling>().add({
                  uuid: spelling.uuid,
                  explicitSpelling: spelling.explicitSpelling,
                });
              } else {
                explicitSpellings[form.uuid].add({
                  uuid: spelling.uuid,
                  explicitSpelling: spelling.explicitSpelling,
                });
              }
            }
          );
        }
      });

      // Get the translation of the current word.
      if (fieldsMapped[dictWord.uuid] !== undefined) {
        translation = fieldsMapped[dictWord.uuid]?.field;
      }

      // Get all abbreviations for each form associated with the current word.
      forms.forEach((form: FormRow) => {
        const properties: ItemPropertyShortRow[] =
          itemPropertiesMapped[form.uuid];
        if (properties !== undefined) {
          properties.forEach((property: ItemPropertyShortRow) => {
            if (
              property.valueUuid !== null &&
              aliasesMapped[property.valueUuid] !== undefined
            ) {
              if (abbreviations[form.uuid] === undefined) {
                abbreviations[form.uuid] = new Set<string | null>().add(
                  aliasesMapped[property.valueUuid].name
                );
              } else {
                abbreviations[form.uuid].add(
                  aliasesMapped[property.valueUuid].name
                );
              }
            }
          });
        }
      });

      // Change format for display and add to results.
      if (forms.length !== 0) {
        forms.forEach(form => {
          results.push({
            uuid: dictWord.uuid,
            word: dictWord.word,
            formUuid: form.uuid,
            translation,
            form: form.form,
            cases:
              abbreviations[form.uuid] !== undefined
                ? Array.from(abbreviations[form.uuid]).join('/')
                : null,
            spellings:
              explicitSpellings[form.uuid] !== undefined
                ? Array.from(explicitSpellings[form.uuid])
                : null,
          } as NamePlaceQueryRow);
        });
      } else {
        results.push({
          uuid: dictWord.uuid,
          word: dictWord.word,
          formUuid: null,
          translation,
          form: null,
          cases: null,
          spellings: null,
        } as NamePlaceQueryRow);
      }
    });

    return results;
  }

  async getNamesOrPlaces(type: string, letter: string) {
    // Query the needed tables.
    const [
      dictionaryWords,
      dictionaryForms,
      dictionarySpellings,
      fields,
      itemProperties,
      aliases,
    ] = await Promise.all([
      this.getDictionaryWordsByType(type, letter),
      this.getDictionaryFormRows(),
      this.getDictionarySpellingRows(),
      this.getFieldRows(),
      this.getItemPropertyRowsByAliasName(AliasDao.CASE_NAME),
      this.getAliasesByType(AliasDao.ABBREVIATION_TYPE),
    ]);

    // Map to referenceUuid for O(1) lookup.
    const dictionaryFormsMapped: Record<string, FormRow[]> = <
      Record<string, FormRow[]>
    >this.reduceByReferenceUuid(dictionaryForms, true);

    const dictionarySpellingsMapped: Record<
      string,
      DictionarySpellingRows[]
    > = <Record<string, DictionarySpellingRows[]>>(
      this.reduceByReferenceUuid(dictionarySpellings, true)
    );

    const fieldsMapped: Record<string, FieldShortRow> = <
      Record<string, FieldShortRow>
    >this.reduceByReferenceUuid(fields);
    const itemPropertiesMapped: Record<string, ItemPropertyShortRow[]> = <
      Record<string, ItemPropertyShortRow[]>
    >this.reduceByReferenceUuid(itemProperties, true);

    const aliasesMapped: Record<string, AliasWithName> = <
      Record<string, AliasWithName>
    >this.reduceByReferenceUuid(aliases);

    const results: NamePlaceQueryRow[] = this.parseNamesOrPlacesQueries(
      dictionaryWords,
      dictionaryFormsMapped,
      dictionarySpellingsMapped,
      fieldsMapped,
      itemPropertiesMapped,
      aliasesMapped
    );

    return results;
  }

  async getPlaces(letter: string): Promise<NameOrPlace[]> {
    const results: NamePlaceQueryRow[] = await this.getNamesOrPlaces(
      this.PLACE_TYPE,
      letter
    );
    return nestedFormsAndSpellings(results);
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

  async getPartsOfSpeech(wordUuid?: string): Promise<ItemPropertyRow[]> {
    const rows = await ItemPropertiesDao.getProperties('Part of Speech', {
      abbreviation: true,
      ...(wordUuid ? { referenceUuid: wordUuid } : null),
    });

    return rows;
  }

  async getSpecialClassifications(
    wordUuid?: string
  ): Promise<ItemPropertyRow[]> {
    const rows = await ItemPropertiesDao.getProperties(
      'Special Classifications',
      wordUuid ? { referenceUuid: wordUuid } : {}
    );

    return rows;
  }

  async getVerbalThematicVowelTypes(
    wordUuid?: string
  ): Promise<ItemPropertyRow[]> {
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
        knex.raw(
          "GROUP_CONCAT(DISTINCT `field`.`field` SEPARATOR ';') AS translations"
        ),
        'df.form',
        knex.raw(
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

  async updateWordSpelling(uuid: string, word: string): Promise<void> {
    await knex('dictionary_word').update({ word }).where({ uuid });
  }

  async updateTranslations(
    userUuid: string,
    wordUuid: string,
    translations: DictionaryWordTranslation[]
  ): Promise<DictionaryWordTranslation[]> {
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

    return combinedTranslations
      .sort((a, b) => {
        if (a.primacy > b.primacy) return 1;
        if (a.primacy < b.primacy) return -1;
        return 0;
      })
      .map(tr => ({
        translation: tr.translation,
        uuid: tr.uuid,
      }));
  }
}

export default new DictionaryWordDao();
