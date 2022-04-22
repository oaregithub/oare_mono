import { Knex } from 'knex';
import cliProgress from 'cli-progress';

const epigraphyTreeFK = 'epigraphy_tree_uuid_foreign';
const discourseTreeFK = 'discourse_tree_uuid_foreign';

export async function up(knex: Knex): Promise<void> {
  const hasTreeTable = await knex.schema.hasTable('tree');
  if (!hasTreeTable) {
    console.info('1/6 - Generating list of existing Tree UUIDs');

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

    console.info('2/6 - Adding Tree UUIDs to uuid table');

    const progressBar1 = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    );

    progressBar1.start(allTreeUuidsInsert.length, 0);

    for (let i = 0; i < allTreeUuidsInsert.length; i += 1) {
      progressBar1.increment();
      // eslint-disable-next-line no-await-in-loop
      await knex('uuid').insert(allTreeUuidsInsert[i]);
    }

    progressBar1.stop();

    console.info('3/6 - Creating tree table');

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

    console.info('4/6 - Inserting existing Tree UUIDs into tree table');

    const progressBar2 = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    );

    progressBar2.start(allExistingRows.length, 0);

    for (let i = 0; i < allExistingRows.length; i += 1) {
      progressBar2.increment();
      // eslint-disable-next-line no-await-in-loop
      await knex('tree').insert(allExistingRows[i]);
    }

    progressBar2.stop();

    console.info(
      '5/6 - Creating foreign key relationship in text_epigraphy table - Est. 1-2 hours'
    );

    await knex.schema.alterTable('text_epigraphy', table => {
      table.foreign('tree_uuid', epigraphyTreeFK).references('tree.uuid');
    });

    console.info(
      '6/6 - Creating foreign key relationship in text_discourse table - Est. 1-2 hours'
    );

    await knex.schema.alterTable('text_discourse', table => {
      table.foreign('tree_uuid', discourseTreeFK).references('tree.uuid');
    });

    console.info('Migration Complete');
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTreeTable = await knex.schema.hasTable('tree');
  if (hasTreeTable) {
    await knex.schema.alterTable('text_epigraphy', table => {
      table.dropForeign(['tree_uuid'], epigraphyTreeFK);
    });

    await knex.schema.alterTable('text_discourse', table => {
      table.dropForeign(['tree_uuid'], discourseTreeFK);
    });

    await knex.schema.dropTable('tree');

    await knex('uuid').del().where('table_reference', 'tree');
  }
}
