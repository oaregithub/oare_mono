import express from 'express';
import { HttpInternalError } from '@/exceptions';
import sl from '@/serviceLocator';
import { SealNameUuid, SealInfo, Seal, Text } from '@oare/types';
import { noFilter } from '@/cache/filters';

const router = express.Router();

router.route('/seals').get(async (req, res, next) => {
  try {
    const SealDao = sl.get('SealDao');
    const cache = sl.get('cache');

    const sealsNoImages: SealNameUuid[] = await SealDao.getSeals();
    const seals: SealInfo[] = await Promise.all(
      sealsNoImages.map(async s => ({
        ...s,
        imageLinks: await SealDao.getImageBySealUuid(s.uuid),
        count: await SealDao.getSealImpressionCountBySealUuid(s.uuid),
      }))
    );

    const response = await cache.insert<SealInfo[]>({ req }, seals, noFilter);

    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

router.route('/seals/:uuid').get(async (req, res, next) => {
  try {
    const uuid = req.params.uuid as string;
    const SealDao = sl.get('SealDao');
    const TextDao = sl.get('TextDao');
    const cache = sl.get('cache');

    const nameAndUuid: SealNameUuid = await SealDao.getSealByUuid(uuid);
    const textUuids: string[] = await SealDao.getSealImpressionsBySealUuid(
      uuid
    );
    const sealImpressionTexts: Text[] = [];
    (
      await Promise.all(
        textUuids.map(async textUuid => TextDao.getTextByUuid(textUuid))
      )
    ).forEach(sealImpressionText =>
      sealImpressionTexts.push(sealImpressionText!)
    );

    const seal: Seal = {
      ...nameAndUuid,
      imageLinks: await SealDao.getImageBySealUuid(uuid),
      count: await SealDao.getSealImpressionCountBySealUuid(uuid),
      sealProperties: await SealDao.getSealProperties(uuid),
      sealImpressions: sealImpressionTexts,
    };

    const response = await cache.insert<Seal>({ req }, seal, noFilter);

    res.json(response);
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
});

export default router;
