import sl from '@/serviceLocator';
import PDDao from '../PublicDenylistDao';

describe('PublicDenylistDao', () => {
  describe('textIsPubliclyViewable', () => {
    const PublicDenylistDao = {
      getDenylistTextUuids: jest.fn().mockResolvedValue([]),
      getDenylistCollectionUuids: jest.fn().mockResolvedValue([]),
    };

    const collectionUuid = 'coll-uuid';
    const CollectionDao = {
      getTextCollectionUuid: jest.fn().mockResolvedValue(collectionUuid),
    };

    beforeEach(() => {
      sl.set('PublicDenylistDao', PublicDenylistDao);
      sl.set('CollectionDao', CollectionDao);
    });

    const textUuid = 'text-uuid';

    const isViewable = () => PDDao.textIsPubliclyViewable(textUuid);

    it('returns false if the denylisted text uuid list contains the text', async () => {
      sl.set('PublicDenylistDao', {
        ...PublicDenylistDao,
        getDenylistTextUuids: jest.fn().mockResolvedValue([textUuid]),
      });

      const canView = await isViewable();
      expect(canView).toBe(false);
    });

    it('returns false if denylisted collection list contains text collection', async () => {
      sl.set('PublicDenylistDao', {
        ...PublicDenylistDao,
        getDenylistCollectionUuids: jest
          .fn()
          .mockResolvedValue([collectionUuid]),
      });

      const canView = await isViewable();
      expect(canView).toBe(false);
    });

    it('returns true if text is not denylisted', async () => {
      const canView = await isViewable();
      expect(canView).toBe(true);
    });
  });
});
