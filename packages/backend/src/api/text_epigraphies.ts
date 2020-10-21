import express from 'express';
import { HttpInternalError, HttpForbidden } from '@/exceptions';
import aliasDao from './daos/AliasDao';
import textEpigraphyDao from './daos/TextEpigraphyDao';
import textGroupDao from './daos/TextGroupDao';
import hierarchyDao from './daos/HierarchyDao';
import TextDao from './daos/TextDao';

const router = express.Router();

router.route('/text_epigraphies/:uuid').get(async (req, res, next) => {
  try {
    const textUuid = String(req.params.uuid);
    const user = req.user || null;

    // Make sure user has access to the text he wishes to access
    if (!user || !user.isAdmin) {
      const blacklist = await textGroupDao.getUserBlacklist(user);
      if (blacklist.includes(textUuid)) {
        next(
          new HttpForbidden(
            'You do not have permission to view this text. If you think this is a mistake, please contact your administrator.',
          ),
        );
        return;
      }
    }

    const textName = await aliasDao.displayAliasNames(textUuid);

    const units = await textEpigraphyDao.getEpigraphicUnits(textUuid);
    const collection = await hierarchyDao.getEpigraphyCollection(textUuid);
    const cdliNum = await TextDao.getCdliNum(textUuid);
    const { color, colorMeaning } = await TextDao.getTranslitStatus(textUuid);

    let canWrite: boolean;
    if (user) {
      canWrite = user.isAdmin ? true : await textGroupDao.userHasWritePermission(textUuid, user.id);
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
    });
  } catch (err) {
    next(new HttpInternalError(err));
  }
});

export default router;
