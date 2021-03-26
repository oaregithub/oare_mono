import { knexConfig } from "@/connection";
import { EpigraphicUnit, EpigraphicUnitSide, MarkupUnit } from '@oare/types';
import * as Knex from "knex";
import { each } from "lodash";


/*
Finds all instances of i-ṣé-er in text_epigraphy that do no have discourse_uuid and 
creates a text_discourse row for that word with the right characteristics and
writes the uuid of the new row back to the rows i-ṣé-er in text_epigrpahy.
*/

export interface rowEditPkgs{
    ids: number[] | null;
    teUuids: string[] | null;
    type: string | null;
    teLine: number | null;
    readings: string[] | null;
    char_on_tablet: number[] | null;
    textUuid: string | null;
    treeUuid: string | null;
    prevWordDiscUuid: string | null;
    childNum: number | null;
    wordOnTablet: number | null;
    parentUuid: string | null;
    spellingUuid: string | null;
    explicitSpelling: string | null;
    transcription: string | null;
    newUuid: string | null;
}

export function getSequentialCharacterQuery(
  characterUuids: string[][],
  baseQuery?: Knex.QueryBuilder
): Knex.QueryBuilder {
  // Join text_epigraphy with itself so that characters can be searched
  // sequentially
  let query = baseQuery || knex('text_epigraphy');
  characterUuids.forEach((char, index) => {
    if (index < 1) {
      return;
    }

    query = query.join(`text_epigraphy AS t${index}`, function () {
      this.on(`t${index}.text_uuid`, 'text_epigraphy.text_uuid')
        .andOnIn(`t${index}.reading_uuid`, char)
        .andOn(
          knex.raw(
            `t${index}.char_on_tablet=text_epigraphy.char_on_tablet + ${index}`
          )
        );
    });
  });

  if (characterUuids.length > 0) {
    query = query.whereIn('text_epigraphy.reading_uuid', characterUuids[0]);
  }

  return query;
}

export const stringToCharsArray = (search: string): string[] => {
  const chars = search
    .trim()
    .split(/[\s\-.]+/)
    .flatMap(formattedSearchCharacter);

  if (chars.length === 1 && chars[0] === '') {
    return [];
  }
  return chars;
};

export interface startWithWord {
    sign: string;
    row: string | null;
}
  
export function getEditRows(characterUuids: string[][])
    const editRows: 
    
export async function up(knex: Knex): Promise<void> {
    /* grab id row of logging_edits before starting  */
    const startLogId = knex('logging_edits').max('id');
    /* gather all instances of i-ṣé-er and info from text_epigraphy into array of objects*/
    const startSearch: string = 'i-ṣé-er';
    const startWithWord: string[] = stringToCharsArray(startSearch);
    const characterUuids: string[][] = getUuidsBySigns(startWithWord.sign);
    const editRows: rowEditPkgs[] = getEditRows(characterUuids[][]);

    
           
    /* grab id row of logging_edits at end  */
    const endLogId = knex('logging_edits').max('id');
}

export async function down(knex: Knex): Promise<void> {
    /* delete text_epigraphy.discourse_uuid for all logging_edit.reference_table = text_epigraphy 
    after start_id and up to end_id */

    /*drop text_discourse rows for all logging_edit.reference_table = text_discourse
    after start_id and up to end_id */ 
}

class ThisMigrationDao {
    async getSignSeriesInfo(anchor[]): Promise<signSeries[]> {
        const sign: signSeries[] = await Knex('text_epigraphy')
            .select('id',
                'uuid',
                'type',
                'line',
                'reading',
                'char_on_tablet as charOnTablet'
            )
            .where('id', ">=", anchor.id)
            .andWhere('text_uuid', anchor.textUuid)
            .andWhere('line', anchor.line)
            .andWhere('type', anchor.type);
        return sign;
    }

    async getUuidsBySign(sign: string): Promise<string[]> {
    const rows: UuidRow[] = await knex('sign_reading')
      .select('uuid')
      .where('reading', sign);
    return rows.map(row => row.uuid);
  }
}




