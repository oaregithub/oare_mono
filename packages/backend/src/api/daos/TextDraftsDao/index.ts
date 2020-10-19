import { TextDraft } from '@oare/types';
import { v4 } from 'uuid';
import knex from '../../../connection';

export interface TextDraftRow {
  createdAt: Date;
  updatedAt: Date;
  uuid: string;
  textUuid: string;
  content: string;
  textName: string;
  notes: string;
}

class TextDraftsDao {
  async getDraft(userId: number, textUuid: string) {
    const draft: TextDraftRow = await knex('text_drafts')
      .first()
      .where('creator', userId)
      .andWhere('text_uuid', textUuid);
    return draft;
  }

  async createDraft(userId: number, textUuid: string, content: string, notes: string) {
    const creation = new Date();
    await knex('text_drafts').insert({
      uuid: v4(),
      creator: userId,
      created_at: creation,
      updated_at: creation,
      text_uuid: textUuid,
      content,
      notes,
    });
  }

  async updateDraft(draftUuid: string, content: string, notes: string) {
    const updated = new Date();
    await knex('text_drafts').where('uuid', draftUuid).update({
      content,
      updated_at: updated,
      notes,
    });
  }

  async getDrafts(userId: number, textUuid: string | null): Promise<TextDraft[]> {
    let query = knex('text_drafts')
      .select(
        'text_drafts.created_at AS createdAt',
        'text_drafts.updated_at AS updatedAt',
        'text_drafts.uuid',
        'text_drafts.text_uuid AS textUuid',
        'text_drafts.content',
        'alias.name AS textName',
        'notes',
      )
      .innerJoin('hierarchy', 'hierarchy.uuid', 'text_drafts.text_uuid')
      .innerJoin('alias', 'text_drafts.text_uuid', 'alias.reference_uuid')
      .orderBy('alias.name')
      .where('creator', userId)
      .groupBy('text_drafts.uuid');

    if (textUuid) {
      query = query.where('text_uuid', textUuid);
    }

    const rows: TextDraftRow[] = await query;
    return rows
      .map((row) => ({
        ...row,
        textName: row.textName.trim(),
        content: JSON.parse(row.content),
      }))
      .sort((a, b) => a.textName.localeCompare(b.textName));
  }
}

export default new TextDraftsDao();
