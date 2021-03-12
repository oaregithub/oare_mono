import sl from '@/serviceLocator';

class CollectionTextUtils {
  async canViewText(
    textUuid: string,
    userUuid: string | null
  ): Promise<boolean> {
    const UserDao = sl.get('UserDao');
    const PublicBlacklistDao = sl.get('PublicBlacklistDao');
    const CollectionDao = sl.get('CollectionDao');
    const TextGroupDao = sl.get('TextGroupDao');
    const CollectionGroupDao = sl.get('CollectionGroupDao');

    const user = userUuid ? await UserDao.getUserByUuid(userUuid) : null;
    const publiclyViewable = await PublicBlacklistDao.isTextPubliclyViewable(
      textUuid
    );

    if (!user) {
      return publiclyViewable;
    }

    if (publiclyViewable || user.isAdmin) {
      return true;
    }

    const collectionUuid = await CollectionDao.getTextCollectionUuid(textUuid);

    const {
      blacklist: textBlacklist,
      whitelist: textWhitelist,
    } = await TextGroupDao.getUserBlacklist(userUuid);
    const {
      blacklist: collectionBlacklist,
    } = await CollectionGroupDao.getUserCollectionBlacklist(userUuid);

    if (textWhitelist.includes(textUuid)) {
      return true;
    }

    if (
      textBlacklist.includes(textUuid) ||
      collectionBlacklist.includes(collectionUuid || '')
    ) {
      return false;
    }

    return true;
  }

  async canEditText(
    textUuid: string,
    userUuid: string | null
  ): Promise<boolean> {
    const UserDao = sl.get('UserDao');
    const TextGroupDao = sl.get('TextGroupDao');
    const CollectionGroupDao = sl.get('CollectionGroupDao');
    const CTUtils = sl.get('CollectionTextUtils');

    const canView = await CTUtils.canViewText(textUuid, userUuid);
    const user = userUuid ? await UserDao.getUserByUuid(userUuid) : null;

    if (!canView || !user) {
      return false;
    }

    if (user.isAdmin) {
      return true;
    }

    const textWritePermission = await TextGroupDao.userHasWritePermission(
      textUuid,
      user.uuid
    );
    const collectionWritePermission = await CollectionGroupDao.userHasWritePermission(
      textUuid,
      user.uuid
    );

    return textWritePermission || collectionWritePermission;
  }
}

export default new CollectionTextUtils();
