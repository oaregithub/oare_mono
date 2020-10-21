import express from 'express';
import HttpException from '@/exceptions/HttpException';
import hierarchyDao from './daos/HierarchyDao';

const router = express.Router();

router.route('/search_text_names').get(async (req, res, next) => {
  try {
    const search = req.query.search as string;

    res.json(await hierarchyDao.getTextsBySearchTerm(search));
  } catch (err) {
    next(new HttpException(500, err));
  }
});

export default router;
