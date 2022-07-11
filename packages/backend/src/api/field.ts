import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import { API_PATH } from '@/setupRoutes';

const router = express.Router();

router
  .route('/field_description/:referenceUuid')
  .get(async (req, res, next) => {
    try {
      const FieldDao = sl.get('FieldDao');
      const { referenceUuid } = req.params;

      const response = await FieldDao.getFieldInfoByReferenceAndType(
        referenceUuid
      );
      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/update_field_description')
  .patch(async (req, res, next) => {
    const FieldDao = sl.get('FieldDao');
    const utils = sl.get('utils');
    const cache = sl.get('cache');
    const { uuid, description, primacy, language } = req.body;

    try {
      await utils.createTransaction(async trx => {
        await FieldDao.updateAllFieldFields(
          uuid,
          description,
          language,
          'description',
          { primacy },
          trx
        );
      });
      cache.clear(`${API_PATH}/dictionary/tree/taxonomy`, { level: 'exact' });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .post(async (req, res, next) => {
    const FieldDao = sl.get('FieldDao');
    const cache = sl.get('cache');
    const { referenceUuid, newDescription, primacy, language } = req.body;

    try {
      await FieldDao.insertField(
        referenceUuid,
        'description',
        newDescription,
        primacy,
        language
      );

      cache.clear(`${API_PATH}/dictionary/tree/taxonomy`, { level: 'exact' });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
