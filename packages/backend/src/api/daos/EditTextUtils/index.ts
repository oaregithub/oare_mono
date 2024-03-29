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
  AddWordEditPayload,
  AddSignPayload,
  MarkupType,
  AddUndeterminedSignsPayload,
  AddDividerPayload,
  DiscourseUnitType,
  EditSignPayload,
  MarkupUnit,
  EditUndeterminedSignsPayload,
  EditDividerPayload,
  ReorderSignPayload,
  MergeWordPayload,
  SplitLinePayload,
  SplitWordPayload,
  InsertItemPropertyRow,
} from '@oare/types';
import { Knex } from 'knex';
import sl from '@/serviceLocator';
import { v4 } from 'uuid';
import { convertSideToSideNumber } from '@oare/oare';
import { cleanLines } from './utils';

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

interface UpdatedDiscourseStarter {
  treeUuid: string;
  parentUuid: string;
  objInText: number;
  wordOnTablet: number;
  childNum: number;
}

const getParentUuidPath = async (
  uuid: string,
  trx?: Knex.Transaction
): Promise<string[]> => {
  const k = trx || knexWrite();
  const parentUuid: string | null = await k('text_discourse')
    .select('parent_uuid')
    .first()
    .where({ uuid })
    .then(row => row.parent_uuid);
  if (parentUuid) {
    const parentUuidPath = await getParentUuidPath(parentUuid);
    return [parentUuid, ...parentUuidPath];
  }
  return [];
};

const getUpdatedDiscourse = async (
  textUuid: string,
  newObjectOnTablet: number,
  trx?: Knex.Transaction
): Promise<UpdatedDiscourseStarter> => {
  const k = trx || knexWrite();

  const discourseTreeUuid: string = await k('text_discourse')
    .select('tree_uuid')
    .where({ text_uuid: textUuid, type: 'discourseUnit' })
    .first()
    .then(row => row.tree_uuid);

  const discourseWordBefore: string | null = await k('text_epigraphy')
    .select('discourse_uuid')
    .first()
    .orderBy('object_on_tablet', 'desc')
    .where({ text_uuid: textUuid })
    .where('object_on_tablet', '<', newObjectOnTablet)
    .whereNotNull('discourse_uuid')
    .then(row => (row ? row.discourse_uuid : null));

  const discourseWordAfter: string | null = await k('text_epigraphy')
    .select('discourse_uuid')
    .first()
    .orderBy('object_on_tablet', 'asc')
    .where({ text_uuid: textUuid })
    .where('object_on_tablet', '>=', newObjectOnTablet)
    .whereNotNull('discourse_uuid')
    .then(row => (row ? row.discourse_uuid : null));

  const discourseBeforePath: string[] | null = discourseWordBefore
    ? await getParentUuidPath(discourseWordBefore, trx)
    : null;
  const discourseAfterPath: string[] | null = discourseWordAfter
    ? await getParentUuidPath(discourseWordAfter, trx)
    : null;

  let newParentUuid: string;
  if (discourseBeforePath && discourseAfterPath) {
    // eslint-disable-next-line prefer-destructuring
    newParentUuid = discourseBeforePath.filter(uuid =>
      discourseAfterPath.includes(uuid)
    )[0];
  } else if (discourseBeforePath) {
    newParentUuid = discourseBeforePath[discourseBeforePath.length - 1];
  } else if (discourseAfterPath) {
    newParentUuid = discourseAfterPath[discourseAfterPath.length - 1];
  } else {
    newParentUuid = await k('text_discourse')
      .select('uuid')
      .first()
      .where({ text_uuid: textUuid, type: 'discourseUnit' })
      .then(row => row.uuid);
  }

  const newObjectInText = discourseWordBefore
    ? await k('text_discourse')
        .select('obj_in_text')
        .first()
        .where({ uuid: discourseWordBefore })
        .then(row => row.obj_in_text + 1)
    : 2; // 1 is the discourseUnit

  const newWordOnTablet = discourseWordBefore
    ? await k('text_discourse')
        .select('word_on_tablet')
        .first()
        .where({ uuid: discourseWordBefore })
        .then(row => row.word_on_tablet + 1)
    : 1;

  const newChildNum = discourseWordBefore
    ? await k('text_discourse')
        .select('child_num')
        .first()
        .where({ parent_uuid: newParentUuid })
        .where('obj_in_text', '<', newObjectInText)
        .orderBy('child_num', 'desc')
        .then(row => row.child_num + 1)
    : 1;

  return {
    treeUuid: discourseTreeUuid,
    parentUuid: newParentUuid,
    objInText: newObjectInText,
    wordOnTablet: newWordOnTablet,
    childNum: newChildNum,
  };
};

const recursivelyCleanDiscourseUuids = async (
  discourseUuidsToDelete: string[],
  textUuid: string,
  trx?: Knex.Transaction
): Promise<void> => {
  const k = trx || knexWrite();

  await k('text_discourse').whereIn('uuid', discourseUuidsToDelete).del();

  const parentUuids: string[] = await k('text_discourse')
    .pluck('parent_uuid')
    .whereNotNull('parent_uuid')
    .where({ text_uuid: textUuid });

  const discourseUuidsToDeleteNext: string[] = await k('text_discourse')
    .pluck('uuid')
    .where({ text_uuid: textUuid })
    .whereNot('type', 'word')
    .whereNot('type', 'number')
    .whereNot('type', 'discourseUnit')
    .whereNot('type', 'region')
    .whereNotIn('uuid', parentUuids);

  if (discourseUuidsToDeleteNext.length > 0) {
    await recursivelyCleanDiscourseUuids(
      discourseUuidsToDeleteNext,
      textUuid,
      trx
    );
  }
};

const addRegionDiscourse = async (
  regionDiscourseUuid: string,
  textUuid: string,
  newObjectOnTablet: number,
  transcription: string | null,
  trx?: Knex.Transaction
): Promise<void> => {
  const k = trx || knexWrite();

  const TextDiscourseDao = sl.get('TextDiscourseDao');
  const AliasDao = sl.get('AliasDao');
  const FieldDao = sl.get('FieldDao');

  const discourseTreeUuid: string = await k('text_discourse')
    .select('tree_uuid')
    .where({ text_uuid: textUuid, type: 'discourseUnit' })
    .first()
    .then(row => row.tree_uuid);

  const discourseUnitUuid: string = await k('text_discourse')
    .select('uuid')
    .where({ text_uuid: textUuid, type: 'discourseUnit' })
    .first()
    .then(row => row.uuid);

  const discourseWordBefore: string | null = await k('text_epigraphy')
    .select('discourse_uuid')
    .first()
    .orderBy('object_on_tablet', 'desc')
    .where({ text_uuid: textUuid })
    .where('object_on_tablet', '<', newObjectOnTablet)
    .whereNotNull('discourse_uuid')
    .then(row => (row ? row.discourse_uuid : null));

  const discourseWordAfter: string | null = await k('text_epigraphy')
    .select('discourse_uuid')
    .first()
    .orderBy('object_on_tablet', 'asc')
    .where({ text_uuid: textUuid })
    .where('object_on_tablet', '>=', newObjectOnTablet)
    .whereNotNull('discourse_uuid')
    .then(row => (row ? row.discourse_uuid : null));

  const discourseBeforePath: string[] = discourseWordBefore
    ? await getParentUuidPath(discourseWordBefore, trx)
    : [discourseUnitUuid];
  const discourseAfterPath: string[] = discourseWordAfter
    ? await getParentUuidPath(discourseWordAfter, trx)
    : [discourseUnitUuid];

  const matchingNodes = discourseBeforePath.filter(node =>
    discourseAfterPath.includes(node)
  );

  const newObjectInText = discourseWordBefore
    ? await k('text_discourse')
        .select('obj_in_text')
        .first()
        .where({ uuid: discourseWordBefore })
        .then(row => row.obj_in_text + 1)
    : 2; // 1 is discourseUnit

  await TextDiscourseDao.incrementObjInText(
    textUuid,
    newObjectInText,
    matchingNodes.length,
    trx
  );

  const reversedMatches = matchingNodes.reverse();

  const discourseUuidCopies: { [key: string]: string } = {};
  let mostRecentDiscourseUuid: string | undefined;

  for (let i = 0; i < reversedMatches.length; i += 1) {
    const node = reversedMatches[i];

    // eslint-disable-next-line no-await-in-loop
    const type: DiscourseUnitType = await k('text_discourse')
      .select('type')
      .first()
      .where({ uuid: node })
      .then(row => row.type);

    if (type !== 'discourseUnit') {
      const newDiscourseUuid = v4();
      discourseUuidCopies[node] = newDiscourseUuid;

      const parentUuid =
        mostRecentDiscourseUuid ||
        // eslint-disable-next-line no-await-in-loop
        (await k('text_discourse')
          .select('uuid')
          .where({ text_uuid: textUuid, type: 'discourseUnit' })
          .first()
          .then(row => row.uuid));

      // eslint-disable-next-line no-await-in-loop
      await TextDiscourseDao.insertDiscourseRow(
        {
          uuid: newDiscourseUuid,
          type,
          objInText: newObjectInText + i,
          wordOnTablet: null,
          childNum: null,
          textUuid,
          treeUuid: discourseTreeUuid,
          parentUuid,
          spellingUuid: null,
          spelling: null,
          explicitSpelling: null,
          transcription: null,
        },
        trx
      );

      if (type === 'sentence') {
        // eslint-disable-next-line no-await-in-loop
        const originalTranslation = await k('field')
          .select('field')
          .where({
            reference_uuid: node,
            type: 'translation',
            primacy: 0,
            language: 'default',
          })
          .first()
          .then(row => (row && row.field ? row.field : null));

        // eslint-disable-next-line no-await-in-loop
        await FieldDao.insertField(
          newDiscourseUuid,
          'translation',
          originalTranslation,
          0,
          'default',
          trx
        );
      } else if (type === 'paragraph') {
        // eslint-disable-next-line no-await-in-loop
        const originalLabel = await k('alias')
          .select('name')
          .where({ reference_uuid: node, type: 'label', primacy: 1 })
          .first()
          .then(row => (row && row.name ? row.name : null));

        // eslint-disable-next-line no-await-in-loop
        await AliasDao.insertAlias(
          'label',
          newDiscourseUuid,
          originalLabel,
          null,
          null,
          1,
          trx
        );
      }

      mostRecentDiscourseUuid = newDiscourseUuid;
    }
  }

  const rowsNeedingParentUpdate: {
    uuid: string;
    parentUuid: string;
  }[] = await k('text_discourse')
    .select('uuid', 'parent_uuid as parentUuid')
    .where({ text_uuid: textUuid })
    .where('obj_in_text', '>', newObjectInText)
    .whereNot({ parent_uuid: discourseUnitUuid })
    .whereIn('parent_uuid', Object.keys(discourseUuidCopies));

  await Promise.all(
    rowsNeedingParentUpdate.map(row =>
      k('text_discourse')
        .where({ uuid: row.uuid })
        .update({ parent_uuid: discourseUuidCopies[row.parentUuid] })
    )
  );

  await TextDiscourseDao.insertDiscourseRow(
    {
      uuid: regionDiscourseUuid,
      type: 'region',
      objInText: newObjectInText,
      wordOnTablet: null,
      childNum: null,
      textUuid,
      treeUuid: discourseTreeUuid,
      parentUuid: discourseUnitUuid,
      spellingUuid: null,
      spelling: null,
      explicitSpelling: transcription,
      transcription,
    },
    trx
  );
};

const getMarkupToAutoAdd = async (
  textUuid: string,
  newObjectOnTablet: number,
  line: number,
  numSigns: number,
  trx?: Knex.Transaction
): Promise<MarkupType[]> => {
  const k = trx || knexWrite();

  const uuidBefore: string | null = await k('text_epigraphy')
    .where({
      text_uuid: textUuid,
      object_on_tablet: newObjectOnTablet - 1,
      line,
    })
    .whereIn('type', ['sign', 'undeterminedSigns'])
    .first()
    .then(row => (row ? row.uuid : null));

  const uuidAfter: string | null = await k('text_epigraphy')
    .where({
      text_uuid: textUuid,
      object_on_tablet: newObjectOnTablet + numSigns,
      line,
    })
    .whereIn('type', ['sign', 'undeterminedSigns'])
    .first()
    .then(row => (row ? row.uuid : null));

  const markupBefore: MarkupType[] | null = uuidBefore
    ? await k('text_markup')
        .pluck('type')
        .where({ reference_uuid: uuidBefore, end_char: null })
    : null;

  const markupAfter: MarkupType[] | null = uuidAfter
    ? await k('text_markup')
        .pluck('type')
        .where({ reference_uuid: uuidAfter, start_char: null })
    : null;

  const markupToAdd: MarkupType[] = [];

  if (markupBefore && markupAfter) {
    const markupOnBothSides = markupBefore.filter(
      markup =>
        markupAfter.includes(markup) &&
        markup !== 'uncertain' &&
        markup !== 'isEmendedReading' &&
        markup !== 'isCollatedReading' &&
        markup !== 'originalSign' &&
        markup !== 'alternateSign' &&
        markup !== 'undeterminedSigns'
    );
    markupToAdd.push(...markupOnBothSides);
  } else if (markupBefore) {
    if (markupBefore.includes('isWrittenAboveTheLine')) {
      markupToAdd.push('isWrittenAboveTheLine');
    } else if (markupBefore.includes('isWrittenBelowTheLine')) {
      markupToAdd.push('isWrittenBelowTheLine');
    }
  }

  return markupToAdd;
};

const editDamageBrackets = async (
  type: 'damage' | 'partialDamage',
  referenceUuid: string,
  existingMarkup: MarkupUnit[],
  payloadMarkup: MarkupUnit[],
  trx?: Knex.Transaction
) => {
  const k = trx || knexWrite();
  const TextMarkupDao = sl.get('TextMarkupDao');

  const existingDamage = existingMarkup.filter(m => m.type === type);
  const payloadDamage = payloadMarkup.filter(m => m.type === type);

  if (existingDamage.length >= payloadDamage.length) {
    const numberToRemove = existingDamage.length - payloadDamage.length;
    const uuidsToRemove = await k('text_markup')
      .pluck('uuid')
      .where({ reference_uuid: referenceUuid, type })
      .limit(numberToRemove);

    await k('text_markup').del().whereIn('uuid', uuidsToRemove);

    await Promise.all(
      payloadDamage.map((markup, idx) =>
        k('text_markup')
          .where({ reference_uuid: referenceUuid, type })
          .update({
            start_char: markup.startChar,
            end_char: markup.endChar,
            alt_reading: markup.altReading,
            alt_reading_uuid: markup.altReadingUuid,
          })
          .limit(1)
          .offset(idx)
      )
    );
  } else {
    const originalDamage = payloadDamage.slice(0, existingDamage.length);
    await Promise.all(
      originalDamage.map((markup, idx) =>
        k('text_markup')
          .where({ reference_uuid: referenceUuid, type })
          .update({
            start_char: markup.startChar,
            end_char: markup.endChar,
            alt_reading: markup.altReading,
            alt_reading_uuid: markup.altReadingUuid,
          })
          .limit(1)
          .offset(idx)
      )
    );

    const newDamage = payloadDamage.slice(existingDamage.length);
    await Promise.all(
      newDamage.map(markup => {
        const markupRow: TextMarkupRow = {
          uuid: v4(),
          referenceUuid: markup.referenceUuid,
          type: markup.type,
          numValue: null,
          altReadingUuid: markup.altReadingUuid,
          altReading: markup.altReading,
          startChar: markup.startChar,
          endChar: markup.endChar,
          objectUuid: null,
        };

        return TextMarkupDao.insertMarkupRow(markupRow, trx);
      })
    );
  }
};

const editMarkupSelection = async (
  uuid: string,
  textUuid: string,
  payloadMarkup: MarkupUnit[],
  trx?: Knex.Transaction
): Promise<void> => {
  const k = trx || knexWrite();
  const TextMarkupDao = sl.get('TextMarkupDao');

  // MARKUP
  const existingMarkup = await TextMarkupDao.getMarkups(
    textUuid,
    undefined,
    uuid,
    trx
  );

  // DAMAGE
  await editDamageBrackets('damage', uuid, existingMarkup, payloadMarkup, trx);

  // PARTIAL DAMAGE
  await editDamageBrackets(
    'partialDamage',
    uuid,
    existingMarkup,
    payloadMarkup,
    trx
  );

  // NON-DAMAGE
  const removedMarkup = existingMarkup
    .map(m => m.type)
    .filter(
      m =>
        m !== 'damage' &&
        m !== 'partialDamage' &&
        m !== 'undeterminedSigns' &&
        !payloadMarkup.map(mark => mark.type).includes(m)
    );

  await Promise.all(
    removedMarkup.map(type =>
      k('text_markup').del().where({ reference_uuid: uuid, type })
    )
  );
  await Promise.all(
    payloadMarkup
      .filter(
        m =>
          m.type !== 'damage' &&
          m.type !== 'partialDamage' &&
          m.type !== 'undeterminedSigns'
      )
      .map(markup => {
        if (existingMarkup.map(m => m.type).includes(markup.type)) {
          return k('text_markup')
            .where({ reference_uuid: uuid, type: markup.type })
            .update({
              start_char: markup.startChar,
              end_char: markup.endChar,
              alt_reading: markup.altReading,
              alt_reading_uuid: markup.altReadingUuid,
            });
        }

        const markupRow: TextMarkupRow = {
          uuid: v4(),
          referenceUuid: markup.referenceUuid,
          type: markup.type,
          numValue: null,
          altReadingUuid: markup.altReadingUuid,
          altReading: markup.altReading,
          startChar: markup.startChar,
          endChar: markup.endChar,
          objectUuid: null,
        };

        return TextMarkupDao.insertMarkupRow(markupRow, trx);
      })
  );
};

class EditTextUtils {
  async addSide(
    payload: AddSidePayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');

    const sideNumber = convertSideToSideNumber(payload.side);
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

    const sideNumber = convertSideToSideNumber(payload.side);

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
    const TextDiscourseDao = sl.get('TextDiscourseDao');
    const AliasDao = sl.get('AliasDao');
    const FieldDao = sl.get('FieldDao');

    const sideNumber = convertSideToSideNumber(payload.side);

    const regionDiscourseUuid =
      payload.type === 'addRegionSealImpression' ? null : v4();

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

    if (payload.type !== 'addRegionSealImpression') {
      let transcription: string | null = null;
      switch (payload.type) {
        case 'addRegionBroken':
          transcription = '(large break)';
          break;
        case 'addRegionRuling':
          if (payload.regionValue) {
            if (payload.regionValue === 1) {
              transcription = '(single ruling)';
            } else if (payload.regionValue === 2) {
              transcription = '(double ruling)';
            } else if (payload.regionValue === 3) {
              transcription = '(triple ruling)';
            } else {
              transcription = `(${payload.regionValue} rulings)`;
            }
          } else {
            transcription = '(ruling)';
          }
          break;
        case 'addRegionUninscribed':
          transcription =
            payload.regionValue && payload.regionValue > 1
              ? `(${payload.regionValue} uninscribed lines)`
              : '(uninscribed line)';
          break;
        default:
          break;
      }

      await addRegionDiscourse(
        regionDiscourseUuid!,
        payload.textUuid,
        newObjectOnTablet,
        transcription,
        trx
      );
    }

    // EPIGRAPHY

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
      discourseUuid: regionDiscourseUuid,
    };

    await TextEpigraphyDao.incrementObjectOnTablet(
      payload.textUuid,
      newObjectOnTablet,
      1,
      trx
    );

    await TextEpigraphyDao.insertEpigraphyRow(epigraphyRow, trx);

    // MARKUP

    let regionType: MarkupType;
    switch (payload.type) {
      case 'addRegionBroken':
        regionType = 'broken';
        break;
      case 'addRegionRuling':
        regionType = 'ruling';
        break;
      case 'addRegionSealImpression':
        regionType = 'isSealImpression';
        break;
      default:
        regionType = 'uninscribed';
        break;
    }

    const markupRow: TextMarkupRow = {
      uuid: v4(),
      referenceUuid: epigraphyRow.uuid,
      type: regionType,
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

    const sideNumber = convertSideToSideNumber(payload.side);

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
    const newDiscourseStarter = await getUpdatedDiscourse(
      payload.textUuid,
      newObjectOnTablet,
      trx
    );

    await TextDiscourseDao.incrementObjInText(
      payload.textUuid,
      newDiscourseStarter.objInText,
      payload.row.words
        ? payload.row.words.filter(word => !!word.discourseUuid).length
        : 0,
      trx
    );

    await TextDiscourseDao.incrementWordOnTablet(
      payload.textUuid,
      newDiscourseStarter.wordOnTablet,
      payload.row.words
        ? payload.row.words.filter(word => !!word.discourseUuid).length
        : 0,
      trx
    );

    await TextDiscourseDao.incrementChildNum(
      payload.textUuid,
      newDiscourseStarter.parentUuid,
      newDiscourseStarter.childNum,
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
            let transcription: string | null = null;
            if (
              payload.discourseSpellings.find(
                item => item.discourseUuid === word.discourseUuid
              )
            ) {
              spellingUuid = payload.discourseSpellings.find(
                item => item.discourseUuid === word.discourseUuid
              )!.spellingUuid;
              transcription = payload.discourseSpellings.find(
                item => item.discourseUuid === word.discourseUuid
              )!.transcription;
            }

            const discourseRow: TextDiscourseRow = {
              uuid: word.discourseUuid!,
              type,
              objInText: newDiscourseStarter.objInText + idx,
              wordOnTablet: newDiscourseStarter.wordOnTablet + idx,
              childNum: newDiscourseStarter.childNum + idx,
              textUuid: payload.textUuid,
              treeUuid: newDiscourseStarter.treeUuid,
              parentUuid: newDiscourseStarter.parentUuid,
              spelling: word.spelling,
              explicitSpelling: word.spelling,
              spellingUuid,
              transcription,
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
    const TextDiscourseDao = sl.get('TextDiscourseDao');

    const sideNumber = convertSideToSideNumber(payload.side);

    const regionDiscourseUuid = v4();

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

    const transcription =
      payload.number > 1 ? `(${payload.number} broken lines)` : '(broken line)';

    // If there are 2 or less broken lines, the discourse will simply be inserted within the existing hierarchy
    if (payload.number > 2) {
      await addRegionDiscourse(
        regionDiscourseUuid,
        payload.textUuid,
        newObjectOnTablet,
        transcription,
        trx
      );
    } else {
      const newDiscourseStarter = await getUpdatedDiscourse(
        payload.textUuid,
        newObjectOnTablet,
        trx
      );

      await TextDiscourseDao.incrementObjInText(
        payload.textUuid,
        newDiscourseStarter.objInText,
        1,
        trx
      );

      const discourseRow: TextDiscourseRow = {
        uuid: regionDiscourseUuid,
        type: 'region',
        objInText: newDiscourseStarter.objInText,
        wordOnTablet: null,
        childNum: null,
        textUuid: payload.textUuid,
        treeUuid: newDiscourseStarter.treeUuid,
        parentUuid: newDiscourseStarter.parentUuid,
        spelling: null,
        spellingUuid: null,
        explicitSpelling: transcription,
        transcription,
      };

      await TextDiscourseDao.insertDiscourseRow(discourseRow, trx);
    }

    // EPIGRAPHY

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
      discourseUuid: regionDiscourseUuid,
    };

    await TextEpigraphyDao.incrementObjectOnTablet(
      payload.textUuid,
      newObjectOnTablet,
      1,
      trx
    );

    await TextEpigraphyDao.insertEpigraphyRow(epigraphyRow, trx);

    // MARKUP

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

  async addWord(
    payload: AddWordEditPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    const TextDiscourseDao = sl.get('TextDiscourseDao');
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const TextMarkupDao = sl.get('TextMarkupDao');

    const sideNumber = convertSideToSideNumber(payload.side);

    if (!payload.row.words || payload.row.words.length !== 1) {
      throw new Error('Invalid word arguments.');
    }

    const word = payload.row.words[0];

    const newObjectOnTablet = payload.previousWord
      ? await k('text_epigraphy')
          .select('object_on_tablet')
          .first()
          .where({
            text_uuid: payload.textUuid,
            side: sideNumber,
            column: payload.column,
            line: payload.line,
            discourse_uuid: payload.previousWord.discourseUuid,
          })
          .orderBy('object_on_tablet', 'desc')
          .then(row => row.object_on_tablet + 1)
      : await k('text_epigraphy')
          .select('object_on_tablet')
          .first()
          .where({
            text_uuid: payload.textUuid,
            side: sideNumber,
            column: payload.column,
            line: payload.line,
          })
          .whereNot('type', 'line')
          .orderBy('object_on_tablet', 'asc')
          .then(row => row.object_on_tablet);

    // DISCOURSE
    const newDiscourseStarter = await getUpdatedDiscourse(
      payload.textUuid,
      newObjectOnTablet,
      trx
    );

    await TextDiscourseDao.incrementObjInText(
      payload.textUuid,
      newDiscourseStarter.objInText,
      1,
      trx
    );

    await TextDiscourseDao.incrementWordOnTablet(
      payload.textUuid,
      newDiscourseStarter.wordOnTablet,
      1,
      trx
    );

    await TextDiscourseDao.incrementChildNum(
      payload.textUuid,
      newDiscourseStarter.parentUuid,
      newDiscourseStarter.childNum,
      1,
      trx
    );

    const type =
      payload.row.signs &&
      payload.row.signs
        .filter(sign => sign.discourseUuid === word.discourseUuid)
        .every(sign => sign.readingType === 'number')
        ? 'number'
        : 'word';

    const discourseRow: TextDiscourseRow = {
      uuid: word.discourseUuid!,
      type,
      objInText: newDiscourseStarter.objInText,
      wordOnTablet: newDiscourseStarter.wordOnTablet,
      childNum: newDiscourseStarter.childNum,
      textUuid: payload.textUuid,
      treeUuid: newDiscourseStarter.treeUuid,
      parentUuid: newDiscourseStarter.parentUuid,
      spelling: word.spelling,
      explicitSpelling: word.spelling,
      spellingUuid: payload.spellingUuid,
      transcription: payload.transcription,
    };

    await TextDiscourseDao.insertDiscourseRow(discourseRow, trx);

    // EPIGRAPHY
    const treeUuid: string = await k('text_epigraphy')
      .select('tree_uuid')
      .first()
      .where({ text_uuid: payload.textUuid })
      .then(row => row.tree_uuid);

    const lineUuid: string = await k('text_epigraphy')
      .select('uuid')
      .first()
      .where({
        text_uuid: payload.textUuid,
        type: 'line',
        side: sideNumber,
        column: payload.column,
        line: payload.line,
      })
      .then(row => row.uuid);

    await TextEpigraphyDao.incrementObjectOnTablet(
      payload.textUuid,
      newObjectOnTablet,
      payload.row.signs ? payload.row.signs.length : 0,
      trx
    );

    if (payload.row.signs) {
      const markupToAdd = await getMarkupToAutoAdd(
        payload.textUuid,
        newObjectOnTablet,
        payload.line,
        payload.row.signs.length,
        trx
      );

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
            parentUuid: lineUuid,
            objectOnTablet: newObjectOnTablet + idx,
            side: sideNumber,
            column: payload.column,
            line: payload.line,
            charOnLine: null, // Will be fixed in clean up
            charOnTablet: null, // Will be fixed in clean up
            signUuid: sign.signUuid,
            sign: sign.sign || null,
            readingUuid: sign.readingUuid,
            reading: sign.value || null,
            discourseUuid,
          };

          await TextEpigraphyDao.insertEpigraphyRow(signRow, trx);

          await Promise.all(
            markupToAdd.map(markupType =>
              TextMarkupDao.insertMarkupRow(
                {
                  uuid: v4(),
                  referenceUuid: signRow.uuid,
                  type: markupType,
                  numValue: null,
                  altReadingUuid: null,
                  altReading: null,
                  startChar: null,
                  endChar: null,
                  objectUuid: null,
                },
                trx
              )
            )
          );
        })
      );
    }
  }

  async addSign(
    payload: AddSignPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const TextMarkupDao = sl.get('TextMarkupDao');

    const sideNumber = convertSideToSideNumber(payload.side);

    const newObjectOnTablet = payload.signUuidBefore
      ? await k('text_epigraphy')
          .select('object_on_tablet')
          .first()
          .where({ text_uuid: payload.textUuid, uuid: payload.signUuidBefore })
          .then(row => row.object_on_tablet + 1)
      : await k('text_epigraphy')
          .select('object_on_tablet')
          .first()
          .where({
            text_uuid: payload.textUuid,
            line: payload.line,
            discourse_uuid: payload.discourseUuid,
          })
          .orderBy('object_on_tablet')
          .then(row => row.object_on_tablet);

    const treeUuid: string = await k('text_epigraphy')
      .select('tree_uuid')
      .first()
      .where({ text_uuid: payload.textUuid })
      .then(row => row.tree_uuid);

    const lineUuid: string = await k('text_epigraphy')
      .select('uuid')
      .first()
      .where({
        text_uuid: payload.textUuid,
        type: 'line',
        side: sideNumber,
        column: payload.column,
        line: payload.line,
      })
      .then(row => row.uuid);

    await TextEpigraphyDao.incrementObjectOnTablet(
      payload.textUuid,
      newObjectOnTablet,
      1,
      trx
    );

    const signRow: TextEpigraphyRow = {
      uuid: payload.sign.uuid,
      type: getEpigraphyType(payload.sign.readingType),
      textUuid: payload.textUuid,
      treeUuid,
      parentUuid: lineUuid,
      objectOnTablet: newObjectOnTablet,
      side: sideNumber,
      column: payload.column,
      line: payload.line,
      charOnLine: null, // Will be fixed in clean up
      charOnTablet: null, // Will be fixed in clean up
      signUuid: payload.sign.signUuid,
      sign: payload.sign.sign || null,
      readingUuid: payload.sign.readingUuid,
      reading: payload.sign.value || null,
      discourseUuid: payload.discourseUuid,
    };

    await TextEpigraphyDao.insertEpigraphyRow(signRow, trx);

    if (payload.discourseUuid) {
      await k('text_discourse').where({ uuid: payload.discourseUuid }).update({
        spelling: payload.spelling,
        spelling_uuid: payload.spellingUuid,
        explicit_spelling: payload.spelling,
        transcription: payload.transcription,
      });
    }

    const markupToAdd = await getMarkupToAutoAdd(
      payload.textUuid,
      newObjectOnTablet,
      payload.line,
      1,
      trx
    );

    await Promise.all(
      markupToAdd.map(async type => {
        const markupRow: TextMarkupRow = {
          uuid: v4(),
          referenceUuid: signRow.uuid,
          type,
          numValue: null,
          altReadingUuid: null,
          altReading: null,
          startChar: null,
          endChar: null,
          objectUuid: null,
        };

        await TextMarkupDao.insertMarkupRow(markupRow, trx);
      })
    );
  }

  async addUndeterminedSigns(
    payload: AddUndeterminedSignsPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const TextMarkupDao = sl.get('TextMarkupDao');

    const sideNumber = convertSideToSideNumber(payload.side);

    // EPIGRAPHY
    const newObjectOnTablet = payload.signUuidBefore
      ? await k('text_epigraphy')
          .select('object_on_tablet')
          .first()
          .where({ text_uuid: payload.textUuid, uuid: payload.signUuidBefore })
          .then(row => row.object_on_tablet + 1)
      : await k('text_epigraphy')
          .select('object_on_tablet')
          .first()
          .where({
            text_uuid: payload.textUuid,
            line: payload.line,
            discourse_uuid: payload.discourseUuid,
          })
          .orderBy('object_on_tablet')
          .then(row => row.object_on_tablet);

    const treeUuid: string = await k('text_epigraphy')
      .select('tree_uuid')
      .first()
      .where({ text_uuid: payload.textUuid })
      .then(row => row.tree_uuid);

    const lineUuid: string = await k('text_epigraphy')
      .select('uuid')
      .first()
      .where({
        text_uuid: payload.textUuid,
        type: 'line',
        side: sideNumber,
        column: payload.column,
        line: payload.line,
      })
      .then(row => row.uuid);

    await TextEpigraphyDao.incrementObjectOnTablet(
      payload.textUuid,
      newObjectOnTablet,
      1,
      trx
    );

    const signRow: TextEpigraphyRow = {
      uuid: v4(),
      type: 'undeterminedSigns',
      textUuid: payload.textUuid,
      treeUuid,
      parentUuid: lineUuid,
      objectOnTablet: newObjectOnTablet,
      side: sideNumber,
      column: payload.column,
      line: payload.line,
      charOnLine: null,
      charOnTablet: null,
      signUuid: null,
      sign: null,
      readingUuid: null,
      reading: null,
      discourseUuid: payload.discourseUuid,
    };

    await TextEpigraphyDao.insertEpigraphyRow(signRow, trx);

    // DISCOURSE
    if (payload.discourseUuid) {
      await k('text_discourse').where({ uuid: payload.discourseUuid }).update({
        spelling: payload.spelling,
        spelling_uuid: null,
        explicit_spelling: payload.spelling,
      });
    }

    // MARKUP
    const undeterminedMarkupRow: TextMarkupRow = {
      uuid: v4(),
      referenceUuid: signRow.uuid,
      type: 'undeterminedSigns',
      numValue: payload.number,
      altReadingUuid: null,
      altReading: null,
      startChar: null,
      endChar: null,
      objectUuid: null,
    };

    await TextMarkupDao.insertMarkupRow(undeterminedMarkupRow, trx);

    const markupToAdd = await getMarkupToAutoAdd(
      payload.textUuid,
      newObjectOnTablet,
      payload.line,
      1,
      trx
    );

    await Promise.all(
      markupToAdd.map(async type => {
        const markupRow: TextMarkupRow = {
          uuid: v4(),
          referenceUuid: signRow.uuid,
          type,
          numValue: null,
          altReadingUuid: null,
          altReading: null,
          startChar: null,
          endChar: null,
          objectUuid: null,
        };

        await TextMarkupDao.insertMarkupRow(markupRow, trx);
      })
    );
  }

  async addDivider(
    payload: AddDividerPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const TextMarkupDao = sl.get('TextMarkupDao');

    const sideNumber = convertSideToSideNumber(payload.side);

    const newObjectOnTablet = payload.signUuidBefore
      ? await k('text_epigraphy')
          .select('object_on_tablet')
          .first()
          .where({ text_uuid: payload.textUuid, uuid: payload.signUuidBefore })
          .then(row => row.object_on_tablet + 1)
      : await k('text_epigraphy')
          .select('object_on_tablet')
          .first()
          .where({
            text_uuid: payload.textUuid,
            line: payload.line,
          })
          .whereNot('type', 'line')
          .orderBy('object_on_tablet')
          .then(row => row.object_on_tablet);

    const treeUuid: string = await k('text_epigraphy')
      .select('tree_uuid')
      .first()
      .where({ text_uuid: payload.textUuid })
      .then(row => row.tree_uuid);

    const lineUuid: string = await k('text_epigraphy')
      .select('uuid')
      .first()
      .where({
        text_uuid: payload.textUuid,
        type: 'line',
        side: sideNumber,
        column: payload.column,
        line: payload.line,
      })
      .then(row => row.uuid);

    await TextEpigraphyDao.incrementObjectOnTablet(
      payload.textUuid,
      newObjectOnTablet,
      1,
      trx
    );

    const signRow: TextEpigraphyRow = {
      uuid: v4(),
      type: 'separator',
      textUuid: payload.textUuid,
      treeUuid,
      parentUuid: lineUuid,
      objectOnTablet: newObjectOnTablet,
      side: sideNumber,
      column: payload.column,
      line: payload.line,
      charOnLine: null, // Will be fixed in clean up
      charOnTablet: null, // Will be fixed in clean up
      signUuid: 'bdde2a30-bcf5-6414-5bb4-cc89cf866f9b',
      sign: 'Old Assyrian Word Divider',
      readingUuid: 'f5b976e1-77ee-f19c-50f2-a27eaf918ac8',
      reading: '|',
      discourseUuid: null,
    };

    await TextEpigraphyDao.insertEpigraphyRow(signRow, trx);

    const markupToAdd = await getMarkupToAutoAdd(
      payload.textUuid,
      newObjectOnTablet,
      payload.line,
      1,
      trx
    );

    await Promise.all(
      markupToAdd.map(async type => {
        const markupRow: TextMarkupRow = {
          uuid: v4(),
          referenceUuid: signRow.uuid,
          type,
          numValue: null,
          altReadingUuid: null,
          altReading: null,
          startChar: null,
          endChar: null,
          objectUuid: null,
        };

        await TextMarkupDao.insertMarkupRow(markupRow, trx);
      })
    );
  }

  async editSide(
    payload: EditSidePayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');

    const originalSideNumber = convertSideToSideNumber(payload.originalSide);
    const newSideNumber = convertSideToSideNumber(payload.newSide);

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

    const sideNumber = convertSideToSideNumber(payload.side);

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

  async editSign(
    payload: EditSignPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    // EPIGRAPHY
    await k('text_epigraphy')
      .where({
        uuid: payload.uuid,
        text_uuid: payload.textUuid,
      })
      .update({
        type: getEpigraphyType(payload.sign.readingType),
        sign_uuid: payload.sign.signUuid,
        sign: payload.sign.sign || null,
        reading_uuid: payload.sign.readingUuid,
        reading: payload.sign.value || null,
      });

    // DISCOURSE
    if (payload.discourseUuid) {
      await k('text_discourse').where({ uuid: payload.discourseUuid }).update({
        spelling: payload.spelling,
        spelling_uuid: payload.spellingUuid,
        explicit_spelling: payload.spelling,
        transcription: payload.transcription,
      });
    }

    // MARKUP
    await editMarkupSelection(
      payload.uuid,
      payload.textUuid,
      payload.markup,
      trx
    );
  }

  async editUndeterminedSigns(
    payload: EditUndeterminedSignsPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    await k('text_markup')
      .where({ reference_uuid: payload.uuid, type: 'undeterminedSigns' })
      .update({ num_value: payload.number });

    // MARKUP
    await editMarkupSelection(
      payload.uuid,
      payload.textUuid,
      payload.markup,
      trx
    );
  }

  async editDivider(
    payload: EditDividerPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    await editMarkupSelection(
      payload.uuid,
      payload.textUuid,
      payload.markup,
      trx
    );
  }

  async splitLine(
    payload: SplitLinePayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');

    const sideNumber = convertSideToSideNumber(payload.side);

    const lineParentUuid = await k('text_epigraphy')
      .where({
        text_uuid: payload.textUuid,
        line: payload.line,
        side: sideNumber,
        column: payload.column,
      })
      .select('parent_uuid')
      .first()
      .then(row => row.parent_uuid);

    const treeUuid = await k('text_epigraphy')
      .where({ uuid: lineParentUuid })
      .select('tree_uuid')
      .first()
      .then(row => row.tree_uuid);

    const newObjectOnTablet = await k('text_epigraphy')
      .where({ uuid: payload.previousUuid, text_uuid: payload.textUuid })
      .select('object_on_tablet')
      .first()
      .then(row => row.object_on_tablet + 1);

    await TextEpigraphyDao.incrementObjectOnTablet(
      payload.textUuid,
      newObjectOnTablet,
      1,
      trx
    );

    const lineRow: TextEpigraphyRow = {
      uuid: v4(),
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

    await k('text_epigraphy')
      .where({
        text_uuid: payload.textUuid,
        line: payload.line,
        side: sideNumber,
        column: payload.column,
      })
      .where('object_on_tablet', '>', newObjectOnTablet)
      .update({ parent_uuid: lineRow.uuid });
  }

  async splitWord(
    payload: SplitWordPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    const TextDiscourseDao = sl.get('TextDiscourseDao');
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');

    const discourseRow = await TextDiscourseDao.getDiscourseRowByUuid(
      payload.discourseUuid,
      trx
    );

    if (discourseRow.objInText === null) {
      throw new Error('Discourse row has no objInText');
    }

    await TextDiscourseDao.incrementObjInText(
      payload.textUuid,
      discourseRow.objInText + 1,
      1,
      trx
    );

    await k('text_discourse').where({ uuid: payload.discourseUuid }).update({
      spelling_uuid: payload.firstSpellingUuid,
      spelling: payload.firstSpelling,
      explicit_spelling: payload.firstSpelling,
      transcription: payload.firstTranscription,
    });

    const newDiscourseRow: TextDiscourseRow = {
      uuid: v4(),
      type: 'word',
      objInText: discourseRow.objInText + 1,
      wordOnTablet: null,
      childNum: null,
      textUuid: payload.textUuid,
      treeUuid: discourseRow.treeUuid,
      parentUuid: discourseRow.parentUuid,
      spellingUuid: payload.secondSpellingUuid,
      spelling: payload.secondSpelling,
      explicitSpelling: payload.secondSpelling,
      transcription: payload.secondTranscription,
    };

    await TextDiscourseDao.insertDiscourseRow(newDiscourseRow, trx);

    const previousObjectOnTablet: number = await k('text_epigraphy')
      .where({
        text_uuid: payload.textUuid,
        uuid: payload.previousUuid,
      })
      .select('object_on_tablet')
      .first()
      .then(row => row.object_on_tablet);

    await k('text_epigraphy')
      .where({
        discourse_uuid: payload.discourseUuid,
        text_uuid: payload.textUuid,
      })
      .where('object_on_tablet', '>', previousObjectOnTablet)
      .update({ discourse_uuid: newDiscourseRow.uuid });

    if (payload.propertySelections.length === 0) {
      await k('item_properties')
        .where({ reference_uuid: payload.discourseUuid })
        .del();
    } else if (payload.propertySelections.length === 1) {
      if (payload.propertySelections[0] === 1) {
        await k('item_properties')
          .where({ reference_uuid: payload.discourseUuid })
          .update({ reference_uuid: newDiscourseRow.uuid });
      }
    } else if (payload.propertySelections.length === 2) {
      const existingProperties = await ItemPropertiesDao.getPropertiesByReferenceUuid(
        payload.discourseUuid,
        trx
      );

      const newRowsWithUuids: InsertItemPropertyRow[] = existingProperties.map(
        row => ({
          uuid: v4(),
          referenceUuid: newDiscourseRow.uuid,
          parentUuid: null,
          level: row.level,
          variableUuid: row.variableUuid,
          valueUuid: row.valueUuid,
          objectUuid: row.objectUuid,
          value: row.value,
        })
      );

      const newRowsWithParentUuids: InsertItemPropertyRow[] = newRowsWithUuids.map(
        (row, idx) => {
          const originalParentUuid = existingProperties[idx].parentUuid;
          const parentIndex = existingProperties.findIndex(
            prop => prop.uuid === originalParentUuid
          );
          const parentUuid =
            parentIndex === -1 ? null : newRowsWithUuids[parentIndex].uuid;

          return {
            ...row,
            parentUuid: parentUuid || null,
          };
        }
      );

      await ItemPropertiesDao.addProperties(newRowsWithParentUuids, trx);
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

  async mergeWords(
    payload: MergeWordPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    if (payload.discourseUuids.length !== 2) {
      throw new Error('Two discourse uuids are required');
    }

    const discourseUuidToKeep = payload.discourseUuids[0];
    const discourseUuidToDelete = payload.discourseUuids[1];

    await k('text_epigraphy')
      .where({
        text_uuid: payload.textUuid,
        discourse_uuid: discourseUuidToDelete,
      })
      .update({ discourse_uuid: discourseUuidToKeep });

    await k('item_properties')
      .where({ reference_uuid: discourseUuidToDelete })
      .update({ reference_uuid: discourseUuidToKeep });

    await k('item_properties')
      .where({ object_uuid: discourseUuidToDelete })
      .update({ object_uuid: discourseUuidToKeep });

    await k('text_discourse').where({ uuid: discourseUuidToKeep }).update({
      spelling: payload.spelling,
      explicit_spelling: payload.spelling,
      spelling_uuid: payload.spellingUuid,
      transcription: payload.transcription,
    });

    await k('text_discourse').where({ uuid: discourseUuidToDelete }).del();
  }

  async reorderSign(
    payload: ReorderSignPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    const firstObjOnTablet: number = await k('text_epigraphy')
      .where({ text_uuid: payload.textUuid, uuid: payload.signUuids[0] })
      .select('object_on_tablet')
      .first()
      .then(row => row.object_on_tablet);

    const secondObjOnTablet: number = await k('text_epigraphy')
      .where({ text_uuid: payload.textUuid, uuid: payload.signUuids[1] })
      .select('object_on_tablet')
      .first()
      .then(row => row.object_on_tablet);

    // Swap obect_on_tablet
    await k('text_epigraphy')
      .where({
        text_uuid: payload.textUuid,
        uuid: payload.signUuids[0],
      })
      .update({ object_on_tablet: secondObjOnTablet });

    await k('text_epigraphy')
      .where({
        text_uuid: payload.textUuid,
        uuid: payload.signUuids[1],
      })
      .update({ object_on_tablet: firstObjOnTablet });

    // DISCOURSE
    await k('text_discourse').where({ uuid: payload.discourseUuid }).update({
      spelling: payload.spelling,
      spelling_uuid: payload.spellingUuid,
      explicit_spelling: payload.spelling,
      transcription: payload.transcription,
    });
  }

  async removeSide(
    payload: RemoveSidePayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    const sideNumber = convertSideToSideNumber(payload.side);

    const discourseUuidsToDelete: string[] = await k('text_epigraphy')
      .where({ text_uuid: payload.textUuid, side: sideNumber })
      .whereNotNull('discourse_uuid')
      .distinct('discourse_uuid')
      .then(rows => rows.map(r => r.discourse_uuid));

    // Prevents FK constraint violation
    await k('text_epigraphy')
      .where({
        text_uuid: payload.textUuid,
        side: sideNumber,
      })
      .update({ parent_uuid: null, discourse_uuid: null });

    await k('text_epigraphy')
      .where({
        text_uuid: payload.textUuid,
        side: sideNumber,
      })
      .del();

    await recursivelyCleanDiscourseUuids(
      discourseUuidsToDelete,
      payload.textUuid,
      trx
    );
  }

  async removeColumn(
    payload: RemoveColumnPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    const sideNumber = convertSideToSideNumber(payload.side);

    const discourseUuidsToDelete: string[] = await k('text_epigraphy')
      .where({
        text_uuid: payload.textUuid,
        side: sideNumber,
        column: payload.column,
      })
      .whereNotNull('discourse_uuid')
      .distinct('discourse_uuid')
      .then(rows => rows.map(r => r.discourse_uuid));

    // Prevents FK constraint violation
    await k('text_epigraphy')
      .where({
        text_uuid: payload.textUuid,
        side: sideNumber,
        column: payload.column,
      })
      .update({ parent_uuid: null, discourse_uuid: null });

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

    await recursivelyCleanDiscourseUuids(
      discourseUuidsToDelete,
      payload.textUuid,
      trx
    );
  }

  async removeRegion(
    payload: RemoveRegionPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    const discourseUuidsToDelete: string[] = await k('text_epigraphy')
      .where({ uuid: payload.uuid })
      .whereNotNull('discourse_uuid')
      .distinct('discourse_uuid')
      .then(rows => rows.map(r => r.discourse_uuid));

    await k('text_epigraphy').where({ uuid: payload.uuid }).del();

    await recursivelyCleanDiscourseUuids(
      discourseUuidsToDelete,
      payload.textUuid,
      trx
    );
  }

  async removeLine(
    payload: RemoveLinePayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    const discourseUuidsToDelete: string[] = await k('text_epigraphy')
      .where({ text_uuid: payload.textUuid, line: payload.line })
      .whereNotNull('discourse_uuid')
      .distinct('discourse_uuid')
      .then(rows => rows.map(r => r.discourse_uuid));

    // Prevents FK constraint violation
    await k('text_epigraphy')
      .where({ text_uuid: payload.textUuid, line: payload.line })
      .update({ parent_uuid: null, discourse_uuid: null });

    await k('text_epigraphy')
      .where({ text_uuid: payload.textUuid, line: payload.line })
      .del();

    await recursivelyCleanDiscourseUuids(
      discourseUuidsToDelete,
      payload.textUuid,
      trx
    );
  }

  async removeUndeterminedLines(
    payload: RemoveUndeterminedLinesPayload,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();

    const discourseUuidsToDelete: string[] = await k('text_epigraphy')
      .where({ uuid: payload.uuid })
      .whereNotNull('discourse_uuid')
      .distinct('discourse_uuid')
      .then(rows => rows.map(r => r.discourse_uuid));

    await k('text_epigraphy').where({ uuid: payload.uuid }).del();

    await recursivelyCleanDiscourseUuids(
      discourseUuidsToDelete,
      payload.textUuid,
      trx
    );
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

    const discourseUuidsToDelete: string[] = await k('text_epigraphy')
      .whereIn('uuid', uuidsToRemove)
      .whereNotNull('discourse_uuid')
      .distinct('discourse_uuid')
      .then(rows => rows.map(r => r.discourse_uuid));

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

    await recursivelyCleanDiscourseUuids(
      discourseUuidsToDelete,
      payload.textUuid,
      trx
    );

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

    const signsInWord: string[] = discourseUuid
      ? await k('text_epigraphy')
          .pluck('uuid')
          .where({ discourse_uuid: discourseUuid })
      : [];

    if (signsInWord.length === 1 && discourseUuid) {
      await this.removeWord(
        {
          type: 'removeWord',
          textUuid: payload.textUuid,
          discourseUuid,
          line: payload.line,
        },
        trx
      );
      return;
    }

    await k('text_epigraphy')
      .where({ uuid: payload.uuid })
      .update({ discourse_uuid: null });

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
        transcription: payload.transcription,
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

  async cleanLines(textUuid: string, trx?: Knex.Transaction): Promise<void> {
    await cleanLines(textUuid, trx);
  }
}

export default new EditTextUtils();
