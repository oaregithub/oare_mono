import * as Knex from 'knex';
import { createTabletRenderer } from '@oare/oare';
import cliProgress from 'cli-progress';
import TextEpigraphyDao from '../build/src/api/daos/TextEpigraphyDao';

interface SignTextRow {
  sign_uuid_sequence: string;
  text_uuid: string;
  text_name: string;
  line: number;
  line_reading: string;
}

interface TextRow {
  textUuid: string;
  textName: string;
}

// Take the reading uuids of the line and return all possible indexes
// e.g. two sign combinations, three sign combinations, etc.
function getLineIndexes(signReadingUuids: string[]): string[] {
  const sequences = new Set<string>();
  for (
    let indexSize = 1;
    indexSize <= signReadingUuids.length;
    indexSize += 1
  ) {
    for (let i = 0; i <= signReadingUuids.length - indexSize; i += 1) {
      sequences.add(signReadingUuids.slice(i, i + indexSize).join(' '));
    }
  }

  return [...sequences];
}

const progressBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic
);

async function indexText(knex: Knex, { textUuid, textName }: TextRow) {
  const units = await TextEpigraphyDao.getEpigraphicUnits(textUuid);
  const renderer = createTabletRenderer(units, { textFormat: 'html' });

  let rows: SignTextRow[] = [];

  renderer.lines.forEach(line => {
    const lineReading = renderer.lineReading(line);
    const signReadingUuids = units
      .filter(unit => unit.line === line)
      .map(unit => unit.readingUuid);

    const lineIndexes = getLineIndexes(signReadingUuids);
    rows = rows.concat(
      lineIndexes.map(sequence => ({
        sign_uuid_sequence: sequence,
        text_uuid: textUuid,
        text_name: textName,
        line,
        line_reading: lineReading,
      }))
    );
  });

  for (let i = 0; i < rows.length; i += 5000) {
    // eslint-disable-next-line
    await knex('search_index').insert(rows.slice(i, i + 5000));
  }
  progressBar.increment();
}

export async function up(knex: Knex): Promise<void> {
  const texts: TextRow[] = await knex('text').select(
    'uuid AS textUuid',
    'name AS textName'
  );

  progressBar.start(texts.length, 0);

  // We have to update in batches since there can't be too many connections in the pool
  const batchStep = 10;
  for (let i = 0; i < texts.length; i += batchStep) {
    // eslint-disable-next-line
    await Promise.all(
      texts.slice(i, i + batchStep).map(textUuid => indexText(knex, textUuid))
    );
  }
  progressBar.stop();
}

export async function down(knex: Knex): Promise<void> {
  await knex('search_index').del();
}
