import {
  Word,
  User,
  CollectionResponse,
  Collection,
  EpigraphyResponse,
  Seal,
  SealInfo,
  PersonInfo,
  Bibliography,
  ZoteroData,
  Archive,
  Dossier,
} from '@oare/types';
import sl from '@/serviceLocator';
import { CacheFilter } from '@/cache';

/**
 * Filters out forms/spellings of a word that have no occurrences if the user does not have the 'CONNECT_SPELLING' permission.
 * Used when requesting data for a specific word.
 * Prevents incomplete dictionary data from being displayed to most users.
 * @param word The word to filter.
 * @param user The requesting user.
 * @returns The filtered word.
 */
export const dictionaryWordFilter: CacheFilter<Word> = async (
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

/**
 * Filters out words that have no forms/spellings with occurrences if the user does not have the 'CONNECT_SPELLING' permission.
 * Used when requesting a list of words.
 * Prevents incomplete dictionary data from being displayed to most users.
 * @param words The list of words to filter.
 * @param user The requesting user.
 * @returns The filtered list of words.
 */
export const dictionaryFilter: CacheFilter<Word[]> = async (
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

/**
 * Filters a collection to exclude texts that the user does not have access to.
 * @param collectionsResponse The collection response to filter.
 * @param user The requesting user.
 * @returns The filtered collection response.
 */
export const collectionTextsFilter: CacheFilter<CollectionResponse> = async (
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

/**
 * Filters a list of collections to exclude collections that the user does not have access to.
 * @param collections The list of collections to filter.
 * @param user The requesting user.
 * @returns The filtered list of collections.
 */
export const collectionFilter: CacheFilter<Collection[]> = async (
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

/**
 * Used to add user-specific information to a epigraphy response.
 * Also used to retrieve PDF links for zotero data. This is done in a cache filter
 * to prevent expiring links.
 * @param epigraphy The epigraphy response to add data to.
 * @param user The requesting user.
 * @returns The epigraphy response with added data.
 */
export const textFilter: CacheFilter<EpigraphyResponse> = async (
  epigraphy: EpigraphyResponse,
  user: User | null
): Promise<EpigraphyResponse> => {
  const CollectionTextUtils = sl.get('CollectionTextUtils');
  const ResourceDao = sl.get('ResourceDao');

  const userUuid = user ? user.uuid : null;

  const canWrite = await CollectionTextUtils.canEditText(
    epigraphy.text.uuid,
    userUuid
  );

  const zoteroData: ZoteroData[] = await Promise.all(
    epigraphy.zoteroData.map(zd => {
      const links = ResourceDao.getPDFUrlByBibliographyUuid(
        zd.uuid,
        zd.referringLocationInfo
      );
      return { ...zd, links };
    })
  );

  return {
    ...epigraphy,
    canWrite,
    zoteroData,
  };
};

/**
 * Used to add occurrences count to a seal response.
 * Done in a cache filter to exclude occurrences that appear in texts that the user does not have access to.
 * @param seal The seal response to add a count to.
 * @param user The requesting user.
 * @returns The seal response with added count.
 */
export const SealFilter: CacheFilter<Seal> = async (
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

/**
 * Used to add occurrences counts to a list of seals.
 * Done in a cache filter to exclude occurrences that appear in texts that the user does not have access to.
 * @param sealList The seal list to add counts to.
 * @param user The requesting user.
 * @returns The seal list with added counts.
 */
export const SealListFilter: CacheFilter<SealInfo[]> = async (
  sealList: SealInfo[],
  user: User | null
): Promise<SealInfo[]> => {
  const CollectionTextUtils = sl.get('CollectionTextUtils');
  const SealDao = sl.get('SealDao');

  const userUuid = user ? user.uuid : null;

  const textsToHide = await CollectionTextUtils.textsToHide(userUuid);

  const filteredSealList = await Promise.all(
    sealList.map(async s => ({
      ...s,
      count: await SealDao.getSealImpressionCountBySealUuid(
        s.uuid,
        textsToHide
      ),
    }))
  );

  return filteredSealList;
};

/**
 * Used to add roles data to a person response.
 * Done in a cache filter to exclude occurrences that appear in texts that the user does not have access to.
 * @param person The person response to add data to.
 * @param user The requesting user.
 * @returns The person response with added data.
 */
export const personFilter: CacheFilter<PersonInfo> = async (
  person: PersonInfo,
  user: User | null
): Promise<PersonInfo> => {
  const PersonDao = sl.get('PersonDao');

  const temporaryRoles = await PersonDao.getPersonRoles(
    person.person.uuid,
    'temporary',
    user ? user.uuid : null
  );
  const durableRoles = await PersonDao.getPersonRoles(
    person.person.uuid,
    'durable',
    user ? user.uuid : null
  );
  const roleNotYetAssigned = await PersonDao.getPersonOccurrencesCount(
    person.person.uuid,
    user ? user.uuid : null,
    undefined,
    'noRole'
  );
  return {
    ...person,
    temporaryRoles,
    durableRoles,
    roleNotYetAssigned,
  };
};

/**
 * Used to add PDF link to a bibliography response.
 * Done in a cache filter to prevent expiring links.
 * @param bibliography The bibliography response to add a link to.
 * @param _user The requesting user.
 * @returns The bibliography response with added link.
 */
export const bibliographyFilter: CacheFilter<Bibliography> = async (
  bibliography: Bibliography,
  _user: User | null
): Promise<Bibliography> => {
  const ResourceDao = sl.get('ResourceDao');
  const { fileUrl } = await ResourceDao.getPDFUrlByBibliographyUuid(
    bibliography.uuid
  );
  const bibliographyResponse = {
    ...bibliography,
    bibliography: { ...bibliography.bibliography, url: fileUrl },
  };
  return bibliographyResponse;
};

/**
 * Used to add PDF links to a list of bibliographies.
 * Done in a cache filter to prevent expiring links.
 * @param bibliographies The bibliographies list to add links to.
 * @param user The requesting user.
 * @returns The bibliography list with added links.
 */
export const bibliographiesFilter: CacheFilter<Bibliography[]> = async (
  bibliographies: Bibliography[],
  user: User | null
): Promise<Bibliography[]> => {
  const bibliographyResponse = await Promise.all(
    bibliographies.map(async bibliography =>
      bibliographyFilter(bibliography, user)
    )
  );
  return bibliographyResponse;
};

/**
 * Used to filter out texts that the user does not have access to from an archive and its dossiers.
 * @param archive The archive to filter.
 * @param user The requesting user.
 * @returns The archive with filtered texts.
 */
export const archiveFilter: CacheFilter<Archive> = async (
  archive: Archive,
  user: User | null
): Promise<Archive> => {
  const CollectionTextUtils = sl.get('CollectionTextUtils');

  const textsToHide = await CollectionTextUtils.textsToHide(
    user ? user.uuid : null
  );

  const archiveResponse: Archive = {
    ...archive,
    texts: archive.texts.filter(text => !textsToHide.includes(text.uuid)),
    dossiers: await Promise.all(
      archive.dossiers.map(d => dossierFilter(d, user))
    ),
  };

  return archiveResponse;
};

/**
 * Used to filter out texts that the user does not have access to from a list of archives and their dossiers.
 * @param archives The list of archives to filter.
 * @param user The requesting user.
 * @returns The list of archives with filtered texts.
 */
export const archivesFilter: CacheFilter<Archive[]> = async (
  archives: Archive[],
  user: User | null
): Promise<Archive[]> => {
  const archiveResponse = await Promise.all(
    archives.map(async archive => archiveFilter(archive, user))
  );
  return archiveResponse;
};

/**
 * Used to filter out texts that the user does not have access to from a dossier.
 * @param dossier The dossier to filter.
 * @param user The requesting user.
 * @returns The dossier with filtered texts.
 */
export const dossierFilter: CacheFilter<Dossier> = async (
  dossier: Dossier,
  user: User | null
): Promise<Dossier> => {
  const CollectionTextUtils = sl.get('CollectionTextUtils');

  const textsToHide = await CollectionTextUtils.textsToHide(
    user ? user.uuid : null
  );

  const dossierResponse: Dossier = {
    ...dossier,
    texts: dossier.texts.filter(text => !textsToHide.includes(text.uuid)),
  };

  return dossierResponse;
};
