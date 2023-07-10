import knex from '@/connection';
import { Note, NoteRow } from '@oare/types';
import { Knex } from 'knex';
import sl from '@/serviceLocator';

class NoteDao {
  /**
   * Retrieves a single note row by UUID.
   * @param uuid The UUID of the note row to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Single note row.
   * @throws Error if no note row found.
   */
  private async getNoteRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<NoteRow> {
    const k = trx || knex;

    const row: NoteRow | undefined = await k('note')
      .select(
        'uuid',
        'reference_uuid as referenceUuid',
        'title',
        'language',
        'primacy',
        'date',
        'private',
        'author_uuid as authorUuid'
      )
      .where({ uuid })
      .first();

    if (!row) {
      throw new Error(`No note with uuid ${uuid}`);
    }

    return row;
  }

  /**
   * Constructs a Note object for a given UUID.
   * @param uuid The UUID of the note to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Complete Note object.
   * @throws Error if no note found.
   */
  private async getNoteByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<Note> {
    const FieldDao = sl.get('FieldDao');

    const noteRow = await this.getNoteRowByUuid(uuid, trx);

    const content = await FieldDao.getFieldRowsByReferenceUuidAndType(
      noteRow.uuid,
      'note',
      trx
    );

    const note: Note = {
      ...noteRow,
      content: content[0].field,
    };

    return note;
  }

  /**
   * Retrieves a list of note UUIDs for a given reference UUID.
   * @param referenceUuid The reference UUID of the note UUIDs to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Array of note UUIDs.
   */
  private async getNoteUuidsByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const uuids: string[] = await k('note')
      .pluck('uuid')
      .where({ reference_uuid: referenceUuid });

    return uuids;
  }

  /**
   * Retrieves a list of Note objects for a given reference UUID.
   * @param referenceUuid The reference UUID of the notes to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Array of Note objects.
   */
  public async getNotesByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<Note[]> {
    const noteUuids = await this.getNoteUuidsByReferenceUuid(
      referenceUuid,
      trx
    );

    const notes = await Promise.all(
      noteUuids.map(uuid => this.getNoteByUuid(uuid, trx))
    );

    return notes;
  }
}

/**
 * NoteDao instance as a singleton.
 */
export default new NoteDao();
