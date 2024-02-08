import knex from '@/connection';
import {
  Pagination,
  TextOccurrencesRow,
  TextDiscourseRow,
  TextDiscourseUnit,
  TextDiscourse,
} from '@oare/types';
import { Knex } from 'knex';
import sl from '@/serviceLocator';
import _ from 'lodash';
import { createNestedDiscourses, setDiscourseReading } from './utils';

class TextDiscourseDao {
  /**
   * Updates the spelling UUID of a text_discourse row.
   * @param uuid The UUIDS of the text_discourse row to update.
   * @param spellingUuid The new spelling_uuid.
   * @param trx Knex Transaction. Optional.
   */
  public async updateSpellingUuid(
    uuid: string,
    spellingUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('text_discourse')
      .update({ spelling_uuid: spellingUuid })
      .where({ uuid });
  }

  /**
   * Retrieves a list of discourse UUIDs with a given text UUID.
   * @param textUuid The text UUID whose discourse UUIDs to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Array of discourse UUIDs.
   */
  private async getTextDiscourseUuidsByTextUuid(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const rows = await k('text_discourse')
      .pluck('uuid')
      .where({ text_uuid: textUuid });

    return rows;
  }

  /**
   * Checks if a text_discourse row exists with a given spelling UUID.
   * @param spellingUuid The spelling UUID to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the row exists.
   */
  public async hasSpelling(
    spellingUuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const row = await k('text_discourse')
      .select()
      .where({ spelling_uuid: spellingUuid })
      .first();

    return !!row;
  }

  /**
   * Constructs text discourse units for a given text.
   * @param textUuid The text UUID whose discourse units to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Constructed text discourse units.
   */
  public async getTextDiscourseUnits(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<TextDiscourseUnit[]> {
    const k = trx || knex;

    const textDiscourseUuids = await this.getTextDiscourseUuidsByTextUuid(
      textUuid,
      trx
    );

    const textDiscourses = await Promise.all(
      textDiscourseUuids.map(uuid => this.getTextDiscourseByUuid(uuid, trx))
    );

    const discourseRowsWithRegionLineNumbers = textDiscourses.reduce<
      TextDiscourse[]
    >((newUnits, unit) => {
      if (unit.type === 'region') {
        const { objInText } = unit;

        const prevUnitIdx = _.findLastIndex(
          newUnits,
          backUnit =>
            backUnit.epigraphies[0].line !== null &&
            backUnit.objInText < objInText
        );

        let objLine: number | null = null;
        if (prevUnitIdx === -1) {
          objLine = 0.1;
        } else if (newUnits[prevUnitIdx].epigraphies[0].line !== null) {
          objLine = newUnits[prevUnitIdx].epigraphies[0].line! + 0.1;
        }

        return [...newUnits, { ...unit, line: objLine }];
      }

      return [...newUnits, unit];
    }, []);

    const nestedDiscourses = createNestedDiscourses(
      discourseRowsWithRegionLineNumbers,
      null
    );
    nestedDiscourses.forEach(nestedDiscourse =>
      setDiscourseReading(nestedDiscourse)
    );

    return nestedDiscourses;
  }

  /**
   * Retrieves the number of discourse occurrences for a given spelling.
   * @param spellingUuid The spelling UUID whose occurrences to retrieve.
   * @param textsToHide Array of text UUIDs that should not be included in the count. Used to filter out occurrences in texts that a user does not have access to.
   * @param pagination Pagination object. Used to supply a search filter.
   * @param trx Knex Transaction. Optional.
   * @returns Number of occurrences.
   */
  public async getSpellingOccurrencesCount(
    spellingUuid: string,
    textsToHide: string[],
    pagination: Partial<Pagination> = {},
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knex;

    const count = await k('text_discourse')
      .innerJoin('text', 'text.uuid', 'text_discourse.text_uuid')
      .where('text_discourse.spelling_uuid', spellingUuid)
      .whereNotIn('text_discourse.text_uuid', textsToHide)
      .modify(qb => {
        if (pagination.filter) {
          qb.where('text.display_name', 'like', `%${pagination.filter}%`);
        }
      })
      .count({ count: 'text_discourse.uuid' })
      .first();

    return count && count.count ? Number(count.count) : 0;
  }

  /**
   * Retrieves a list of text occurrences for given spellings.
   * @param spellingUuids The spelling UUIDs whose occurrences to retrieve.
   * @param textsToHide An array of text UUIDS that a user does not have access to.
   * @param pagination Pagination object. Used to supply a page, limit, and search filter.
   * @param trx Knex Transaction. Optional.
   * @returns Array of text occurrences.
   */
  public async getSpellingOccurrencesTexts(
    spellingUuids: string[],
    textsToHide: string[],
    { limit, page, filter }: Pagination,
    trx?: Knex.Transaction
  ): Promise<TextOccurrencesRow[]> {
    const k = trx || knex;

    const rows: TextOccurrencesRow[] = await k('text_discourse')
      .distinct(
        'text_discourse.uuid AS discourseUuid',
        'display_name AS textName',
        'text_discourse.text_uuid AS textUuid'
      )
      .innerJoin('text', 'text.uuid', 'text_discourse.text_uuid')
      .whereIn('text_discourse.spelling_uuid', spellingUuids)
      .whereNotIn('text.uuid', textsToHide)
      .modify(qb => {
        if (filter) {
          qb.andWhere('text.display_name', 'like', `%${filter}%`);
        }
      })
      .orderBy('text.display_name')
      .limit(limit)
      .offset((page - 1) * limit);

    return rows;
  }

  /**
   * Sets the spelling UIUD to NULL for all occurrences of a given spelling UUID. Used when deleting a spelling.
   * @param spellingUuid The spelling UUID whose occurrences to unset.
   * @param trx Knex Transaction. Optional.
   */
  public async unsetSpellingUuid(
    spellingUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('text_discourse')
      .update({ spelling_uuid: null })
      .where({ spelling_uuid: spellingUuid });
  }

  /**
   * Checks if a text discourse row exists.
   * @param uuid The UUID of the text discourse row to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the row exists.
   */
  public async textDiscourseExists(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const row = await k('text_discourse').select().where({ uuid }).first();

    return !!row;
  }

  /**
   * Checks if a spelling has any discourse occurrences.
   * @param spellingUuid The spelling UUID to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the spelling has any occurrences.
   */
  public async hasSpellingOccurrence(
    spellingUuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const row = await k('text_discourse')
      .where({ spelling_uuid: spellingUuid })
      .first();

    return !!row;
  }

  /**
   * Inserts a new text discourse row.
   * @param row The text discourse row to insert.
   * @param trx Knex Transaction. Optional.
   */
  public async insertDiscourseRow(
    row: TextDiscourseRow,
    trx?: Knex.Transaction
  ) {
    const k = trx || knex;

    await k('text_discourse').insert({
      uuid: row.uuid,
      type: row.type,
      obj_in_text: row.objInText,
      word_on_tablet: row.wordOnTablet,
      child_num: row.childNum,
      text_uuid: row.textUuid,
      tree_uuid: row.treeUuid,
      parent_uuid: row.parentUuid,
      spelling_uuid: row.spellingUuid,
      spelling: row.spelling,
      explicit_spelling: row.explicitSpelling,
      transcription: row.transcription,
    });
  }

  /**
   * Retrieves a text discourse row by UUID.
   * @param uuid The UUID of the text discourse row to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A single text discourse row.
   */
  public async getTextDiscourseRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<TextDiscourseRow> {
    const k = trx || knex;

    const row: TextDiscourseRow | undefined = await k('text_discourse')
      .select(
        'uuid',
        'type',
        'obj_in_text as objInText',
        'word_on_tablet as wordOnTablet',
        'child_num as childNum',
        'text_uuid as textUuid',
        'tree_uuid as treeUuid',
        'parent_uuid as parentUuid',
        'spelling_uuid as spellingUuid',
        'spelling',
        'explicit_spelling as explicitSpelling',
        'transcription'
      )
      .where({ uuid })
      .first();

    if (!row) {
      throw new Error(`Discourse row with uuid ${uuid} not found`);
    }

    return row;
  }

  /**
   * Constructs a TextDiscourse object for a given UUID.
   * @param uuid The UUID of the text discourse row to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Complete TextDiscourse object.
   */
  public async getTextDiscourseByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<TextDiscourse> {
    const FieldDao = sl.get('FieldDao');
    const AliasDao = sl.get('AliasDao');
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');
    const NoteDao = sl.get('NoteDao');

    const row = await this.getTextDiscourseRowByUuid(uuid, trx);

    const translations = await FieldDao.getFieldRowsByReferenceUuidAndType(
      uuid,
      'translation',
      trx
    );

    const paragraphLabels = await AliasDao.getAliasNamesByReferenceUuid(
      uuid,
      trx
    );

    const epigraphies = await TextEpigraphyDao.getTextEpigraphyRowsByDiscourseUuid(
      uuid,
      trx
    );

    const properties = await ItemPropertiesDao.getItemPropertiesByReferenceUuid(
      uuid,
      trx
    );

    const notes = await NoteDao.getNotesByReferenceUuid(uuid, trx);

    return {
      ...row,
      translations,
      paragraphLabels,
      epigraphies,
      properties,
      notes,
    };
  }

  /**
   * Updates the parent UUID of a set of text discourse rows.
   * @param uuids The UUIDs of the text discourse rows to update.
   * @param newParentUuid The new parent UUID.
   * @param trx Knex Transaction. Optional.
   */
  async updateParentUuid(
    uuids: string[],
    newParentUuid: string,
    trx?: Knex.Transaction
  ) {
    const k = trx || knex;

    await k('text_discourse')
      .update({ parent_uuid: newParentUuid })
      .whereIn('uuid', uuids);
  }

  /**
   * Increments the child number of a set of text discourse rows.
   * @param textUuid The text UUID.
   * @param parentUuid The parent UUID whoe children to increment.
   * @param childNum All rows with a child number greater than or equal to this, belonging to the provided parent, will be incremented.
   * @param amount The amount to increment by.
   * @param trx Knex Transaction. Optional.
   */
  public async incrementChildNum(
    textUuid: string,
    parentUuid: string,
    childNum: number | null,
    amount: number,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    if (childNum) {
      await k('text_discourse')
        .where({
          text_uuid: textUuid,
          parent_uuid: parentUuid,
        })
        .andWhere('child_num', '>=', childNum)
        .increment('child_num', amount);
    }
  }

  /**
   * Increments the word on tablet of a set of text discourse rows.
   * @param textUuid The text UUID.
   * @param wordOnTablet All rows with a word on tablet greater than or equal to this will be incremented.
   * @param amount The amount to increment by.
   * @param trx Knex Transaction. Optional.
   */
  public async incrementWordOnTablet(
    textUuid: string,
    wordOnTablet: number | null,
    amount: number,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    if (wordOnTablet) {
      await k('text_discourse')
        .where({
          text_uuid: textUuid,
        })
        .andWhere('word_on_tablet', '>=', wordOnTablet)
        .increment('word_on_tablet', amount);
    }
  }

  /**
   * Increments the object in text of a set of text discourse rows.
   * @param textUuid The text UUID.
   * @param objInText All rows with an object in text greater than or equal to this will be incremented.
   * @param amount The amount to increment by.
   * @param trx Knex Transaction. Optional.
   */
  public async incrementObjInText(
    textUuid: string,
    objInText: number,
    amount: number,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('text_discourse')
      .where({
        text_uuid: textUuid,
      })
      .andWhere('obj_in_text', '>=', objInText)
      .increment('obj_in_text', amount);
  }

  /**
   * Updates the child number of a text discourse row.
   * @param uuid The UUID of the text discourse row to update.
   * @param newChildNum The new child number.
   * @param trx Knex Transaction. Optional.
   */
  public async updateChildNum(
    uuid: string,
    newChildNum: number | null,
    trx?: Knex.Transaction
  ) {
    const k = trx || knex;

    await k('text_discourse')
      .update({ child_num: newChildNum })
      .where({ uuid });
  }

  /**
   * Retrieves a list of discourse UUIDs with a given parent UUID.
   * @param parentUuid The parent UUID.
   * @param trx Knex Transaction. Optional.
   * @returns Array of discourse UUIDs.
   */
  public async getTextDiscourseUuidsByParentUuid(
    parentUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const rows = await k('text_discourse')
      .pluck('uuid')
      .where({ parent_uuid: parentUuid })
      .orderBy('child_num');

    return rows;
  }

  /**
   * Retrieves nested discourse rows starting from a given UUID.
   * @param discourseUuid The discourse UUID to start from.
   * @param trx Knex Transaction. Optional.
   * @returns Array of nested discourse rows.
   */
  public async getSubwordsByDiscourseUuid(
    discourseUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const row = await this.getTextDiscourseRowByUuid(discourseUuid, trx);

    if (row.type === 'discourseUnit') {
      return [];
    }

    if (row.type === 'word' || row.type === 'number' || row.type === 'region') {
      return [discourseUuid];
    }

    const subwordUuids = await this.getTextDiscourseUuidsByParentUuid(
      discourseUuid,
      trx
    );

    const discourseUuids = (
      await Promise.all(
        subwordUuids.map(uuid => this.getSubwordsByDiscourseUuid(uuid, trx))
      )
    ).flat();

    return discourseUuids;
  }

  /**
   * Searches for discourse entries for use with link item properties.
   * @param search The search string.
   * @param textUuidFilter The text UUID that the discourse entries must belong to.
   * @param trx Knex Transaction. Optional.
   * @returns Array of discourse entries.
   */
  public async searchDiscourseLinkProperties(
    search: string,
    textUuidFilter: string,
    trx?: Knex.Transaction
  ): Promise<TextDiscourseUnit[]> {
    const matches: TextDiscourseUnit[] = [];

    const discourseUnits = await this.getTextDiscourseUnits(
      textUuidFilter,
      trx
    );

    const searchDiscourseUnits = (units: TextDiscourseUnit[]) => {
      units.forEach(unit => {
        if (
          unit.explicitSpelling &&
          unit.explicitSpelling.toLowerCase().includes(search.toLowerCase())
        ) {
          matches.push(unit);
        } else if (
          unit.transcription &&
          unit.transcription.toLowerCase().includes(search.toLowerCase())
        ) {
          matches.push(unit);
        } else if (
          unit.translations.some(tr =>
            tr.field.toLowerCase().includes(search.toLowerCase())
          )
        ) {
          matches.push(unit);
        } else if (
          unit.paragraphLabels.some(pl =>
            pl.toLowerCase().includes(search.toLowerCase())
          )
        ) {
          matches.push(unit);
        }
        searchDiscourseUnits(unit.children);
      });
    };

    searchDiscourseUnits(discourseUnits);

    return matches;
  }
}

/**
 * TextDiscourseDao instance as a singleton.
 */
export default new TextDiscourseDao();
