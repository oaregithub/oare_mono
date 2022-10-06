import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasExcavationPrefColumn = await knex.schema.hasColumn(
    'text',
    'excavation_prfx'
  );
  const hasExcavationNoColumn = await knex.schema.hasColumn(
    'text',
    'excavation_no'
  );
  const hasMuseumPrfxColumn = await knex.schema.hasColumn(
    'text',
    'museum_prfx'
  );
  const hasMuseumNoColumn = await knex.schema.hasColumn('text', 'museum_no');
  const hasPublicationPrfxColumn = await knex.schema.hasColumn(
    'text',
    'publication_prfx'
  );
  const hasPublicationNoColumn = await knex.schema.hasColumn(
    'text',
    'publication_no'
  );
  const hasObjectTypeColumn = await knex.schema.hasColumn(
    'text',
    'object_type'
  );
  const hasSourceColumn = await knex.schema.hasColumn('text', 'source');
  const hasGenreColumn = await knex.schema.hasColumn('text', 'genre');
  const hasSubgenreColumn = await knex.schema.hasColumn('text', 'subgenre');

  if (!hasExcavationPrefColumn) {
    await knex.raw(
      'ALTER TABLE text ADD COLUMN excavation_prfx VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER name; '
    );
  }
  if (!hasExcavationNoColumn) {
    await knex.raw(
      'ALTER TABLE text ADD COLUMN excavation_no VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER excavation_prfx;'
    );
  }
  if (!hasMuseumPrfxColumn) {
    await knex.raw(
      'ALTER TABLE text ADD COLUMN museum_prfx VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER excavation_no; '
    );
  }
  if (!hasMuseumNoColumn) {
    await knex.raw(
      'ALTER TABLE text ADD COLUMN museum_no VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER museum_prfx; '
    );
  }
  if (!hasPublicationPrfxColumn) {
    await knex.raw(
      'ALTER TABLE text ADD COLUMN publication_prfx VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER museum_prfx; '
    );
  }
  if (!hasPublicationNoColumn) {
    await knex.raw(
      'ALTER TABLE text ADD COLUMN publication_no VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER publication_prfx; '
    );
  }
  if (!hasObjectTypeColumn) {
    await knex.raw(
      'ALTER TABLE text ADD COLUMN object_type VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER publication_no; '
    );
  }
  if (!hasSourceColumn) {
    await knex.raw(
      'ALTER TABLE text ADD COLUMN source VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER object_type; '
    );
  }
  if (!hasGenreColumn) {
    await knex.raw(
      'ALTER TABLE text ADD COLUMN genre VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER source; '
    );
  }
  if (!hasSubgenreColumn) {
    await knex.raw(
      'ALTER TABLE text ADD COLUMN subgenre VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER genre; '
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasExcavationPrefColumn = await knex.schema.hasColumn(
    'text',
    'excavation_prfx'
  );
  const hasExcavationNoColumn = await knex.schema.hasColumn(
    'text',
    'excavation_no'
  );
  const hasMuseumPrfxColumn = await knex.schema.hasColumn(
    'text',
    'museum_prfx'
  );
  const hasMuseumNoColumn = await knex.schema.hasColumn('text', 'museum_no');
  const hasPublicationPrfxColumn = await knex.schema.hasColumn(
    'text',
    'publication_prfx'
  );
  const hasPublicationNoColumn = await knex.schema.hasColumn(
    'text',
    'publication_no'
  );
  const hasObjectTypeColumn = await knex.schema.hasColumn(
    'text',
    'object_type'
  );
  const hasSourceColumn = await knex.schema.hasColumn('text', 'source');
  const hasGenreColumn = await knex.schema.hasColumn('text', 'genre');
  const hasSubgenreColumn = await knex.schema.hasColumn('text', 'subgenre');

  if (hasExcavationPrefColumn) {
    await knex.schema.table('text', table => {
      table.dropColumn('excavation_prfx');
    });
  }
  if (hasExcavationNoColumn) {
    await knex.schema.table('text', table => {
      table.dropColumn('excavation_no');
    });
  }
  if (hasMuseumPrfxColumn) {
    await knex.schema.table('text', table => {
      table.dropColumn('museum_prfx');
    });
  }
  if (hasMuseumNoColumn) {
    await knex.schema.table('text', table => {
      table.dropColumn('museum_no');
    });
  }
  if (hasPublicationPrfxColumn) {
    await knex.schema.table('text', table => {
      table.dropColumn('publication_prfx');
    });
  }
  if (hasPublicationNoColumn) {
    await knex.schema.table('text', table => {
      table.dropColumn('publication_no');
    });
  }
  if (hasObjectTypeColumn) {
    await knex.schema.table('text', table => {
      table.dropColumn('object_type');
    });
  }
  if (hasSourceColumn) {
    await knex.schema.table('text', table => {
      table.dropColumn('source');
    });
  }
  if (hasGenreColumn) {
    await knex.schema.table('text', table => {
      table.dropColumn('genre');
    });
  }
  if (hasSubgenreColumn) {
    await knex.schema.table('text', table => {
      table.dropColumn('subgenre');
    });
  }
}
