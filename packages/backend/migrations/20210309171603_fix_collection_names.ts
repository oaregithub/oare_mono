import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    'ALTER TABLE collection MODIFY name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin'
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    'ALTER TABLE collection MODIFY name VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci'
  );
}
