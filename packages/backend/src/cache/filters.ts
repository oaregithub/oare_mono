import {
  DictionaryWord,
  User,
  Collection,
  Epigraphy,
  Seal,
  SealCore,
  Person,
  Bibliography,
  Archive,
  Dossier,
  CollectionRow,
  Publication,
  PeriodResponse,
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
export const dictionaryWordFilter: CacheFilter<DictionaryWord> = async (
  word: DictionaryWord,
  user: User | null
): Promise<DictionaryWord> => {
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
export const dictionaryFilter: CacheFilter<DictionaryWord[]> = async (
  words: DictionaryWord[],
  user: User | null
): Promise<DictionaryWord[]> => {
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
 * @param collection The collection response to filter.
 * @param user The requesting user.
 * @returns The filtered collection response.
 */
export const collectionTextsFilter: CacheFilter<Collection> = async (
  collection: Collection,
  user: User | null
): Promise<Collection> => {
  const CollectionTextUtils = sl.get('CollectionTextUtils');

  const userUuid = user ? user.uuid : null;

  const textsToHide = await CollectionTextUtils.textsToHide(userUuid);

  return {
    ...collection,
    texts: collection.texts.filter(text => !textsToHide.includes(text.uuid)),
  };
};

/**
 * Filters a list of collections to exclude collections that the user does not have access to.
 * @param collections The list of collections to filter.
 * @param user The requesting user.
 * @returns The filtered list of collections.
 */
export const collectionFilter: CacheFilter<CollectionRow[]> = async (
  collections: CollectionRow[],
  user: User | null
): Promise<CollectionRow[]> => {
  const CollectionTextUtils = sl.get('CollectionTextUtils');

  const userUuid = user ? user.uuid : null;

  const viewableCollectionsStatus = await Promise.all(
    collections.map(collection =>
      CollectionTextUtils.canViewCollection(collection.uuid, userUuid)
    )
  );

  const viewableCollections = collections.filter(
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
export const epigraphyFilter: CacheFilter<Epigraphy> = async (
  epigraphy: Epigraphy,
  user: User | null
): Promise<Epigraphy> => {
  const CollectionTextUtils = sl.get('CollectionTextUtils');
  const ResourceDao = sl.get('ResourceDao');

  const userUuid = user ? user.uuid : null;

  const canEdit = await CollectionTextUtils.canEditText(
    epigraphy.text.uuid,
    userUuid
  );

  const images = await ResourceDao.getImagesByTextUuid(
    epigraphy.text.uuid,
    userUuid
  );

  const pdfUrls = await Promise.all(
    epigraphy.citations.map(citation =>
      ResourceDao.getPDFUrlByBibliographyUuid(
        citation.bibliographyUuid,
        citation.beginPage || undefined,
        citation.beginPlate || undefined
      )
    )
  );

  const citations = epigraphy.citations.map((citation, idx) => ({
    ...citation,
    urls: pdfUrls[idx],
  }));

  return {
    ...epigraphy,
    citations,
    images,
    canEdit,
  };
};

/**
 * Used to add occurrences count, image links, and impressions to a seal.
 * Done in a cache filter to exclude occurrences that appear in texts that the user does not have access to.
 * Image links are added to prevent expiring.
 * @param seal The seal response to add a count to.
 * @param user The requesting user.
 * @returns The seal response with added count.
 */
export const sealFilter: CacheFilter<Seal> = async (
  seal: Seal,
  user: User | null
): Promise<Seal> => {
  const CollectionTextUtils = sl.get('CollectionTextUtils');
  const SpatialUnitDao = sl.get('SpatialUnitDao');

  const userUuid = user ? user.uuid : null;

  const imagesToHide = await CollectionTextUtils.imagesToHide(userUuid);
  const imageLinks = await SpatialUnitDao.getImageLinksBySealUuid(
    seal.uuid,
    imagesToHide
  );

  const textsToHide = await CollectionTextUtils.textsToHide(userUuid);
  const occurrences = await SpatialUnitDao.getSealImpressionOccurrencesBySealUuid(
    seal.uuid,
    textsToHide
  );

  const impressions = await SpatialUnitDao.getSealImpressionsBySealUuid(
    seal.uuid,
    textsToHide
  );

  return {
    ...seal,
    imageLinks,
    occurrences,
    impressions,
  };
};

/**
 * Used to add occurrences counts and image links to a list of seals.
 * Done in a cache filter to exclude occurrences that appear in texts that the user does not have access to.
 * Image links are added to prevent expiring.
 * @param seals The seal list to add counts to.
 * @param user The requesting user.
 * @returns The seal list with added counts.
 */
export const sealListFilter: CacheFilter<SealCore[]> = async (
  seals: SealCore[],
  user: User | null
): Promise<SealCore[]> => {
  const CollectionTextUtils = sl.get('CollectionTextUtils');
  const SpatialUnitDao = sl.get('SpatialUnitDao');

  const userUuid = user ? user.uuid : null;

  const imagesToHide = await CollectionTextUtils.imagesToHide(userUuid);
  const imageLinks = await Promise.all(
    seals.map(seal =>
      SpatialUnitDao.getImageLinksBySealUuid(seal.uuid, imagesToHide)
    )
  );

  const textsToHide = await CollectionTextUtils.textsToHide(userUuid);
  const occurrences = await Promise.all(
    seals.map(seal =>
      SpatialUnitDao.getSealImpressionOccurrencesBySealUuid(
        seal.uuid,
        textsToHide
      )
    )
  );

  const filteredSealList = seals.map((seal, idx) => ({
    ...seal,
    imageLinks: imageLinks[idx],
    occurrences: occurrences[idx],
  }));

  return filteredSealList;
};

/**
 * Used to add roles data to a person response.
 * Done in a cache filter to exclude occurrences that appear in texts that the user does not have access to.
 * @param person The person response to add data to.
 * @param user The requesting user.
 * @returns The person response with added data.
 */
export const personFilter: CacheFilter<Person> = async (
  person: Person,
  user: User | null
): Promise<Person> => {
  const PersonDao = sl.get('PersonDao');

  const temporaryRoles = await PersonDao.getPersonRolesWithOccurrences(
    person.uuid,
    'temporary',
    user ? user.uuid : null
  );
  const durableRoles = await PersonDao.getPersonRolesWithOccurrences(
    person.uuid,
    'durable',
    user ? user.uuid : null
  );
  const roleNotYetAssigned = await PersonDao.getPersonOccurrencesCount(
    person.uuid,
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
  const citationUrls = await ResourceDao.getPDFUrlByBibliographyUuid(
    bibliography.uuid
  );
  const bibliographyResponse = {
    ...bibliography,
    bibliography: {
      ...bibliography.bibliography,
      url: citationUrls ? citationUrls.general : null,
    },
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

/**
 * Filters out texts that the user does not have access to from an array of publications.
 * @param publications The publications to filter.
 * @param user The requesting user.
 * @returns The publications with filtered texts.
 */
export const publicationsFilter: CacheFilter<Publication[]> = async (
  publications: Publication[],
  user: User | null
): Promise<Publication[]> => {
  const CollectionTextUtils = sl.get('CollectionTextUtils');

  const textsToHide = await CollectionTextUtils.textsToHide(
    user ? user.uuid : null
  );

  const publicationResponse: Publication[] = publications.map(publication => ({
    ...publication,
    texts: publication.texts.filter(text => !textsToHide.includes(text.uuid)),
  }));

  return publicationResponse;
};

/**
 * Used to add occurrences counts to periods data.
 * Done in a cache filter to filter out occurrences in texts that the user does not have access to.
 * @param response The periods to add occurrences to.
 * @param user The requesting user.
 * @returns The periods with added occurrences.
 */
export const periodsFilter: CacheFilter<PeriodResponse> = async (
  response: PeriodResponse,
  user: User | null
): Promise<PeriodResponse> => {
  const CollectionTextUtils = sl.get('CollectionTextUtils');
  const PeriodsDao = sl.get('PeriodsDao');

  const textsToHide = await CollectionTextUtils.textsToHide(
    user ? user.uuid : null
  );

  const periodResponse: PeriodResponse = {
    years: await Promise.all(
      response.years.map(async year => ({
        ...year,
        occurrences: await PeriodsDao.getOccurrences(year.uuid, textsToHide),
        months: await Promise.all(
          year.months.map(async month => ({
            ...month,
            occurrences: await PeriodsDao.getOccurrences(
              month.uuid,
              textsToHide
            ),
            weeks: await Promise.all(
              month.weeks.map(async week => ({
                ...week,
                occurrences: await PeriodsDao.getOccurrences(
                  week.uuid,
                  textsToHide
                ),
              }))
            ),
          }))
        ),
      }))
    ),
  };

  return periodResponse;
};
