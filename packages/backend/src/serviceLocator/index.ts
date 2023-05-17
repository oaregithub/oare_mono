import AliasDao from '@/daos/AliasDao';
import ArchiveDao from '@/daos/ArchiveDao';
import AssetDao from '@/daos/AssetDao';
import BibliographyDao from '@/daos/BibliographyDao';
import BibliographyUtils from '@/daos/BibliographyUtils';
import cache from '@/cache';
import CacheStatusDao from '@/daos/CacheStatusDao';
import CollectionDao from '@/daos/CollectionDao';
import CollectionTextUtils from '@/daos/CollectionTextUtils';
import CommentsDao from '@/daos/CommentsDao';
import ConceptDao from '@/daos/ConceptDao';
import DictionaryFormDao from '@/daos/DictionaryFormDao';
import DictionarySpellingDao from '@/daos/DictionarySpellingDao';
import DictionaryWordDao from '@/daos/DictionaryWordDao';
import EditTextUtils from '@/daos/EditTextUtils';
import ErrorsDao from '@/daos/ErrorsDao';
import EventDao from '@/daos/EventDao';
import FieldDao from '@/daos/FieldDao';
import GroupAllowlistDao from '@/daos/GroupAllowlistDao';
import GroupEditPermissionsDao from '@/daos/GroupEditPermissionsDao';
import HierarchyDao from '@/daos/HierarchyDao';
import ItemPropertiesDao from '@/daos/ItemPropertiesDao';
import NoteDao from '@/daos/NoteDao';
import OareGroupDao from '@/daos/OareGroupDao';
import PageContentDao from '@/daos/PageContentDao';
import PeriodsDao from '@/daos/PeriodsDao';
import PermissionsDao from '@/daos/PermissionsDao';
import PersonDao from '@/daos/PersonDao';
import PublicationDao from '@/daos/PublicationDao';
import PublicDenylistDao from '@/daos/PublicDenylistDao';
import QuarantineTextDao from '@/daos/QuarantineTextDao';
import ResourceDao from '@/daos/ResourceDao';
import SealDao from '@/daos/SealDao';
import SearchFailureDao from '@/daos/SearchFailureDao';
import SignReadingDao from '@/daos/SignReadingDao';
import SpatialUnitDao from '@/daos/SpatialUnitDao';
import TextDao from '@/daos/TextDao';
import TextDiscourseDao from '@/daos/TextDiscourseDao';
import TextDraftsDao from '@/daos/TextDraftsDao';
import TextEpigraphyDao from '@/daos/TextEpigraphyDao';
import TextMarkupDao from '@/daos/TextMarkupDao';
import ThreadsDao from '@/daos/ThreadsDao';
import TreeDao from '@/daos/TreeDao';
import UserDao from '@/daos/UserDao';
import UserGroupDao from '@/daos/UserGroupDao';
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
