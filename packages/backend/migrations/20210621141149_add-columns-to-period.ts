import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasNameColumn = await knex.schema.hasColumn('period', 'name');
  const hasAbbreviationColumn = await knex.schema.hasColumn(
    'period',
    'abbreviation'
  );
  const hasOfficial1Column = await knex.schema.hasColumn(
    'period',
    'official1_uuid'
  );
  const hasOfficial2Column = await knex.schema.hasColumn(
    'period',
    'official2_uuid'
  );
  const hasOfficialPN1Column = await knex.schema.hasColumn(
    'period',
    'officialPN1_uuid'
  );
  const hasOfficialPN2Column = await knex.schema.hasColumn(
    'period',
    'officialPN2_uuid'
  );
  const hasPeriodTypeColumn = await knex.schema.hasColumn(
    'period',
    'period_type'
  );

  if (!hasNameColumn) {
    await knex.raw(
      'ALTER TABLE period ADD COLUMN name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER parent_uuid; '
    );
  }
  if (!hasAbbreviationColumn) {
    await knex.raw(
      'ALTER TABLE period ADD COLUMN abbreviation CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER name;'
    );
  }
  if (!hasOfficial1Column) {
    await knex.raw(
      'ALTER TABLE period ADD COLUMN official1_uuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER abbreviation; '
    );
  }
  if (!hasOfficial2Column) {
    await knex.raw(
      'ALTER TABLE period ADD COLUMN official2_uuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER official1_uuid; '
    );
  }
  if (!hasOfficialPN1Column) {
    await knex.raw(
      'ALTER TABLE period ADD COLUMN officialPN1_uuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER official2_uuid; '
    );
  }
  if (!hasOfficialPN2Column) {
    await knex.raw(
      'ALTER TABLE period ADD COLUMN officialPN2_uuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER officialPN1_uuid; '
    );
  }
  if (!hasPeriodTypeColumn) {
    await knex.raw(
      'ALTER TABLE period ADD COLUMN period_type CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER officialPN2_uuid; '
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasNameColumn = await knex.schema.hasColumn('period', 'name');
  const hasAbbreviationColumn = await knex.schema.hasColumn(
    'period',
    'abbreviation'
  );
  const hasOfficial1Column = await knex.schema.hasColumn(
    'period',
    'official1_uuid'
  );
  const hasOfficial2Column = await knex.schema.hasColumn(
    'period',
    'official2_uuid'
  );
  const hasOfficialPN1Column = await knex.schema.hasColumn(
    'period',
    'officialPN1_uuid'
  );
  const hasOfficialPN2Column = await knex.schema.hasColumn(
    'period',
    'officialPN2_uuid'
  );
  const hasPeriodTypeColumn = await knex.schema.hasColumn(
    'period',
    'period_type'
  );

  if (hasNameColumn) {
    await knex.schema.table('period', table => {
      table.dropColumn('name');
    });
  }
  if (hasAbbreviationColumn) {
    await knex.schema.table('period', table => {
      table.dropColumn('abbreviation');
    });
  }
  if (hasOfficial1Column) {
    await knex.schema.table('period', table => {
      table.dropColumn('official1_uuid');
    });
  }
  if (hasOfficial2Column) {
    await knex.schema.table('period', table => {
      table.dropColumn('official2_uuid');
    });
  }
  if (hasOfficialPN1Column) {
    await knex.schema.table('period', table => {
      table.dropColumn('officialPN1_uuid');
    });
  }
  if (hasOfficialPN2Column) {
    await knex.schema.table('period', table => {
      table.dropColumn('officialPN2_uuid');
    });
  }
  if (hasPeriodTypeColumn) {
    await knex.schema.table('period', table => {
      table.dropColumn('period_type');
    });
  }
}
