import { knexWrite } from '@/connection';
import {
  AddColumnPayload,
  AddRegionPayload,
  AddSidePayload,
  RemoveColumnPayload,
  RemoveLinePayload,
  RemoveRegionPayload,
  RemoveSidePayload,
  RemoveUndeterminedLinesPayload,
  EpigraphicUnitSide,
  TextEpigraphyRow,
  TextMarkupRow,
  EditSidePayload,
  EditColumnPayload,
  RemoveWordPayload,
  RemoveDividerPayload,
  RemoveSignPayload,
  AddLinePayload,
  TextDiscourseRow,
  EpigraphicUnitType,
  EpigraphyType,
  MergeLinePayload,
  AddUndeterminedLinesPayload,
  EditRegionPayload,
  EditUndeterminedLinesPayload,
} from '@oare/types';
import { Knex } from 'knex';
import sl from '@/serviceLocator';
import { v4 } from 'uuid';

class EditTextUtils {
  private getSideNumber(side: EpigraphicUnitSide) {
    switch (side) {
      case 'obv.':
        return 1;
      case 'lo.e.':
        return 2;
      case 'rev.':
        return 3;
      case 'u.e.':
        return 4;
      case 'le.e.':
        return 5;
      case 'r.e.':
        return 6;
      case 'mirror text':
        return 7;
      case 'legend':
        return 8;
      case 'suppl. tablet':
        return 9;
      default:
        return 1;
    }
  }

  async addSide(
    payload: AddSidePayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');

    const sideNumber = this.getSideNumber(payload.side);
    const sideBefore: number | null =
      sideNumber !== 1
        ? await k('text_epigraphy')
            .select('side')
            .where({ type: 'section' })
            .andWhere({ text_uuid: payload.textUuid })
            .andWhere('side', '<', sideNumber)
            .orderBy('side', 'desc')
            .first()
            .then(row => row.side)
        : null;

    const newObjectOnTablet: number = sideBefore
      ? await k('text_epigraphy')
          .select('object_on_tablet')
          .first()
          .where({ side: sideBefore, text_uuid: payload.textUuid })
          .orderBy('object_on_tablet', 'desc')
          .then(row => row.object_on_tablet + 1)
      : 2;

    await TextEpigraphyDao.incrementObjectOnTablet(
      payload.textUuid,
      newObjectOnTablet,
      1,
      trx
    );

    const treeUuid: string = await k('text_epigraphy')
      .select('tree_uuid')
      .first()
      .where({ text_uuid: payload.textUuid })
      .then(row => row.tree_uuid);

    const parentUuid: string = await k('text_epigraphy')
      .select('uuid')
      .first()
      .where({ text_uuid: payload.textUuid, type: 'epigraphicUnit' })
      .then(row => row.uuid);

    const epigraphyRow: TextEpigraphyRow = {
      uuid: v4(),
      type: 'section',
      textUuid: payload.textUuid,
      treeUuid,
      parentUuid,
      objectOnTablet: newObjectOnTablet,
      side: sideNumber,
      column: null,
      line: null,
      charOnLine: null,
      charOnTablet: null,
      signUuid: null,
      sign: null,
      readingUuid: null,
      reading: null,
      discourseUuid: null,
    };

    await TextEpigraphyDao.insertEpigraphyRow(epigraphyRow, trx);

    await this.addColumn(
      {
        type: 'addColumn',
        textUuid: payload.textUuid,
        side: payload.side,
        column: 1,
      },
      trx
    );
  }

  async addColumn(
    payload: AddColumnPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    const TextEpigraphyDao = sl.get('TextEpigraphyDao');

    const sideNumber = this.getSideNumber(payload.side);

    await k('text_epigraphy')
      .where({ text_uuid: payload.textUuid, side: sideNumber })
      .where('column', '>=', payload.column)
      .increment('column', 1);

    const columnBefore: number | null =
      payload.column !== 1 ? payload.column - 1 : null;

    const newObjectOnTablet: number = columnBefore
      ? await k('text_epigraphy')
          .select('object_on_tablet')
          .first()
          .where({ text_uuid: payload.textUuid, side: sideNumber })
          .where('column', columnBefore)
          .orderBy('object_on_tablet', 'desc')
          .then(row => row.object_on_tablet + 1)
      : await k('text_epigraphy')
          .select('object_on_tablet')
          .first()
          .where({
            text_uuid: payload.textUuid,
            side: sideNumber,
            type: 'section',
          })
          .orderBy('object_on_tablet', 'desc')
          .then(row => row.object_on_tablet + 1);

    await TextEpigraphyDao.incrementObjectOnTablet(
      payload.textUuid,
      newObjectOnTablet,
      1,
      trx
    );

    const treeUuid: string = await k('text_epigraphy')
      .select('tree_uuid')
      .first()
      .where({ text_uuid: payload.textUuid })
      .then(row => row.tree_uuid);

    const parentUuid: string = await k('text_epigraphy')
      .select('uuid')
      .first()
      .where({ text_uuid: payload.textUuid, type: 'section', side: sideNumber })
      .then(row => row.uuid);

    const columnEpigraphyRow: TextEpigraphyRow = {
      uuid: v4(),
      type: 'column',
      textUuid: payload.textUuid,
      treeUuid,
      parentUuid,
      objectOnTablet: newObjectOnTablet,
      side: sideNumber,
      column: payload.column,
      line: null,
      charOnLine: null,
      charOnTablet: null,
      signUuid: null,
      sign: null,
      readingUuid: null,
      reading: null,
      discourseUuid: null,
    };

    await TextEpigraphyDao.insertEpigraphyRow(columnEpigraphyRow, trx);
  }

  async addRegion(
    payload: AddRegionPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const TextMarkupDao = sl.get('TextMarkupDao');

    const sideNumber = this.getSideNumber(payload.side);

    // If undefined, it will be the first object on tablet in the column
    const newObjectOnTablet = payload.previousObjectOnTablet
      ? payload.previousObjectOnTablet + 1
      : await k('text_epigraphy')
          .select('object_on_tablet')
          .first()
          .where({
            text_uuid: payload.textUuid,
            side: sideNumber,
            column: payload.column,
          })
          .orderBy('object_on_tablet', 'asc')
          .then(row => row.object_on_tablet + 1);

    const treeUuid: string = await k('text_epigraphy')
      .select('tree_uuid')
      .first()
      .where({ text_uuid: payload.textUuid })
      .then(row => row.tree_uuid);

    const parentUuid: string = await k('text_epigraphy')
      .select('uuid')
      .first()
      .where({ text_uuid: payload.textUuid, type: 'column', side: sideNumber })
      .then(row => row.uuid);

    const epigraphyRow: TextEpigraphyRow = {
      uuid: v4(),
      type: 'region',
      textUuid: payload.textUuid,
      treeUuid,
      parentUuid,
      objectOnTablet: newObjectOnTablet,
      side: sideNumber,
      column: payload.column,
      line: null,
      charOnLine: null,
      charOnTablet: null,
      signUuid: null,
      sign: null,
      readingUuid: null,
      reading: payload.regionLabel || null,
      discourseUuid: null,
    };

    await TextEpigraphyDao.incrementObjectOnTablet(
      payload.textUuid,
      newObjectOnTablet,
      1,
      trx
    );

    await TextEpigraphyDao.insertEpigraphyRow(epigraphyRow, trx);

    const markupRow: TextMarkupRow = {
      uuid: v4(),
      referenceUuid: epigraphyRow.uuid,
      type: payload.regionType,
      numValue: payload.regionValue || null,
      altReadingUuid: null,
      altReading: null,
      startChar: null,
      endChar: null,
      objectUuid: null,
    };

    await TextMarkupDao.insertMarkupRow(markupRow, trx);
  }

  async addLine(
    payload: AddLinePayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const TextMarkupDao = sl.get('TextMarkupDao');
    const TextDiscourseDao = sl.get('TextDiscourseDao');
    const SignReadingDao = sl.get('SignReadingDao');

    const sideNumber = this.getSideNumber(payload.side);

    // If undefined, it will be the first object on tablet in the column
    const newObjectOnTablet = payload.previousObjectOnTablet
      ? payload.previousObjectOnTablet + 1
      : await k('text_epigraphy')
          .select('object_on_tablet')
          .first()
          .where({
            text_uuid: payload.textUuid,
            side: sideNumber,
            column: payload.column,
          })
          .orderBy('object_on_tablet', 'asc')
          .then(row => row.object_on_tablet + 1);

    // DISCOURSE
    const discourseUnitRow: { uuid: string; treeUuid: string } = await k(
      'text_discourse'
    )
      .select('uuid', 'tree_uuid as treeUuid')
      .where({ text_uuid: payload.textUuid, type: 'discourseUnit' })
      .first();

    const previousDiscourseUuid: string | null = await k('text_epigraphy')
      .select('discourse_uuid')
      .first()
      .orderBy('object_on_tablet', 'desc')
      .where({ text_uuid: payload.textUuid })
      .where('object_on_tablet', '<', newObjectOnTablet)
      .then(row => (row ? row.discourse_uuid : null));

    const previousDiscourseRow: TextDiscourseRow = await k('text_discourse')
      .select(
        'uuid',
        'type',
        'obj_in_text as objInText',
        'word_on_tablet as wordOnTablet',
        'child_num as childNum',
        'text_uuid as textUuid',
        'tree_uuid as treeUuid',
        'parent_uuid as parentUuid',
        'spelling_uuid as spellingUuid',
        'spelling',
        'explicit_spelling as explicitSpelling',
        'transcription'
      )
      .first()
      .modify(qb => {
        if (previousDiscourseUuid) {
          qb.where({ uuid: previousDiscourseUuid });
        } else {
          qb.where({ uuid: discourseUnitRow.uuid });
        }
      });

    const lastChildBefore: number = await k('text_discourse')
      .select('child_num')
      .first()
      .where({ parent_uuid: discourseUnitRow.uuid })
      .where('obj_in_text', '<=', previousDiscourseRow.objInText)
      .orderBy('child_num', 'desc')
      .then(row => (row ? row.child_num : 0));

    await TextDiscourseDao.incrementObjInText(
      payload.textUuid,
      previousDiscourseRow.objInText! + 1,
      payload.row.words
        ? payload.row.words.filter(word => !!word.discourseUuid).length
        : 0,
      trx
    );

    await TextDiscourseDao.incrementWordOnTablet(
      payload.textUuid,
      previousDiscourseRow.wordOnTablet
        ? previousDiscourseRow.wordOnTablet + 1
        : 1,
      payload.row.words
        ? payload.row.words.filter(word => !!word.discourseUuid).length
        : 0,
      trx
    );

    await TextDiscourseDao.incrementChildNum(
      payload.textUuid,
      discourseUnitRow.uuid,
      lastChildBefore + 1,
      payload.row.words
        ? payload.row.words.filter(word => !!word.discourseUuid).length
        : 0,
      trx
    );

    if (payload.row.words) {
      await Promise.all(
        payload.row.words
          .filter(word => !!word.discourseUuid)
          .map(async (word, idx) => {
            const type =
              payload.row.signs &&
              payload.row.signs
                .filter(sign => sign.discourseUuid === word.discourseUuid)
                .every(sign => sign.readingType === 'number')
                ? 'number'
                : 'word';

            let spellingUuid: string | null = null;
            if (
              payload.discourseSpellings.find(
                item => item.discourseUuid === word.discourseUuid
              )
            ) {
              spellingUuid = payload.discourseSpellings.find(
                item => item.discourseUuid === word.discourseUuid
              )!.spellingUuid;
            }

            const discourseRow: TextDiscourseRow = {
              uuid: word.discourseUuid!,
              type,
              objInText: previousDiscourseRow.objInText
                ? previousDiscourseRow.objInText + 1 + idx
                : 1 + idx,
              wordOnTablet: previousDiscourseRow.wordOnTablet
                ? previousDiscourseRow.wordOnTablet + 1 + idx
                : 1 + idx,
              childNum: lastChildBefore + 1 + idx,
              textUuid: payload.textUuid,
              treeUuid: discourseUnitRow.treeUuid,
              parentUuid: discourseUnitRow.uuid,
              spelling: word.spelling,
              explicitSpelling: word.spelling,
              spellingUuid,
              transcription: null,
            };

            await TextDiscourseDao.insertDiscourseRow(discourseRow, trx);
          })
      );
    }

    // EPIGRAPHY
    const treeUuid: string = await k('text_epigraphy')
      .select('tree_uuid')
      .first()
      .where({ text_uuid: payload.textUuid })
      .then(row => row.tree_uuid);

    const lineParentUuid: string = await k('text_epigraphy')
      .select('uuid')
      .first()
      .where({ text_uuid: payload.textUuid, type: 'column', side: sideNumber })
      .then(row => row.uuid);

    await TextEpigraphyDao.incrementObjectOnTablet(
      payload.textUuid,
      newObjectOnTablet,
      payload.row.signs ? payload.row.signs.length + 1 : 1, // +1 for the line itself
      trx
    );

    const lineRow: TextEpigraphyRow = {
      uuid: payload.row.uuid,
      type: 'line',
      textUuid: payload.textUuid,
      treeUuid,
      parentUuid: lineParentUuid,
      objectOnTablet: newObjectOnTablet,
      side: sideNumber,
      column: payload.column,
      line: null, // Will be fixed in clean up
      charOnLine: null,
      charOnTablet: null,
      signUuid: null,
      sign: null,
      readingUuid: null,
      reading: null,
      discourseUuid: null,
    };

    await TextEpigraphyDao.insertEpigraphyRow(lineRow, trx);

    const getEpigraphyType = (
      readingType: EpigraphicUnitType | undefined
    ): EpigraphyType => {
      if (readingType) {
        switch (readingType) {
          case 'number':
            return 'number';
          case 'punctuation':
            return 'separator';
          default:
            return 'sign';
        }
      }
      return 'undeterminedSigns';
    };

    if (payload.row.signs) {
      await Promise.all(
        payload.row.signs.map(async (sign, idx) => {
          const discourseUuid =
            sign.markup &&
            sign.markup.markup.some(
              markup =>
                markup.type === 'superfluous' || markup.type === 'erasure'
            )
              ? null
              : sign.discourseUuid;

          const signRow: TextEpigraphyRow = {
            uuid: sign.uuid,
            type: getEpigraphyType(sign.readingType),
            textUuid: payload.textUuid,
            treeUuid,
            parentUuid: lineRow.uuid,
            objectOnTablet: newObjectOnTablet + idx + 1,
            side: sideNumber,
            column: payload.column,
            line: null, // Will be fixed in clean up
            charOnLine: null, // Will be fixed in clean up
            charOnTablet: null, // Will be fixed in clean up
            signUuid: sign.signUuid,
            sign: sign.sign || null,
            readingUuid: sign.readingUuid,
            reading: sign.value || null,
            discourseUuid,
          };

          await TextEpigraphyDao.insertEpigraphyRow(signRow, trx);

          // MARKUP
          if (sign.markup) {
            await Promise.all(
              sign.markup.markup.map(async markup => {
                const formattedAltReading = markup.altReading
                  ? (
                      await SignReadingDao.getFormattedSign(markup.altReading)
                    ).join('')
                  : undefined;

                let altReadingUuid;
                if (
                  markup.altReading &&
                  markup.altReading !== '@' &&
                  !markup.altReading.includes('x')
                ) {
                  const signCode = await SignReadingDao.getSignCode(
                    markup.altReading,
                    markup.isDeterminative || false
                  );
                  altReadingUuid = signCode.readingUuid;
                }

                const markupRow: TextMarkupRow = {
                  uuid: v4(),
                  referenceUuid: signRow.uuid,
                  type: markup.type,
                  numValue: markup.numValue || null,
                  altReadingUuid: altReadingUuid || null,
                  altReading: formattedAltReading || null,
                  startChar:
                    markup.startChar !== undefined ? markup.startChar : null,
                  endChar: markup.endChar !== undefined ? markup.endChar : null,
                  objectUuid: null,
                };

                await TextMarkupDao.insertMarkupRow(markupRow, trx);
              })
            );
          }
        })
      );
    }
  }

  async addUndeterminedLines(
    payload: AddUndeterminedLinesPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const TextMarkupDao = sl.get('TextMarkupDao');

    const sideNumber = this.getSideNumber(payload.side);

    // If undefined, it will be the first object on tablet in the column
    const newObjectOnTablet = payload.previousObjectOnTablet
      ? payload.previousObjectOnTablet + 1
      : await k('text_epigraphy')
          .select('object_on_tablet')
          .first()
          .where({
            text_uuid: payload.textUuid,
            side: sideNumber,
            column: payload.column,
          })
          .orderBy('object_on_tablet', 'asc')
          .then(row => row.object_on_tablet + 1);

    const treeUuid: string = await k('text_epigraphy')
      .select('tree_uuid')
      .first()
      .where({ text_uuid: payload.textUuid })
      .then(row => row.tree_uuid);

    const parentUuid: string = await k('text_epigraphy')
      .select('uuid')
      .first()
      .where({ text_uuid: payload.textUuid, type: 'column', side: sideNumber })
      .then(row => row.uuid);

    const epigraphyRow: TextEpigraphyRow = {
      uuid: v4(),
      type: 'undeterminedLines',
      textUuid: payload.textUuid,
      treeUuid,
      parentUuid,
      objectOnTablet: newObjectOnTablet,
      side: sideNumber,
      column: payload.column,
      line: null, // Fixed in clean up
      charOnLine: null,
      charOnTablet: null,
      signUuid: null,
      sign: null,
      readingUuid: null,
      reading: null,
      discourseUuid: null,
    };

    await TextEpigraphyDao.incrementObjectOnTablet(
      payload.textUuid,
      newObjectOnTablet,
      1,
      trx
    );

    await TextEpigraphyDao.insertEpigraphyRow(epigraphyRow, trx);

    const markupRow: TextMarkupRow = {
      uuid: v4(),
      referenceUuid: epigraphyRow.uuid,
      type: 'undeterminedLines',
      numValue: payload.number,
      altReadingUuid: null,
      altReading: null,
      startChar: null,
      endChar: null,
      objectUuid: null,
    };

    await TextMarkupDao.insertMarkupRow(markupRow, trx);
  }

  async editSide(
    payload: EditSidePayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');

    const originalSideNumber = this.getSideNumber(payload.originalSide);
    const newSideNumber = this.getSideNumber(payload.newSide);

    const sideBefore: number | null =
      newSideNumber !== 1
        ? await k('text_epigraphy')
            .select('side')
            .where({ type: 'section' })
            .andWhere({ text_uuid: payload.textUuid })
            .andWhere('side', '<', newSideNumber)
            .orderBy('side', 'desc')
            .first()
            .then(row => row.side)
        : null;

    const newObjectOnTablet: number = sideBefore
      ? await k('text_epigraphy')
          .select('object_on_tablet')
          .first()
          .where({ side: sideBefore, text_uuid: payload.textUuid })
          .orderBy('object_on_tablet', 'desc')
          .then(row => row.object_on_tablet + 1)
      : 2;

    const uuidsOnOriginalSide: string[] = await k('text_epigraphy')
      .pluck('uuid')
      .orderBy('object_on_tablet', 'asc')
      .where({ text_uuid: payload.textUuid, side: originalSideNumber });

    await TextEpigraphyDao.incrementObjectOnTablet(
      payload.textUuid,
      newObjectOnTablet,
      uuidsOnOriginalSide.length,
      trx
    );

    await Promise.all(
      uuidsOnOriginalSide.map((uuid, idx) =>
        k('text_epigraphy')
          .where({ uuid })
          .update({
            side: newSideNumber,
            object_on_tablet: newObjectOnTablet + idx,
          })
      )
    );
  }

  async editColumn(
    payload: EditColumnPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');

    const sideNumber = this.getSideNumber(payload.side);

    const numberOfColumns: number = await k('text_epigraphy')
      .count({ count: 'uuid' })
      .where({ text_uuid: payload.textUuid, side: sideNumber, type: 'column' })
      .first()
      .then(row => (row && row.count ? Number(row.count) : 0));

    if (payload.column === 1 && payload.direction === 'left') {
      throw new Error('Cannot move first column left');
    } else if (
      payload.column === numberOfColumns &&
      payload.direction === 'right'
    ) {
      throw new Error('Cannot move last column right');
    }

    const droppingColumn =
      payload.direction === 'right' ? payload.column + 1 : payload.column;

    const newObjectOnTablet = await k('text_epigraphy')
      .select('object_on_tablet')
      .first()
      .orderBy('object_on_tablet', 'asc')
      .where({
        text_uuid: payload.textUuid,
        column: droppingColumn - 1,
        side: sideNumber,
        type: 'column',
      })
      .then(row => row.object_on_tablet);

    const uuidsOnDroppingColumn: string[] = await k('text_epigraphy')
      .pluck('uuid')
      .where({
        text_uuid: payload.textUuid,
        side: sideNumber,
        column: droppingColumn,
      })
      .orderBy('object_on_tablet', 'asc');

    await TextEpigraphyDao.incrementObjectOnTablet(
      payload.textUuid,
      newObjectOnTablet,
      uuidsOnDroppingColumn.length,
      trx
    );

    await k('text_epigraphy')
      .where({
        text_uuid: payload.textUuid,
        side: sideNumber,
        column: droppingColumn - 1,
      })
      .update({ column: droppingColumn });

    await Promise.all(
      uuidsOnDroppingColumn.map((uuid, idx) =>
        k('text_epigraphy')
          .where({ uuid })
          .update({
            column: droppingColumn - 1,
            object_on_tablet: newObjectOnTablet + idx,
          })
      )
    );
  }

  async editRegion(
    payload: EditRegionPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    if (
      payload.regionType === 'ruling' ||
      payload.regionType === 'uninscribed' ||
      payload.regionType === 'broken'
    ) {
      if (payload.regionValue === undefined) {
        throw new Error(
          `Region value is required for region type ${payload.regionType}`
        );
      }
    }

    if (payload.regionType === 'isSealImpression') {
      await k('text_epigraphy')
        .where({ uuid: payload.uuid })
        .update({ reading: payload.regionLabel || null });
    } else if (
      payload.regionType === 'ruling' ||
      payload.regionType === 'uninscribed'
    ) {
      await k('text_markup')
        .where({ reference_uuid: payload.uuid })
        .update({ num_value: payload.regionValue! });
    } else if (payload.regionType === 'broken') {
      await k('text_markup')
        .where({ reference_uuid: payload.uuid, type: 'broken' })
        .update({ type: 'undeterminedLines', num_value: payload.regionValue! });
      await k('text_epigraphy')
        .where({ uuid: payload.uuid })
        .update({ type: 'undeterminedLines' });
    }
  }

  async editUndeterminedLines(
    payload: EditUndeterminedLinesPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    if (!payload.convertToBrokenArea) {
      await k('text_markup')
        .where({ reference_uuid: payload.uuid, type: 'undeterminedLines' })
        .update({ num_value: payload.number });
    } else {
      await k('text_markup')
        .where({ reference_uuid: payload.uuid, type: 'undeterminedLines' })
        .update({ type: 'broken', num_value: null });
      await k('text_epigraphy')
        .where({ uuid: payload.uuid })
        .update({ type: 'region' });
    }
  }

  async mergeLines(
    payload: MergeLinePayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    const newParentUuid = await k('text_epigraphy')
      .select('uuid')
      .first()
      .where({
        text_uuid: payload.textUuid,
        type: 'line',
        line: payload.firstLine,
      })
      .then(row => row.uuid);

    await k('text_epigraphy')
      .where({
        text_uuid: payload.textUuid,
        line: payload.secondLine,
      })
      .update({ parent_uuid: newParentUuid });

    await k('text_epigraphy')
      .where({
        text_uuid: payload.textUuid,
        type: 'line',
        line: payload.secondLine,
      })
      .del();
  }

  async removeSide(
    payload: RemoveSidePayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    const sideNumber = this.getSideNumber(payload.side);

    // Prevents FK constraint violation
    await k('text_epigraphy')
      .where({
        text_uuid: payload.textUuid,
        side: sideNumber,
      })
      .update({ parent_uuid: null });

    await k('text_epigraphy')
      .where({
        text_uuid: payload.textUuid,
        side: sideNumber,
      })
      .del();
  }

  async removeColumn(
    payload: RemoveColumnPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    const sideNumber = this.getSideNumber(payload.side);

    // Prevents FK constraint violation
    await k('text_epigraphy')
      .where({
        text_uuid: payload.textUuid,
        side: sideNumber,
        column: payload.column,
      })
      .update({ parent_uuid: null });

    await k('text_epigraphy')
      .where({
        text_uuid: payload.textUuid,
        side: sideNumber,
        column: payload.column,
      })
      .del();

    await k('text_epigraphy')
      .decrement('column', 1)
      .where({ text_uuid: payload.textUuid, side: sideNumber })
      .where('column', '>', payload.column);
  }

  async removeRegion(
    payload: RemoveRegionPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    await k('text_epigraphy').where({ uuid: payload.uuid }).del();
  }

  async removeLine(
    payload: RemoveLinePayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    // Prevents FK constraint violation
    await k('text_epigraphy')
      .where({ text_uuid: payload.textUuid, line: payload.line })
      .update({ parent_uuid: null });

    await k('text_epigraphy')
      .where({ text_uuid: payload.textUuid, line: payload.line })
      .del();
  }

  async removeUndeterminedLines(
    payload: RemoveUndeterminedLinesPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    await k('text_epigraphy').where({ uuid: payload.uuid }).del();
  }

  async removeWord(
    payload: RemoveWordPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    const uuidsToRemove = await k('text_epigraphy').pluck('uuid').where({
      text_uuid: payload.textUuid,
      discourse_uuid: payload.discourseUuid,
    });

    await k('text_epigraphy')
      .whereIn('uuid', uuidsToRemove)
      .update({ discourse_uuid: null });

    await k('text_epigraphy').whereIn('uuid', uuidsToRemove).del();

    await k('text_epigraphy')
      .where({
        text_uuid: payload.textUuid,
        discourse_uuid: payload.discourseUuid,
      })
      .del();

    const numUnitsOnLine = await k('text_epigraphy')
      .count({ count: 'uuid' })
      .first()
      .where({ text_uuid: payload.textUuid, line: payload.line })
      .where('type', '!=', 'line')
      .then(row => (row && row.count ? Number(row.count) : 0));

    if (numUnitsOnLine === 0) {
      await this.removeLine(
        { type: 'removeLine', textUuid: payload.textUuid, line: payload.line },
        trx
      );
    }
  }

  async removeSign(
    payload: RemoveSignPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    const discourseUuid: string | null = await k('text_epigraphy')
      .select('discourse_uuid')
      .first()
      .where({ uuid: payload.uuid })
      .then(row => (row ? row.discourse_uuid : null));

    await k('text_epigraphy')
      .where({
        uuid: payload.uuid,
      })
      .del();

    if (discourseUuid) {
      await k('text_discourse').where({ uuid: discourseUuid }).update({
        spelling_uuid: payload.spellingUuid,
        spelling: payload.spelling,
        explicit_spelling: payload.spelling,
      });
    }

    const numUnitsOnLine = await k('text_epigraphy')
      .count({ count: 'uuid' })
      .first()
      .where({ text_uuid: payload.textUuid, line: payload.line })
      .where('type', '!=', 'line')
      .then(row => (row && row.count ? Number(row.count) : 0));

    if (numUnitsOnLine === 0) {
      await this.removeLine(
        { type: 'removeLine', textUuid: payload.textUuid, line: payload.line },
        trx
      );
    }
  }

  async removeDivider(
    payload: RemoveDividerPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    await k('text_epigraphy')
      .where({
        uuid: payload.uuid,
      })
      .del();

    const numUnitsOnLine = await k('text_epigraphy')
      .count({ count: 'uuid' })
      .first()
      .where({ text_uuid: payload.textUuid, line: payload.line })
      .where('type', '!=', 'line')
      .then(row => (row && row.count ? Number(row.count) : 0));

    if (numUnitsOnLine === 0) {
      await this.removeLine(
        { type: 'removeLine', textUuid: payload.textUuid, line: payload.line },
        trx
      );
    }
  }
}

export default new EditTextUtils();