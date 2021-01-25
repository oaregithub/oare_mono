import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import { LoginRegisterResponse, PermissionItem } from '@oare/types';
import { reactive } from '@vue/composition-api';

Vue.use(VueCompositionAPI);

export interface State {
  landed: boolean;
  user: null | LoginRegisterResponse;
  authComplete: boolean;
  permissions: PermissionItem[];
}

const state: State = reactive({
  landed: false,
  user: null,
  authComplete: false,
  permissions: [],
});

export default {
  setUser: (user: LoginRegisterResponse) => {
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
  },
};
