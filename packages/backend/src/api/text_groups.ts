import express from 'express';
import {
  AddTextCollectionPayload,
  UpdateTextCollectionListPayload,
} from '@oare/types';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import adminRoute from '@/middlewares/adminRoute';
import sl from '@/serviceLocator';
import { API_PATH } from '@/setupRoutes';

function clearCache() {
  const cache = sl.get('cache');
  cache.clear(
    {
      req: {
        originalUrl: `${API_PATH}/collections`,
        method: 'GET',
      },
    },
    { exact: false }
  );
}

const router = express.Router();

router
  .route('/text_groups/:groupId')
  .get(adminRoute, async (req, res, next) => {
    try {
      const TextEpigraphyDao = sl.get('TextEpigraphyDao');
      const TextGroupDao = sl.get('TextGroupDao');
      const { groupId } = (req.params as unknown) as { groupId: number };
      const texts = await TextGroupDao.getTexts(groupId);
      const epigraphyStatus = await Promise.all(
        texts.map(text => TextEpigraphyDao.hasEpigraphy(text.uuid))
      );
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
      const { items }: AddTextCollectionPayload = req.body;

      const TextGroupDao = sl.get('TextGroupDao');
      const OareGroupDao = sl.get('OareGroupDao');
      const TextDao = sl.get('TextDao');

      // Make sure that group ID exists
      const existingGroup = await OareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpBadRequest(`Group ID does not exist: ${groupId}`));
        return;
      }

      // Make sure all text UUIDs exist
      const texts = await Promise.all(
        items.map(({ uuid }) => TextDao.getTextByUuid(uuid))
      );
      if (texts.some(text => !text)) {
        next(
          new HttpBadRequest('One or more of given text UUIDs does not exist')
        );
        return;
      }

      // TODO make sure each text is not already associated with group
      const insertRows = items.map(text => ({
        text_uuid: text.uuid,
        group_id: groupId,
        can_read: text.canRead,
        can_write: text.canWrite,
      }));

      await TextGroupDao.addTexts(insertRows);
      clearCache();
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .patch(adminRoute, async (req, res, next) => {
    try {
      const { groupId } = (req.params as unknown) as { groupId: number };
      const {
        uuid,
        canRead,
        canWrite,
      }: UpdateTextCollectionListPayload = req.body;

      const TextGroupDao = sl.get('TextGroupDao');
      const OareGroupDao = sl.get('OareGroupDao');

      // Make sure that group ID exists
      const existingGroup = OareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpBadRequest(`Group ID does not exist: ${groupId}`));
        return;
      }

      // Make sure that each text exists inside the group
      const textExists = await TextGroupDao.containsAssociation(groupId, uuid);
      if (!textExists) {
        next(new HttpBadRequest(`Cannot update text not in group: ${uuid}`));
        return;
      }

      await TextGroupDao.update(groupId, uuid, canWrite, canRead);
      clearCache();
      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/text_groups/:groupId/:textUuid')
  .delete(adminRoute, async (req, res, next) => {
    try {
      const TextGroupDao = sl.get('TextGroupDao');
      const OareGroupDao = sl.get('OareGroupDao');
      const { groupId, textUuid } = (req.params as unknown) as {
        groupId: number;
        textUuid: string;
      };

      const existingGroup = await OareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpBadRequest(`Group ID does not exist: ${groupId}`));
        return;
      }

      const textExists = await TextGroupDao.containsAssociation(
        groupId,
        textUuid
      );
      if (!textExists) {
        next(
          new HttpBadRequest(`Cannot remove text not in group: ${textUuid}`)
        );
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
