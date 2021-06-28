import express from 'express';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import adminRoute from '@/middlewares/adminRoute';
import sl from '@/serviceLocator';
import { API_PATH } from '@/setupRoutes';
import {
  DenylistAllowlistPayload,
  GetDenylistAllowlistParameters,
  DeleteDenylistAllowlistParameters,
} from '@oare/types';

function clearCache() {
  const cache = sl.get('cache');
  cache.clear(
    {
      req: {
        originalUrl: `${API_PATH}/collections`,
        method: 'GET',
      },
    },
    { exact: false }
  );
}

const router = express.Router();

router
  .route('/group_allowlist/:groupId/:type')
  .get(adminRoute, async (req, res, next) => {
    try {
      const TextEpigraphyDao = sl.get('TextEpigraphyDao');
      const GroupAllowlistDao = sl.get('GroupAllowlistDao');
      const TextDao = sl.get('TextDao');
      const CollectionDao = sl.get('CollectionDao');

      const {
        groupId,
        type,
      } = (req.params as unknown) as GetDenylistAllowlistParameters;

      const groupAllowlist = await GroupAllowlistDao.getGroupAllowlist(
        groupId,
        type
      );
      const names = await Promise.all(
        groupAllowlist.map(uuid =>
          type === 'text'
            ? TextDao.getTextByUuid(uuid)
            : CollectionDao.getCollectionByUuid(uuid)
        )
      );
      const epigraphyStatus = await Promise.all(
        groupAllowlist.map(uuid => TextEpigraphyDao.hasEpigraphy(uuid))
      );
      const response = groupAllowlist.map((uuid, index) => ({
        uuid,
        name: names[index]?.name,
        hasEpigraphy: epigraphyStatus[index],
      }));
      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/group_allowlist/:groupId')
  .post(adminRoute, async (req, res, next) => {
    try {
      const { groupId } = (req.params as unknown) as {
        groupId: number;
      };
      const { uuids, type }: DenylistAllowlistPayload = req.body;

      const GroupAllowlistDao = sl.get('GroupAllowlistDao');
      const OareGroupDao = sl.get('OareGroupDao');
      const TextDao = sl.get('TextDao');
      const CollectionDao = sl.get('CollectionDao');

      // Make sure that group ID exists
      const existingGroup = await OareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpBadRequest(`Group ID does not exist: ${groupId}`));
        return;
      }

      // If texts, make sure all text UUIDs exist
      if (type === 'text') {
        const texts = await Promise.all(
          uuids.map(uuid => TextDao.getTextByUuid(uuid))
        );
        if (texts.some(text => !text)) {
          next(
            new HttpBadRequest('One or more of given text UUIDs does not exist')
          );
          return;
        }
      }

      // If collections, make sure all collection UUIDs exist
      if (type === 'collection') {
        const collections = await Promise.all(
          uuids.map(uuid => CollectionDao.getCollectionByUuid(uuid))
        );
        if (collections.some(collection => !collection)) {
          next(
            new HttpBadRequest(
              'One or more of given collection UUIDs does not exist'
            )
          );
          return;
        }
      }

      await GroupAllowlistDao.addItemsToAllowlist(groupId, uuids, type);
      clearCache();
      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/group_allowlist/:groupId/:uuid')
  .delete(adminRoute, async (req, res, next) => {
    try {
      const GroupAllowlistDao = sl.get('GroupAllowlistDao');
      const OareGroupDao = sl.get('OareGroupDao');
      const {
        groupId,
        uuid,
      } = (req.params as unknown) as DeleteDenylistAllowlistParameters;

      // Make sure group ID exists
      const existingGroup = await OareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpBadRequest(`Group ID does not exist: ${groupId}`));
        return;
      }

      // Make sure association exists
      const associationExists = await GroupAllowlistDao.containsAssociation(
        uuid,
        groupId
      );
      if (!associationExists) {
        next(new HttpBadRequest(`Cannot remove item not in group ${uuid}`));
        return;
      }

      await GroupAllowlistDao.removeItemFromAllowlist(groupId, uuid);
      clearCache();
      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
