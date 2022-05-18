import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('reset_password_links_table');
}

export async function down(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable('reset_password_links_table');

  if (!tableExists) {
    await knex.raw(`
      CREATE TABLE reset_password_links (
        uuid char(36) NOT NULL,
        user_uuid char(36) NOT NULL,
        expiration timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (uuid),
        KEY reset_password_links_user_uuid_foreign (user_uuid),
        CONSTRAINT reset_password_links_user_uuid_foreign FOREIGN KEY (user_uuid) REFERENCES user (uuid)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);
  }
}
