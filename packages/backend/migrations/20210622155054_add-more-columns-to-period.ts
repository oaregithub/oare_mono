import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasOfficialPN1NotUuidColumn = await knex.schema.hasColumn(
    'period',
    'officialPN1'
  );
  const hasOfficialPN2NotUuidColumn = await knex.schema.hasColumn(
    'period',
    'officialPN2'
  );
  const hasOfficialPTR1Column = await knex.schema.hasColumn(
    'period',
    'officialPTR1'
  );
  const hasOfficialPTR2Column = await knex.schema.hasColumn(
    'period',
    'officialPTR2'
  );
  const hasOfficialPTR1UuidColumn = await knex.schema.hasColumn(
    'period',
    'officialPTR1_uuid'
  );
  const hasOfficialPTR2UuidColumn = await knex.schema.hasColumn(
    'period',
    'officialPTR2_uuid'
  );

  if (!hasOfficialPN1NotUuidColumn) {
    await knex.raw(
      'ALTER TABLE period ADD COLUMN officialPN1 VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER abbreviation; '
    );
  }
  if (!hasOfficialPN2NotUuidColumn) {
    await knex.raw(
      'ALTER TABLE period ADD COLUMN officialPN2 VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER officialPN1;'
    );
  }
  if (!hasOfficialPTR1Column) {
    await knex.raw(
      'ALTER TABLE period ADD COLUMN officialPTR1 VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER officialPN2_uuid; '
    );
  }
  if (!hasOfficialPTR2Column) {
    await knex.raw(
      'ALTER TABLE period ADD COLUMN officialPTR2 VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER officialPTR1; '
    );
  }
  if (!hasOfficialPTR1UuidColumn) {
    await knex.raw(
      'ALTER TABLE period ADD COLUMN officialPTR1_uuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER officialPTR2; '
    );
  }
  if (!hasOfficialPTR2UuidColumn) {
    await knex.raw(
      'ALTER TABLE period ADD COLUMN officialPTR2_uuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER officialPTR1_uuid; '
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasOfficialPN1NotUuidColumn = await knex.schema.hasColumn(
    'period',
    'officialPN1'
  );
  const hasOfficialPN2NotUuidColumn = await knex.schema.hasColumn(
    'period',
    'officialPN2'
  );
  const hasOfficialPTR1Column = await knex.schema.hasColumn(
    'period',
    'officialPTR1'
  );
  const hasOfficialPTR2Column = await knex.schema.hasColumn(
    'period',
    'officialPTR2'
  );
  const hasOfficialPTR1UuidColumn = await knex.schema.hasColumn(
    'period',
    'officialPTR1_uuid'
  );
  const hasOfficialPTR2UuidColumn = await knex.schema.hasColumn(
    'period',
    'officialPTR2_uuid'
  );

  if (hasOfficialPN1NotUuidColumn) {
    await knex.schema.table('period', table => {
      table.dropColumn('officialPN1');
    });
  }
  if (hasOfficialPN2NotUuidColumn) {
    await knex.schema.table('period', table => {
      table.dropColumn('officialPN2');
    });
  }
  if (hasOfficialPTR1Column) {
    await knex.schema.table('period', table => {
      table.dropColumn('officialPTR1');
    });
  }
  if (hasOfficialPTR2Column) {
    await knex.schema.table('period', table => {
      table.dropColumn('officialPTR2');
    });
  }
  if (hasOfficialPTR1UuidColumn) {
    await knex.schema.table('period', table => {
      table.dropColumn('officialPTR1_uuid');
    });
  }
  if (hasOfficialPTR2UuidColumn) {
    await knex.schema.table('period', table => {
      table.dropColumn('officialPTR2_uuid');
    });
  }
}
