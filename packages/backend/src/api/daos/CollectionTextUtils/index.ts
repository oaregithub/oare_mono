import sl from '@/serviceLocator';
import { Knex } from 'knex';

class CollectionTextUtils {
  async canViewText(
    textUuid: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const UserDao = sl.get('UserDao');
    const PublicDenylistDao = sl.get('PublicDenylistDao');
    const GroupAllowlistDao = sl.get('GroupAllowlistDao');

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

    const textIsInAllowlist = await GroupAllowlistDao.textIsInAllowlist(
      textUuid,
      userUuid,
      trx
    );
    if (textIsInAllowlist) {
      return true;
    }

    return false;
  }

  async canViewCollection(
    collectionUuid: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const UserDao = sl.get('UserDao');
    const PublicDenylistDao = sl.get('PublicDenylistDao');
    const GroupAllowlistDao = sl.get('GroupAllowlistDao');
    const HierarchyDao = sl.get('HierarchyDao');

    const user = userUuid ? await UserDao.getUserByUuid(userUuid, trx) : null;
    if (user && user.isAdmin) {
      return true;
    }

    const isPubliclyViewable = await PublicDenylistDao.collectionIsPubliclyViewable(
      collectionUuid,
      trx
    );
    if (isPubliclyViewable) {
      return true;
    }

    const collectionIsInAllowlist = await GroupAllowlistDao.collectionIsInAllowlist(
      collectionUuid,
      userUuid,
      trx
    );
    if (collectionIsInAllowlist) {
      return true;
    }

    const textsInCollection = await HierarchyDao.getTextsInCollection(
      collectionUuid,
      trx
    );
    const subtextsViewable = await Promise.all(
      textsInCollection.map(text => this.canViewText(text, userUuid, trx))
    );
    if (subtextsViewable.includes(true)) {
      return true;
    }

    return false;
  }

  async textsToHide(
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const GroupAllowlistDao = sl.get('GroupAllowlistDao');
    const PublicDenylistDao = sl.get('PublicDenylistDao');
    const UserGroupDao = sl.get('UserGroupDao');
    const HierarchyDao = sl.get('HierarchyDao');
    const UserDao = sl.get('UserDao');

    const user = userUuid ? await UserDao.getUserByUuid(userUuid, trx) : null;
    if (user && user.isAdmin) {
      return [];
    }

    const publicDenylist = await PublicDenylistDao.getDenylistTextUuids(trx);
    const publicDenylistCollections = await PublicDenylistDao.getDenylistCollectionUuids(
      trx
    );
    const textsInDenylistCollections = (
      await Promise.all(
        publicDenylistCollections.map(collection =>
          HierarchyDao.getTextsInCollection(collection, trx)
        )
      )
    ).flat();
    textsInDenylistCollections.forEach(text => publicDenylist.push(text));

    const groups = await UserGroupDao.getGroupsOfUser(userUuid, trx);
    const textAllowlist = (
      await Promise.all(
        groups.map(groupId =>
          GroupAllowlistDao.getGroupAllowlist(groupId, 'text', trx)
        )
      )
    ).flat();
    const collectionAllowlist = (
      await Promise.all(
        groups.map(groupId =>
          GroupAllowlistDao.getGroupAllowlist(groupId, 'collection', trx)
        )
      )
    ).flat();
    const textsInAllowlistCollections = (
      await Promise.all(
        collectionAllowlist.map(collection =>
          HierarchyDao.getTextsInCollection(collection, trx)
        )
      )
    ).flat();
    textsInAllowlistCollections.forEach(text => textAllowlist.push(text));

    const textsToHide = publicDenylist.filter(
      text => !textAllowlist.includes(text)
    );

    return textsToHide;
  }

  async imagesToHide(userUuid: string | null): Promise<string[]> {
    const GroupAllowlistDao = sl.get('GroupAllowlistDao');
    const PublicDenylistDao = sl.get('PublicDenylistDao');
    const UserGroupDao = sl.get('UserGroupDao');
    const UserDao = sl.get('UserDao');

    const user = userUuid ? await UserDao.getUserByUuid(userUuid) : null;
    if (user && user.isAdmin) {
      return [];
    }

    const publicImageDenylist = await PublicDenylistDao.getDenylistImageUuids();

    const groups = await UserGroupDao.getGroupsOfUser(userUuid);
    const imageAllowlist = (
      await Promise.all(
        groups.map(groupId =>
          GroupAllowlistDao.getGroupAllowlist(groupId, 'img')
        )
      )
    ).flat();

    const imagesToHide = publicImageDenylist.filter(
      image => !imageAllowlist.includes(image)
    );

    return imagesToHide;
  }

  async canEditText(
    textUuid: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const UserDao = sl.get('UserDao');
    const CollectionDao = sl.get('CollectionDao');
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
          GroupEditPermissionsDao.getGroupEditPermissions(groupId, 'text', trx)
        )
      )
    ).flat();
    const hasTextEditPermission = textEditPermissions.includes(textUuid);

    if (hasTextEditPermission) {
      return true;
    }

    const collectionUuid = await CollectionDao.getTextCollectionUuid(
      textUuid,
      trx
    );
    const collectionEditPermissions = (
      await Promise.all(
        groups.map(groupId =>
          GroupEditPermissionsDao.getGroupEditPermissions(
            groupId,
            'collection',
            trx
          )
        )
      )
    ).flat();
    const hasCollectionEditPermission =
      collectionUuid && collectionEditPermissions.includes(collectionUuid);

    if (hasCollectionEditPermission) {
      return true;
    }

    return false;
  }
}

export default new CollectionTextUtils();
