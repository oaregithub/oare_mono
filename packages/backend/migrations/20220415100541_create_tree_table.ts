import { Knex } from 'knex';
import cliProgress from 'cli-progress';

const epigraphyTreeFK = 'epigraphy_tree_uuid_foreign';
const discourseTreeFK = 'discourse_tree_uuid_foreign';

export async function up(knex: Knex): Promise<void> {
  const hasTreeTable = await knex.schema.hasTable('tree');
  if (!hasTreeTable) {
    const progressBar1 = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    );

    const existingEpigraphyTreeUuids: string[] = [
      ...new Set(await knex('text_epigraphy').pluck('tree_uuid')),
    ];

    const existingDiscourseTreeUuids: string[] = [
      ...new Set(await knex('text_discourse').pluck('tree_uuid')),
    ];

    const allTreeUuids = [
      ...existingDiscourseTreeUuids,
      ...existingEpigraphyTreeUuids,
    ];

    const allTreeUuidsInsert = allTreeUuids.map(uuid => ({
      uuid,
      table_reference: 'tree',
    }));

    progressBar1.start(allTreeUuidsInsert.length, 0);

    await Promise.all(
      allTreeUuidsInsert.map(row => {
        progressBar1.increment();
        return knex('uuid').insert(row);
      })
    );

    progressBar1.stop();

    await knex.schema.createTable('tree', table => {
      table.charset('utf8mb4');
      table.collate('utf8mb4_bin');
      table.increments('id').primary();
      // @ts-ignore
      table.uuid('uuid').notNullable().unique().collate('latin1_swedish_ci');
      table.string('type');

      table.foreign('uuid', 'tree_uuid_fk_uuid').references('uuid.uuid');
    });

    const existingEpigraphyTreeInserts = existingEpigraphyTreeUuids.map(
      uuid => ({
        uuid,
        type: 'epigraphy',
      })
    );

    const existingDiscourseTreeInserts = existingDiscourseTreeUuids.map(
      uuid => ({
        uuid,
        type: 'discourse',
      })
    );

    const allExistingRows = [
      ...existingEpigraphyTreeInserts,
      ...existingDiscourseTreeInserts,
    ];

    const progressBar2 = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    );

    progressBar2.start(allExistingRows.length, 0);

    await Promise.all(
      allExistingRows.map(row => {
        progressBar2.increment();
        return knex('tree').insert(row);
      })
    );

    progressBar2.stop();

    await knex.schema.alterTable('text_epigraphy', table => {
      table.foreign('tree_uuid', epigraphyTreeFK).references('tree.uuid');
    });

    await knex.schema.alterTable('text_discourse', table => {
      table.foreign('tree_uuid', discourseTreeFK).references('tree.uuid');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('text_epigraphy', table => {
    table.dropForeign(['tree_uuid'], epigraphyTreeFK);
  });

  await knex.schema.alterTable('text_discourse', table => {
    table.dropForeign(['tree_uuid'], discourseTreeFK);
  });

  const hasTreeTable = await knex.schema.hasTable('tree');
  if (hasTreeTable) {
    await knex.schema.dropTable('tree');
  }

  await knex('uuid').del().where('table_reference', 'tree');
}
