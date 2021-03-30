import express from 'express';
import {
  AddTextDraftPayload,
  TextDraft,
  TextDraftWithUser,
  GetDraftsSortType,
  SortOrder,
  TextDraftsResponse,
} from '@oare/types';
import { HttpBadRequest, HttpInternalError, HttpForbidden } from '@/exceptions';
import authenticatedRoute from '@/middlewares/authenticatedRoute';
import adminRoute from '@/middlewares/adminRoute';
import sl from '@/serviceLocator';
import utils, { parsedQuery } from '@/utils';

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

      const draftUuids = await TextDraftsDao.getAllDraftUuidsByUser(
        userUuidParam
      );
      const drafts: TextDraft[] = await Promise.all(
        draftUuids.map(uuid => TextDraftsDao.getDraftByUuid(uuid))
      );

      res.json(drafts);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router.route('/text_drafts').get(adminRoute, async (req, res, next) => {
  try {
    const TextDraftsDao = sl.get('TextDraftsDao');
    const UserDao = sl.get('UserDao');

    const query = parsedQuery(req.originalUrl);
    const sortBy = (query.get('sortBy') || 'updatedAt') as GetDraftsSortType;
    const sortOrder = (query.get('sortOrder') || 'desc') as SortOrder;
    const { page, limit } = utils.extractPagination(req.query);

    const draftUuids = await TextDraftsDao.getAllDraftUuids({
      sortBy,
      sortOrder,
      page,
      limit,
    });

    const totalDrafts = await TextDraftsDao.totalDrafts();
    const drafts = await Promise.all(
      draftUuids.map(uuid => TextDraftsDao.getDraftByUuid(uuid))
    );
    const users = await Promise.all(
      drafts.map(({ userUuid }) => UserDao.getUserByUuid(userUuid))
    );

    const draftsWithUser: TextDraftWithUser[] = drafts.map((draft, index) => ({
      ...draft,
      user: {
        firstName: users[index].firstName,
        lastName: users[index].lastName,
        uuid: users[index].uuid,
      },
    }));

    const response: TextDraftsResponse = {
      drafts: draftsWithUser,
      totalDrafts,
    };
    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
