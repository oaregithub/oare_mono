import express from 'express';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import adminRoute from '@/middlewares/router/adminRoute';
import sl from '@/serviceLocator';
import { AddDenylistAllowlistPayload, DenylistAllowlist } from '@oare/types';

// MOSTLY COMPLETE

const router = express.Router();

// FIXME migration to remove rows that had a type of collection

router
  .route('/group_allowlist/:groupId')
  .get(adminRoute, async (req, res, next) => {
    try {
      const GroupAllowlistDao = sl.get('GroupAllowlistDao');
      const TextDao = sl.get('TextDao');
      const ResourceDao = sl.get('ResourceDao');

      const groupId = Number(req.params.groupId);

      const allowlistTexts = await GroupAllowlistDao.getGroupAllowlist(
        groupId,
        'text'
      );
      const allowlistImages = await GroupAllowlistDao.getGroupAllowlist(
        groupId,
        'img'
      );

      const texts = await Promise.all(
        allowlistTexts.map(uuid => TextDao.getTextByUuid(uuid))
      );
      const images = await Promise.all(
        allowlistImages.map(uuid => ResourceDao.getAllowListImageWithText(uuid))
      );

      const response: DenylistAllowlist = {
        texts,
        images,
      };

      res.json(response);
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const GroupAllowlistDao = sl.get('GroupAllowlistDao');
      const OareGroupDao = sl.get('OareGroupDao');
      const TextDao = sl.get('TextDao');
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
        // FIXME not ideal setup for checking null status
        try {
          await Promise.all(uuids.map(uuid => TextDao.getTextByUuid(uuid)));
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
