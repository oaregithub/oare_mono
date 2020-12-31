import express from 'express';
import { AddTextPayload, UpdateTextPermissionPayload } from '@oare/types';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import adminRoute from '@/middlewares/adminRoute';
import sl from '@/serviceLocator';
import { API_PATH } from '@/setupRoutes';
import textGroupDao from './daos/TextGroupDao';
import oareGroupDao from './daos/OareGroupDao';
import textDao from './daos/TextDao';

function clearCache() {
  const cache = sl.get('cache');
  cache.clear(
    {
      req: {
        originalUrl: `${API_PATH}/collections`,
        method: 'GET',
      },
    },
    { exact: false },
  );
}

const router = express.Router();

router
  .route('/text_groups/:groupId')
  .get(adminRoute, async (req, res, next) => {
    try {
      const HierarchyDao = sl.get('HierarchyDao');
      const { groupId } = (req.params as unknown) as { groupId: number };
      const texts = await textGroupDao.getTexts(groupId);
      const epigraphyStatus = await Promise.all(texts.map((text) => HierarchyDao.hasEpigraphy(text.uuid)));
      const response = texts.map((text, index) => ({
        ...text,
        hasEpigraphy: epigraphyStatus[index],
      }));
      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const { groupId } = (req.params as unknown) as { groupId: number };
      const { texts }: AddTextPayload = req.body;

      // Make sure that group ID exists
      const existingGroup = await oareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpBadRequest(`Group ID does not exist: ${groupId}`));
        return;
      }

      // Make sure that given text UUIDs exist
      for (let i = 0; i < texts.length; i += 1) {
        const text = texts[i];
        const existingText = await textDao.getTextByUuid(text.uuid);
        if (!existingText) {
          next(new HttpBadRequest(`Text UUID is invalid: ${text.uuid}`));
          return;
        }
      }

      // TODO make sure each text is not already associated with group
      const insertRows = texts.map((text) => ({
        text_uuid: text.uuid,
        group_id: groupId,
        can_read: text.canRead,
        can_write: text.canWrite,
      }));

      await textGroupDao.addTexts(insertRows);
      clearCache();
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .patch(adminRoute, async (req, res, next) => {
    try {
      const { groupId } = (req.params as unknown) as { groupId: number };
      const { uuid, canRead, canWrite }: UpdateTextPermissionPayload = req.body;

      // Make sure that group ID exists
      const existingGroup = oareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpBadRequest(`Group ID does not exist: ${groupId}`));
        return;
      }

      // Make sure that each text exists inside the group
      const textExists = await textGroupDao.containsAssociation(groupId, uuid);
      if (!textExists) {
        next(new HttpBadRequest(`Cannot update text not in group: ${uuid}`));
        return;
      }

      await textGroupDao.update(groupId, uuid, canWrite, canRead);
      clearCache();
      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router.route('/text_groups/:groupId/:textUuid').delete(adminRoute, async (req, res, next) => {
  try {
    const TextGroupDao = sl.get('TextGroupDao');
    const OareGroupDao = sl.get('OareGroupDao');
    const { groupId, textUuid } = (req.params as unknown) as { groupId: number; textUuid: string };

    const existingGroup = await OareGroupDao.getGroupById(groupId);
    if (!existingGroup) {
      next(new HttpBadRequest(`Group ID does not exist: ${groupId}`));
      return;
    }

    const textExists = await TextGroupDao.containsAssociation(groupId, textUuid);
    if (!textExists) {
      next(new HttpBadRequest(`Cannot remove text not in group: ${textUuid}`));
      return;
    }

    await TextGroupDao.removeText(groupId, textUuid);
    clearCache();
    res.status(204).end();
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
