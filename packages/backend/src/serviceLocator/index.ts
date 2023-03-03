import DictionaryFormDao from '@/api/daos/DictionaryFormDao';
import DictionaryWordDao from '@/api/daos/DictionaryWordDao';
import TextDiscourseDao from '@/api/daos/TextDiscourseDao';
import UserDao from '@/api/daos/UserDao';
import TextDraftsDao from '@/api/daos/TextDraftsDao';
import OareGroupDao from '@/api/daos/OareGroupDao';
import DictionarySpellingDao from '@/api/daos/DictionarySpellingDao';
import cache from '@/cache';
import TextMarkupDao from '@/api/daos/TextMarkupDao';
import TextDao from '@/api/daos/TextDao';
import HierarchyDao from '@/api/daos/HierarchyDao';
import TextEpigraphyDao from '@/api/daos/TextEpigraphyDao';
import PublicDenylistDao from '@/api/daos/PublicDenylistDao';
import SignReadingDao from '@/api/daos/SignReadingDao';
import FieldDao from '@/api/daos/FieldDao';
import ItemPropertiesDao from '@/api/daos/ItemPropertiesDao';
import UserGroupDao from '@/api/daos/UserGroupDao';
import PermissionsDao from '@/api/daos/PermissionsDao';
import CommentsDao from '@/api/daos/CommentsDao';
import ThreadsDao from '@/api/daos/ThreadsDao';
import ErrorsDao from '@/api/daos/ErrorsDao';
import CollectionDao from '@/api/daos/CollectionDao';
import CacheStatusDao from '@/api/daos/CacheStatusDao';
import CollectionTextUtils from '@/api/daos/CollectionTextUtils';
import PersonDao from '@/api/daos/PersonDao';
import GroupAllowlistDao from '@/api/daos/GroupAllowlistDao';
import GroupEditPermissionsDao from '@/api/daos/GroupEditPermissionsDao';
import ResourceDao from '@/api/daos/ResourceDao';
import AliasDao from '@/api/daos/AliasDao';
import PublicationDao from '@/api/daos/PublicationDao';
import ArchiveDao from '@/api/daos/ArchiveDao';
import NoteDao from '@/api/daos/NoteDao';
import PageContentDao from '@/api/daos/PageContentDao';
import SearchFailureDao from '@/api/daos/SearchFailureDao';
import BibliographyDao from '@/api/daos/BibliographyDao';
import TreeDao from '@/api/daos/TreeDao';
import QuarantineTextDao from '@/api/daos/QuarantineTextDao';
import * as utils from '@/utils';
import BibliographyUtils from '@/api/daos/BibliographyUtils';
import SealDao from '@/api/daos/SealDao';
import EditTextUtils from '@/api/daos/EditTextUtils';
import PeriodsDao from '@/api/daos/PeriodsDao';

const instances: { [key: string]: any } = {};

export type ServiceTypes = {
  CollectionDao: typeof CollectionDao;
  DictionaryFormDao: typeof DictionaryFormDao;
  DictionaryWordDao: typeof DictionaryWordDao;
  DictionarySpellingDao: typeof DictionarySpellingDao;
  FieldDao: typeof FieldDao;
  ItemPropertiesDao: typeof ItemPropertiesDao;
  TextDiscourseDao: typeof TextDiscourseDao;
  TextDraftsDao: typeof TextDraftsDao;
  UserDao: typeof UserDao;
  OareGroupDao: typeof OareGroupDao;
  cache: typeof cache;
  TextMarkupDao: typeof TextMarkupDao;
  TextDao: typeof TextDao;
  HierarchyDao: typeof HierarchyDao;
  TextEpigraphyDao: typeof TextEpigraphyDao;
  PublicDenylistDao: typeof PublicDenylistDao;
  SignReadingDao: typeof SignReadingDao;
  UserGroupDao: typeof UserGroupDao;
  PermissionsDao: typeof PermissionsDao;
  CommentsDao: typeof CommentsDao;
  ThreadsDao: typeof ThreadsDao;
  ErrorsDao: typeof ErrorsDao;
  CacheStatusDao: typeof CacheStatusDao;
  CollectionTextUtils: typeof CollectionTextUtils;
  PersonDao: typeof PersonDao;
  GroupAllowlistDao: typeof GroupAllowlistDao;
  GroupEditPermissionsDao: typeof GroupEditPermissionsDao;
  ResourceDao: typeof ResourceDao;
  AliasDao: typeof AliasDao;
  NoteDao: typeof NoteDao;
  utils: typeof utils;
  PublicationDao: typeof PublicationDao;
  ArchiveDao: typeof ArchiveDao;
  PageContentDao: typeof PageContentDao;
  SearchFailureDao: typeof SearchFailureDao;
  BibliographyDao: typeof BibliographyDao;
  BibliographyUtils: typeof BibliographyUtils;
  TreeDao: typeof TreeDao;
  QuarantineTextDao: typeof QuarantineTextDao;
  SealDao: typeof SealDao;
  EditTextUtils: typeof EditTextUtils;
  PeriodsDao: typeof PeriodsDao;
};

export default {
  set<K extends keyof ServiceTypes, V extends ServiceTypes[K]>(
    instanceId: K,
    instance: V
  ): void {
    instances[instanceId] = instance;
  },

  get<K extends keyof ServiceTypes, V extends ServiceTypes[K]>(
    instanceId: K
  ): V {
    return instances[instanceId];
  },
};
