import express from 'express';
import HttpException from '../exceptions/HttpException';
import textDraftsDao from './daos/TextDraftsDao';

const router = express.Router();

router
  .route('/text_drafts')
  .get(async (req, res, next) => {
    try {
      const userId = req.user ? req.user.id : null;
      const textUuid = req.query.text_uuid ? (req.query.text_uuid as string) : null;

      if (!userId) {
        next(new HttpException(400, 'You must be an authenticated user to query drafts'));
        return;
      }

      const drafts = await textDraftsDao.getDrafts(userId, textUuid);
      res.json(drafts);
    } catch (err) {
      next(new HttpException(500, err));
    }
  })
  .post(async (req, res, next) => {
    try {
      const userId = req.user ? req.user.id : null;

      if (!userId) {
        next(new HttpException(400, 'You must be an authenticated user to edit texts'));
        return;
      }

      const { text_uuid: textUuid, content } = req.body;
      const draft = await textDraftsDao.getDraft(userId, textUuid);

      if (!draft) {
        // Create new draft
        await textDraftsDao.createDraft(userId, textUuid, content);
      } else {
        // Update existing draft
        await textDraftsDao.updateDraft(draft.uuid, content);
      }
      res.status(201).end();
    } catch (err) {
      next(new HttpException(500, err));
    }
  });

export default router;
