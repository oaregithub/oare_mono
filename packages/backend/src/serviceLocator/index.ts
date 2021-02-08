import DictionaryFormDao from '@/api/daos/DictionaryFormDao';
import DictionaryWordDao from '@/api/daos/DictionaryWordDao';
import LoggingEditsDao from '@/api/daos/LoggingEditsDao';
import TextDiscourseDao from '@/api/daos/TextDiscourseDao';
import UserDao from '@/api/daos/UserDao';
import TextDraftsDao from '@/api/daos/TextDraftsDao';
import OareGroupDao from '@/api/daos/OareGroupDao';
import DictionarySpellingDao from '@/api/daos/DictionarySpellingDao';
import cache from '@/cache';
import TextMarkupDao from '@/api/daos/TextMarkupDao';
import TextDao from '@/api/daos/TextDao';
import HierarchyDao from '@/api/daos/HierarchyDao';
import TextGroupDao from '@/api/daos/TextGroupDao';
import TextEpigraphyDao from '@/api/daos/TextEpigraphyDao';
import AliasDao from '@/api/daos/AliasDao';
import PublicBlacklistDao from '@/api/daos/PublicBlacklistDao';
import SignReadingDao from '@/api/daos/SignReadingDao';
import CollectionGroupDao from '@/api/daos/CollectionGroupDao';
import ResetPasswordLinksDao from '@/api/daos/ResetPasswordLinksDao';
import FieldDao from '@/api/daos/FieldDao';
import ItemPropertiesDao from '@/api/daos/ItemPropertiesDao';
import UserGroupDao from '@/api/daos/UserGroupDao';
import PermissionsDao from '@/api/daos/PermissionsDao';
import CommentsDao from '@/api/daos/CommentsDao';
import ThreadsDao from '@/api/daos/ThreadsDao';
import utils from '@/utils';
import mailer from '@/mailer';

const instances: { [key: string]: any } = {};

export type ServiceTypes = {
  AliasDao: typeof AliasDao;
  DictionaryFormDao: typeof DictionaryFormDao;
  DictionaryWordDao: typeof DictionaryWordDao;
  DictionarySpellingDao: typeof DictionarySpellingDao;
  FieldDao: typeof FieldDao;
  ItemPropertiesDao: typeof ItemPropertiesDao;
  LoggingEditsDao: typeof LoggingEditsDao;
  TextDiscourseDao: typeof TextDiscourseDao;
  TextDraftsDao: typeof TextDraftsDao;
  UserDao: typeof UserDao;
  OareGroupDao: typeof OareGroupDao;
  cache: typeof cache;
  TextMarkupDao: typeof TextMarkupDao;
  TextDao: typeof TextDao;
  HierarchyDao: typeof HierarchyDao;
  TextGroupDao: typeof TextGroupDao;
  TextEpigraphyDao: typeof TextEpigraphyDao;
  PublicBlacklistDao: typeof PublicBlacklistDao;
  SignReadingDao: typeof SignReadingDao;
  CollectionGroupDao: typeof CollectionGroupDao;
  ResetPasswordLinksDao: typeof ResetPasswordLinksDao;
  UserGroupDao: typeof UserGroupDao;
  PermissionsDao: typeof PermissionsDao;
  CommentsDao: typeof CommentsDao;
  ThreadsDao: typeof ThreadsDao;
  utils: typeof utils;
  mailer: typeof mailer;
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
