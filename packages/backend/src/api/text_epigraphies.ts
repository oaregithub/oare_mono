import express from 'express';
import { HttpInternalError, HttpForbidden } from '@/exceptions';
import sl from '@/serviceLocator';
import { EpigraphyResponse } from '@oare/types';
import authFirst from '@/middlewares/authFirst';

const router = express.Router();

router
  .route('/text_epigraphies/:uuid')
  .get(authFirst, async (req, res, next) => {
    try {
      const textUuid = String(req.params.uuid);
      const user = req.user || null;
      const TextMarkupDao = sl.get('TextMarkupDao');
      const TextDao = sl.get('TextDao');
      const HierarchyDao = sl.get('HierarchyDao');
      const TextGroupDao = sl.get('TextGroupDao');
      const TextEpigraphyDao = sl.get('TextEpigraphyDao');
      const AliasDao = sl.get('AliasDao');
      const TextDiscourseDao = sl.get('TextDiscourseDao');
      const CollectionGroupDao = sl.get('CollectionGroupDao');
      const TextDraftsDao = sl.get('TextDraftsDao');

      // Make sure user has access to the text he wishes to access
      if (!user || !user.isAdmin) {
        const { blacklist } = await TextGroupDao.getUserBlacklist(user);
        const collectionBlacklist = await CollectionGroupDao.getUserCollectionBlacklist(
          user
        );
        const collectionOfText = await HierarchyDao.getCollectionOfText(
          textUuid
        );

        if (
          blacklist.includes(textUuid) ||
          collectionBlacklist.includes(collectionOfText)
        ) {
          next(
            new HttpForbidden(
              'You do not have permission to view this text. If you think this is a mistake, please contact your administrator.'
            )
          );
          return;
        }
      }

      const textName = await AliasDao.textAliasNames(textUuid);
      const units = await TextEpigraphyDao.getEpigraphicUnits(textUuid);
      const collection = await HierarchyDao.getEpigraphyCollection(textUuid);
      const cdliNum = await TextDao.getCdliNum(textUuid);
      const { color, colorMeaning } = await TextDao.getTranslitStatus(textUuid);
      const discourseUnits = await TextDiscourseDao.getTextDiscourseUnits(
        textUuid
      );

      const markups = await TextMarkupDao.getMarkups(textUuid);

      let canWrite: boolean;
      if (user) {
        canWrite = user.isAdmin
          ? true
          : (await TextGroupDao.userHasWritePermission(textUuid, user.uuid)) ||
            (await CollectionGroupDao.userHasWritePermission(
              textUuid,
              user.uuid
            ));
      } else {
        canWrite = false;
      }

      let draft;

      if (user) {
        draft = await TextDraftsDao.getDraft(user?.id, textUuid);
      }

      const response: EpigraphyResponse = {
        textName,
        collection,
        units,
        canWrite,
        cdliNum,
        color,
        colorMeaning,
        markups,
        discourseUnits,
        ...(draft ? { draft } : {}),
      };

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
