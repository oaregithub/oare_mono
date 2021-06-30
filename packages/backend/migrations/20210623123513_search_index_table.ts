import * as Knex from 'knex';
import { createTabletRenderer } from '@oare/oare';
import cliProgress from 'cli-progress';
import TextEpigraphyDao from '../build/src/api/daos/TextEpigraphyDao';

interface SignTextRow {
  sign_uuid_sequence: string;
  text_uuid: string;
  line: number;
}

async function indexText(knex: Knex, textUuid: string) {
  const units = await TextEpigraphyDao.getEpigraphicUnits(textUuid);
  const renderer = createTabletRenderer(units);

  let rows: SignTextRow[] = [];

  renderer.lines.forEach(line => {
    const sequences = new Set<string>();
    const signReadingUuids = units
      .filter(unit => unit.line === line)
      .map(unit => unit.readingUuid);
    for (let i = 0; i < signReadingUuids.length - 1; i += 1) {
      sequences.add(signReadingUuids.slice(i, i + 2).join(' '));
    }
    rows = rows.concat(
      [...sequences].map(sequence => ({
        sign_uuid_sequence: sequence,
        text_uuid: textUuid,
        line,
      }))
    );
  });

  await knex('search_index').insert(rows);
}

export async function up(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable('search_index');

  if (!tableExists) {
    await knex.schema.createTable('search_index', table => {
      table.increments('id');
      table.string('sign_uuid_sequence');
      table.string('text_uuid');
      table.integer('line');

      table.index('sign_uuid_sequence');
      table.foreign('text_uuid').references('text.uuid');
    });

    const textUuids = await knex('text').pluck('uuid');

    const progressBar = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    );
    progressBar.start(textUuids.length, 0);

    for (let i = 0; i < textUuids.length; i += 1) {
      await indexText(knex, textUuids[i]); // eslint-disable-line
      progressBar.increment();
    }
    progressBar.stop();
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('search_index');
}
