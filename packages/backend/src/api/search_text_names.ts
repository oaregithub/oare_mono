import express from 'express';
import { HttpInternalError } from '@/exceptions';
import hierarchyDao from './daos/HierarchyDao';

const router = express.Router();

router.route('/search_text_names').get(async (req, res, next) => {
  try {
    const page = Number(req.query.page as string);
    const rows = Number(req.query.rows as string);
    const search = req.query.search as string;
    const groupId = Number(req.query.groupId as string);

    res.json(await hierarchyDao.getTextsBySearchTerm(page, rows, search, groupId));
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
