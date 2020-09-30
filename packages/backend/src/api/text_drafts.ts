import express from 'express';
import HttpException from '../exceptions/HttpException';
import textDraftsDao from './daos/TextDraftsDao';

const router = express.Router();

router
  .route('/text_drafts')
  .get(async (req, res, next) => {
    try {
      const userId = req.user ? req.user.id : null;
      const textUuid = req.query.textUuid ? (req.query.textUuid as string) : null;

      if (!userId) {
        next(new HttpException(401, 'You must be an authenticated user to query drafts'));
        return;
      }

      const drafts = await textDraftsDao.getDrafts(userId, textUuid);

      if (textUuid) {
        if (drafts.length < 1) {
          next(new HttpException(400, 'The draft UUID does not exist.'));
        } else {
          res.json(drafts[0]);
        }
      } else {
        res.json(drafts);
      }
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

      const { textUuid, content, notes } = req.body;
      const draft = await textDraftsDao.getDraft(userId, textUuid);

      if (!draft) {
        // Create new draft
        await textDraftsDao.createDraft(userId, textUuid, content, notes);
      } else {
        // Update existing draft
        await textDraftsDao.updateDraft(draft.uuid, content, notes);
      }
      res.status(201).end();
    } catch (err) {
      next(new HttpException(500, err));
    }
  });

export default router;
