import express from 'express';
import HttpException from '../exceptions/HttpException';
import textMarkupDao from './daos/TextMarkupDao';

const router = express.Router();

router.route('/markups/:textUuid').get(async (req, res, next) => {
  try {
    let markups = await textMarkupDao.getMarkups(req.params.textUuid);

    // TODO get rid of duplicates from database
    // Filter out the duplicates
    const refTypes: { [key: string]: Set<string> } = {};
    markups = markups.filter((markup) => {
      if (refTypes[markup.referenceUuid]) {
        if (refTypes[markup.referenceUuid].has(markup.type)) {
          return false;
        }
      } else {
        refTypes[markup.referenceUuid] = new Set();
      }

      refTypes[markup.referenceUuid].add(markup.type);
      return true;
    });

    markups.sort((a) => {
      if (a.type === 'damage' || a.type === 'partialDamage') {
        return -1;
      }
      return 0;
    });

    res.json(markups);
  } catch (err) {
    next(new HttpException(500, err));
  }
});

export default router;
