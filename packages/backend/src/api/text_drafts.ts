import express from 'express';
import { AddTextDraftPayload, TextDraft } from '@oare/types';
import { HttpBadRequest, HttpInternalError, HttpForbidden } from '@/exceptions';
import authenticatedRoute from '@/middlewares/authenticatedRoute';
import sl from '@/serviceLocator';

const router = express.Router();

router
  .route('/text_drafts/:textUuid')
  .post(authenticatedRoute, async (req, res, next) => {
    const TextDraftsDao = sl.get('TextDraftsDao');
    const CollectionTextUtils = sl.get('CollectionTextUtils');

    try {
      const { textUuid } = req.params;
      const userUuid = req.user!.uuid;

      const { content, notes }: AddTextDraftPayload = req.body;

      const canEdit = await CollectionTextUtils.canEditText(textUuid, userUuid);
      if (!canEdit) {
        next(
          new HttpBadRequest('You do not have permission to edit this draft')
        );
        return;
      }

      const draft = await TextDraftsDao.getDraft(userUuid, textUuid);

      if (!draft) {
        await TextDraftsDao.createDraft(userUuid, textUuid, content, notes);
      } else {
        await TextDraftsDao.updateDraft(draft.uuid, content, notes);
      }

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/text_drafts/user/:userUuid')
  .get(authenticatedRoute, async (req, res, next) => {
    try {
      const { userUuid: userUuidParam } = req.params;
      const TextDraftsDao = sl.get('TextDraftsDao');
      const userUuid = req.user!.uuid;
      const isAdmin = req.user ? req.user.isAdmin : false;

      if (userUuidParam !== userUuid && !isAdmin) {
        next(
          new HttpForbidden('You do not have permission to access this route')
        );
        return;
      }

      const draftUuids = await TextDraftsDao.getAllDraftUuids(userUuidParam);
      const drafts: TextDraft[] = await Promise.all(
        draftUuids.map(uuid => TextDraftsDao.getDraftByUuid(uuid))
      );

      res.json(drafts);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
