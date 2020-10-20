import express from 'express';
import { AddTextPayload, RemoveTextsPayload, UpdateTextPermissionPayload } from '@oare/types';
import HttpException from '../exceptions/HttpException';
import adminRoute from '../middlewares/adminRoute';
import textGroupDao from './daos/TextGroupDao';
import oareGroupDao from './daos/OareGroupDao';
import textDao from './daos/TextDao';

const router = express.Router();

router
  .route('/text_groups/:groupId')
  .get(adminRoute, async (req, res, next) => {
    try {
      const { groupId } = (req.params as unknown) as { groupId: number };
      const texts = await textGroupDao.getTexts(groupId);
      res.json(texts);
    } catch (err) {
      next(new HttpException(500, err));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const { groupId } = (req.params as unknown) as { groupId: number };
      const { texts }: AddTextPayload = req.body;

      // Make sure that group ID exists
      const existingGroup = await oareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpException(400, `Group ID does not exist: ${groupId}`));
        return;
      }

      // Make sure that given text UUIDs exist
      for (let i = 0; i < texts.length; i += 1) {
        const text = texts[i];
        const existingText = await textDao.getTextByUuid(text.uuid);
        if (!existingText) {
          next(new HttpException(400, `Text UUID is invalid: ${text.uuid}`));
          return;
        }
      }

      // TODO make sure each text is not already associated with group
      const insertRows = texts.map((text) => ({
        text_uuid: text.uuid,
        group_id: groupId,
        can_read: text.can_read,
        can_write: text.can_write,
      }));

      await textGroupDao.addTexts(insertRows);
      res.status(201).end();
    } catch (err) {
      next(new HttpException(500, err));
    }
  })
  .delete(adminRoute, async (req, res, next) => {
    try {
      const { groupId } = (req.params as unknown) as { groupId: number };
      const { textUuids } = (req.query as unknown) as RemoveTextsPayload;

      // Make sure that group ID exists
      const existingGroup = await oareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpException(400, `Group ID does not exist: ${groupId}`));
        return;
      }

      // Make sure that each text exists inside the group
      for (let i = 0; i < textUuids.length; i += 1) {
        const textExists = await textGroupDao.containsAssociation(groupId, textUuids[i]);
        if (!textExists) {
          next(new HttpException(400, `Cannot remove text not in group: ${textUuids[i]}`));
          return;
        }
      }

      await textGroupDao.removeTexts(groupId, textUuids);
      res.status(204).end();
    } catch (err) {
      next(new HttpException(500, err));
    }
  })
  .patch(adminRoute, async (req, res, next) => {
    try {
      const { groupId } = (req.params as unknown) as { groupId: number };
      const { textUuid, canRead, canWrite }: UpdateTextPermissionPayload = req.body;

      // Make sure that group ID exists
      const existingGroup = oareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpException(400, `Group ID does not exist: ${groupId}`));
        return;
      }

      // Make sure that each text exists inside the group
      const textExists = await textGroupDao.containsAssociation(groupId, textUuid);
      if (!textExists) {
        next(new HttpException(400, `Cannot update text not in group: ${textUuid}`));
        return;
      }

      await textGroupDao.update(groupId, textUuid, canWrite, canRead);
      res.status(204).end();
    } catch (err) {
      next(new HttpException(500, err));
    }
  });

export default router;
