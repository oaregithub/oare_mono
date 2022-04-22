import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('refresh_tokens');
}

export async function down(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable('refresh_tokens');

  if (!tableExists) {
    await knex.raw(`CREATE TABLE refresh_tokens (
      id int(11) NOT NULL AUTO_INCREMENT,
      token char(36) NOT NULL,
      expiration char(39) NOT NULL,
      email varchar(320) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY token (token)
    ) ENGINE = InnoDB AUTO_INCREMENT = 4204 DEFAULT CHARSET = latin1`);
  }
}
