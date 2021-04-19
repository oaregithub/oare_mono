import express from 'express';
import {
  DraftPayload,
  TextDraft,
  TextDraftWithUser,
  GetDraftsSortType,
  SortOrder,
  TextDraftsResponse,
  CreateDraftResponse,
} from '@oare/types';
import { createTabletRenderer } from '@oare/oare';
import { HttpBadRequest, HttpInternalError, HttpForbidden } from '@/exceptions';
import authenticatedRoute from '@/middlewares/authenticatedRoute';
import adminRoute from '@/middlewares/adminRoute';
import sl from '@/serviceLocator';
import { parsedQuery, extractPagination } from '@/utils';

const router = express.Router();

router
  .route('/text_drafts/:draftUuid')
  .patch(authenticatedRoute, async (req, res, next) => {
    try {
      const TextDraftsDao = sl.get('TextDraftsDao');
      const CollectionTextUtils = sl.get('CollectionTextUtils');
      const { draftUuid } = req.params;
      const userUuid = req.user!.uuid;

      const { content, notes, textUuid }: DraftPayload = req.body;

      const draftExists = await TextDraftsDao.draftExists(draftUuid);

      if (!draftExists) {
        next(new HttpBadRequest(`There is no draft with UUID ${draftUuid}`));
        return;
      }

      const canEdit = await CollectionTextUtils.canEditText(textUuid, userUuid);
      if (!canEdit) {
        next(
          new HttpBadRequest('You do not have permission to edit this draft')
        );
        return;
      }

      await TextDraftsDao.updateDraft(draftUuid, content, notes);

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

router
  .route('/text_drafts')
  .get(adminRoute, async (req, res, next) => {
    try {
      const UserDao = sl.get('UserDao');
      const TextEpigraphyDao = sl.get('TextEpigraphyDao');
      const TextDraftsDao = sl.get('TextDraftsDao');

      const query = parsedQuery(req.originalUrl);
      const sortBy = (query.get('sortBy') || 'updatedAt') as GetDraftsSortType;
      const sortOrder = (query.get('sortOrder') || 'desc') as SortOrder;
      const textFilter = query.get('textFilter') || '';
      const authorFilter = query.get('authorFilter') || '';
      const { page, limit } = extractPagination(req.query);

      const draftUuids = await TextDraftsDao.getAllDraftUuids({
        sortBy,
        sortOrder,
        page,
        limit,
        textFilter,
        authorFilter,
      });

      const totalDrafts = await TextDraftsDao.totalDrafts({
        authorFilter,
        textFilter,
      });
      const drafts = await Promise.all(
        draftUuids.map(uuid => TextDraftsDao.getDraftByUuid(uuid))
      );
      const users = await Promise.all(
        drafts.map(({ userUuid }) => UserDao.getUserByUuid(userUuid))
      );

      const draftsWithUser: TextDraftWithUser[] = drafts.map(
        (draft, index) => ({
          ...draft,
          user: {
            firstName: users[index].firstName,
            lastName: users[index].lastName,
            uuid: users[index].uuid,
          },
        })
      );

      const response: TextDraftsResponse = {
        drafts: draftsWithUser,
        totalDrafts,
      };
      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .post(authenticatedRoute, async (req, res, next) => {
    const TextDraftsDao = sl.get('TextDraftsDao');
    const CollectionTextUtils = sl.get('CollectionTextUtils');

    try {
      const userUuid = req.user!.uuid;

      const { content, notes, textUuid }: DraftPayload = req.body;

      const canEdit = await CollectionTextUtils.canEditText(textUuid, userUuid);
      if (!canEdit) {
        next(
          new HttpBadRequest('You do not have permission to edit this draft')
        );
        return;
      }

      const draft = await TextDraftsDao.getDraftByTextUuid(userUuid, textUuid);
      if (draft) {
        next(
          new HttpBadRequest(
            `You have already created a draft on the text with UUID ${textUuid}`
          )
        );
        return;
      }

      const draftUuid = await TextDraftsDao.createDraft(
        userUuid,
        textUuid,
        content,
        notes
      );

      const response: CreateDraftResponse = {
        draftUuid,
      };

      res.status(201).json(response);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
