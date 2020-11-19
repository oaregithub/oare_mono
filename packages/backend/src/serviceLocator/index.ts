import AliasDao from '@/api/daos/AliasDao';
import DictionaryFormDao from '@/api/daos/DictionaryFormDao';
import DictionaryWordDao from '@/api/daos/DictionaryWordDao';
import LoggingEditsDao from '@/api/daos/LoggingEditsDao';
import TextDiscourseDao from '@/api/daos/TextDiscourseDao';
import UserDao from '@/api/daos/UserDao';
import TextDraftsDao from '@/api/daos/TextDraftsDao';
import OareGroupDao from '@/api/daos/OareGroupDao';
import DictionarySpellingDao from '@/api/daos/DictionarySpellingDao';
import cache from '@/cache';

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
};

export default {
  set<K extends keyof ServiceTypes, V extends ServiceTypes[K]>(instanceId: K, instance: V): void {
    instances[instanceId] = instance;
  },

  get<K extends keyof ServiceTypes, V extends ServiceTypes[K]>(instanceId: K): V {
    return instances[instanceId];
  },
};
