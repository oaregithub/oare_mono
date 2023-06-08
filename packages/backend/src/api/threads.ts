import express from 'express';
import sl from '@/serviceLocator';
import { HttpInternalError } from '@/exceptions';
import {
  CreateThreadPayload,
  Thread,
  ThreadStatus,
  ThreadsSortType,
  UpdateThreadNamePayload,
  UpdateThreadStatusPayload,
} from '@oare/types';
import permissionsRoute from '@/middlewares/router/permissionsRoute';
import adminRoute from '@/middlewares/router/adminRoute';

// MOSTLY COMPLETE

// FIXME - write migration to replace `route` column with `table_reference` column

const router = express.Router();

router
  .route('/threads/:referenceUuid')
  .get(permissionsRoute('ADD_COMMENTS'), async (req, res, next) => {
    try {
      const ThreadsDao = sl.get('ThreadsDao');

      const { referenceUuid } = req.params;

      const threads: Thread[] = await ThreadsDao.getThreadsByReferenceUuid(
        referenceUuid
      );

      res.json(threads);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/threads/status/:uuid')
  .patch(adminRoute, async (req, res, next) => {
    try {
      const ThreadsDao = sl.get('ThreadsDao');
      const CommentsDao = sl.get('CommentsDao');
      const utils = sl.get('utils');

      const { uuid } = req.params;
      const userUuid = req.user!.uuid;

      const { status }: UpdateThreadStatusPayload = req.body;

      const originalThread = await ThreadsDao.getThreadByUuid(uuid);

      await utils.createTransaction(async trx => {
        await ThreadsDao.updateThreadStatus(uuid, status, trx);

        await CommentsDao.createComment(
          uuid,
          userUuid,
          `The status was changed from ${originalThread.status} to ${status}`,
          trx
        );
      });

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/threads/name/:uuid')
  .patch(permissionsRoute('ADD_COMMENTS'), async (req, res, next) => {
    try {
      const ThreadsDao = sl.get('ThreadsDao');

      const { uuid } = req.params;

      const { name }: UpdateThreadNamePayload = req.body;

      await ThreadsDao.updateThreadName(uuid, name);

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/threads')
  .get(permissionsRoute('ADD_COMMENTS'), async (req, res, next) => {
    try {
      const ThreadsDao = sl.get('ThreadsDao');
      const utils = sl.get('utils');

      const status: ThreadStatus | '' = (req.query.status as string) as
        | ThreadStatus
        | '';
      const name: string = req.query.name as string;
      const sort = (req.query.sort as string) as ThreadsSortType;
      const desc: boolean = (req.query.desc as string) === 'true';
      const { page, limit } = utils.extractPagination(req.query);

      const threadUuids = await ThreadsDao.getAllThreadUuids(
        status,
        name,
        sort,
        desc,
        page,
        limit
      );

      const threads = await Promise.all(
        threadUuids.map(uuid => ThreadsDao.getThreadByUuid(uuid))
      );

      res.json(threads);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .post(permissionsRoute('ADD_COMMENTS'), async (req, res, next) => {
    try {
      const ThreadsDao = sl.get('ThreadsDao');

      const {
        referenceUuid,
        name,
        tableReference,
      }: CreateThreadPayload = req.body;

      await ThreadsDao.createThread(referenceUuid, name, tableReference);

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

// FIXME should probably use web sockets instead of polling
router.route('/new_threads/').get(adminRoute, async (_req, res, next) => {
  try {
    const ThreadsDao = sl.get('ThreadsDao');

    const response = await ThreadsDao.newThreadsExist();

    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
