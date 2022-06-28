import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import { PermissionsListType, SearchNamesPayload } from '@oare/types';

const router = express.Router();

router.route('/search_names').get(async (req, res, next) => {
  const HierarchyDao = sl.get('HierarchyDao');
  const utils = sl.get('utils');
  try {
    const { page, limit, filter } = utils.extractPagination(req.query);
    const searchParams: SearchNamesPayload = {
      page,
      limit,
      filter,
      groupId: req.query.groupId as string,
      type: req.query.type as PermissionsListType,
      showExcluded: (req.query.showExcluded as string) === 'true',
    };

    if (req.query.type === 'Text' || req.query.type === 'Collection') {
      res.json(await HierarchyDao.getBySearchTerm(searchParams));
    } else {
      if (req.query.fromWhere === 'addAllowlstImages')
        res.json(await HierarchyDao.getImagesForAllowlist(searchParams));
      else res.json(await HierarchyDao.getImagesForDenylist(searchParams));
    }
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
