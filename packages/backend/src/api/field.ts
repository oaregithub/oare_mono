import express from 'express';
import sl from '@/serviceLocator';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import { FieldPayload } from '@oare/types';
import permissionsRoute from '@/middlewares/router/permissionsRoute';

// MOSTLY COMPLETE

const router = express.Router();

router
  .route('/field/:uuid')
  .get(async (req, res, next) => {
    // FIXME - there are probably a ton of routes that should be authenticated but aren't marked as such?
    try {
      const FieldDao = sl.get('FieldDao');

      const { uuid: referenceUuid } = req.params;

      const response = await FieldDao.getFieldRowsByReferenceUuidAndType(
        referenceUuid,
        'description'
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
        const {
          description,
          primacy,
          isTaxonomy,
        }: FieldPayload = req.body as FieldPayload;

        if (req.user && !req.user.isAdmin && primacy > 1) {
          next(
            new HttpBadRequest(
              'Only admins can add descriptions with primacy greater than 1.'
            )
          );
          return;
        }

        const language = (
          await utils.detectLanguage(description)
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

        if (isTaxonomy) {
          cache.clear('/properties_taxonomy_tree', {
            level: 'exact',
          });
        }

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
        const {
          description,
          primacy,
          isTaxonomy,
        }: FieldPayload = req.body as FieldPayload;

        if (req.user && !req.user.isAdmin && primacy > 1) {
          next(
            new HttpBadRequest('Only admins can edit primacy greater than 1.')
          );
          return;
        }

        const language = (
          await utils.detectLanguage(description)
        ).toLocaleLowerCase();

        await FieldDao.updateField(
          uuid,
          description,
          language === 'english'
            ? 'default'
            : language[0].toLocaleUpperCase() + language.substring(1),
          'description',
          primacy
        );

        if (isTaxonomy) {
          cache.clear('/dictionary/tree/taxonomy', {
            level: 'exact',
          });
        }

        res.status(201).end();
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

        const fieldRow = await FieldDao.getFieldRowByUuid(uuid);
        await FieldDao.deleteField(uuid);

        if (fieldRow.primacy !== null && fieldRow.type !== null) {
          await FieldDao.decrementPrimacy(
            fieldRow.referenceUuid,
            fieldRow.primacy,
            fieldRow.type
          );
        }

        // FIXME better way to tell if taxonomy?
        cache.clear('/dictionary/tree/taxonomy', {
          level: 'exact',
        });

        res.status(204).end();
      } catch (err) {
        next(new HttpInternalError(err as string));
      }
    }
  );

export default router;
