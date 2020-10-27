import { LoginRegisterResponse, PermissionResponse } from '@oare/types';
import { reactive, computed, shallowReadonly } from '@vue/composition-api';

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
  },
});

const readonlyState = computed(() => state);

export default {
  state: readonlyState,
  setUser: (user: LoginRegisterResponse) => {
    state.user = user;
  },
  setLanded: (landed: boolean) => {
    state.landed = landed;
  },
  logout: () => {
    state.user = null;
  },
  setAuthComplete: () => {
    state.authComplete = true;
  },
  setPermissions: (permissions: PermissionResponse) => {
    state.permissions = permissions;
  },
};
