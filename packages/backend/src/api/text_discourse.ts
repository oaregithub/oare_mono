import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import { NewDiscourseRowPayload, DiscourseProperties } from '@oare/types';
import permissionRoute from '@/middlewares/permissionsRoute';
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
      next(new HttpInternalError(err));
    }
  });

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
    next(new HttpInternalError(err));
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
      next(new HttpInternalError(err));
    }
  })
  .post(permissionRoute('EDIT_TRANSLATION'), async (req, res, next) => {
    const FieldDao = sl.get('FieldDao');
    const { uuid } = req.params;
    const { newTranslation } = req.body;

    try {
      await FieldDao.insertField(uuid, 'translation', newTranslation, {
        primacy: 0,
      });
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
