import {
  Word,
  User,
  CollectionResponse,
  Collection,
  EpigraphyResponse,
  Seal,
  SealInfo,
} from '@oare/types';
import sl from '@/serviceLocator';

export const dictionaryWordFilter = async (
  word: Word,
  user: User | null
): Promise<Word> => {
  const PermissionsDao = sl.get('PermissionsDao');
  const userPermissions = user
    ? await PermissionsDao.getUserPermissions(user.uuid)
    : [];
  const canConnectSpellings = userPermissions
    .map(permission => permission.name)
    .includes('CONNECT_SPELLING');
  return {
    ...word,
    forms: word.forms
      .map(form => ({
        ...form,
        spellings: form.spellings.filter(spelling =>
          canConnectSpellings ? spelling : spelling.hasOccurrence
        ),
      }))
      .filter(form => (canConnectSpellings ? form : form.spellings.length > 0)),
  };
};

export const dictionaryFilter = async (
  words: Word[],
  user: User | null
): Promise<Word[]> => {
  const PermissionsDao = sl.get('PermissionsDao');
  const userPermissions = user
    ? await PermissionsDao.getUserPermissions(user.uuid)
    : [];
  const canConnectSpellings = userPermissions
    .map(permission => permission.name)
    .includes('CONNECT_SPELLING');

  const filteredWords = await Promise.all(
    words.map(word => dictionaryWordFilter(word, user))
  );

  return filteredWords.filter(word =>
    canConnectSpellings ? word : word.forms.length > 0
  );
};

export const collectionTextsFilter = async (
  collectionsResponse: CollectionResponse,
  user: User | null
): Promise<CollectionResponse> => {
  const CollectionTextUtils = sl.get('CollectionTextUtils');

  const userUuid = user ? user.uuid : null;

  const textsToHide = await CollectionTextUtils.textsToHide(userUuid);

  return {
    ...collectionsResponse,
    texts: collectionsResponse.texts.filter(
      text => !textsToHide.includes(text.uuid)
    ),
  };
};

export const collectionFilter = async (
  collections: Collection[],
  user: User | null
): Promise<Collection[]> => {
  const CollectionTextUtils = sl.get('CollectionTextUtils');
  const HierarchyDao = sl.get('HierarchyDao');

  const userUuid = user ? user.uuid : null;
  const isAdmin = !!user && user.isAdmin;

  const publishedCollectionsStatus = await Promise.all(
    collections.map(
      collection => isAdmin || HierarchyDao.isPublished(collection.uuid)
    )
  );

  const publishedCollections = collections.filter(
    (_, idx) => publishedCollectionsStatus[idx]
  );

  const viewableCollectionsStatus = await Promise.all(
    publishedCollections.map(collection =>
      CollectionTextUtils.canViewCollection(collection.uuid, userUuid)
    )
  );

  const viewableCollections = publishedCollections.filter(
    (_, idx) => viewableCollectionsStatus[idx]
  );

  return viewableCollections;
};

export const textFilter = async (
  epigraphy: EpigraphyResponse,
  user: User | null
): Promise<EpigraphyResponse> => {
  const CollectionTextUtils = sl.get('CollectionTextUtils');

  const userUuid = user ? user.uuid : null;

  const canWrite = await CollectionTextUtils.canEditText(
    epigraphy.text.uuid,
    userUuid
  );

  return {
    ...epigraphy,
    canWrite,
  };
};

export const SealFilter = async (
  seal: Seal,
  user: User | null
): Promise<Seal> => {
  const CollectionTextUtils = sl.get('CollectionTextUtils');
  const SealDao = sl.get('SealDao');

  const userUuid = user ? user.uuid : null;

  const textsToHide = await CollectionTextUtils.textsToHide(userUuid);

  const count = await SealDao.getSealImpressionCountBySealUuid(
    seal.uuid,
    textsToHide
  );

  const sealImpressions = await SealDao.getSealImpressionsBySealUuid(
    seal.uuid,
    textsToHide
  );

  return {
    ...seal,
    count,
    sealImpressions,
  };
};

export const SealListFilter = async (
  sealList: SealInfo[],
  user: User | null
): Promise<SealInfo[]> => {
  const CollectionTextUtils = sl.get('CollectionTextUtils');
  const SealDao = sl.get('SealDao');

  const userUuid = user ? user.uuid : null;

  const textsToHide = await CollectionTextUtils.textsToHide(userUuid);

  const filteredSealList = await Promise.all(
    sealList.map(async s => {
      if (s.count > 0) {
        return {
          ...s,
          count: await SealDao.getSealImpressionCountBySealUuid(
            s.uuid,
            textsToHide
          ),
        };
      }
      return s;
    })
  );

  return filteredSealList;
};

export const noFilter = async (items: any, _user: User | null) => items;
