import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import { EditFieldPayload, FieldInfo, NewFieldPayload } from '@oare/types';
import { detectLanguage } from './daos/FieldDao/utils';

const router = express.Router();

router
  .route('/field_description/:referenceUuid')
  .get(async (req, res, next) => {
    try {
      const FieldDao = sl.get('FieldDao');
      const { referenceUuid } = req.params;

      const response: FieldInfo = await FieldDao.getFieldInfoByReferenceAndType(
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
    const cache = sl.get('cache');
    const {
      uuid,
      description,
      primacy,
    }: EditFieldPayload = req.body as EditFieldPayload;

    try {
      const language = (await detectLanguage(description)).toLocaleLowerCase();

      await FieldDao.updateAllFieldFields(
        uuid,
        description,
        language === 'english'
          ? 'default'
          : language[0].toLocaleUpperCase() + language.substring(1),
        'description',
        { primacy }
      );

      cache.clear('/dictionary/tree/taxonomy', {
        level: 'exact',
      });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .post(async (req, res, next) => {
    const FieldDao = sl.get('FieldDao');
    const cache = sl.get('cache');
    const {
      referenceUuid,
      description,
      primacy,
    }: NewFieldPayload = req.body as NewFieldPayload;

    try {
      const language: string = (
        await detectLanguage(description)
      ).toLocaleLowerCase();
      await FieldDao.insertField(
        referenceUuid,
        'description',
        description,
        primacy,
        language === 'english'
          ? 'default'
          : language[0].toLocaleUpperCase() + language.substring(1)
      );

      cache.clear('/dictionary/tree/taxonomy', {
        level: 'exact',
      });

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
