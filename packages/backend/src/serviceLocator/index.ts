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
import utils from '@/utils';

const instances: { [key: string]: any } = {};

export type ServiceTypes = {
  AliasDao: typeof AliasDao;
  DictionaryFormDao: typeof DictionaryFormDao;
  DictionaryWordDao: typeof DictionaryWordDao;
  DictionarySpellingDao: typeof DictionarySpellingDao;
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
  utils: typeof utils;
};

export default {
  set<K extends keyof ServiceTypes, V extends ServiceTypes[K]>(instanceId: K, instance: V): void {
    instances[instanceId] = instance;
  },

  get<K extends keyof ServiceTypes, V extends ServiceTypes[K]>(instanceId: K): V {
    return instances[instanceId];
  },
};
