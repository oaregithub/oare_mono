import express from 'express';
import HttpException from '../exceptions/HttpException';
import dictionaryFormDao from './daos/DictionaryFormDao';
import dictionaryWordDao from './daos/DictionaryWordDao';

const router = express.Router();

router.route('/dictionary/:uuid').get(async (req, res, next) => {
  try {
    const { uuid } = req.params;

    const grammarInfo = await dictionaryWordDao.getGrammaticalInfo(uuid);
    const forms = await dictionaryFormDao.getFormsWithSpellings(uuid);

    res.json({
      ...grammarInfo,
      forms,
    });
  } catch (err) {
    next(new HttpException(500, err));
  }
});

export default router;
