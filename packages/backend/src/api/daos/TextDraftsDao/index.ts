import { TextDraft } from '@oare/types';
import { v4 } from 'uuid';
import knex from '@/connection';

export interface TextDraftRow {
  createdAt: Date;
  updatedAt: Date;
  uuid: string;
  textUuid: string;
  content: string;
  textName: string;
  notes: string;
}

function getBaseDraftQuery(userUuid: string) {
  return knex('text_drafts')
    .select(
      'text_drafts.created_at AS createdAt',
      'text_drafts.updated_at AS updatedAt',
      'text_drafts.uuid',
      'text_drafts.text_uuid AS textUuid',
      'text_drafts.content',
      'alias.name AS textName',
      'notes'
    )
    .innerJoin('hierarchy', 'hierarchy.uuid', 'text_drafts.text_uuid')
    .innerJoin('alias', 'text_drafts.text_uuid', 'alias.reference_uuid')
    .orderBy('alias.name')
    .where('user_uuid', userUuid)
    .groupBy('text_drafts.uuid');
}

class TextDraftsDao {
  async getDraft(
    userUuid: string,
    textUuid: string
  ): Promise<TextDraft | null> {
    const draft: TextDraftRow | null = await getBaseDraftQuery(userUuid)
      .first()
      .andWhere('text_uuid', textUuid);

    return draft
      ? {
          ...draft,
          textName: draft.textName.trim(),
          content: JSON.parse(draft.content),
        }
      : null;
  }

  async createDraft(
    userUuid: string,
    textUuid: string,
    content: string,
    notes: string
  ) {
    const creation = new Date();
    await knex('text_drafts').insert({
      uuid: v4(),
      user_uuid: userUuid,
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

  async getAllDrafts(userUuid: string): Promise<TextDraft[]> {
    const query = getBaseDraftQuery(userUuid);

    const rows: TextDraftRow[] = await query;
    return rows
      .map(row => ({
        ...row,
        textName: row.textName.trim(),
        content: JSON.parse(row.content),
      }))
      .sort((a, b) => a.textName.localeCompare(b.textName));
  }
}

export default new TextDraftsDao();
