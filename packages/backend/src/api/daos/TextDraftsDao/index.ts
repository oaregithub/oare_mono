import { TextDraft, UuidRow, DraftQueryOptions } from '@oare/types';
import { v4 } from 'uuid';
import { knexRead, knexWrite } from '@/connection';
import { createTabletRenderer } from '@oare/oare';
import { Knex } from 'knex';
import CollectionTextUtils from '../CollectionTextUtils';
import TextEpigraphyDao from '../TextEpigraphyDao';

export interface TextDraftRow
  extends Omit<TextDraft, 'content' | 'originalText'> {
  content: string;
}

function getBaseDraftQuery(userUuid: string, trx?: Knex.Transaction) {
  const k = trx || knexRead();
  return k('text_drafts')
    .select(
      'text_drafts.created_at AS createdAt',
      'text_drafts.updated_at AS updatedAt',
      'text_drafts.uuid',
      'text_drafts.text_uuid AS textUuid',
      'text_drafts.content',
      'text.name AS textName',
      'notes'
    )
    .innerJoin('hierarchy', 'hierarchy.object_uuid', 'text_drafts.text_uuid')
    .innerJoin('text', 'text_drafts.text_uuid', 'text.uuid')
    .orderBy('text.name')
    .where('user_uuid', userUuid)
    .groupBy('text_drafts.uuid');
}

class TextDraftsDao {
  async draftExists(
    draftUuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knexRead();
    const row = await k('text_drafts')
      .select()
      .where('uuid', draftUuid)
      .first();
    return !!row;
  }

  async userOwnsDraft(
    userUuid: string,
    draftUuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knexRead();
    const row = await k('text_drafts')
      .select()
      .where('user_uuid', userUuid)
      .andWhere('uuid', draftUuid)
      .first();

    return !!row;
  }

  async deleteDraft(draftUuid: string, trx?: Knex.Transaction): Promise<void> {
    const k = trx || knexWrite();
    await k('text_drafts').del().where('uuid', draftUuid);
  }

  async getDraftByUuid(
    draftUuid: string,
    trx?: Knex.Transaction
  ): Promise<TextDraft> {
    const k = trx || knexRead();
    const exists = await this.draftExists(draftUuid, trx);
    if (!exists) {
      throw new Error(`Draft with UUID ${draftUuid} does not exist`);
    }

    const row: TextDraftRow = await k('text_drafts')
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
      row.textUuid,
      undefined,
      trx
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
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<TextDraft | null> {
    const draft: TextDraftRow | null = await getBaseDraftQuery(userUuid, trx)
      .first()
      .andWhere('text_uuid', textUuid);

    if (!draft) {
      return null;
    }

    const epigraphicUnits = await TextEpigraphyDao.getEpigraphicUnits(
      draft.textUuid,
      undefined,
      trx
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
    notes: string,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knexWrite();
    const creation = new Date();
    const uuid = v4();

    await k('text_drafts').insert({
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

  async updateDraft(
    draftUuid: string,
    content: string,
    notes: string,
    trx?: Knex.Transaction
  ) {
    const k = trx || knexWrite();
    const updated = new Date();
    await k('text_drafts').where('uuid', draftUuid).update({
      content,
      updated_at: updated,
      notes,
    });
  }

  async getAllDraftUuidsByUser(
    userUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knexRead();
    interface DraftTextRow {
      uuid: string;
      textUuid: string;
    }
    const drafts: DraftTextRow[] = await k('text_drafts')
      .select('text_drafts.uuid', 'text_uuid AS textUuid')
      .innerJoin('text', 'text.uuid', 'text_drafts.text_uuid')
      .where('user_uuid', userUuid)
      .orderBy('text.name');

    const draftUuids = drafts.map(({ uuid }) => uuid);

    const canEdits = await Promise.all(
      drafts.map(({ textUuid }) =>
        CollectionTextUtils.canEditText(textUuid, userUuid, trx)
      )
    );

    return draftUuids.filter((_, index) => canEdits[index]);
  }

  private baseDraftQuery(
    {
      authorFilter,
      textFilter,
    }: Pick<DraftQueryOptions, 'authorFilter' | 'textFilter'>,
    trx?: Knex.Transaction
  ) {
    const k = trx || knexRead();
    return k('text_drafts')
      .innerJoin('user', 'user.uuid', 'text_drafts.user_uuid')
      .innerJoin('text', 'text.uuid', 'text_drafts.text_uuid')
      .where('text.name', 'like', `%${textFilter || ''}%`)
      .andWhere('user.full_name', 'like', `%${authorFilter || ''}%`);
  }

  async totalDrafts(
    options: Pick<DraftQueryOptions, 'authorFilter' | 'textFilter'>,
    trx?: Knex.Transaction
  ): Promise<number> {
    const row = await this.baseDraftQuery(options, trx)
      .count({ count: 'text_drafts.uuid' })
      .first();
    return row ? Number(row.count) : 0;
  }

  async getAllDraftUuids(
    {
      sortBy,
      sortOrder,
      page,
      limit,
      authorFilter,
      textFilter,
    }: DraftQueryOptions,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const draftUuids: UuidRow[] = await this.baseDraftQuery(
      {
        authorFilter,
        textFilter,
      },
      trx
    )
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
