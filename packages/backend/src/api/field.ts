import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import { EditFieldPayload, FieldInfo, NewFieldPayload } from '@oare/types';
import permissionsRoute from '@/middlewares/permissionsRoute';

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
  .patch(
    permissionsRoute('ADD_EDIT_FIELD_DESCRIPTION'),
    async (req, res, next) => {
      const FieldDao = sl.get('FieldDao');
      const cache = sl.get('cache');
      const {
        uuid,
        description,
        primacy,
      }: EditFieldPayload = req.body as EditFieldPayload;

      if (req.user && !req.user.isAdmin && primacy > 1) {
        next(res.status(403).end());
        return;
      }

      try {
        const language = (
          await FieldDao.detectLanguage(description)
        ).toLocaleLowerCase();

        await FieldDao.updateAllFieldFields(
          uuid,
          description,
          language === 'english'
            ? 'default'
            : language[0].toLocaleUpperCase() + language.substring(1),
          'description',
          { primacy }
        );

        cache.clear(
          '/dictionary/tree/taxonomy',
          {
            level: 'exact',
          },
          req
        );

        res.status(201).end();
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  )
  .post(
    permissionsRoute('ADD_EDIT_FIELD_DESCRIPTION'),
    async (req, res, next) => {
      const FieldDao = sl.get('FieldDao');
      const cache = sl.get('cache');
      const {
        referenceUuid,
        description,
        primacy,
      }: NewFieldPayload = req.body as NewFieldPayload;

      if (req.user && !req.user.isAdmin && primacy > 1) {
        next(res.status(403).end());
        return;
      }

      try {
        const language = (
          await FieldDao.detectLanguage(description)
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

        cache.clear(
          '/dictionary/tree/taxonomy',
          {
            level: 'exact',
          },
          req
        );

        res.status(201).end();
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

export default router;
