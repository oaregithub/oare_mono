import express from 'express';
import HttpException from '../exceptions/HttpException';
import aliasDao from './daos/AliasDao';
import textEpigraphyDao from './daos/TextEpigraphyDao';
import textGroupDao from './daos/TextGroupDao';
import hierarchyDao from './daos/HierarchyDao';

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
          new HttpException(
            403,
            'You do not have permission to view this text. If you think this is a mistake, please contact your administrator.',
          ),
        );
        return;
      }
    }

    const textName = await aliasDao.displayAliasNames(textUuid);

    const units = await textEpigraphyDao.getEpigraphicUnits(textUuid);
    const collection = await hierarchyDao.getEpigraphyCollection(textUuid);

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
    });
  } catch (err) {
    next(new HttpException(500, err));
  }
});

export default router;
