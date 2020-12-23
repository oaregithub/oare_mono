import express from 'express';
import { AddCollectionsPayload, UpdateCollectionPermissionPayload, CollectionGroup } from '@oare/types';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import adminRoute from '@/middlewares/adminRoute';
import { API_PATH } from '@/setupRoutes';
import sl from '@/serviceLocator';

async function canInsert(groupId: number, collections: CollectionGroup[]) {
  const CollectionGroupDao = sl.get('CollectionGroupDao');
  const groupCollections = (await CollectionGroupDao.getCollections(groupId)).map((collection) => collection.uuid);
  for (let i = 0; i < collections.length; i += 1) {
    if (groupCollections.includes(collections[i].uuid)) {
      return false;
    }
  }
  return true;
}

async function canRemove(groupId: number, uuid: string) {
  const CollectionGroupDao = sl.get('CollectionGroupDao');
  const groupCollections = (await CollectionGroupDao.getCollections(groupId)).map((collection) => collection.uuid);
  if (!groupCollections.includes(uuid)) {
    return false;
  }
  return true;
}

function clearCache() {
  const cache = sl.get('cache');
  cache.clear(
    {
      req: {
        originalUrl: `${API_PATH}/collections`,
        method: 'GET',
      },
    },
    { exact: false },
  );
}

const router = express.Router();

router
  .route('/collection_groups/:groupId')
  .get(adminRoute, async (req, res, next) => {
    const CollectionGroupDao = sl.get('CollectionGroupDao');
    try {
      const { groupId } = (req.params as unknown) as { groupId: number };
      const collections = await CollectionGroupDao.getCollections(groupId);
      res.json(collections);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const CollectionGroupDao = sl.get('CollectionGroupDao');
      const OareGroupDao = sl.get('OareGroupDao');
      const { groupId } = (req.params as unknown) as { groupId: number };
      const { collections }: AddCollectionsPayload = req.body;

      const existingGroup = await OareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpBadRequest(`Group ID does not exist: ${groupId}`));
        return;
      }

      if (!(await canInsert(groupId, collections))) {
        next(new HttpBadRequest('One or more of the selected collections is already blacklisted'));
        return;
      }

      const insertRows = collections.map(({ uuid, canRead, canWrite }) => ({
        collection_uuid: uuid,
        group_id: groupId,
        can_read: canRead,
        can_write: canWrite,
      }));

      await CollectionGroupDao.addCollections(insertRows);
      clearCache();
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .patch(adminRoute, async (req, res, next) => {
    try {
      const OareGroupDao = sl.get('OareGroupDao');
      const CollectionGroupDao = sl.get('CollectionGroupDao');
      const { groupId } = (req.params as unknown) as { groupId: number };
      const { uuid, canRead, canWrite }: UpdateCollectionPermissionPayload = req.body;

      const existingGroup = await OareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpBadRequest(`Group ID does not exist: ${groupId}`));
        return;
      }

      const collectionExists = await CollectionGroupDao.containsAssociation(groupId, uuid);
      if (!collectionExists) {
        next(new HttpBadRequest(`Cannot update collection not in group: ${uuid}`));
        return;
      }

      await CollectionGroupDao.update(groupId, uuid, canWrite, canRead);
      clearCache();
      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router.route('/collection_groups/:groupId/:uuid').delete(adminRoute, async (req, res, next) => {
  try {
    const CollectionGroupDao = sl.get('CollectionGroupDao');
    const OareGroupDao = sl.get('OareGroupDao');
    const { groupId, uuid } = (req.params as unknown) as { groupId: number; uuid: string };

    const existingGroup = await OareGroupDao.getGroupById(groupId);
    if (!existingGroup) {
      next(new HttpBadRequest(`Group ID does not exist: ${groupId}`));
      return;
    }

    if (!(await canRemove(groupId, uuid))) {
      next(new HttpBadRequest('One or more of the selected collections does not exist in the blacklist'));
      return;
    }

    await CollectionGroupDao.removeCollection(groupId, uuid);
    clearCache();
    res.status(204).end();
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
