import Vue from 'vue';
import VueCompositionAPI, { reactive } from '@vue/composition-api';
import { User, PermissionItem } from '@oare/types';

Vue.use(VueCompositionAPI);

export interface State {
  landed: boolean;
  user: null | User;
  permissions: PermissionItem[];
  idToken: string | null;
}

const state: State = reactive({
  landed: false,
  user: null,
  permissions: [],
  idToken: null,
});

export default {
  setUser: (user: User) => {
    state.user = user;
  },
  setLanded: (landed: boolean) => {
    state.landed = landed;
  },
  setIdToken: (idToken: string) => {
    state.idToken = idToken;
  },
  logout: () => {
    state.user = null;
    state.permissions = [];
    state.idToken = null;
  },
  setPermissions: (permissions: PermissionItem[]) => {
    state.permissions = permissions;
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
    get idToken() {
      return state.idToken;
    },
  },
};
