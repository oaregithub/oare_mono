import express from 'express';
import { HttpInternalError, HttpForbidden, HttpBadRequest } from '@/exceptions';
import sl from '@/serviceLocator';
import { EpigraphyResponse } from '@oare/types';
import authFirst from '@/middlewares/authFirst';

const router = express.Router();

router
  .route('/text_epigraphies/:uuid')
  .get(authFirst, async (req, res, next) => {
    try {
      const { uuid: textUuid } = req.params;
      const { user } = req;
      const userUuid = user ? user.uuid : null;
      const TextDao = sl.get('TextDao');
      const TextEpigraphyDao = sl.get('TextEpigraphyDao');
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const TextDraftsDao = sl.get('TextDraftsDao');
      const CollectionDao = sl.get('CollectionDao');
      const CollectionTextUtils = sl.get('CollectionTextUtils');

      const text = await TextDao.getTextByUuid(textUuid);

      if (!text) {
        next(new HttpBadRequest(`Text with UUID ${textUuid} does not exist`));
        return;
      }

      const canViewText = await CollectionTextUtils.canViewText(
        textUuid,
        userUuid
      );

      if (!canViewText) {
        next(
          new HttpForbidden(
            'You do not have permission to view this text. If you think this is a mistake, please contact your administrator.'
          )
        );
        return;
      }

      const collection = await CollectionDao.getTextCollection(text.uuid);

      if (!collection) {
        next(new HttpBadRequest('Text does not belong to a valid collection'));
        return;
      }

      const units = await TextEpigraphyDao.getEpigraphicUnits(textUuid);
      const cdliNum = await TextDao.getCdliNum(textUuid);
      const { color, colorMeaning } = await TextDao.getTranslitStatus(textUuid);
      const discourseUnits = await TextDiscourseDao.getTextDiscourseUnits(
        textUuid
      );
      const canWrite = await CollectionTextUtils.canEditText(
        textUuid,
        userUuid
      );
      const draft = user
        ? await TextDraftsDao.getDraft(user.uuid, textUuid)
        : null;

      const response: EpigraphyResponse = {
        textName: text.name,
        collection,
        units,
        canWrite,
        cdliNum,
        color,
        colorMeaning,
        discourseUnits,
        ...(draft ? { draft } : {}),
      };

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
