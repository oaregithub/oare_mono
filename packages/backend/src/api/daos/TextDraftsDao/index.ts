import { TextDraft, UuidRow, DraftQueryOptions } from '@oare/types';
import { v4 } from 'uuid';
import knex from '@/connection';
import CollectionTextUtils from '../CollectionTextUtils';

export interface TextDraftRow extends Omit<TextDraft, 'content'> {
  content: string;
}

function getBaseDraftQuery(userUuid: string) {
  return knex('text_drafts')
    .select(
      'text_drafts.created_at AS createdAt',
      'text_drafts.updated_at AS updatedAt',
      'text_drafts.uuid',
      'text_drafts.text_uuid AS textUuid',
      'text_drafts.content',
      'text.name AS textName',
      'notes'
    )
    .innerJoin('hierarchy', 'hierarchy.uuid', 'text_drafts.text_uuid')
    .innerJoin('text', 'text_drafts.text_uuid', 'text.uuid')
    .orderBy('text.name')
    .where('user_uuid', userUuid)
    .groupBy('text_drafts.uuid');
}

class TextDraftsDao {
  async draftExists(draftUuid: string): Promise<boolean> {
    const row = await knex('text_drafts')
      .select()
      .where('uuid', draftUuid)
      .first();
    return !!row;
  }

  async getDraftByUuid(draftUuid: string): Promise<TextDraft> {
    const exists = await this.draftExists(draftUuid);
    if (!exists) {
      throw new Error(`Draft with UUID ${draftUuid} does not exist`);
    }

    const row: TextDraftRow = await knex('text_drafts')
      .select(
        'text_drafts.created_at AS createdAt',
        'text_drafts.updated_at AS updatedAt',
        'text_drafts.uuid',
        'text_drafts.text_uuid AS textUuid',
        'text_drafts.content',
        'text_drafts.user_uuid AS userUuid',
        'text.name AS textName',
        'notes'
      )
      .innerJoin('text', 'text_drafts.text_uuid', 'text.uuid')
      .where('text_drafts.uuid', draftUuid)
      .first();

    return {
      ...row,
      content: JSON.parse(row.content),
    };
  }

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

  async getAllDraftUuidsByUser(userUuid: string): Promise<string[]> {
    interface DraftTextRow {
      uuid: string;
      textUuid: string;
    }
    const drafts: DraftTextRow[] = await knex('text_drafts')
      .select('text_drafts.uuid', 'text_uuid AS textUuid')
      .innerJoin('text', 'text.uuid', 'text_drafts.text_uuid')
      .where('user_uuid', userUuid)
      .orderBy('text.name');

    const draftUuids = drafts.map(({ uuid }) => uuid);

    const canEdits = await Promise.all(
      drafts.map(({ textUuid }) =>
        CollectionTextUtils.canEditText(textUuid, userUuid)
      )
    );

    return draftUuids.filter((_, index) => canEdits[index]);
  }

  async getAllDraftUuids({
    sortBy,
    sortOrder,
    page,
    limit,
  }: DraftQueryOptions): Promise<string[]> {
    const draftUuids: UuidRow[] = await knex('text_drafts')
      .select(
        'text_drafts.uuid',
        knex.raw('CONCAT(user.first_name, " ", user.last_name) AS author')
      )
      .innerJoin('user', 'user.uuid', 'text_drafts.user_uuid')
      .modify(qb => {
        if (sortBy === 'text') {
          qb.innerJoin('text', 'text.uuid', 'text_drafts.text_uuid').orderBy(
            'text.name',
            sortOrder
          );
        } else if (sortBy === 'updated') {
          qb.orderBy('text_drafts.updated_at', sortOrder);
        } else if (sortBy === 'author') {
          qb.orderBy('author', sortOrder);
        }
      })
      .limit(limit)
      .offset((page - 1) * limit);
    return draftUuids.map(({ uuid }) => uuid);
  }
}

export default new TextDraftsDao();
