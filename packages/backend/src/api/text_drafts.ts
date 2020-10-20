import express from 'express';
import { AddTextDraftPayload } from '@oare/types';
import HttpException from '../exceptions/HttpException';
import textDraftsDao from './daos/TextDraftsDao';
import authenticatedRoute from '../middlewares/authenticatedRoute';

const router = express.Router();

router
  .route('/text_drafts/:textUuid')
  .get(authenticatedRoute, async (req, res, next) => {
    try {
      const userId = req!.user!.id;
      const { textUuid } = req.params;
      const draftExists = await textDraftsDao.draftExists(userId, textUuid);

      if (!draftExists) {
        next(new HttpException(400, `No drafts for text with UUID ${textUuid}`));
        return;
      }
      const draft = await textDraftsDao.getDraft(userId, textUuid);
      res.json(draft);
    } catch (err) {
      next(new HttpException(500, err));
    }
  })
  .post(async (req, res, next) => {
    try {
      const { textUuid } = req.params;
      const userId = req.user ? req.user.id : null;

      if (!userId) {
        next(new HttpException(400, 'You must be an authenticated user to edit texts'));
        return;
      }

      const { content, notes }: AddTextDraftPayload = req.body;
      const draftExists = await textDraftsDao.draftExists(userId, textUuid);

      if (!draftExists) {
        // Create new draft
        await textDraftsDao.createDraft(userId, textUuid, content, notes);
      } else {
        // Update existing draft
        const draft = await textDraftsDao.getDraft(userId, textUuid);
        await textDraftsDao.updateDraft(draft.uuid, content, notes);
      }
      res.status(201).end();
    } catch (err) {
      next(new HttpException(500, err));
    }
  });

router.route('/text_drafts').get(authenticatedRoute, async (req, res, next) => {
  try {
    const userId = req!.user!.id;

    const drafts = await textDraftsDao.getAllDrafts(userId);
    res.json(drafts);
  } catch (err) {
    next(new HttpException(500, err));
  }
});

export default router;
