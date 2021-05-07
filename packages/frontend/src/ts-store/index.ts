import Vue from 'vue';
import VueCompositionAPI, { reactive } from '@vue/composition-api';
import { User, PermissionItem, AdminBadgeOptions } from '@oare/types';

Vue.use(VueCompositionAPI);

export interface State {
  landed: boolean;
  user: null | User;
  authComplete: boolean;
  permissions: PermissionItem[];
  displayAdminBadge: AdminBadgeOptions;
}

const state: State = reactive({
  landed: false,
  user: null,
  authComplete: false,
  permissions: [],
  displayAdminBadge: {
    error: false,
    comments: false,
  },
});

export default {
  setUser: (user: User) => {
    state.user = user;
  },
  setLanded: (landed: boolean) => {
    state.landed = landed;
  },
  logout: () => {
    state.user = null;
    state.permissions = [];
  },
  setAuthComplete: () => {
    state.authComplete = true;
  },
  setPermissions: (permissions: PermissionItem[]) => {
    state.permissions = permissions;
  },
  setAdminBadge: (status: AdminBadgeOptions) => {
    state.displayAdminBadge = status;
  },
  getters: {
    get isAdmin() {
      return state.user ? state.user.isAdmin : false;
    },
    get landed() {
      return state.landed;
    },
    get isAuthenticated() {
      return !!state.user;
    },
    get user() {
      return state.user;
    },
    get authComplete() {
      return state.authComplete;
    },
    get permissions() {
      return state.permissions;
    },
    get displayAdminBadge() {
      return state.displayAdminBadge;
    },
  },
};
