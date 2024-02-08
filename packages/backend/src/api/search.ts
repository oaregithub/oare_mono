import { HttpBadRequest, HttpInternalError } from '@/exceptions';
import express from 'express';
import sl from '@/serviceLocator';
import {
  SearchPotentialPermissionsListsType,
  SearchTransliterationMode,
  SearchTransliterationResponse,
  SearchType,
} from '@oare/types';
import { createTabletRenderer } from '@oare/oare';

// FIXME

const router = express.Router();

router.route('/search/transliteration').get(async (req, res, next) => {
  try {
    const TextDao = sl.get('TextDao');
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const utils = sl.get('utils');

    const pagination = utils.extractPagination(req.query);
    const transliteration = req.query.transliteration as string | undefined;
    const mode =
      (req.query.mode as SearchTransliterationMode) || 'respectAllBoundaries';

    const transliterationUuids = await utils.prepareCharactersForSearch(
      transliteration
    );

    const textUuids = await TextEpigraphyDao.searchTransliteration(
      transliterationUuids,
      pagination,
      req.user ? req.user.uuid : null,
      mode
    );

    const texts = await Promise.all(
      textUuids.map(uuid => TextDao.getTextByUuid(uuid))
    );

    const lines = await Promise.all(
      textUuids.map(textUuid =>
        TextEpigraphyDao.searchTransliterationLines(
          textUuid,
          transliterationUuids,
          mode
        )
      )
    );

    const discourseUuids = await Promise.all(
      textUuids.map(textUuid =>
        TextEpigraphyDao.searchTransliterationDiscourseUuids(
          textUuid,
          transliterationUuids,
          mode
        )
      )
    );

    const lineReadings = await Promise.all(
      textUuids.map(async (uuid, idx) => {
        const epigraphicUnits = await TextEpigraphyDao.getEpigraphicUnits(uuid);

        const renderer = createTabletRenderer(epigraphicUnits, req.locale, {
          textFormat: 'html',
          lineNumbers: true,
          highlightDiscourses: discourseUuids[idx],
        });

        return lines[idx].map(line => renderer.lineReading(line));
      })
    );

    const count = await TextEpigraphyDao.searchTransliterationCount(
      transliterationUuids,
      req.user ? req.user.uuid : null,
      mode
    );

    const response: SearchTransliterationResponse = {
      results: texts.map((text, idx) => ({
        text,
        matches: lineReadings[idx],
        discourseUuids: discourseUuids[idx],
      })),
      count,
    };

    if (response.results.length === 0) {
      const SearchFailureDao = sl.get('SearchFailureDao');

      const type: SearchType = 'transliteration';
      const query = transliteration || '';
      const userUuid = req.user ? req.user.uuid : null;

      await SearchFailureDao.insertSearchFailure(type, query, userUuid);
    }

    res.json(response);
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

router.route('/search/texts').get(async (req, res, next) => {
  try {
    const utils = sl.get('utils');
    const TextDao = sl.get('TextDao');
    const CollectionTextUtils = sl.get('CollectionTextUtils');

    const pagination = utils.extractPagination(req.query);

    const textsToHide = await CollectionTextUtils.textsToHide(
      req.user ? req.user.uuid : null
    );

    const textUuids = await TextDao.searchTexts(pagination, textsToHide);

    const texts = await Promise.all(
      textUuids.map(uuid => TextDao.getTextByUuid(uuid))
    );

    res.json(texts);
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
