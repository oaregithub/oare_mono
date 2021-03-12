import sl from '@/serviceLocator';
import CollectionTextUtils from '../CollectionTextUtils';

describe('CollectionTextUtils test', () => {
  describe('canViewText', () => {
    const UserDao = {
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    };

    const PublicBlacklistDao = {
      isTextPubliclyViewable: jest.fn().mockResolvedValue(false),
    };

    const collectionUuid = 'coll-uuid';

    const CollectionDao = {
      getTextCollectionUuid: jest.fn().mockResolvedValue(collectionUuid),
    };

    const TextGroupDao = {
      getUserBlacklist: jest.fn().mockResolvedValue({
        blacklist: [],
        whitelist: [],
      }),
    };

    const CollectionGroupDao = {
      getUserCollectionBlacklist: jest.fn().mockResolvedValue({
        blacklist: [],
      }),
    };

    const textUuid = 'text-uuid';

    const canViewText = () =>
      CollectionTextUtils.canViewText(textUuid, 'user-uuid');

    beforeEach(() => {
      sl.set('UserDao', UserDao);
      sl.set('PublicBlacklistDao', PublicBlacklistDao);
      sl.set('CollectionDao', CollectionDao);
      sl.set('TextGroupDao', TextGroupDao);
      sl.set('CollectionGroupDao', CollectionGroupDao);
    });

    it('returns public status if user is not logged in', async () => {
      sl.set('UserDao', {
        ...UserDao,
        getUserByUuid: jest.fn().mockResolvedValue(null),
      });
      sl.set('PublicBlacklistDao', {
        ...PublicBlacklistDao,
        isTextPubliclyViewable: jest.fn().mockResolvedValue(true),
      });

      let canView = await canViewText();
      expect(canView).toBe(true);

      sl.set('PublicBlacklistDao', {
        ...PublicBlacklistDao,
        isTextPubliclyViewable: jest.fn().mockResolvedValue(false),
      });

      canView = await canViewText();
      expect(canView).toBe(false);
    });

    it('returns true if text is publicly viewable', async () => {
      sl.set('PublicBlacklistDao', {
        ...PublicBlacklistDao,
        isTextPubliclyViewable: jest.fn().mockResolvedValue(true),
      });

      const canView = await canViewText();
      expect(canView).toBe(true);
    });

    it('returns true if user is an admin', async () => {
      sl.set('UserDao', {
        ...UserDao,
        getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
      });
      sl.set('PublicBlacklistDao', {
        ...PublicBlacklistDao,
        isTextPubliclyViewable: jest.fn().mockResolvedValue(false),
      });

      const canView = await canViewText();
      expect(canView).toBe(true);
    });

    it('returns false if the text is blacklisted', async () => {
      sl.set('TextGroupDao', {
        ...TextGroupDao,
        getUserBlacklist: jest.fn().mockResolvedValue({
          blacklist: [textUuid],
          whitelist: [],
        }),
      });

      const canView = await canViewText();
      expect(canView).toBe(false);
    });

    it('returns false if collection blacklist contains text collection', async () => {
      sl.set('CollectionGroupDao', {
        ...CollectionGroupDao,
        getUserCollectionBlacklist: jest.fn().mockResolvedValue({
          blacklist: [collectionUuid],
        }),
      });

      const canView = await canViewText();
      expect(canView).toBe(false);
    });

    it('returns true if text is whitelisted', async () => {
      sl.set('TextGroupDao', {
        ...TextGroupDao,
        getUserBlacklist: jest.fn().mockResolvedValue({
          whitelist: [textUuid],
        }),
      });

      const canView = await canViewText();
      expect(canView).toBe(true);
    });
  });

  describe('canEditText', () => {
    const UserDao = {
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    };

    const TextGroupDao = {
      userHasWritePermission: jest.fn().mockResolvedValue(false),
    };

    const CollectionGroupDao = {
      userHasWritePermission: jest.fn().mockResolvedValue(false),
    };

    const CTUtils = {
      canViewText: jest.fn().mockResolvedValue(true),
    };

    const canEditText = () =>
      CollectionTextUtils.canEditText('text-uuid', 'user-uuid');

    beforeEach(() => {
      sl.set('UserDao', UserDao);
      sl.set('TextGroupDao', TextGroupDao);
      sl.set('CollectionGroupDao', CollectionGroupDao);
      sl.set('CollectionTextUtils', CTUtils);
    });

    it('returns false if cannot view text', async () => {
      sl.set('CollectionTextUtils', {
        ...CTUtils,
        canViewText: jest.fn().mockResolvedValue(false),
      });

      const canEdit = await canEditText();
      expect(canEdit).toBe(false);
    });

    it('returns false if user is not logged in', async () => {
      sl.set('UserDao', {
        ...UserDao,
        getUserByUuid: jest.fn().mockResolvedValue(null),
      });

      const canEdit = await canEditText();
      expect(canEdit).toBe(false);
    });

    it('returns true if user is an admin', async () => {
      sl.set('UserDao', {
        ...UserDao,
        getUserByUuid: jest.fn().mockResolvedValue({
          isAdmin: true,
        }),
      });

      const canEdit = await canEditText();
      expect(canEdit).toBe(true);
    });

    it('returns true if user can edit text', async () => {
      sl.set('TextGroupDao', {
        ...TextGroupDao,
        userHasWritePermission: jest.fn().mockResolvedValue(true),
      });

      const canEdit = await canEditText();
      expect(canEdit).toBe(true);
    });

    it("returns true if user can edit text's collection", async () => {
      sl.set('CollectionGroupDao', {
        ...CollectionGroupDao,
        userHasWritePermission: jest.fn().mockResolvedValue(true),
      });

      const canEdit = await canEditText();
      expect(canEdit).toBe(true);
    });

    it('returns false without write permission', async () => {
      const canEdit = await canEditText();
      expect(canEdit).toBe(false);
    });
  });
});
