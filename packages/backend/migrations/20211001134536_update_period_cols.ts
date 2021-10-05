import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasOfficialPTR1UuidColumn = await knex.schema.hasColumn(
    'period',
    'officialPTR1_uuid'
  );

  const hasOfficialPTR2UuidColumn = await knex.schema.hasColumn(
    'period',
    'officialPTR2_uuid'
  );

  const hasOfficial1PTRUuidColumn = await knex.schema.hasColumn(
    'period',
    'official1PTR_uuid'
  );

  const hasOfficial2PTRUuidColumn = await knex.schema.hasColumn(
    'period',
    'official2PTR_uuid'
  );

  const hasOfficialPN1Column = await knex.schema.hasColumn(
    'period',
    'officialPN1'
  );

  const hasOfficialPN2Column = await knex.schema.hasColumn(
    'period',
    'officialPN2'
  );

  const hasOfficialPN1UuidColumn = await knex.schema.hasColumn(
    'period',
    'officialPN1_uuid'
  );

  const hasOfficialPN2UuidColumn = await knex.schema.hasColumn(
    'period',
    'officialPN2_uuid'
  );

  const hasOfficialPTR1Column = await knex.schema.hasColumn(
    'period',
    'officialPTR1'
  );

  const hasOfficialPTR2Column = await knex.schema.hasColumn(
    'period',
    'officialPTR2'
  );

  if (hasOfficialPTR1UuidColumn) {
    await knex.raw(
      'ALTER TABLE period CHANGE `officialPTR1_uuid` `official1PTR_PN_uuid` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER officialPTR2; '
    );
  }

  if (hasOfficialPTR2UuidColumn) {
    await knex.raw(
      'ALTER TABLE period CHANGE `officialPTR2_uuid` `official2PTR_PN_uuid` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER official1PTR_PN_uuid; '
    );
  }

  if (!hasOfficial1PTRUuidColumn) {
    await knex.raw(
      'ALTER TABLE period ADD COLUMN official1PTR_uuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER official2PTR_PN_uuid; '
    );
  }

  if (!hasOfficial2PTRUuidColumn) {
    await knex.raw(
      'ALTER TABLE period ADD COLUMN official2PTR_uuid CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER official1PTR_uuid; '
    );
  }

  if (hasOfficialPN1Column) {
    await knex.raw(
      'ALTER TABLE period CHANGE `officialPN1` `official1PN` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER abbreviation; '
    );
  }

  if (hasOfficialPN2Column) {
    await knex.raw(
      'ALTER TABLE period CHANGE `officialPN2` `official2PN` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER official1PN; '
    );
  }

  if (hasOfficialPN1UuidColumn) {
    await knex.raw(
      'ALTER TABLE period CHANGE `officialPN1_uuid` `official1PN_uuid` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER official2_uuid; '
    );
  }

  if (hasOfficialPN2UuidColumn) {
    await knex.raw(
      'ALTER TABLE period CHANGE `officialPN2_uuid` `official2PN_uuid` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER official1PN_uuid; '
    );
  }

  if (hasOfficialPTR1Column) {
    await knex.raw(
      'ALTER TABLE period CHANGE `officialPTR1` `official1PTR` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER official2PN_uuid; '
    );
  }

  if (hasOfficialPTR2Column) {
    await knex.raw(
      'ALTER TABLE period CHANGE `officialPTR2` `official2PTR` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER official1PTR; '
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasOfficial1PTRPNUuidCol = await knex.schema.hasColumn(
    'period',
    'official1PTR_PN_uuid'
  );

  const hasOfficial1PTRPNUuidColumn = await knex.schema.hasColumn(
    'period',
    'official2PTR_PN_uuid'
  );

  const hasOfficial1PTRUuidColumn = await knex.schema.hasColumn(
    'period',
    'official1PTR_uuid'
  );

  const hasOfficial2PTRUuidColumn = await knex.schema.hasColumn(
    'period',
    'official2PTR_uuid'
  );

  const hasOfficialPN1Column = await knex.schema.hasColumn(
    'period',
    'official1PN'
  );

  const hasOfficialPN2Column = await knex.schema.hasColumn(
    'period',
    'official2PN'
  );

  const hasOfficialPN1UuidColumn = await knex.schema.hasColumn(
    'period',
    'official1PN_uuid'
  );

  const hasOfficialPN2UuidColumn = await knex.schema.hasColumn(
    'period',
    'official2PN_uuid'
  );

  const hasOfficialPTR1Column = await knex.schema.hasColumn(
    'period',
    'official1PTR'
  );

  const hasOfficialPTR2Column = await knex.schema.hasColumn(
    'period',
    'official2PTR'
  );

  if (hasOfficial1PTRPNUuidCol) {
    await knex.raw(
      'ALTER TABLE period CHANGE `official1PTR_PN_uuid` `officialPTR1_uuid` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER official2PTR; '
    );
  }

  if (hasOfficial1PTRPNUuidColumn) {
    await knex.raw(
      'ALTER TABLE period CHANGE `official2PTR_PN_uuid` `officialPTR2_uuid` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER officialPTR1_uuid; '
    );
  }

  if (hasOfficial1PTRUuidColumn) {
    await knex.schema.table('period', table => {
      table.dropColumn('official1PTR_uuid');
    });
  }

  if (hasOfficial2PTRUuidColumn) {
    await knex.schema.table('period', table => {
      table.dropColumn('official2PTR_uuid');
    });
  }

  if (hasOfficialPN1Column) {
    await knex.raw(
      'ALTER TABLE period CHANGE `official1PN` `officialPN1` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER abbreviation; '
    );
  }

  if (hasOfficialPN2Column) {
    await knex.raw(
      'ALTER TABLE period CHANGE `official2PN` `officialPN2` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER officialPN1; '
    );
  }

  if (hasOfficialPN1UuidColumn) {
    await knex.raw(
      'ALTER TABLE period CHANGE `official1PN_uuid` `officialPN1_uuid` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER official2_uuid; '
    );
  }

  if (hasOfficialPN2UuidColumn) {
    await knex.raw(
      'ALTER TABLE period CHANGE `official2PN_uuid` `officialPN2_uuid` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER officialPN1_uuid; '
    );
  }

  if (hasOfficialPTR1Column) {
    await knex.raw(
      'ALTER TABLE period CHANGE `official1PTR` `officialPTR1` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER officialPN1_uuid; '
    );
  }

  if (hasOfficialPTR2Column) {
    await knex.raw(
      'ALTER TABLE period CHANGE `official2PTR` `officialPTR2` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin AFTER officialPTR1; '
    );
  }
}
