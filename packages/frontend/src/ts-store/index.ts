import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import { LoginRegisterResponse, PermissionResponse } from '@oare/types';
import { reactive, computed, shallowReadonly } from '@vue/composition-api';

Vue.use(VueCompositionAPI);

export interface State {
  landed: boolean;
  user: null | LoginRegisterResponse;
  authComplete: boolean;
  permissions: PermissionResponse;
}

const state: State = reactive({
  landed: false,
  user: null,
  authComplete: false,
  permissions: {
    dictionary: [],
    pages: [],
  },
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
    state.permissions.dictionary = [];
    state.permissions.pages = [];
  },
  setAuthComplete: () => {
    state.authComplete = true;
  },
  setPermissions: (permissions: PermissionResponse) => {
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
