import sl from '@/serviceLocator';
import PublicBlacklistDao from '../PublicBlacklistDao';

describe('PublicBlacklistDao', () => {
  describe('isTextPubliclyViewable', () => {
    const PBDao = {
      getBlacklistedTextUuids: jest.fn().mockResolvedValue([]),
      getBlacklistedCollectionUuids: jest.fn().mockResolvedValue([]),
    };

    const collectionUuid = 'coll-uuid';
    const CollectionDao = {
      getTextCollectionUuid: jest.fn().mockResolvedValue(collectionUuid),
    };

    beforeEach(() => {
      sl.set('PublicBlacklistDao', PBDao);
      sl.set('CollectionDao', CollectionDao);
    });

    const textUuid = 'text-uuid';

    const isViewable = () =>
      PublicBlacklistDao.isTextPubliclyViewable(textUuid);

    it('returns false if the blacklisted text uuid list contains the text', async () => {
      sl.set('PublicBlacklistDao', {
        ...PBDao,
        getBlacklistedTextUuids: jest.fn().mockResolvedValue([textUuid]),
      });

      const canView = await isViewable();
      expect(canView).toBe(false);
    });

    it('returns false if blacklisted collection list contains text collection', async () => {
      sl.set('PublicBlacklistDao', {
        ...PBDao,
        getBlacklistedCollectionUuids: jest
          .fn()
          .mockResolvedValue([collectionUuid]),
      });

      const canView = await isViewable();
      expect(canView).toBe(false);
    });

    it('returns true if text is not blacklisted', async () => {
      const canView = await isViewable();
      expect(canView).toBe(true);
    });
  });
});
