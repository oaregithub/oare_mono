import * as Knex from 'knex';
import { v4 } from 'uuid';

const distinctCountColumn = 'distinct_count';
export async function up(knex: Knex): Promise<void> {
  const hasDistinctCountColumn = await knex.schema.hasColumn(
    'person_text_occurrences',
    distinctCountColumn
  );

  if (!hasDistinctCountColumn) {
    await knex.raw(
      'ALTER TABLE person_text_occurrences ADD COLUMN distinct_count INT(11) AFTER count;'
    );

    const personTextOccurrences = await knex(
      'person_text_occurrences'
    ).select();

    await Promise.all(
      personTextOccurrences.map(async person => {
        const referenceUuids = await knex('item_properties')
          .distinct('item_properties.reference_uuid AS referenceUuid')
          .where('item_properties.object_uuid', person.uuid);

        const textDiscourseUuids = referenceUuids.map(
          item => item.referenceUuid
        );

        const totalTextCount = await knex('text_discourse')
          .select('text_discourse.text_uuid')
          .whereIn('text_discourse.uuid', textDiscourseUuids)
          .count({ count: 'text_discourse.text_uuid' })
          .first();

        const totalTextCountNumber = totalTextCount
          ? Number(totalTextCount.count)
          : 0;

        await knex('person_text_occurrences')
          .update({ count: totalTextCountNumber })
          .where({ uuid: person.uuid });
      })
    );

    await Promise.all(
      personTextOccurrences.map(async person => {
        const referenceUuids = await knex('item_properties')
          .distinct('item_properties.reference_uuid AS referenceUuid')
          .where('item_properties.object_uuid', person.uuid);

        const textDiscourseUuids = referenceUuids.map(
          item => item.referenceUuid
        );

        const distinctTextCount = await knex('text_discourse')
          .distinct('text_discourse.text_uuid')
          .whereIn('text_discourse.uuid', textDiscourseUuids)
          .count({ count: 'text_discourse.text_uuid' })
          .first();

        const totalTextCountNumber = distinctTextCount
          ? Number(distinctTextCount.count)
          : 0;

        await knex('person_text_occurrences')
          .update({ distinct_count: totalTextCountNumber })
          .where({ uuid: person.uuid });
      })
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasDistinctCountColumn = await knex.schema.hasColumn(
    'person_text_occurrences',
    distinctCountColumn
  );

  if (hasDistinctCountColumn) {
    await knex.schema.table('person_text_occurrences', table => {
      table.dropColumn(distinctCountColumn);
    });

    // Update back to previous migration of 20210503091035_person_text_occurrences.ts
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

        await knex('person_text_occurrences')
          .update({ count: totalCount })
          .where({ uuid: personUuid });
      })
    );
  }
}
