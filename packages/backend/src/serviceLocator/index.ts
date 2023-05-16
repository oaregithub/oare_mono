import AliasDao from '@/api/daos/AliasDao';
import ArchiveDao from '@/api/daos/ArchiveDao';
import AssetDao from '@/api/daos/AssetDao';
import BibliographyDao from '@/api/daos/BibliographyDao';
import BibliographyUtils from '@/api/daos/BibliographyUtils';
import cache from '@/cache';
import CacheStatusDao from '@/api/daos/CacheStatusDao';
import CollectionDao from '@/api/daos/CollectionDao';
import CollectionTextUtils from '@/api/daos/CollectionTextUtils';
import CommentsDao from '@/api/daos/CommentsDao';
import ConceptDao from '@/api/daos/ConceptDao';
import DictionaryFormDao from '@/api/daos/DictionaryFormDao';
import DictionarySpellingDao from '@/api/daos/DictionarySpellingDao';
import DictionaryWordDao from '@/api/daos/DictionaryWordDao';
import EditTextUtils from '@/api/daos/EditTextUtils';
import ErrorsDao from '@/api/daos/ErrorsDao';
import EventDao from '@/api/daos/EventDao';
import FieldDao from '@/api/daos/FieldDao';
import GroupAllowlistDao from '@/api/daos/GroupAllowlistDao';
import GroupEditPermissionsDao from '@/api/daos/GroupEditPermissionsDao';
import HierarchyDao from '@/api/daos/HierarchyDao';
import ItemPropertiesDao from '@/api/daos/ItemPropertiesDao';
import NoteDao from '@/api/daos/NoteDao';
import OareGroupDao from '@/api/daos/OareGroupDao';
import PageContentDao from '@/api/daos/PageContentDao';
import PeriodsDao from '@/api/daos/PeriodsDao';
import PermissionsDao from '@/api/daos/PermissionsDao';
import PersonDao from '@/api/daos/PersonDao';
import PublicationDao from '@/api/daos/PublicationDao';
import PublicDenylistDao from '@/api/daos/PublicDenylistDao';
import QuarantineTextDao from '@/api/daos/QuarantineTextDao';
import ResourceDao from '@/api/daos/ResourceDao';
import SealDao from '@/api/daos/SealDao';
import SearchFailureDao from '@/api/daos/SearchFailureDao';
import SignReadingDao from '@/api/daos/SignReadingDao';
import SpatialUnitDao from '@/api/daos/SpatialUnitDao';
import TextDao from '@/api/daos/TextDao';
import TextDiscourseDao from '@/api/daos/TextDiscourseDao';
import TextDraftsDao from '@/api/daos/TextDraftsDao';
import TextEpigraphyDao from '@/api/daos/TextEpigraphyDao';
import TextMarkupDao from '@/api/daos/TextMarkupDao';
import ThreadsDao from '@/api/daos/ThreadsDao';
import TreeDao from '@/api/daos/TreeDao';
import UserDao from '@/api/daos/UserDao';
import UserGroupDao from '@/api/daos/UserGroupDao';
import * as utils from '@/utils';

/**
 * Stores the instantiated singletons in the service locator.
 */
const instances: { [key: string]: any } = {};

/**
 * Specifies the service types that are available in the service locator. Should be listed alphabetically.
 */
export type ServiceTypes = {
  AliasDao: typeof AliasDao;
  ArchiveDao: typeof ArchiveDao;
  AssetDao: typeof AssetDao;
  BibliographyDao: typeof BibliographyDao;
  BibliographyUtils: typeof BibliographyUtils;
  cache: typeof cache;
  CacheStatusDao: typeof CacheStatusDao;
  CollectionDao: typeof CollectionDao;
  CollectionTextUtils: typeof CollectionTextUtils;
  CommentsDao: typeof CommentsDao;
  ConceptDao: typeof ConceptDao;
  DictionaryFormDao: typeof DictionaryFormDao;
  DictionarySpellingDao: typeof DictionarySpellingDao;
  DictionaryWordDao: typeof DictionaryWordDao;
  EditTextUtils: typeof EditTextUtils;
  ErrorsDao: typeof ErrorsDao;
  EventDao: typeof EventDao;
  FieldDao: typeof FieldDao;
  GroupAllowlistDao: typeof GroupAllowlistDao;
  GroupEditPermissionsDao: typeof GroupEditPermissionsDao;
  HierarchyDao: typeof HierarchyDao;
  ItemPropertiesDao: typeof ItemPropertiesDao;
  NoteDao: typeof NoteDao;
  OareGroupDao: typeof OareGroupDao;
  PageContentDao: typeof PageContentDao;
  PeriodsDao: typeof PeriodsDao;
  PermissionsDao: typeof PermissionsDao;
  PersonDao: typeof PersonDao;
  PublicationDao: typeof PublicationDao;
  PublicDenylistDao: typeof PublicDenylistDao;
  QuarantineTextDao: typeof QuarantineTextDao;
  ResourceDao: typeof ResourceDao;
  SealDao: typeof SealDao;
  SearchFailureDao: typeof SearchFailureDao;
  SignReadingDao: typeof SignReadingDao;
  SpatialUnitDao: typeof SpatialUnitDao;
  TextDao: typeof TextDao;
  TextDiscourseDao: typeof TextDiscourseDao;
  TextDraftsDao: typeof TextDraftsDao;
  TextEpigraphyDao: typeof TextEpigraphyDao;
  TextMarkupDao: typeof TextMarkupDao;
  ThreadsDao: typeof ThreadsDao;
  TreeDao: typeof TreeDao;
  UserDao: typeof UserDao;
  UserGroupDao: typeof UserGroupDao;
  utils: typeof utils;
};

export default {
  /**
   * Sets the instance of the given service type.
   * @param instanceId The service type to set.
   * @param instance An instance of the service type to set.
   */
  set<K extends keyof ServiceTypes, V extends ServiceTypes[K]>(
    instanceId: K,
    instance: V
  ): void {
    instances[instanceId] = instance;
  },

  /**
   * Retrieves the stored instance of the given service type.
   * @param instanceId The service type to retrieve.
   * @returns The stored instance of the given service type.
   */
  get<K extends keyof ServiceTypes, V extends ServiceTypes[K]>(
    instanceId: K
  ): V {
    return instances[instanceId];
  },
};
