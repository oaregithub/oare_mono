import express from 'express';
import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import adminRoute from '@/middlewares/router/adminRoute';
import sl from '@/serviceLocator';
import { AddDenylistAllowlistPayload, DenylistAllowlist } from '@oare/types';

// COMPLETE

const router = express.Router();

router
  .route('/group_allowlist/:groupId')
  .get(adminRoute, async (req, res, next) => {
    try {
      const GroupAllowlistDao = sl.get('GroupAllowlistDao');
      const TextDao = sl.get('TextDao');
      const ResourceDao = sl.get('ResourceDao');
      const OareGroupDao = sl.get('OareGroupDao');

      const groupId = Number(req.params.groupId);

      const groupExists = await OareGroupDao.groupExists(groupId);
      if (!groupExists) {
        next(new HttpBadRequest('Group does not exist'));
        return;
      }

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
        allowlistImages.map(uuid => ResourceDao.getS3ImageByUuid(uuid))
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
      const groupExists = await OareGroupDao.groupExists(groupId);
      if (!groupExists) {
        next(new HttpBadRequest('Group does not exist'));
        return;
      }

      // Make sure all UUIDs exist
      if (type === 'text') {
        const textsExist = await Promise.all(
          uuids.map(uuid => TextDao.textExists(uuid))
        );
        if (textsExist.includes(false)) {
          next(
            new HttpBadRequest('One or more of the provided texts do not exist')
          );
          return;
        }
      } else if (type === 'img') {
        const imagesExist = await Promise.all(
          uuids.map(uuid => ResourceDao.resourceExists(uuid))
        );
        if (imagesExist.includes(false)) {
          next(
            new HttpBadRequest(
              'One or more of the provided images do not exist'
            )
          );
          return;
        }
      } else {
        next(new HttpBadRequest('Invalid type'));
        return;
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

      // Make sure that group ID exists
      const groupExists = await OareGroupDao.groupExists(groupId);
      if (!groupExists) {
        next(new HttpBadRequest('Group does not exist'));
        return;
      }

      // Make sure association exists
      const associationExists = await GroupAllowlistDao.containsAssociation(
        uuid,
        groupId
      );
      if (!associationExists) {
        next(new HttpBadRequest(`Cannot remove item not in group: ${uuid}`));
        return;
      }

      await GroupAllowlistDao.removeItemFromAllowlist(groupId, uuid);

      res.status(204).end();
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
