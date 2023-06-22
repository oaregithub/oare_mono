import express from 'express';
import sl from '@/serviceLocator';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import { InsertParentDiscourseRowPayload, TextDiscourseRow } from '@oare/types';
import permissionsRoute from '@/middlewares/router/permissionsRoute';
import { v4 } from 'uuid';
import { convertAppliedPropsToItemProps } from '@oare/oare';

// COMPLETE

const router = express.Router();

router
  .route('/text_discourse/parent')
  .post(
    permissionsRoute('INSERT_PARENT_DISCOURSE_ROWS'),
    async (req, res, next) => {
      try {
        const TextDiscourseDao = sl.get('TextDiscourseDao');
        const FieldDao = sl.get('FieldDao');
        const AliasDao = sl.get('AliasDao');
        const ItemPropertiesDao = sl.get('ItemPropertiesDao');
        const utils = sl.get('utils');
        const cache = sl.get('cache');

        const {
          textUuid,
          discourseSelections,
          discourseType,
          newContent,
          properties,
        }: InsertParentDiscourseRowPayload = req.body;

        if (
          discourseSelections.some(
            unit =>
              unit.type === 'region' &&
              (unit.explicitSpelling?.includes('uninscribed') ||
                unit.explicitSpelling?.includes('ruling'))
          )
        ) {
          next(
            new HttpBadRequest(
              'Cannot insert a parent discourse row for an uninscribed or ruling region'
            )
          );
          return;
        }

        const sortedDiscourseSelections = discourseSelections.sort(
          (a, b) => a.objInText - b.objInText
        );

        const newRowUuid = v4();
        const newRowObjInText = sortedDiscourseSelections[0].objInText;
        const newRowChildNum = sortedDiscourseSelections[0].childNum!;

        await utils.createTransaction(async trx => {
          const newRowTreeUuid = (
            await TextDiscourseDao.getTextDiscourseRowByUuid(
              sortedDiscourseSelections[0].uuid,
              trx
            )
          ).treeUuid;

          await TextDiscourseDao.incrementObjInText(
            textUuid,
            newRowObjInText,
            1,
            trx
          );

          await Promise.all(
            sortedDiscourseSelections.map((selection, idx) =>
              TextDiscourseDao.updateChildNum(selection.uuid, idx + 1, trx)
            )
          );

          const newDiscourseRow: TextDiscourseRow = {
            uuid: newRowUuid,
            type: discourseType,
            objInText: newRowObjInText,
            wordOnTablet: null,
            childNum: newRowChildNum,
            textUuid,
            treeUuid: newRowTreeUuid,
            parentUuid: sortedDiscourseSelections[0].parentUuid || null,
            spellingUuid: null,
            spelling: null,
            explicitSpelling: null,
            transcription: null,
          };
          await TextDiscourseDao.insertDiscourseRow(newDiscourseRow, trx);

          await TextDiscourseDao.updateParentUuid(
            sortedDiscourseSelections.map(selection => selection.uuid),
            newRowUuid,
            trx
          );

          const siblings = await TextDiscourseDao.getTextDiscourseUuidsByParentUuid(
            sortedDiscourseSelections[0].parentUuid!,
            trx
          );
          const siblingRows = await Promise.all(
            siblings.map(sibling =>
              TextDiscourseDao.getTextDiscourseRowByUuid(sibling, trx)
            )
          );
          const relevantSiblingRows = siblingRows.filter(
            row => row.childNum && row.childNum > newRowChildNum
          );
          await Promise.all(
            relevantSiblingRows.map((row, idx) =>
              TextDiscourseDao.updateChildNum(
                row.uuid,
                newRowChildNum + idx + 1,
                trx
              )
            )
          );

          const itemPropertyRows = convertAppliedPropsToItemProps(
            properties,
            newRowUuid
          );
          await ItemPropertiesDao.insertItemPropertyRows(itemPropertyRows, trx);

          if (discourseType === 'sentence') {
            await FieldDao.insertField(
              newRowUuid,
              'translation',
              newContent,
              0,
              'default',
              trx
            );
          } else if (discourseType === 'paragraph') {
            await AliasDao.insertAliasRow(
              'label',
              newRowUuid,
              newContent,
              null,
              null,
              1,
              trx
            );
          }
        });

        await cache.clear(`/epigraphies/${textUuid}`, {
          level: 'startsWith',
        });

        res.status(201).end();
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

router.route('/text_discourse/:uuid').get(async (req, res, next) => {
  try {
    const TextDiscourseDao = sl.get('TextDiscourseDao');

    const { uuid } = req.params;

    const textDiscourse = await TextDiscourseDao.getTextDiscourseByUuid(uuid);

    res.json(textDiscourse);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
