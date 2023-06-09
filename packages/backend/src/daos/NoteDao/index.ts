import knex from '@/connection';
import { DiscourseNote } from '@oare/types';
import { Knex } from 'knex';

// FIXME

class NoteDao {
  async getNotesByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<DiscourseNote[]> {
    const k = trx || knex;
    const rows: DiscourseNote[] = await k('note')
      .select(
        'note.uuid',
        'note.reference_uuid as referenceUuid',
        'note.title',
        'note.language',
        'note.primacy',
        'note.date',
        'field.field as content',
        'note.author_uuid as authorUuid'
      )
      .innerJoin('field', 'field.reference_uuid', 'note.uuid')
      .where('note.reference_uuid', referenceUuid);

    return rows;
  }

  async removeNotesByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    await k('note').del().where({ reference_uuid: referenceUuid });
  }
}

export default new NoteDao();
