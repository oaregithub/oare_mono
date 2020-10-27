import { GlobalActionsType } from '@/globalActions';
import { ServerProxyType } from '@/serverProxy';
import store from '@/ts-store';

const instances: { [key: string]: any } = {};

export type ServiceTypes = {
  serverProxy: ServerProxyType;
  globalActions: GlobalActionsType;
  store: typeof store;
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
