import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import {
  NewDiscourseRowPayload,
  DiscourseProperties,
  InsertParentDiscourseRowPayload,
  TextDiscourseRow,
  DiscourseUnitType,
  InsertItemPropertyRow,
} from '@oare/types';
import permissionRoute from '@/middlewares/permissionsRoute';
import { v4 } from 'uuid';
import { convertParsePropsToItemProps } from '@oare/oare';
import { nestProperties } from '../utils/index';

const router = express.Router();

router
  .route('/text_discourse')
  .post(permissionRoute('INSERT_DISCOURSE_ROWS'), async (req, res, next) => {
    const TextDiscourseDao = sl.get('TextDiscourseDao');
    const {
      spelling,
      formUuid,
      occurrences,
    }: NewDiscourseRowPayload = req.body;

    try {
      for (let i = 0; i < occurrences.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await TextDiscourseDao.insertNewDiscourseRow(
          spelling,
          formUuid,
          occurrences[i].epigraphyUuids,
          occurrences[i].textUuid
        );
      }
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/text_discourse_parent')
  .post(
    permissionRoute('INSERT_PARENT_DISCOURSE_ROWS'),
    async (req, res, next) => {
      try {
        const TextDiscourseDao = sl.get('TextDiscourseDao');
        const FieldDao = sl.get('FieldDao');
        const AliasDao = sl.get('AliasDao');
        const ItemPropertiesDao = sl.get('ItemPropertiesDao');

        const {
          textUuid,
          discourseSelections,
          discourseType,
          newContent,
          properties,
        }: InsertParentDiscourseRowPayload = req.body;

        const sortedDiscourseSelections = discourseSelections.sort(
          (a, b) => a.objInText - b.objInText
        );

        const newRowObjInText = sortedDiscourseSelections[0].objInText;
        const newRowChildNum = sortedDiscourseSelections[0].childNum!;
        const newRowUuid = v4();
        const newRowTreeUuid = (
          await TextDiscourseDao.getDiscourseRowByUuid(
            sortedDiscourseSelections[0].uuid
          )
        ).treeUuid;

        await TextDiscourseDao.incrementObjInText(textUuid, newRowObjInText);
        await Promise.all(
          sortedDiscourseSelections.map((selection, idx) =>
            TextDiscourseDao.updateChildNum(selection.uuid, idx + 1)
          )
        );

        const newDiscourseRow: TextDiscourseRow = {
          uuid: newRowUuid,
          type: discourseType.toLowerCase() as DiscourseUnitType,
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
        await TextDiscourseDao.insertDiscourseRow(newDiscourseRow);
        await TextDiscourseDao.updateParentUuid(
          newRowUuid,
          sortedDiscourseSelections.map(selection => selection.uuid)
        );

        const siblings = await TextDiscourseDao.getChildrenUuids(
          sortedDiscourseSelections[0].parentUuid!
        );
        const siblingRows = await Promise.all(
          siblings.map(sibling =>
            TextDiscourseDao.getDiscourseRowByUuid(sibling)
          )
        );
        const relevantSiblingRows = siblingRows.filter(
          row => row.childNum && row.childNum > newRowChildNum
        );
        await Promise.all(
          relevantSiblingRows.map((row, idx) =>
            TextDiscourseDao.updateChildNum(row.uuid, newRowChildNum + idx + 1)
          )
        );

        const itemProperties = convertParsePropsToItemProps(
          properties,
          newRowUuid
        );
        const itemPropertyRowLevels = [
          ...new Set(itemProperties.map(row => row.level)),
        ];
        const rowsByLevel: InsertItemPropertyRow[][] = itemPropertyRowLevels.map(
          level => itemProperties.filter(row => row.level === level)
        );
        for (let i = 0; i < rowsByLevel.length; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await Promise.all(
            rowsByLevel[i].map(row => ItemPropertiesDao.addProperty(row))
          );
        }

        // insert properties
        if (discourseType === 'Sentence') {
          await FieldDao.insertField(
            newRowUuid,
            'translation',
            newContent,
            0,
            'default'
          );
        } else if (discourseType === 'Paragraph') {
          await AliasDao.insertAlias(
            'label',
            newRowUuid,
            newContent,
            null,
            null,
            1
          );
        }

        res.status(201).end();
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

router.route('/text_discourse/properties/:uuid').get(async (req, res, next) => {
  try {
    const { uuid: discourseUuid } = req.params;
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');
    const NoteDao = sl.get('NoteDao');

    const properties = await ItemPropertiesDao.getPropertiesByReferenceUuid(
      discourseUuid
    );

    const propertiesWithChildren = nestProperties(properties, null);

    const notes = await NoteDao.getNotesByReferenceUuid(discourseUuid);

    const response: DiscourseProperties = {
      properties: propertiesWithChildren,
      notes,
    };
    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router
  .route('/text_discourse/:uuid')
  .patch(permissionRoute('EDIT_TRANSLATION'), async (req, res, next) => {
    const FieldDao = sl.get('FieldDao');
    const { uuid } = req.params;
    const { newTranslation } = req.body;

    try {
      const fieldRow = await FieldDao.getByReferenceUuid(uuid);
      await FieldDao.updateField(fieldRow[0].uuid, newTranslation, {
        primacy: 1,
      });
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .post(permissionRoute('EDIT_TRANSLATION'), async (req, res, next) => {
    const FieldDao = sl.get('FieldDao');
    const { uuid } = req.params;
    const { newTranslation } = req.body;

    try {
      await FieldDao.insertField(uuid, 'translation', newTranslation, 0, null);
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
