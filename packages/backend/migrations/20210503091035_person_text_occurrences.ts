import * as Knex from 'knex';
import { v4 } from 'uuid';

const fkName = 'person_uuid_foreign';
export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('person_text_occurrences');
  if (!hasTable) {
    await knex.schema.createTable('person_text_occurrences', table => {
      table.increments('id');
      table.uuid('uuid').notNullable().unique();
      table.uuid('person_uuid').notNullable();
      table.integer('count').notNullable();
      table
        .foreign('person_uuid', fkName)
        .references('person.uuid')
        .onDelete('CASCADE');
    });

    const getTextReferencesBaseQuery = (personUuid: string) =>
      knex('item_properties')
        .leftJoin(
          'text_discourse',
          'text_discourse.uuid',
          'item_properties.reference_uuid'
        )
        .where('item_properties.object_uuid', personUuid);

    const personUuids = await knex('person').pluck('uuid');

    await Promise.all(
      personUuids.map(async personUuid => {
        const textsOfPersonCount = await getTextReferencesBaseQuery(personUuid)
          .count({ count: 'text_discourse.text_uuid' })
          .first();

        const totalCount = textsOfPersonCount
          ? Number(textsOfPersonCount.count)
          : 0;

        await knex('person_text_occurrences').insert({
          uuid: v4(),
          person_uuid: personUuid,
          count: totalCount,
        });
      })
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('person_text_occurrences');
}
