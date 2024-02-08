import { GlobalActionsType } from '@/globalActions';
import { ServerProxyType } from '@/serverProxy';
import store from '@/ts-store';
import _ from 'lodash';
import Router from 'vue-router';

/**
 * Stores the instantiated singletons in the service locator.
 */
const instances: { [key: string]: any } = {};

/**
 * Specifies the service types that are available in the service locator. Should be listed alphabetically.
 */
export type ServiceTypes = {
  globalActions: GlobalActionsType;
  lodash: typeof _;
  router: Router;
  serverProxy: ServerProxyType;
  store: typeof store;
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
