import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable('page_content');

  if (tableExists) {
    await knex('page_content')
      .update({ page: 'about' })
      .where('page', '/about');

    await knex('page_content').update({ page: 'home' }).where('page', '/');
  }
}

export async function down(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable('page_content');
  if (tableExists) {
    await knex('page_content')
      .update({ page: '/about' })
      .where('page', 'about');

    await knex('page_content').update({ page: '/' }).where('page', 'home');
  }
}
