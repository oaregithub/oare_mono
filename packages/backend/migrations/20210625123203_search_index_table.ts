import { Knex } from 'knex';
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
  const hasTable = await knex.schema.hasTable('search_index');
  if (hasTable) {
    return;
  }
  await knex.schema.createTable('search_index', table => {
    table.increments('id');
    table.string('sign_uuid_sequence', 1332);
    table.uuid('text_uuid');
    table.string('text_name');
    table.decimal('line');
    table.text('line_reading');

    table.foreign('text_uuid').references('text.uuid');
  });

  // Index keys will be too long if every column is utf8, so just change line_reading
  await knex.raw(
    'ALTER TABLE search_index MODIFY line_reading TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin'
  );

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
  /**
   * Delete first since I was having problems with storage
   * not being freed even after dropping the table
   */
  await knex('search_index').del();

  const hasTable = await knex.schema.hasTable('search_index');

  if (hasTable) {
    await knex.schema.dropTableIfExists('search_index');
  }
}
