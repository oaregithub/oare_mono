import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import permissionsRoute from '@/middlewares/permissionsRoute';
import { Pagination } from '@oare/types';
import { extractPagination } from '@/utils';

const router = express.Router();

router
  .route('/people/:letter')
  .get(permissionsRoute('PEOPLE'), async (req, res, next) => {
    try {
      const pagination: Pagination = extractPagination(req.query);
      const { letter } = req.params;
      const cache = sl.get('cache');
      const PersonDao = sl.get('PersonDao');
      const ItemPropertiesDao = sl.get('ItemPropertiesDao');

      const people = await PersonDao.getAllPeople(letter, {
        limit: Number(pagination.limit),
        page: Number(pagination.page),
      });

      const resultPeople = await Promise.all(
        people.map(async person => {
          const count = await ItemPropertiesDao.getTextsOfPersonCount(
            person.uuid
          );
          return {
            ...person,
            totalReferenceCount: count,
          };
        })
      );

      cache.insert({ req }, resultPeople);
      res.json(resultPeople);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

router
  .route('/people/:letter/count')
  .get(permissionsRoute('PEOPLE'), async (req, res, next) => {
    try {
      const { letter } = req.params;
      const PersonDao = sl.get('PersonDao');

      const count = await PersonDao.getAllPeopleCount(letter);

      res.json(count);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
