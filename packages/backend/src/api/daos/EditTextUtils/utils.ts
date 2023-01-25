import { Knex } from 'knex';
import { knexWrite } from '@/connection';
import { EpigraphyType } from '@oare/types';

interface CleanEpigraphyLine extends CleanIterators {
  uuid: string;
  type: EpigraphyType;
  line: number | null;
}

interface CleanIterators {
  objectOnTablet: number | null;
  charOnTablet: number | null;
  charOnLine: number | null;
}

export async function cleanLines(
  textUuid: string,
  trx?: Knex.Transaction
): Promise<void> {
  const k = trx || knexWrite();

  const rows: CleanEpigraphyLine[] = await k('text_epigraphy')
    .select(
      'uuid',
      'type',
      'line',
      'object_on_tablet as objectOnTablet',
      'char_on_tablet as charOnTablet',
      'char_on_line as charOnLine'
    )
    .where({ text_uuid: textUuid })
    .orderBy('object_on_tablet', 'asc');

  await cleanIterators(rows, trx);
  await cleanLineNumbers(rows, trx);
}

async function cleanLineNumbers(
  rows: CleanEpigraphyLine[],
  trx?: Knex.Transaction
): Promise<void> {
  const k = trx || knexWrite();

  let currentLine = 0;
  let numBrokenAreas = 0;
  let brokenStatus = false;

  const newRows: { [key: string]: number | null } = {};

  for (let i = 0; i < rows.length; i += 1) {
    if (
      rows[i].type === 'epigraphicUnit' ||
      rows[i].type === 'section' ||
      rows[i].type === 'column'
    ) {
      newRows[rows[i].uuid] = null;
    } else if (rows[i].type === 'region') {
      newRows[rows[i].uuid] = null;
      // eslint-disable-next-line no-await-in-loop
      const isBroken = await k('text_markup')
        .first()
        .where({ reference_uuid: rows[i].uuid, type: 'broken' })
        .then(row => !!row);

      if (isBroken) {
        if (!brokenStatus) {
          numBrokenAreas += 1;
          currentLine = 0.01 * numBrokenAreas;
        }

        brokenStatus = true;
      } else {
        brokenStatus = false;
      }
    } else if (rows[i].type === 'line') {
      brokenStatus = false;
      currentLine += 1;
      newRows[rows[i].uuid] = currentLine;
    } else if (
      rows[i].type === 'sign' ||
      rows[i].type === 'number' ||
      rows[i].type === 'separator' ||
      rows[i].type === 'undeterminedSigns'
    ) {
      brokenStatus = false;
      newRows[rows[i].uuid] = currentLine;
    } else if (rows[i].type === 'undeterminedLines') {
      brokenStatus = false;
      currentLine += 1;
      newRows[rows[i].uuid] = currentLine;
      const numValue =
        // eslint-disable-next-line no-await-in-loop
        (await k('text_markup')
          .select('num_value')
          .where({ reference_uuid: rows[i].uuid, type: 'undeterminedLines' })
          .first()
          .then(row => row.num_value as number)) || 0;
      currentLine += numValue - 1;
    } else {
      brokenStatus = false;
      newRows[rows[i].uuid] = null;
    }
  }

  const changedRows = Object.keys(newRows).filter(
    (uuid, idx) => newRows[uuid] !== rows[idx].line
  );

  await Promise.all(
    changedRows.map(uuid =>
      k('text_epigraphy').where({ uuid }).update({ line: newRows[uuid] })
    )
  );
}

async function cleanIterators(
  rows: CleanEpigraphyLine[],
  trx?: Knex.Transaction
): Promise<void> {
  const k = trx || knexWrite();

  let charOnTablet = 0;
  let charOnLine = 0;

  const newIterators: { [key: string]: CleanIterators } = {};

  rows.forEach((row, idx) => {
    if (row.type === 'line') {
      charOnLine = 0;
    }

    if (
      row.type === 'sign' ||
      row.type === 'number' ||
      row.type === 'separator' ||
      row.type === 'undeterminedSigns'
    ) {
      charOnTablet += 1;
      charOnLine += 1;

      newIterators[row.uuid] = {
        objectOnTablet: idx + 1,
        charOnTablet,
        charOnLine,
      };
    } else {
      newIterators[row.uuid] = {
        objectOnTablet: idx + 1,
        charOnTablet: null,
        charOnLine: null,
      };
    }
  });

  const changedRows = Object.keys(newIterators).filter((row, idx) => {
    if (newIterators[row].objectOnTablet !== rows[idx].objectOnTablet) {
      return true;
    }
    if (newIterators[row].charOnTablet !== rows[idx].charOnTablet) {
      return true;
    }
    return newIterators[row].charOnLine !== rows[idx].charOnLine;
  });

  await Promise.all(
    changedRows.map(uuid =>
      k('text_epigraphy').where({ uuid }).update({
        object_on_tablet: newIterators[uuid].objectOnTablet,
        char_on_tablet: newIterators[uuid].charOnTablet,
        char_on_line: newIterators[uuid].charOnLine,
      })
    )
  );
}
