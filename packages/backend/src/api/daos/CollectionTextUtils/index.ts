import UserDao from '../UserDao';
import TextGroupDao from '../TextGroupDao';
import CollectionGroupDao from '../CollectionGroupDao';
import PublicBlacklistDao from '../PublicBlacklistDao';
import CollectionDao from '../CollectionDao';

class CollectionTextUtils {
  /**
   * Returns true if the user will be able to view the given text with textUuid.
   * The user can view the text if one of the following is true:
   *
   * 1. The text is not publicly blacklisted, and its group is not publicly blacklisted
   * 2. The user belongs to a group where the text is whitelisted, or the text's group is whitelisted
   * 3. The user is an admin
   */
  async canViewText(
    textUuid: string,
    userUuid: string | null
  ): Promise<boolean> {
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

    if (
      textBlacklist.includes(textUuid) ||
      (collectionBlacklist.includes(collectionUuid || '') &&
        !textWhitelist.includes(textUuid))
    ) {
      return false;
    }

    return true;
  }

  async canEditText(
    textUuid: string,
    userUuid: string | null
  ): Promise<boolean> {
    const canView = await this.canViewText(textUuid, userUuid);
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
