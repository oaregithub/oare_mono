import * as Knex from 'knex';
import cliProgress from 'cli-progress';

interface TextRow {
  uuid: string;
  name: string;
}

const textUuidIndex = 'text_uuid_index';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('search_index', 'text_name');

  if (!hasColumn) {
    await knex.schema.alterTable('search_index', table => {
      table.string('text_name');
    });
  }

  await knex.schema.alterTable('search_index', table => {
    table.index('text_uuid', textUuidIndex);
  });

  const rows: TextRow[] = await knex('text').select('uuid', 'name');

  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  progressBar.start(rows.length, 0);

  for (let i = 0; i < rows.length; i += 1) {
    // eslint-disable-next-line
    await knex('search_index')
      .update({ text_name: rows[i].name })
      .where('text_uuid', rows[i].uuid);
    progressBar.increment();
  }
  progressBar.stop();
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('search_index', table => {
    table.dropColumn('text_name');
    table.dropIndex('text_uuid', textUuidIndex);
  });
}
