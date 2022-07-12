import express from 'express';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import adminRoute from '@/middlewares/adminRoute';
import sl from '@/serviceLocator';
import {
  DenylistAllowlistPayload,
  GetDenylistAllowlistParameters,
  DeleteDenylistAllowlistParameters,
  DenylistAllowlistItem,
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
      const {
        groupId,
        type,
      } = (req.params as unknown) as GetDenylistAllowlistParameters;

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
      } else {
        const results = await Promise.all(
          groupAllowlist.map(uuid =>
            ResourceDao.getAllowListImageWithText(uuid)
          )
        );
        names = results.map(row => (row ? row.name : undefined));
        urls = results.map(row => (row ? row.url : undefined));
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
      const { groupId } = (req.params as unknown) as {
        groupId: number;
      };
      const { uuids, type }: DenylistAllowlistPayload = req.body;

      const GroupAllowlistDao = sl.get('GroupAllowlistDao');
      const OareGroupDao = sl.get('OareGroupDao');
      const TextDao = sl.get('TextDao');
      const CollectionDao = sl.get('CollectionDao');
      const ResourceDao = sl.get('ResourceDao');

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

      // If images, make sure all images UUIDs exist
      if (type === 'img') {
        const images = await Promise.all(
          uuids.map(uuid => ResourceDao.getImageByUuid(uuid))
        );
        if (images.some(image => !image)) {
          next(
            new HttpBadRequest(
              'One or more of given image UUIDs does not exist'
            )
          );
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
      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
