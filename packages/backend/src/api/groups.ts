import express from 'express';
import adminRoute from '../middlewares/adminRoute';
import oareGroupDao from './daos/OareGroupDao';
import HttpException from '../exceptions/HttpException';

const router = express.Router();

router.route('/groups/:id').get(adminRoute, async (req, res, next) => {
  try {
    const groupId = (req.params.id as unknown) as number;

    const existingGroup = await oareGroupDao.getGroupById(groupId);
    if (!existingGroup) {
      next(new HttpException(400, `Cannot retrieve information on non existent group with ID ${groupId}`));
      return;
    }

    res.json(existingGroup);
  } catch (err) {
    next(new HttpException(500, err));
  }
});

router
  .route('/groups')
  .get(adminRoute, async (_req, res, next) => {
    try {
      res.json(await oareGroupDao.getAllGroups());
    } catch (err) {
      next(new HttpException(500, err));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const groupName = req.body.group_name;

      const existingGroup = await oareGroupDao.getGroupByName(groupName);
      if (existingGroup) {
        next(new HttpException(400, 'Group name already exists'));
        return;
      }

      const groupId = await oareGroupDao.createGroup(req.body.group_name);
      res.json({
        id: groupId,
      });
    } catch (err) {
      next(new HttpException(500, err));
    }
  })
  .delete(adminRoute, async (req, res, next) => {
    try {
      // Verify that each group ID exists before deleting
      const groupIds = (req.query.group_ids as unknown) as number[];

      for (let i = 0; i < groupIds.length; i += 1) {
        const existingGroup = await oareGroupDao.getGroupById(groupIds[i]);
        if (!existingGroup) {
          next(new HttpException(400, `Group with ID ${groupIds[i]} does not exist`));
          return;
        }
      }
      await oareGroupDao.deleteGroups(groupIds);
      res.end();
    } catch (err) {
      next(new HttpException(500, err));
    }
  });

export default router;
