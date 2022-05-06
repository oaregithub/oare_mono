import { knexRead } from '@/connection';
import { DiscourseNote } from '@oare/types';

class NoteDao {
  async getNotesByReferenceUuid(
    referenceUuid: string
  ): Promise<DiscourseNote[]> {
    const rows: DiscourseNote[] = await knexRead()('note')
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
}

export default new NoteDao();
