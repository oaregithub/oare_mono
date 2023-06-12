import sl from '@/serviceLocator';
import { Knex } from 'knex';

// COMPLETE

class CollectionTextUtils {
  /**
   * Checks if a given user can view a given text.
   * @param textUuid The UUID of the text to check.
   * @param userUuid The UUID of the user. Can be null.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the user can view the text.
   * @throws Error if user or text does not exist.
   */
  public async canViewText(
    textUuid: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const UserDao = sl.get('UserDao');
    const PublicDenylistDao = sl.get('PublicDenylistDao');
    const GroupAllowlistDao = sl.get('GroupAllowlistDao');
    const QuarantineTextDao = sl.get('QuarantineTextDao');
    const UserGroupDao = sl.get('UserGroupDao');

    const textIsQuarantined = await QuarantineTextDao.textIsQuarantined(
      textUuid,
      trx
    );
    if (textIsQuarantined) {
      return false;
    }

    const user = userUuid ? await UserDao.getUserByUuid(userUuid, trx) : null;
    if (user && user.isAdmin) {
      return true;
    }

    const isPubliclyViewable = await PublicDenylistDao.textIsPubliclyViewable(
      textUuid,
      trx
    );

    if (isPubliclyViewable) {
      return true;
    }

    const groups = await UserGroupDao.getGroupsOfUser(userUuid, trx);
    const textAllowlist = (
      await Promise.all(
        groups.map(groupId =>
          GroupAllowlistDao.getGroupAllowlist(groupId, 'text', trx)
        )
      )
    ).flat();

    if (textAllowlist.includes(textUuid)) {
      return true;
    }

    return false;
  }

  /**
   * Checks if a given user can view a given collection.
   * @param collectionUuid The UUID of the collection to check.
   * @param userUuid The UUID of the user. Can be null.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the user can view the collection.
   * @throws Error if user or collection texts do not exist.
   */
  public async canViewCollection(
    collectionUuid: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const UserDao = sl.get('UserDao');
    const HierarchyDao = sl.get('HierarchyDao');

    const user = userUuid ? await UserDao.getUserByUuid(userUuid, trx) : null;
    if (user && user.isAdmin) {
      return true;
    }

    const textsInCollection = await HierarchyDao.getTextUuidsByCollectionUuid(
      collectionUuid,
      trx
    );
    const subtextsViewable = await Promise.all(
      textsInCollection.map(uuid => this.canViewText(uuid, userUuid, trx))
    );
    if (subtextsViewable.includes(true)) {
      return true;
    }

    return false;
  }

  /**
   * Retrieves a list of text UUIDs that should be hidden from the user.
   * @param userUuid The UUID of the user. Can be null.
   * @param trx Knex Transaction. Optional.
   * @returns Array of text UUIDs that should be hidden from the user.
   * @throws Error if user does not exist.
   */
  public async textsToHide(
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const GroupAllowlistDao = sl.get('GroupAllowlistDao');
    const PublicDenylistDao = sl.get('PublicDenylistDao');
    const UserGroupDao = sl.get('UserGroupDao');
    const UserDao = sl.get('UserDao');
    const QuarantineTextDao = sl.get('QuarantineTextDao');

    const quarantinedTexts = await QuarantineTextDao.getAllQuarantinedTextUuids(
      trx
    );

    const user = userUuid ? await UserDao.getUserByUuid(userUuid, trx) : null;
    if (user && user.isAdmin) {
      return [...quarantinedTexts];
    }

    const publicDenylist = await PublicDenylistDao.getDenylist('text', trx);

    const groups = await UserGroupDao.getGroupsOfUser(userUuid, trx);
    const textAllowlist = (
      await Promise.all(
        groups.map(groupId =>
          GroupAllowlistDao.getGroupAllowlist(groupId, 'text', trx)
        )
      )
    ).flat();

    const denylistTexts = publicDenylist.filter(
      text => !textAllowlist.includes(text)
    );

    return [...denylistTexts, ...quarantinedTexts];
  }

  /**
   * Retrieves a list of image UUIDs that should be hidden from the user.
   * @param userUuid The UUID of the user. Can be null.
   * @param trx Knex Transaction. Optional.
   * @returns Array of image UUIDs that should be hidden from the user.
   * @throws Error if user does not exist.
   */
  public async imagesToHide(
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const GroupAllowlistDao = sl.get('GroupAllowlistDao');
    const PublicDenylistDao = sl.get('PublicDenylistDao');
    const UserGroupDao = sl.get('UserGroupDao');
    const UserDao = sl.get('UserDao');

    const user = userUuid ? await UserDao.getUserByUuid(userUuid, trx) : null;
    if (user && user.isAdmin) {
      return [];
    }

    const publicImageDenylist = await PublicDenylistDao.getDenylist('img', trx);

    const groups = await UserGroupDao.getGroupsOfUser(userUuid, trx);
    const imageAllowlist = (
      await Promise.all(
        groups.map(groupId =>
          GroupAllowlistDao.getGroupAllowlist(groupId, 'img', trx)
        )
      )
    ).flat();

    const imagesToHide = publicImageDenylist.filter(
      image => !imageAllowlist.includes(image)
    );

    return imagesToHide;
  }

  /**
   * Checks if a given user can edit a given text.
   * @param textUuid The UUID of the text to check.
   * @param userUuid The UUID of the user. Can be null.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the user can edit the text.
   */
  public async canEditText(
    textUuid: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const UserDao = sl.get('UserDao');
    const UserGroupDao = sl.get('UserGroupDao');
    const GroupEditPermissionsDao = sl.get('GroupEditPermissionsDao');

    const user = userUuid ? await UserDao.getUserByUuid(userUuid, trx) : null;
    if (user && user.isAdmin) {
      return true;
    }

    const canViewText = await this.canViewText(textUuid, userUuid, trx);
    if (!canViewText) {
      return false;
    }

    const groups = await UserGroupDao.getGroupsOfUser(userUuid, trx);
    const textEditPermissions = (
      await Promise.all(
        groups.map(groupId =>
          GroupEditPermissionsDao.getGroupEditPermissions(groupId, trx)
        )
      )
    ).flat();
    const hasTextEditPermission = textEditPermissions.includes(textUuid);

    if (hasTextEditPermission) {
      return true;
    }

    return false;
  }
}

/**
 * CollectionTextUtils instance as a singleton.
 */
export default new CollectionTextUtils();
