import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasdwMashColumn = await knex.schema.hasColumn(
    'dictionary_word',
    'mash'
  );

  const hasdfMashColumn = await knex.schema.hasColumn(
    'dictionary_form',
    'mash'
  );

  const hasdsMashColumn = await knex.schema.hasColumn(
    'dictionary_spelling',
    'mash'
  );

  if (!hasdwMashColumn) {
    await knex.schema.table('dictionary_word', table => {
      table.string('mash');
    });
    await knex.raw('UPDATE dictionary_word SET mash = wordmash(word);');
  }

  if (!hasdfMashColumn) {
    await knex.schema.table('dictionary_form', table => {
      table.string('mash');
    });
    await knex.raw('UPDATE dictionary_form SET mash = wordmash(form);');
  }

  if (!hasdsMashColumn) {
    await knex.schema.table('dictionary_spelling', table => {
      table.string('mash');
    });
    await knex.raw(
      'UPDATE dictionary_spelling SET mash = wordmash(explicit_spelling);'
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasdwMashColumn = await knex.schema.hasColumn(
    'dictionary_word',
    'mash'
  );

  const hasdfMashColumn = await knex.schema.hasColumn(
    'dictionary_form',
    'mash'
  );

  const hasdsMashColumn = await knex.schema.hasColumn(
    'dictionary_spelling',
    'mash'
  );

  if (hasdwMashColumn) {
    await knex.schema.table('dictionary_word', table => {
      table.dropColumn('mash');
    });
  }

  if (hasdfMashColumn) {
    await knex.schema.table('dictionary_form', table => {
      table.dropColumn('mash');
    });
  }

  if (hasdsMashColumn) {
    await knex.schema.table('dictionary_spelling', table => {
      table.dropColumn('mash');
    });
  }
}
