import sl from '@/serviceLocator';
import CollectionTextUtils from '../CollectionTextUtils';

describe('CollectionTextUtils test', () => {
  describe('canViewText', () => {
    const UserDao = {
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    };

    const PublicDenylistDao = {
      textIsPubliclyViewable: jest.fn().mockResolvedValue(false),
    };

    const collectionUuid = 'coll-uuid';

    const CollectionDao = {
      getCollectionUuidByTextUuid: jest.fn().mockResolvedValue(collectionUuid),
    };

    const GroupAllowlistDao = {
      textIsInAllowlist: jest.fn().mockResolvedValue(false),
    };

    const QuarantineTextDao = {
      textIsQuarantined: jest.fn().mockResolvedValue(false),
    };

    const textUuid = 'text-uuid';

    const canViewText = () =>
      CollectionTextUtils.canViewText(textUuid, 'user-uuid');

    beforeEach(() => {
      sl.set('UserDao', UserDao);
      sl.set('PublicDenylistDao', PublicDenylistDao);
      sl.set('CollectionDao', CollectionDao);
      sl.set('GroupAllowlistDao', GroupAllowlistDao);
      sl.set('QuarantineTextDao', QuarantineTextDao);
    });

    it('returns public status if user is not logged in', async () => {
      sl.set('UserDao', {
        ...UserDao,
        getUserByUuid: jest.fn().mockResolvedValue(null),
      });
      sl.set('PublicDenylistDao', {
        ...PublicDenylistDao,
        textIsPubliclyViewable: jest.fn().mockResolvedValue(true),
      });

      let canView = await canViewText();
      expect(canView).toBe(true);

      sl.set('PublicDenylistDao', {
        ...PublicDenylistDao,
        isTextPubliclyViewable: jest.fn().mockResolvedValue(false),
      });

      canView = await canViewText();
      expect(canView).toBe(false);
    });

    it('returns true if text is publicly viewable', async () => {
      sl.set('PublicDenylistDao', {
        ...PublicDenylistDao,
        textIsPubliclyViewable: jest.fn().mockResolvedValue(true),
      });

      const canView = await canViewText();
      expect(canView).toBe(true);
    });

    it('returns true if user is an admin', async () => {
      sl.set('UserDao', {
        ...UserDao,
        getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
      });
      sl.set('PublicDenylistDao', {
        ...PublicDenylistDao,
        textIsPubliclyViewable: jest.fn().mockResolvedValue(false),
      });

      const canView = await canViewText();
      expect(canView).toBe(true);
    });

    it('returns false if the text is not in allowlist', async () => {
      sl.set('GroupAllowlistDao', {
        ...GroupAllowlistDao,
        getGroupAllowlist: jest.fn().mockResolvedValue(),
      });

      const canView = await canViewText();
      expect(canView).toBe(false);
    });

    it('returns true if text is in allowlist', async () => {
      sl.set('GroupAllowlistDao', {
        ...GroupAllowlistDao,
        textIsInAllowlist: jest.fn().mockResolvedValue(true),
      });

      const canView = await canViewText();
      expect(canView).toBe(true);
    });
  });

  describe('canEditText', () => {
    const UserDao = {
      getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: false }),
    };

    const UserGroupDao = {
      getGroupsOfUser: jest.fn().mockResolvedValue([]),
    };

    const CTUtils = {
      canViewText: jest.fn().mockResolvedValue(true),
    };

    const GroupEditPermissionsDao = {
      getGroupEditPermissions: jest.fn().mockResolvedValue([]),
    };

    const textUuid = 'text-uuid';

    const canEditText = () =>
      CollectionTextUtils.canEditText('text-uuid', 'user-uuid');

    beforeEach(() => {
      sl.set('UserDao', UserDao);
      sl.set('CollectionTextUtils', CTUtils);
      sl.set('UserGroupDao', UserGroupDao);
      sl.set('GroupEditPermissionsDao', GroupEditPermissionsDao);
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
      sl.set('UserGroupDao', {
        getGroupsOfUser: jest.fn().mockResolvedValue([1]),
      });
      sl.set('GroupEditPermissionsDao', {
        ...GroupEditPermissionsDao,
        getGroupEditPermissions: jest.fn().mockResolvedValue([textUuid]),
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
