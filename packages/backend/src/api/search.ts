import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import express from 'express';
import sl from '@/serviceLocator';
import { SearchPotentialPermissionsListsType } from '@oare/types';

// FIXME

const router = express.Router();

router.route('/search/transliteration').get(async (req, res, next) => {
  try {
    // FIXME searches texts by text name and transliteration
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/search/spellings').get(async (req, res, next) => {
  try {
    // FIXME searches dictionary for spelling
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/search/discourse_spellings').get(async (req, res, next) => {
  try {
    // FIXME searches for discourse rows with matching explicit_spelling but spelling_uuid is NULL
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/search/null_discourse_spellings').get(async (req, res, next) => {
  try {
    // FIXME searches for discourse rows with matching transliteration but explicit_spelling and spelling_uuid are NULL
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/search/dictionary').get(async (req, res, next) => {
  try {
    // FIXME searches dictionary
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/search/words_in_text').get(async (req, res, next) => {
  try {
    // FIXME searches words in text - discourse/epigraphy duo
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router
  .route('/search/potential_permissions_lists')
  .get(async (req, res, next) => {
    try {
      const PublicDenylistDao = sl.get('PublicDenylistDao');
      const GroupAllowlistDao = sl.get('GroupAllowlistDao');
      const GroupEditPermissionsDao = sl.get('GroupEditPermissionsDao');
      const utils = sl.get('utils');

      const pagination = utils.extractPagination(req.query);
      const groupId = req.query.groupId ? Number(req.query.groupId) : null;
      const type = req.query.type as SearchPotentialPermissionsListsType;

      if (type === 'text') {
        if (!groupId) {
          const response = await PublicDenylistDao.getPotentialPublicDenylistTexts(
            pagination
          );

          res.json(response);
        } else {
          const response = await GroupAllowlistDao.getPotentialGroupAllowlistTexts(
            pagination,
            groupId
          );

          res.json(response);
        }
      } else if (type === 'img') {
        if (!groupId) {
          const response = await PublicDenylistDao.getPotentialPublicDenylistImages(
            pagination
          );

          res.json(response);
        } else {
          const response = await GroupAllowlistDao.getPotentialGroupAllowlistImages(
            pagination,
            groupId
          );

          res.json(response);
        }
      } else if (type === 'edit') {
        if (!groupId) {
          next(
            new HttpBadRequest(
              'A group ID is required for group edit permissions searches.'
            )
          );
          return;
        }

        const response = await GroupEditPermissionsDao.getPotentialGroupEditPermissionsTexts(
          pagination,
          groupId
        );

        res.json(response);
      } else {
        next(new HttpBadRequest('Invalid text list type provided.'));
        return;
      }
    } catch (err) {
      next(new HttpInternalError(err as string));
    }
  });

export default router;
