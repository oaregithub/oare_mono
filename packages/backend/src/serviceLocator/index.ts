import DictionaryFormDao from '@/api/daos/DictionaryFormDao';
import DictionaryWordDao from '@/api/daos/DictionaryWordDao';
import LoggingEditsDao from '@/api/daos/LoggingEditsDao';
import TextDiscourseDao from '@/api/daos/TextDiscourseDao';
import cache from '@/cache';

const instances: { [key: string]: any } = {};

export type ServiceTypes = {
  DictionaryFormDao: typeof DictionaryFormDao;
  DictionaryWordDao: typeof DictionaryWordDao;
  LoggingEditsDao: typeof LoggingEditsDao;
  TextDiscourseDao: typeof TextDiscourseDao;
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
