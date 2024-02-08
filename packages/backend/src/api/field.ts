import express from 'express';
import sl from '@/serviceLocator';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import { FieldPayload, FieldType } from '@oare/types';
import permissionsRoute from '@/middlewares/router/permissionsRoute';
import authenticatedRoute from '@/middlewares/router/authenticatedRoute';

const router = express.Router();

router
  .route('/field/:uuid')
  .get(authenticatedRoute, async (req, res, next) => {
    try {
      const FieldDao = sl.get('FieldDao');

      const { uuid: referenceUuid } = req.params;
      const type = (req.params.type || 'description') as FieldType;

      const response = await FieldDao.getFieldRowsByReferenceUuidAndType(
        referenceUuid,
        type
      );

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .post(
    permissionsRoute('ADD_EDIT_FIELD_DESCRIPTION'),
    async (req, res, next) => {
      try {
        const FieldDao = sl.get('FieldDao');
        const cache = sl.get('cache');
        const utils = sl.get('utils');

        const { uuid: referenceUuid } = req.params;
        const { field, primacy, type }: FieldPayload = req.body as FieldPayload;

        if (req.user && !req.user.isAdmin && primacy > 1) {
          next(
            new HttpBadRequest(
              'Only admins can add descriptions with primacy greater than 1.'
            )
          );
          return;
        }

        const language = await utils.detectLanguage(field);

        await FieldDao.insertField(
          referenceUuid,
          type,
          field,
          primacy,
          language === 'english' ? 'default' : language
        );

        cache.clear('/properties_taxonomy_tree', {
          level: 'exact',
        });
        cache.clear('/person', { level: 'startsWith' });
        cache.clear('/archive', { level: 'startsWith' });

        res.status(201).end();
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  )
  .patch(
    permissionsRoute('ADD_EDIT_FIELD_DESCRIPTION'),
    async (req, res, next) => {
      try {
        const FieldDao = sl.get('FieldDao');
        const cache = sl.get('cache');
        const utils = sl.get('utils');

        const { uuid } = req.params;
        const { field, primacy, type }: FieldPayload = req.body as FieldPayload;

        const fieldExists = await FieldDao.fieldExists(uuid);
        if (!fieldExists) {
          next(new HttpBadRequest('Field does not exist.'));
          return;
        }

        if (!req.user!.isAdmin && primacy > 1) {
          next(
            new HttpBadRequest('Only admins can edit primacy greater than 1.')
          );
          return;
        }

        const language = await utils.detectLanguage(field);

        await FieldDao.updateField(
          uuid,
          field,
          language === 'english' ? 'default' : language,
          type,
          primacy
        );

        cache.clear('/properties_taxonomy_tree', {
          level: 'exact',
        });
        cache.clear('/person', { level: 'startsWith' });
        cache.clear('/archive', { level: 'startsWith' });

        res.status(204).end();
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  )
  .delete(
    permissionsRoute('ADD_EDIT_FIELD_DESCRIPTION'),
    async (req, res, next) => {
      try {
        const FieldDao = sl.get('FieldDao');
        const cache = sl.get('cache');

        const { uuid } = req.params;

        const fieldExists = await FieldDao.fieldExists(uuid);
        if (!fieldExists) {
          next(new HttpBadRequest('Field does not exist.'));
          return;
        }

        const fieldRow = await FieldDao.getFieldRowByUuid(uuid);

        await FieldDao.deleteField(uuid);

        if (fieldRow.primacy !== null && fieldRow.type !== null) {
          await FieldDao.decrementPrimacy(
            fieldRow.referenceUuid,
            fieldRow.primacy,
            fieldRow.type
          );
        }

        cache.clear('/properties_taxonomy_tree', {
          level: 'exact',
        });
        cache.clear('/person', { level: 'startsWith' });
        cache.clear('/archive', { level: 'startsWith' });

        res.status(204).end();
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

export default router;
