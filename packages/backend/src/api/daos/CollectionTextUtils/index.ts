import sl from '@/serviceLocator';
import { CollectionText } from '@oare/types';
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
    const QuarantineTextDao = sl.get('QuarantineTextDao');

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
    const QuarantineTextDao = sl.get('QuarantineTextDao');

    const quarantinedTexts = await QuarantineTextDao.getQuarantinedTextUuids(
      trx
    );

    const user = userUuid ? await UserDao.getUserByUuid(userUuid, trx) : null;
    if (user && user.isAdmin) {
      return [...quarantinedTexts];
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

    const denylistTexts = publicDenylist.filter(
      text => !textAllowlist.includes(text)
    );

    return [...denylistTexts, ...quarantinedTexts];
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

  async sortCollectionTexts(texts: CollectionText[]) {
    const sortedTexts = texts.sort((a, b) => {
      const textNameA: string = a.name.replace(/[{}()-+,.;: ]{1,}/g, ' ');
      const textNameB: string = b.name.replace(/[{}()-+,.;: ]{1,}/g, ' ');
      const nameArrayA: string[] = textNameA.split(' ');
      const nameArrayB: string[] = textNameB.split(' ');
      nameArrayA.forEach((val, idx) => {
        const numLetterSplit = val.match(/(\d+|\D+)/g);
        if (numLetterSplit && numLetterSplit.length > 1) {
          nameArrayA.splice(idx, 1, ...numLetterSplit);
        }
      });
      nameArrayB.forEach((val, idx) => {
        const numLetterSplit = val.match(/\d+|\D+/g);
        if (numLetterSplit && numLetterSplit.length > 1) {
          nameArrayB.splice(idx, 1, ...numLetterSplit);
        }
      });
      const shorterLength =
        nameArrayA.length <= nameArrayB.length
          ? nameArrayA.length
          : nameArrayB.length;
      for (let i = 0; i < shorterLength; i += 1) {
        if (nameArrayA[i] !== nameArrayB[i]) {
          const numA = parseFloat(nameArrayA[i]);
          const numB = parseFloat(nameArrayB[i]);
          if (numA && numB && numA !== numB) {
            return numA - numB;
          }
          return nameArrayA[i].localeCompare(nameArrayB[i]);
        }
      }

      return nameArrayA.length - nameArrayB.length;
    });
    return sortedTexts;
  }
}

export default new CollectionTextUtils();
