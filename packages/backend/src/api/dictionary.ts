import express from 'express';
import { DictionaryWordResponse, UpdateDictionaryPayload } from '@oare/types';
import adminRoute from '@/middlewares/adminRoute';
import { HttpInternalError, HttpForbidden } from '@/exceptions';
import cache from '@/cache';
import { API_PATH } from '@/setupRoutes';
import dictionaryFormDao from './daos/DictionaryFormDao';
import dictionaryWordDao from './daos/DictionaryWordDao';

const router = express.Router();

router
  .route('/dictionary/:uuid')
  .get(async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const grammarInfo = await dictionaryWordDao.getGrammaticalInfo(uuid);
      const forms = await dictionaryFormDao.getFormsWithSpellings(uuid);

      const result: DictionaryWordResponse = {
        ...grammarInfo,
        forms,
      };
      res.json(result);
    } catch (err) {
      next(new HttpInternalError(err));
    }
  })
  .post(adminRoute, async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const { word, translations }: UpdateDictionaryPayload = req.body;
      if (req.user) {
        await dictionaryWordDao.updateWordSpelling(req.user.uuid, uuid, word);
        const updatedTranslations = await dictionaryWordDao.updateTranslations(req.user.uuid, uuid, translations);
        // Updating a word's spelling, so the words endpoint cache must be cleared
        cache.clear({
          req: {
            originalUrl: `${API_PATH}/words`,
            method: 'GET',
          },
        });
        res.json({
          translations: updatedTranslations,
        });
      } else {
        next(new HttpForbidden('You are not authorized to access this route'));
      }
    } catch (err) {
      next(new HttpInternalError(err));
    }
  });

export default router;
