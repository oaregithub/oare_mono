import express from 'express';
import { HttpInternalError, HttpForbidden } from '@/exceptions';
import sl from '@/serviceLocator';

const router = express.Router();

router.route('/text_epigraphies/:uuid').get(async (req, res, next) => {
  try {
    const textUuid = String(req.params.uuid);
    const user = req.user || null;
    const TextMarkupDao = sl.get('TextMarkupDao');
    const TextDao = sl.get('TextDao');
    const HierarchyDao = sl.get('HierarchyDao');
    const TextGroupDao = sl.get('TextGroupDao');
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const AliasDao = sl.get('AliasDao');
    const TextDiscourseDao = sl.get('TextDiscourseDao');

    // Make sure user has access to the text he wishes to access
    if (!user || !user.isAdmin) {
      const blacklist = await TextGroupDao.getUserBlacklist(user);
      if (blacklist.includes(textUuid)) {
        next(
          new HttpForbidden(
            'You do not have permission to view this text. If you think this is a mistake, please contact your administrator.',
          ),
        );
        return;
      }
    }

    const textName = await AliasDao.textAliasNames(textUuid);
    const units = await TextEpigraphyDao.getEpigraphicUnits(textUuid);
    const collection = await HierarchyDao.getEpigraphyCollection(textUuid);
    const cdliNum = await TextDao.getCdliNum(textUuid);
    const { color, colorMeaning } = await TextDao.getTranslitStatus(textUuid);
    const discourseUnits = await TextDiscourseDao.getTextDiscourseUnits(textUuid);

    let markups = await TextMarkupDao.getMarkups(textUuid);
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

    let canWrite: boolean;
    if (user) {
      canWrite = user.isAdmin ? true : await TextGroupDao.userHasWritePermission(textUuid, user.id);
    } else {
      canWrite = false;
    }

    res.json({
      textName,
      collection,
      units,
      canWrite,
      cdliNum,
      color,
      colorMeaning,
      markups,
      discourseUnits,
    });
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
