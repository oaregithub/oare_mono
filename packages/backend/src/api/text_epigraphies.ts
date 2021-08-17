import express from 'express';
import { HttpInternalError, HttpForbidden, HttpBadRequest } from '@/exceptions';
import sl from '@/serviceLocator';
import {
  EpigraphyResponse,
  TranslitOption,
  UpdateTranslitStatusPayload,
} from '@oare/types';
import permissionsRoute from '@/middlewares/permissionsRoute';

const router = express.Router();

router
  .route('/text_epigraphies/images/:uuid/:cdliNum')
  .get(async (req, res, next) => {
    try {
      const { uuid: textUuid, cdliNum } = req.params;
      const ResourceDao = sl.get('ResourceDao');

      const response = await ResourceDao.getImageLinksByTextUuid(
        textUuid,
        cdliNum
      );
      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/text_epigraphies/transliteration/options')
  .get(
    permissionsRoute('EDIT_TRANSLITERATION_STATUS'),
    async (_req, res, next) => {
      try {
        const TextDao = sl.get('TextDao');
        const stoplightOptions: TranslitOption[] = await TextDao.getTranslitOptions();

        res.json(stoplightOptions);
      } catch (err) {
        next(new HttpInternalError(err));
      }
    }
  )
  .patch(
    permissionsRoute('EDIT_TRANSLITERATION_STATUS'),
    async (req, res, next) => {
      try {
        const TextDao = sl.get('TextDao');
        const { textUuid, color }: UpdateTranslitStatusPayload = req.body;

        await TextDao.updateTranslitStatus(textUuid, color);

        res.status(204).end();
      } catch (err) {
        next(new HttpInternalError(err));
      }
    }
  );

router.route('/text_epigraphies/:uuid').get(async (req, res, next) => {
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
      next(
        new HttpBadRequest(`Text with UUID ${textUuid} does not exist`, true)
      );
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
    const canWrite = await CollectionTextUtils.canEditText(textUuid, userUuid);
    const draft = user
      ? await TextDraftsDao.getDraftByTextUuid(user.uuid, textUuid)
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
