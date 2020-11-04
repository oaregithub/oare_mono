import express from 'express';
import { AddTextDraftPayload } from '@oare/types';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import authenticatedRoute from '@/middlewares/authenticatedRoute';
import sl from '@/serviceLocator';

const router = express.Router();

router
  .route('/text_drafts/:textUuid')
  .get(authenticatedRoute, async (req, res, next) => {
    const TextDraftsDao = sl.get('TextDraftsDao');

    try {
      const userId = req!.user!.id;
      const { textUuid } = req.params;
      const draftExists = await TextDraftsDao.draftExists(userId, textUuid);

      if (!draftExists) {
        next(new HttpBadRequest(`No drafts for text with UUID ${textUuid}`));
        return;
      }
      const draft = await TextDraftsDao.getDraft(userId, textUuid);
      res.json(draft);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .post(authenticatedRoute, async (req, res, next) => {
    const TextDraftsDao = sl.get('TextDraftsDao');

    try {
      const { textUuid } = req.params;
      const userId = req.user!.id;

      const { content, notes }: AddTextDraftPayload = req.body;
      const draftExists = await TextDraftsDao.draftExists(userId, textUuid);

      if (!draftExists) {
        // Create new draft
        await TextDraftsDao.createDraft(userId, textUuid, content, notes);
      } else {
        // Update existing draft
        const draft = await TextDraftsDao.getDraft(userId, textUuid);
        await TextDraftsDao.updateDraft(draft.uuid, content, notes);
      }
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router.route('/text_drafts').get(authenticatedRoute, async (req, res, next) => {
  const TextDraftsDao = sl.get('TextDraftsDao');

  try {
    const userId = req!.user!.id;

    const drafts = await TextDraftsDao.getAllDrafts(userId);
    res.json(drafts);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
