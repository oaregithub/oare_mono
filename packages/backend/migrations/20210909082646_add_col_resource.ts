import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasContainerColumn = await knex.schema.hasColumn(
    'resource',
    'container'
  );

  if (!hasContainerColumn) {
    await knex.raw(
      'ALTER TABLE resource ADD COLUMN container VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER type; '
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasContainerColumn = await knex.schema.hasColumn(
    'resource',
    'container'
  );

  if (hasContainerColumn) {
    await knex.schema.table('resource', table => {
      table.dropColumn('container');
    });
  }
}
