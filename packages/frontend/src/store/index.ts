import Vue from 'vue';
import VueCompositionAPI, { reactive } from '@vue/composition-api';
import { User, PermissionItem, PermissionName } from '@oare/types';
import firebase from '@/firebase';

Vue.use(VueCompositionAPI);

export interface State {
  user: null | User;
  permissions: PermissionItem[];
  displayAdminBadge: AdminBadgeOptions;
  idToken: string | null;
}

interface AdminBadgeOptions {
  error: boolean;
  comments: boolean;
}

/**
 * The state for the TS store.
 */
const state: State = reactive<State>({
  user: null,
  permissions: [],
  displayAdminBadge: {
    error: false,
    comments: false,
  },
  idToken: null,
});

export default {
  /**
   * Sets a user in the store.
   * @param user The user to set.
   */
  setUser: (user: User) => {
    state.user = user;
  },
  /**
   * Sets the Firebase authentication token.
   * @param token The token to set.
   */
  setToken: (token: Pick<firebase.auth.IdTokenResult, 'token'>) => {
    state.idToken = token.token;
  },
  /**
   * Resets store to initial state upon logout.
   */
  logout: () => {
    state.user = null;
    state.permissions = [];
    state.idToken = null;
  },
  /**
   * Sets the permissions for the user.
   * @param permissions The permissions to set.
   */
  setPermissions: (permissions: PermissionItem[]) => {
    state.permissions = permissions;
  },
  /**
   * Sets the admin badge status.
   * @param status The status to set.
   */
  setAdminBadge: (status: AdminBadgeOptions) => {
    state.displayAdminBadge = status;
  },
  /**
   * Checks if a user has a given permission set in the store.
   * @param name The name of the permission to check.
   * @returns Boolean indicating if the user has the permission.
   */
  hasPermission(name: PermissionName): boolean {
    return state.permissions.map(perm => perm.name).includes(name);
  },
  getters: {
    /**
     * Checks if the user is an admin.
     * @returns Boolean indicating if the user is an admin.
     */
    get isAdmin() {
      return state.user ? state.user.isAdmin : false;
    },
    /**
     * Checks if the user is authenticated.
     * @returns Boolean indicating if the user is authenticated.
     */
    get isAuthenticated() {
      return !!state.user;
    },
    /**
     * Gets the user.
     * @returns The user object.
     */
    get user() {
      return state.user;
    },
    /**
     * Gets the current admin badge status.
     * @returns The admin badge status.
     */
    get displayAdminBadge() {
      return state.displayAdminBadge;
    },
    /**
     * Gets the Firebase authentication token.
     * @returns The current Firebase authentication token.
     */
    get idToken() {
      return state.idToken;
    },
  },
};
