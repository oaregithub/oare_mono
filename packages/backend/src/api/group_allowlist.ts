import express from 'express';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import adminRoute from '@/middlewares/router/adminRoute';
import sl from '@/serviceLocator';
import {
  AddDenylistAllowlistPayload,
  DenylistAllowlistItem,
  DenylistAllowlistType,
} from '@oare/types';

const router = express.Router();

router
  .route('/group_allowlist/:groupId/:type')
  .get(adminRoute, async (req, res, next) => {
    try {
      const TextEpigraphyDao = sl.get('TextEpigraphyDao');
      const GroupAllowlistDao = sl.get('GroupAllowlistDao');
      const TextDao = sl.get('TextDao');
      const CollectionDao = sl.get('CollectionDao');
      const ResourceDao = sl.get('ResourceDao');

      const groupId = Number(req.params.groupId);
      const type = req.params.type as DenylistAllowlistType;

      const groupAllowlist = await GroupAllowlistDao.getGroupAllowlist(
        groupId,
        type
      );

      let names: (string | undefined)[];
      let urls: (string | undefined)[];

      if (type === 'text') {
        const results = await Promise.all(
          groupAllowlist.map(uuid => TextDao.getTextByUuid(uuid))
        );
        names = results.map(row => (row ? row.name : undefined));
      } else if (type === 'collection') {
        const results = await Promise.all(
          groupAllowlist.map(uuid => CollectionDao.getCollectionByUuid(uuid))
        );
        names = results.map(row => (row ? row.name : undefined));
      } else if (type === 'img') {
        const results = await Promise.all(
          groupAllowlist.map(uuid =>
            ResourceDao.getAllowListImageWithText(uuid)
          )
        );
        names = results.map(row => (row ? row.label : undefined));
        urls = results.map(row => (row ? row.link : undefined));
      }

      let response: DenylistAllowlistItem[];
      if (type === 'text' || type === 'collection') {
        const epigraphyStatus = await Promise.all(
          groupAllowlist.map(uuid => TextEpigraphyDao.hasEpigraphy(uuid))
        );
        response = groupAllowlist.map((uuid, index) => ({
          uuid,
          name: names[index],
          hasEpigraphy: epigraphyStatus[index],
        }));
      } else {
        response = groupAllowlist.map((uuid, index) => ({
          uuid,
          name: names[index],
          url: urls[index],
        }));
      }

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/group_allowlist/:groupId')
  .post(adminRoute, async (req, res, next) => {
    try {
      const GroupAllowlistDao = sl.get('GroupAllowlistDao');
      const OareGroupDao = sl.get('OareGroupDao');
      const TextDao = sl.get('TextDao');
      const CollectionDao = sl.get('CollectionDao');
      const ResourceDao = sl.get('ResourceDao');

      const groupId = Number(req.params.groupId);
      const { uuids, type }: AddDenylistAllowlistPayload = req.body;

      // Make sure that group ID exists
      const existingGroup = await OareGroupDao.getGroupById(groupId);
      if (!existingGroup) {
        next(new HttpBadRequest(`Group ID does not exist: ${groupId}`));
        return;
      }

      // If texts, make sure all text UUIDs exist
      if (type === 'text') {
        try {
          await Promise.all(uuids.map(uuid => TextDao.getTextByUuid(uuid)));
        } catch (err) {
          next(new HttpBadRequest(err as string));
          return;
        }
      }

      // If collections, make sure all collection UUIDs exist
      if (type === 'collection') {
        try {
          await Promise.all(
            uuids.map(uuid => CollectionDao.getCollectionByUuid(uuid))
          );
        } catch (err) {
          next(new HttpBadRequest(err as string));
          return;
        }
      }

      // If images, make sure all images UUIDs exist
      if (type === 'img') {
        try {
          await Promise.all(
            uuids.map(uuid => ResourceDao.getImageByUuid(uuid))
          );
        } catch (err) {
          next(new HttpBadRequest(err as string));
          return;
        }
      }

      await GroupAllowlistDao.addItemsToAllowlist(groupId, uuids, type);

      res.status(201).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

router
  .route('/group_allowlist/:groupId/:uuid')
  .delete(adminRoute, async (req, res, next) => {
    try {
      const GroupAllowlistDao = sl.get('GroupAllowlistDao');
      const OareGroupDao = sl.get('OareGroupDao');

      const groupId = Number(req.params.groupId);
      const { uuid } = req.params;

      // Make sure group ID exists
      // FIXME should throw rather than return null. Should fix this all over the place
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

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
