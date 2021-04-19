import { TextDraft, UuidRow, DraftQueryOptions } from '@oare/types';
import { v4 } from 'uuid';
import knex from '@/connection';
import { createTabletRenderer } from '@oare/oare';
import CollectionTextUtils from '../CollectionTextUtils';
import TextEpigraphyDao from '../TextEpigraphyDao';

export interface TextDraftRow
  extends Omit<TextDraft, 'content' | 'originalText'> {
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

    const epigraphicUnits = await TextEpigraphyDao.getEpigraphicUnits(
      row.textUuid
    );
    const originalText = createTabletRenderer(epigraphicUnits, {
      lineNumbers: true,
    }).tabletReading();

    return {
      ...row,
      content: JSON.parse(row.content),
      originalText,
    };
  }

  async getDraftByTextUuid(
    userUuid: string,
    textUuid: string
  ): Promise<TextDraft | null> {
    const draft: TextDraftRow | null = await getBaseDraftQuery(userUuid)
      .first()
      .andWhere('text_uuid', textUuid);

    if (!draft) {
      return null;
    }

    const epigraphicUnits = await TextEpigraphyDao.getEpigraphicUnits(
      draft.textUuid
    );
    const originalText = createTabletRenderer(epigraphicUnits, {
      lineNumbers: true,
    }).tabletReading();

    return {
      ...draft,
      originalText,
      textName: draft.textName.trim(),
      content: JSON.parse(draft.content),
    };
  }

  async createDraft(
    userUuid: string,
    textUuid: string,
    content: string,
    notes: string
  ): Promise<string> {
    const creation = new Date();
    const uuid = v4();

    await knex('text_drafts').insert({
      uuid,
      user_uuid: userUuid,
      created_at: creation,
      updated_at: creation,
      text_uuid: textUuid,
      content,
      notes,
    });

    return uuid;
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

  private baseDraftQuery({
    authorFilter,
    textFilter,
  }: Pick<DraftQueryOptions, 'authorFilter' | 'textFilter'>) {
    return knex('text_drafts')
      .innerJoin('user', 'user.uuid', 'text_drafts.user_uuid')
      .innerJoin('text', 'text.uuid', 'text_drafts.text_uuid')
      .where('text.name', 'like', `%${textFilter || ''}%`)
      .andWhere('user.full_name', 'like', `%${authorFilter || ''}%`);
  }

  async totalDrafts(
    options: Pick<DraftQueryOptions, 'authorFilter' | 'textFilter'>
  ): Promise<number> {
    const row = await this.baseDraftQuery(options)
      .count({ count: 'text_drafts.uuid' })
      .first();
    return row ? Number(row.count) : 0;
  }

  async getAllDraftUuids({
    sortBy,
    sortOrder,
    page,
    limit,
    authorFilter,
    textFilter,
  }: DraftQueryOptions): Promise<string[]> {
    const draftUuids: UuidRow[] = await this.baseDraftQuery({
      authorFilter,
      textFilter,
    })
      .select('text_drafts.uuid')
      .modify(qb => {
        if (sortBy === 'text') {
          qb.orderBy([
            { column: 'text.name', order: sortOrder },
            { column: 'updated_at', order: 'desc' },
          ]);
        } else if (sortBy === 'updatedAt') {
          qb.orderBy('text_drafts.updated_at', sortOrder);
        } else if (sortBy === 'author') {
          qb.orderBy([
            { column: 'user.full_name', order: sortOrder },
            { column: 'updated_at', order: 'desc' },
          ]);
        }
      })
      .limit(limit)
      .offset((page - 1) * limit);
    return draftUuids.map(({ uuid }) => uuid);
  }
}

export default new TextDraftsDao();
