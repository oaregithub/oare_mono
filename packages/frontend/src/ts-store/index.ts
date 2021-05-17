import Vue from 'vue';
import VueCompositionAPI, { reactive } from '@vue/composition-api';
import { User, PermissionItem, AdminBadgeOptions } from '@oare/types';
import firebase from '@/firebase';

Vue.use(VueCompositionAPI);

export interface State {
  landed: boolean;
  user: null | User;
  permissions: PermissionItem[];
  displayAdminBadge: AdminBadgeOptions;
  idToken: string | null;
}

const state: State = reactive({
  landed: false,
  user: null,
  permissions: [],
  displayAdminBadge: {
    error: false,
    comments: false,
  },
  idToken: null,
});

export default {
  setUser: (user: User) => {
    state.user = user;
  },
  setLanded: (landed: boolean) => {
    state.landed = landed;
  },
  setToken: (token: Pick<firebase.auth.IdTokenResult, 'token'>) => {
    state.idToken = token.token;
  },
  logout: () => {
    state.user = null;
    state.permissions = [];
    state.idToken = null;
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
    get permissions() {
      return state.permissions;
    },
    get displayAdminBadge() {
      return state.displayAdminBadge;
    },
    get idToken() {
      return state.idToken;
    },
  },
};
